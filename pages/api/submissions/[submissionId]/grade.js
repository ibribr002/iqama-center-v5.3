import pool from '../../../../lib/db';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // Get user from token
        const cookies = parse(req.headers.cookie || '');
        const token = cookies.token;
        
        if (!token) {
            return res.status(401).json({ message: 'غير مصرح' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        // Verify user is a teacher or admin
        const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0 || !['teacher', 'admin', 'head'].includes(userResult.rows[0].role)) {
            return res.status(403).json({ message: 'غير مصرح لك بتصحيح المهام' });
        }

        const { submissionId } = req.query;
        const { grade, feedback } = req.body;

        // Validate inputs
        if (grade === undefined || grade === null) {
            return res.status(400).json({ message: 'الدرجة مطلوبة' });
        }

        const gradeNum = parseFloat(grade);
        if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
            return res.status(400).json({ message: 'الدرجة يجب أن تكون بين 0 و 100' });
        }

        // Check if submission exists
        const submissionResult = await pool.query(
            `SELECT s.*, t.title as task_title, u.full_name as student_name
             FROM submissions s
             JOIN tasks t ON s.task_id = t.id
             JOIN users u ON s.user_id = u.id
             WHERE s.id = $1`,
            [submissionId]
        );

        if (submissionResult.rows.length === 0) {
            return res.status(404).json({ message: 'التقديم غير موجود' });
        }

        const submission = submissionResult.rows[0];

        // Update submission with grade and feedback
        await pool.query(
            `UPDATE submissions 
             SET grade = $1, feedback = $2, status = 'graded', graded_at = CURRENT_TIMESTAMP, graded_by = $3
             WHERE id = $4`,
            [gradeNum, feedback || '', userId, submissionId]
        );

        // Create notification for student
        await pool.query(
            `INSERT INTO notifications (user_id, type, message, link, created_at)
             VALUES ($1, 'grade_received', $2, $3, CURRENT_TIMESTAMP)`,
            [
                submission.user_id,
                `تم تصحيح مهمة "${submission.task_title}" - الدرجة: ${gradeNum}`,
                `/student/tasks`
            ]
        );

        res.status(200).json({ 
            message: 'تم تسجيل الدرجة بنجاح',
            grade: gradeNum,
            feedback: feedback || ''
        });

    } catch (err) {
        console.error('Grading error:', err);
        res.status(500).json({ message: 'حدث خطأ في الخادم' });
    }
}