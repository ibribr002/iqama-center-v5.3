import React, { useState } from 'react';
import Layout from '../components/Layout';
import { withAuth } from '../lib/withAuth';

import pool from '../lib/db';

const CoursesPage = ({ user, courses: initialCourses }) => {
    const [courses, setCourses] = useState(initialCourses || []);
    const [message, setMessage] = useState(null);

    // Add safety check for user
    if (!user) {
        return (
            <Layout user={null}>
                <div>Loading...</div>
            </Layout>
        );
    }

    const handleEnroll = async (courseId) => {
        if (!window.confirm('هل أنت متأكد من رغبتك في التقديم لهذه الدورة؟')) {
            return;
        }

        try {
            const response = await fetch(`/api/courses/${courseId}/enroll`, {
                method: 'POST'
            });
            const result = await response.json();
            setMessage({ text: result.message, isError: !response.ok });
            if (response.ok) {
                // Update the UI to reflect enrollment
                setCourses(prev => prev.filter(c => c.id !== courseId));
            }
        } catch (err) {
            setMessage({ text: 'حدث خطأ في ا��اتصال بالخادم.', isError: true });
        }
    };

    return (
        <Layout user={user}>
            <h1>الدورات المتاحة للتسجيل</h1>
            <p>تصفح الدورات المتاحة وتقدم للدورة التي تناسبك.</p>
            {message && (
                <div style={{ color: message.isError ? 'red' : 'green', marginTop: '20px' }}>
                    {message.text}
                </div>
            )}
            <div id="courses-container" className="courses-container">
                {courses.map(course => (
                    <div className="course-card" key={course.id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
                        <h3>{course.name}</h3>
                        <p>{course.description}</p>
                        <div className="course-details">
                            <strong>التفاصيل:</strong>
                            <div className="details-content">
                                {course.details && typeof course.details === 'object' ? (
                                    Object.entries(course.details).map(([key, value]) => {
                                        const displayValue = Array.isArray(value) 
                                            ? value.join(', ') 
                                            : (typeof value === 'object' && value !== null)
                                                ? JSON.stringify(value)
                                                : String(value || '');
                                        
                                        return (
                                            <div key={key} className="detail-item">
                                                <span className="detail-label">{key}:</span>
                                                <span className="detail-value">{displayValue}</span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <span>{course.details || 'لا توجد تفاصيل إضافية'}</span>
                                )}
                            </div>
                        </div>
                        <button onClick={() => handleEnroll(course.id)}>التقديم الآن</button>
                    </div>
                ))}
            </div>

            {/* Message Display */}
            {message && (
                <div className={`message-overlay ${message.isError ? 'error' : 'success'}`}>
                    <div className="message-content">
                        <p>{message.text}</p>
                        <button onClick={() => setMessage(null)}>إغلاق</button>
                    </div>
                </div>
            )}

            <style jsx>{`
                .course-details {
                    margin: 10px 0;
                }
                .details-content {
                    margin-top: 5px;
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 4px;
                }
                .detail-item {
                    display: flex;
                    margin-bottom: 5px;
                }
                .detail-label {
                    font-weight: bold;
                    margin-left: 10px;
                    min-width: 100px;
                }
                .detail-value {
                    flex: 1;
                }
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: white;
                    padding: 30px;
                    border-radius: 8px;
                    max-width: 500px;
                    width: 90%;
                    text-align: center;
                }
                .modal-actions {
                    margin-top: 20px;
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                }
                .btn-confirm {
                    background: #28a745;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                }
                .btn-cancel {
                    background: #6c757d;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                }
                .message-overlay {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1001;
                }
                .message-content {
                    padding: 15px 20px;
                    border-radius: 5px;
                    color: white;
                    max-width: 400px;
                }
                .message-overlay.success .message-content {
                    background: #28a745;
                }
                .message-overlay.error .message-content {
                    background: #dc3545;
                }
                .message-content button {
                    background: transparent;
                    border: 1px solid white;
                    color: white;
                    padding: 5px 10px;
                    border-radius: 3px;
                    cursor: pointer;
                    margin-top: 10px;
                }
            `}</style>
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { user } = context;

    try {
        const coursesResult = await pool.query(`
            SELECT c.* FROM courses c
            WHERE c.status = 'active'
            AND NOT EXISTS (
                SELECT 1 FROM enrollments e WHERE e.course_id = c.id AND e.user_id = $1
            )
            ORDER BY c.created_at DESC
        `, [user.id]);

        return {
            props: {
                user: JSON.parse(JSON.stringify(user)),
                courses: JSON.parse(JSON.stringify(coursesResult.rows))
            }
        };
    } catch (err) {
        console.error('Courses page error:', err);
        return {
            props: {
                user: JSON.parse(JSON.stringify(user)),
                courses: []
            }
        };
    }
});

export default CoursesPage;
