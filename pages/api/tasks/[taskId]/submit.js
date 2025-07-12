
import pool from '../../../../lib/db';
import { withAuth } from '../../../../lib/withAuth';

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { taskId } = req.query;
    const { content } = req.body;

    try {
        const query = `
            INSERT INTO submissions (task_id, user_id, content, status, submitted_at)
            VALUES ($1, $2, $3, 'submitted', NOW())
            ON CONFLICT (task_id, user_id) DO UPDATE SET
            content = EXCLUDED.content,
            status = 'submitted',
            submitted_at = NOW()
            RETURNING *;
        `;
        const result = await pool.query(query, [taskId, req.user.id, content]);

        // TODO: Add notification for the teacher

        res.status(201).json({ message: 'Task submitted successfully.', submission: result.rows[0] });

    } catch (error) {
        console.error('Error submitting task:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

export default withAuth(handler, { roles: ['student'] });
