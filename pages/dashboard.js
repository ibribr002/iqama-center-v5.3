import React from 'react';
import { withAuth } from '../lib/withAuth';
import pool from '../lib/db';
import Layout from '../components/Layout';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import FinanceDashboard from '../components/dashboards/FinanceDashboard';
import HeadDashboard from '../components/dashboards/HeadDashboard';
import TeacherDashboard from '../components/dashboards/TeacherDashboard';
import StudentDashboard from '../components/dashboards/StudentDashboard';
import ParentDashboard from '../components/dashboards/ParentDashboard';
import DefaultDashboard from '../components/dashboards/DefaultDashboard';

const DashboardPage = (props) => {
    const { user } = props;

    const renderDashboard = () => {
        switch (user.role) {
            case 'admin':
                return <AdminDashboard {...props} />;
            case 'finance':
                return <FinanceDashboard {...props} />;
            case 'head':
                return <HeadDashboard {...props} />;
            case 'teacher':
                return <TeacherDashboard {...props} />;
            case 'student':
                return <StudentDashboard {...props} />;
            case 'parent':
                return <ParentDashboard {...props} />;
            default:
                return <DefaultDashboard {...props} />;
        }
    };

    return (
        <Layout user={user}>
            {renderDashboard()}
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;
    let props = { user };

    if (user.role === 'finance') {
        const statsRes = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM payments WHERE status = 'pending_review') as pending_review_count,
                (SELECT COUNT(*) FROM payments WHERE status = 'due') as due_count,
                (SELECT COUNT(*) FROM payments WHERE status = 'late') as late_count,
                (SELECT SUM(amount) FROM payments WHERE status = 'paid' AND paid_at >= NOW() - INTERVAL '30 days') as total_paid_this_month;
        `);
        props.stats = JSON.parse(JSON.stringify(statsRes.rows[0]));
    }

    if (user.role === 'admin') {
        const statsRes = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM courses) as total_courses,
                (SELECT COUNT(*) FROM payments WHERE status = 'due') as pending_payments;
        `);
        props.stats = JSON.parse(JSON.stringify(statsRes.rows[0]));

        // Get recent users
        const recentUsersRes = await pool.query(`
            SELECT id, full_name, email, role, created_at, details
            FROM users 
            ORDER BY created_at DESC 
            LIMIT 10;
        `);
        props.recentUsers = JSON.parse(JSON.stringify(recentUsersRes.rows));

        // Get recent courses
        const recentCoursesRes = await pool.query(`
            SELECT id, name, status, created_at, description
            FROM courses 
            ORDER BY created_at DESC 
            LIMIT 10;
        `);
        props.recentCourses = JSON.parse(JSON.stringify(recentCoursesRes.rows));

        // Get pending edit requests
        const pendingRequestsRes = await pool.query(`
            SELECT r.id, r.field_name, r.old_value, r.new_value, r.requested_at, u.full_name
            FROM user_edit_requests r
            JOIN users u ON r.user_id = u.id
            WHERE r.status = 'pending'
            ORDER BY r.requested_at DESC;
        `);
        props.pendingRequests = JSON.parse(JSON.stringify(pendingRequestsRes.rows));
    }

    if (user.role === 'head') {
        const statsRes = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM users WHERE role = 'teacher' AND reports_to = $1) as teacher_count,
                (SELECT COUNT(DISTINCT e.user_id) FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE c.created_by IN (SELECT id FROM users WHERE reports_to = $1)) as student_count,
                (SELECT COUNT(*) FROM courses WHERE status = 'pending_approval') as pending_courses_count,
                (SELECT COUNT(*) FROM courses WHERE status = 'active') as active_courses_count;
        `, [user.id]);
        props.stats = JSON.parse(JSON.stringify(statsRes.rows[0]));
    }

    if (user.role === 'parent') {
        // Check if user_relationships table exists, if not create it
        try {
            const childrenRes = await pool.query(`
                SELECT u.id, u.full_name, u.email, u.details
                FROM users u
                WHERE u.details->>'parent_id' = $1 AND u.role = 'student'
                ORDER BY u.full_name ASC;
            `, [user.id.toString()]);
            props.children = JSON.parse(JSON.stringify(childrenRes.rows));
        } catch (err) {
            console.log('Parent-child relationship query failed, using empty array');
            props.children = [];
        }

        // Get available courses for parent (same as courses page logic)
        try {
            const coursesResult = await pool.query(`
                SELECT c.* FROM courses c
                WHERE c.status = 'active'
                AND NOT EXISTS (
                    SELECT 1 FROM enrollments e WHERE e.course_id = c.id AND e.user_id = $1
                )
                ORDER BY c.created_at DESC
                LIMIT 6
            `, [user.id]);
            props.availableCourses = JSON.parse(JSON.stringify(coursesResult.rows));
        } catch (err) {
            console.log('Available courses query failed, using empty array:', err.message);
            props.availableCourses = [];
        }
    }

    if (user.role === 'student') {
        // Get student's tasks and courses - simplified query to avoid column issues
        let tasksRes = { rows: [] };
        try {
            tasksRes = await pool.query(`
                SELECT t.id, t.title, t.due_date, t.task_type as type
                FROM tasks t
                WHERE t.due_date >= CURRENT_DATE
                ORDER BY t.due_date ASC
                LIMIT 5;
            `);
        } catch (err) {
            console.log('Tasks query failed, using empty array:', err.message);
        }

        let coursesRes = { rows: [] };
        try {
            coursesRes = await pool.query(`
                SELECT c.id, c.name, e.status
                FROM courses c
                JOIN enrollments e ON c.id = e.course_id
                WHERE e.user_id = $1 AND e.status IN ('active', 'pending_payment')
                ORDER BY c.name ASC;
            `, [user.id]);
        } catch (err) {
            console.log('Courses query failed, using empty array:', err.message);
        }

        let commitmentsRes = { rows: [] };
        try {
            commitmentsRes = await pool.query(`
                SELECT commitment_type, status
                FROM daily_commitments
                WHERE user_id = $1 AND date = CURRENT_DATE;
            `, [user.id]);
        } catch (err) {
            console.log('Commitments query failed, using empty array:', err.message);
        }

        const commitments = {};
        commitmentsRes.rows.forEach(row => {
            commitments[row.commitment_type] = row.status;
        });

        props.tasks = JSON.parse(JSON.stringify(tasksRes.rows));
        props.courses = JSON.parse(JSON.stringify(coursesRes.rows));
        props.commitments = commitments;
    }

    if (user.role === 'teacher') {
        const coursesRes = await pool.query(`
            SELECT c.id, c.name, 
                   (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'active') as student_count
            FROM courses c
            WHERE c.created_by = $1 AND c.status = 'active'
            ORDER BY c.name ASC;
        `, [user.id]);
        props.courses = JSON.parse(JSON.stringify(coursesRes.rows));
    }

    return { props };
});

export default DashboardPage;