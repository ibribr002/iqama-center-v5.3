import nextConnect from 'next-connect';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pool from '../../../../lib/db';
import jwt from 'jsonwebtoken';

// Ensure the uploads directory exists
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

const apiRoute = nextConnect({
  onError(error, req, res) {
    console.error("Upload Proof Error:", error);
    res.status(501).json({ error: `Sorry something happened! ${error.message}` });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  },
});

apiRoute.post(async (req, res) => {
  const { id } = req.query; // payment ID
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Manually invoke multer upload
    upload.single('paymentProof')(req, res, async (err) => {
        if (err) {
            return res.status(501).json({ error: `Sorry something happened! ${err.message}` });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'لم يتم رفع أي ملف.' });
        }

        const paymentProofUrl = `/uploads/${req.file.filename}`;

        // Update payment status to 'pending_review' and add proof URL
        const result = await pool.query(
          `UPDATE payments SET status = 'pending_review', payment_proof_url = $1 WHERE id = $2 AND enrollment_id IN (SELECT id FROM enrollments WHERE user_id = $3) RETURNING *`,
          [paymentProofUrl, id, userId]
        );

        if (result.rows.length === 0) {
          // Important: If the update fails, delete the uploaded file to prevent orphans
          fs.unlink(path.join(uploadDir, req.file.filename), (unlinkErr) => {
            if (unlinkErr) console.error("Error deleting orphaned file:", unlinkErr);
          });
          return res.status(404).json({ message: 'الدفع غير موجود أو غير مصرح لك بتعديله.' });
        }

        res.status(200).json({ message: 'تم رفع إثبات الدفع بنجاح. بانتظار المراجعة.', payment: result.rows[0] });
    });
  } catch (err) {
    console.error("Upload Proof API Error:", err);
    if (err instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ message: 'Invalid token.' });
    }
    res.status(500).json({ message: 'حدث خطأ في الخادم.' });
  }
});

export const config = {
  api: {
    bodyParser: false, // Disable bodyParser to allow multer to handle the body
  },
};

export default apiRoute.handler;