import pool from '../../../lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

import errorHandler from '../../../lib/errorHandler';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { emailOrPhone, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1 OR phone = $1', [emailOrPhone]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'بيانات الدخول غير صحيحة.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'بيانات الدخول غير صحيحة.' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    const cookie = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    res.setHeader('Set-Cookie', cookie);
    res.status(200).json({ redirectTo: '/dashboard' });

  } catch (err) {
    errorHandler(err, res);
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
