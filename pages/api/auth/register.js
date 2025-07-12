import pool from '../../../lib/db';
import bcrypt from 'bcryptjs';

import errorHandler from '../../../lib/errorHandler';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { fullName, email, phone, password, role, details } = req.body;

  // Basic validation
  if (!fullName || !email || !phone || !password || !role) {
    return res.status(400).json({ message: 'الرجاء ملء جميع الحقول الإلزامية.' });
  }

  // Security check: Prevent self-assigning privileged roles
  const allowedPublicRoles = ['student', 'parent'];
  if (!allowedPublicRoles.includes(role)) {
    return res.status(403).json({ message: 'لا يمكن إنشاء هذا النوع من الحسابات عبر التسجيل العام. يرجى التواصل مع الإدارة.' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Enhanced details object with new fields
    const enhancedDetails = {
      ...details,
      parent_contact_optional: details.parentContactOptional || '',
      father_perspective: details.fatherPerspective || '',
      mother_perspective: details.motherPerspective || '',
      registration_status: 'pending_approval', // New registrations need approval
      registration_date: new Date().toISOString()
    };

    const newUser = await pool.query(
      'INSERT INTO users (full_name, email, phone, password_hash, role, details) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [fullName, email, phone, password_hash, role, enhancedDetails]
    );

    // This part of the logic for linking a child to a parent seems to be intended for a different workflow,
    // as a parent registering themselves wouldn't have a parent_id.
    // We will keep it for now, as it might be used when an admin or a parent adds a child.
    if (role === 'student' && details && details.parent_id) {
      await pool.query(
        'INSERT INTO parent_child_relationships (parent_id, child_id) VALUES ($1, $2)',
        [details.parent_id, newUser.rows[0].id]
      );
    }

    // Create notification for admin users about new registration
    const adminUsers = await pool.query(
      "SELECT id FROM users WHERE role = 'admin'"
    );

    for (const admin of adminUsers.rows) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, message, link, created_at) 
         VALUES ($1, 'announcement', $2, $3, CURRENT_TIMESTAMP)`,
        [
          admin.id, 
          `تسجيل جديد: ${fullName} كـ ${role}`,
          `/admin/users?new=${newUser.rows[0].id}`
        ]
      );
    }

    res.status(201).json({ 
      message: 'تم إنشاء الحساب بنجاح! سيتم مراجعة طلبك وتفعيل الحساب قريباً.' 
    });
  } catch (err) {
    if (err.code === '23505') { // unique_violation
      return res.status(400).json({ message: 'البريد الإلكتروني أو رقم الهاتف مسجل بالفعل.' });
    }
    errorHandler(err, res);
  }
}
