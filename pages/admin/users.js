// /pages/admin/courses/schedule.js

import React from 'react';
import Layout from '../../../components/Layout';
import { withAuth } from '../../../lib/withAuth';
import pool from '../../../lib/db';

// A helper function to format time strings
const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'م' : 'ص';
    const formattedHour = h % 12 === 0 ? 12 : h % 12;
    return `${formattedHour}:${minutes} ${ampm}`;
};

const AdminCoursesSchedulePage = ({ user, schedule }) => {
    return (
        <Layout user={user}>
            <style jsx>{`
                .table-container { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
                .schedule-table { width: 100%; border-collapse: collapse; }
                .schedule-table th, .schedule-table td { padding: 12px; border-bottom: 1px solid #eee; text-align: right; }
                .schedule-table th { background-color: #f7f9fc; font-weight: 600; }
                .no-schedule { text-align: center; padding: 40px; font-size: 1.2rem; color: #777; }
            `}</style>
            <h1><i className="fas fa-calendar-alt fa-fw"></i> جدول الحصص الدراسية</h1>
            <div className="table-container">
                {schedule.length > 0 ? (
                    <table className="schedule-table">
                        <thead>
                            <tr>
                                <th>المادة الدراسية</th>
                                <th>المعلم</th>
                                <th>اليوم</th>
                                <th>وقت البدء</th>
                                <th>وقت الانتهاء</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schedule.map(item => (
                                <tr key={item.id}>
                                    <td>{item.course_name}</td>
                                    <td>{item.teacher_name}</td>
                                    <td>{item.day_of_week}</td>
                                    <td>{formatTime(item.start_time)}</td>
                                    <td>{formatTime(item.end_time)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="no-schedule">
                        <p>لا توجد بيانات في الجدول لعرضها حاليًا.</p>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default AdminCoursesSchedulePage;

/**
 * This is the crucial part that fixes the error.
 * We wrap getServerSideProps with `withAuth`. This does two things:
 * 1. It ensures only users with the specified roles can access the page.
 * 2. It automatically fetches the logged-in user's data and passes it as `context.user`.
 * We then pass this user object in the props, which makes it available to the page component and its Layout.
 */
export const getServerSideProps = withAuth(async (context) => {
    // The `user` object is now available from the context, thanks to `withAuth`.
    const { user } = context;

    // Fetch the schedule data from the database.
    // This query joins three tables to get all the necessary information.
    const scheduleQuery = `
        SELECT 
            cs.id,
            c.name AS course_name,
            u.full_name AS teacher_name,
            cs.day_of_week,
            cs.start_time,
            cs.end_time
        FROM course_schedules cs
        JOIN courses c ON cs.course_id = c.id
        JOIN users u ON cs.teacher_id = u.id
        ORDER BY cs.day_of_week, cs.start_time;
    `;
    
    const scheduleResult = await pool.query(scheduleQuery);

    // It's essential to serialize the data, especially Date/Time objects,
    // before passing it to the page component as props.
    const schedule = JSON.parse(JSON.stringify(scheduleResult.rows));

    return {
        props: {
            user: JSON.parse(JSON.stringify(user)), // Pass the user object to props
            schedule: schedule, // Pass the schedule data to props
        },
    };
}, { roles: ['admin', 'teacher', 'head'] }); // Define which roles can access the schedule page.
