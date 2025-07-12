import pool from '../../../lib/db';
import jwt from 'jsonwebtoken';
import NotificationService from '../../../services/notificationService';
import errorHandler from '../../../lib/errorHandler';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!['teacher', 'admin', 'head'].includes(decoded.role)) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { 
            courseId, 
            title, 
            description, 
            questions, 
            duration, // in minutes
            startTime, 
            endTime,
            maxAttempts,
            passingGrade 
        } = req.body;

        if (!courseId || !title || !questions || !duration || !startTime || !endTime) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Verify teacher has access to this course
        const courseAccess = await pool.query(
            `SELECT c.id FROM courses c
             JOIN enrollments e ON c.id = e.course_id
             WHERE c.id = $1 AND e.user_id = $2 AND e.user_id IN (
                 SELECT id FROM users WHERE role IN ('teacher', 'admin', 'head')
             )`,
            [courseId, decoded.id]
        );

        if (courseAccess.rows.length === 0 && decoded.role !== 'admin') {
            return res.status(403).json({ message: 'No access to this course' });
        }

        // Create exam
        const newExam = await pool.query(
            `INSERT INTO exams (
                course_id, title, description, questions, duration, 
                start_time, end_time, max_attempts, passing_grade, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [
                courseId, title, description, JSON.stringify(questions), 
                duration, startTime, endTime, maxAttempts || 1, 
                passingGrade || 60, decoded.id
            ]
        );

        // Get enrolled students
        const students = await pool.query(
            `SELECT user_id FROM enrollments 
             WHERE course_id = $1 AND status = 'active'
             AND user_id IN (SELECT id FROM users WHERE role = 'student')`,
            [courseId]
        );

        // Notify students about new exam
        if (students.rows.length > 0) {
            await NotificationService.createNotification(
                students.rows.map(s => s.user_id),
                'new_task',
                `امتحان جديد: ${title} - يبدأ في ${new Date(startTime).toLocaleDateString('ar-EG')}`,
                `/exams/${newExam.rows[0].id}`
            );
        }

        res.status(201).json({
            message: 'تم إنشاء الامتحان بنجاح',
            exam: newExam.rows[0]
        });

    } catch (err) {
        console.error('Create exam error:', err);
        errorHandler(err, res);
    }
}