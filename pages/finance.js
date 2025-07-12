import React, { useState } from 'react';
import Layout from '../components/Layout';
import { withAuth } from '../lib/withAuth';
import pool from '../lib/db';
import { useRouter } from 'next/router';

const PaymentConfirmationModal = ({ isOpen, onClose, payment, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="modal" style={{ display: 'flex' }}>
            <div className="modal-content">
                <span className="close-button" onClick={onClose}>×</span>
                <h2>تأكيد استلام دفعة</h2>
                <p>الرجاء مراجعة تفاصيل الدفعة وإيصال الدفع قبل التأكيد.</p>
                <div>
                    <p><strong>الطالب:</strong> {payment.full_name}</p>
                    <p><strong>الدورة:</strong> {payment.course_name}</p>
                    <p><strong>المبلغ:</strong> {payment.amount} {payment.currency}</p>
                    <p><strong>تاريخ الاستحقاق:</strong> {new Date(payment.due_date).toLocaleDateString('ar-EG')}</p>
                </div>
                {payment.payment_proof_url && (
                    <div className="payment-proof">
                        <h4>إيصال الدفع:</h4>
                        <a href={payment.payment_proof_url} target="_blank" rel="noopener noreferrer">
                            <img src={payment.payment_proof_url} alt="إيصال الدفع" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                        </a>
                    </div>
                )}
                <div className="modal-actions">
                    <button onClick={() => onConfirm(payment.id, 'paid')} className="btn-save">تأكيد الدفعة</button>
                    <button onClick={() => onConfirm(payment.id, 'rejected')} className="btn-danger">رفض الدفعة</button>
                </div>
            </div>
        </div>
    );
};

const FinancePage = ({ user, initialPayments }) => {
    const [payments, setPayments] = useState(initialPayments);
    const [filter, setFilter] = useState('pending_review');
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    const handleConfirmPayment = async (paymentId, newStatus) => {
        try {
            const response = await fetch(`/api/payments/${paymentId}/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                router.replace(router.asPath); // Refresh data
                setIsModalOpen(false);
            } else {
                const result = await response.json();
                alert(`خطأ: ${result.message}`);
            }
        } catch (err) {
            alert('حدث خطأ في الاتصال بالخادم.');
        }
    };

    const openModal = (payment) => {
        setSelectedPayment(payment);
        setIsModalOpen(true);
    };

    const filteredPayments = payments.filter(p => p.status === filter);

    return (
        <Layout user={user}>
            <style jsx>{`
                .table-container { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
                .filters { margin-bottom: 20px; display: flex; gap: 10px; }
                .filter-btn { padding: 10px 15px; border: 1px solid #ccc; background: #f9f9f9; cursor: pointer; border-radius: 5px; }
                .filter-btn.active { background: #007bff; color: white; border-color: #007bff; }
                .payments-table { width: 100%; border-collapse: collapse; }
                .payments-table th, .payments-table td { padding: 12px; border-bottom: 1px solid #eee; text-align: right; }
                .payments-table th { background-color: #f7f9fc; font-weight: 600; }
                .action-btn { cursor: pointer; color: #007bff; }
                .modal { display: flex; justify-content: center; align-items: center; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.7); }
                .modal-content { background-color: #fefefe; padding: 20px; border-radius: 8px; width: 80%; max-width: 500px; }
                .close-button { color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer; }
                .modal-actions { margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px; }
            `}</style>
            <h1><i className="fas fa-file-invoice-dollar fa-fw"></i> إدارة المدفوعات</h1>
            
            <div className="table-container">
                <div className="filters">
                    <button onClick={() => setFilter('pending_review')} className={`filter-btn ${filter === 'pending_review' ? 'active' : ''}`}>قيد المراجعة</button>
                    <button onClick={() => setFilter('due')} className={`filter-btn ${filter === 'due' ? 'active' : ''}`}>مستحقة</button>
                    <button onClick={() => setFilter('late')} className={`filter-btn ${filter === 'late' ? 'active' : ''}`}>متأخرة</button>
                    <button onClick={() => setFilter('paid')} className={`filter-btn ${filter === 'paid' ? 'active' : ''}`}>مدفوعة</button>
                </div>

                <table className="payments-table">
                    <thead>
                        <tr>
                            <th>الطالب</th>
                            <th>الدورة</th>
                            <th>المبلغ</th>
                            <th>تاريخ الاستحقاق</th>
                            <th>الحالة</th>
                            <th>إجراء</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPayments.map(p => (
                            <tr key={p.id}>
                                <td>{p.full_name}</td>
                                <td>{p.course_name}</td>
                                <td>{p.amount} {p.currency}</td>
                                <td>{new Date(p.due_date).toLocaleDateString('ar-EG')}</td>
                                <td>{p.status}</td>
                                <td>
                                    {p.status === 'pending_review' && (
                                        <button className="action-btn" onClick={() => openModal(p)}>مراجعة وتأكيد</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <PaymentConfirmationModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                payment={selectedPayment}
                onConfirm={handleConfirmPayment}
            />
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const paymentsResult = await pool.query(`
        SELECT p.*, u.full_name, c.name as course_name
        FROM payments p
        JOIN enrollments e ON p.enrollment_id = e.id
        JOIN users u ON e.user_id = u.id
        JOIN courses c ON e.course_id = c.id
        ORDER BY p.due_date ASC
    `);

    return {
        props: {
            user: context.user,
            initialPayments: JSON.parse(JSON.stringify(paymentsResult.rows))
        }
    };
}, { roles: ['finance', 'admin'] });

export default FinancePage;