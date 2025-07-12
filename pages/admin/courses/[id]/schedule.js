import React, { useState } from 'react';
import Layout from '../../../../components/Layout';
import { withAuth } from '../../../../lib/withAuth';
import pool from '../../../../lib/db';
import { serializeDbRow, serializeDbRows, safeProps } from '../../../../lib/serializer';

// مكون لإدارة يوم دراسي واحد
const DayScheduler = ({ day, onSave, onCreateExam }) => {
    const [details, setDetails] = useState(day);
    const [showExamBuilder, setShowExamBuilder] = useState(false);

    const handleSave = () => {
        onSave(details);
    };

    const handleExamContentChange = (examData) => {
        setDetails({
            ...details,
            exam_content: examData
        });
    };

    return (
        <div className="day-scheduler">
            <h4>🗓️ اليوم {details.day_number} - {details.title}</h4>
            
            <div className="form-group">
                <label>عنوان اليوم الدراسي</label>
                <input type="text" value={details.title} onChange={e => setDetails({...details, title: e.target.value})} />
            </div>
            
            <div className="form-group">
                <label>🔗 رابط اللقاء (Zoom/Meet)</label>
                <input type="text" value={details.meeting_link || ''} onChange={e => setDetails({...details, meeting_link: e.target.value})} />
            </div>
            
            <div className="form-group">
                <label>📂 رابط المحتوى (PDF/Video)</label>
                <input type="text" value={details.content_url || ''} onChange={e => setDetails({...details, content_url: e.target.value})} />
            </div>
            

            <div className="exam-section">
                <h5>📝 تكاليف درجة 3 (الطلاب)</h5>
                <div className="form-group">
                    <label>عنوان الامتحان</label>
                    <input 
                        type="text" 
                        value={details.exam_content?.title || ''} 
                        onChange={e => handleExamContentChange({...details.exam_content, title: e.target.value})}
                        placeholder="امتحان اليوم الدراسي"
                    />
                </div>
                
                <div className="form-group">
                    <label>وصف الامتحان</label>
                    <textarea 
                        value={details.exam_content?.description || ''} 
                        onChange={e => handleExamContentChange({...details.exam_content, description: e.target.value})}
                        rows="2"
                        placeholder="وصف مختصر للامتحان"
                    />
                </div>

                <div className="form-group">
                    <label>مدة الامتحان (بالدقائق)</label>
                    <input 
                        type="number" 
                        value={details.exam_content?.time_limit || 60} 
                        onChange={e => handleExamContentChange({...details.exam_content, time_limit: parseInt(e.target.value)})}
                        min="5"
                        max="180"
                    />
                </div>

                <button 
                    type="button" 
                    className="btn-exam-builder"
                    onClick={() => setShowExamBuilder(!showExamBuilder)}
                >
                    {showExamBuilder ? '🔼 إخفاء بناء الامتحان' : '🔽 بناء الامتحان (اختيارات وصح وخطأ)'}
                </button>

                {showExamBuilder && (
                    <ExamBuilder 
                        examContent={details.exam_content} 
                        onChange={handleExamContentChange}
                    />
                )}
            </div>

            <div className="assignments-section">
                <h5>📋 تكاليف إضافية</h5>
                <div className="form-group">
                    <label>تكاليف درجة 2 (المعلمين/المدربين)</label>
                    <textarea 
                        value={details.assignments?.level_2 || ''} 
                        onChange={e => setDetails({
                            ...details, 
                            assignments: {...details.assignments, level_2: e.target.value}
                        })}
                        rows="2"
                        placeholder="تكاليف خاصة بالمعلمين والمدربين"
                    />
                </div>
                
                <div className="form-group">
                    <label>تكاليف درجة 1 (المشرفين)</label>
                    <textarea 
                        value={details.assignments?.level_1 || ''} 
                        onChange={e => setDetails({
                            ...details, 
                            assignments: {...details.assignments, level_1: e.target.value}
                        })}
                        rows="2"
                        placeholder="تكاليف خاصة بالمشرفين"
                    />
                </div>
            </div>

            <button className="btn-save-day" onClick={handleSave}>
                💾 حفظ اليوم {details.day_number}
            </button>
        </div>
    );
};

// مكون بناء الامتحان
const ExamBuilder = ({ examContent, onChange }) => {
    const [questions, setQuestions] = useState(examContent?.questions || []);
    const [jsonImport, setJsonImport] = useState('');

    const addQuestion = (type) => {
        const newQuestion = {
            id: Date.now(),
            type: type,
            question: '',
            options: type === 'multiple_choice' ? ['', '', '', ''] : [],
            correct_answer: '',
            points: 1
        };
        const updatedQuestions = [...questions, newQuestion];
        setQuestions(updatedQuestions);
        onChange({...examContent, questions: updatedQuestions});
    };

    const updateQuestion = (questionId, field, value) => {
        const updatedQuestions = questions.map(q => 
            q.id === questionId ? {...q, [field]: value} : q
        );
        setQuestions(updatedQuestions);
        onChange({...examContent, questions: updatedQuestions});
    };

    const removeQuestion = (questionId) => {
        const updatedQuestions = questions.filter(q => q.id !== questionId);
        setQuestions(updatedQuestions);
        onChange({...examContent, questions: updatedQuestions});
    };

    const importFromJson = () => {
        try {
            const parsedQuestions = JSON.parse(jsonImport);
            if (Array.isArray(parsedQuestions)) {
                const formattedQuestions = parsedQuestions.map((q, index) => ({
                    id: Date.now() + index,
                    type: q.type || 'multiple_choice',
                    question: q.question || '',
                    options: q.options || (q.type === 'multiple_choice' ? ['', '', '', ''] : []),
                    correct_answer: q.correct_answer || '',
                    points: q.points || 1
                }));
                setQuestions(formattedQuestions);
                onChange({...examContent, questions: formattedQuestions});
                setJsonImport('');
                alert('✅ تم استيراد الأسئلة بنجاح');
            } else {
                alert('❌ تنسيق JSON غير صحيح - يجب أن يكون مصفوفة من الأسئلة');
            }
        } catch (error) {
            alert('❌ خطأ في تنسيق JSON: ' + error.message);
        }
    };

    return (
        <div className="exam-builder">
            <div className="exam-controls">
                <button type="button" onClick={() => addQuestion('multiple_choice')}>
                    ➕ إضافة سؤال اختيارات متعددة
                </button>
                <button type="button" onClick={() => addQuestion('true_false')}>
                    ➕ إضافة سؤال صح وخطأ
                </button>
            </div>
            
            <div className="json-import-section" style={{ background: '#f0f8ff', padding: '15px', borderRadius: '8px', margin: '15px 0' }}>
                <h6 style={{ margin: '0 0 10px 0', color: '#0066cc' }}>📥 استيراد أسئلة من JSON</h6>
                <textarea
                    value={jsonImport}
                    onChange={e => setJsonImport(e.target.value)}
                    placeholder='مثال: [{"type":"multiple_choice","question":"ما هو...؟","options":["خيار 1","خيار 2","خيار 3","خيار 4"],"correct_answer":"0","points":1}]'
                    rows="4"
                    style={{ width: '100%', marginBottom: '10px', fontFamily: 'monospace', fontSize: '12px' }}
                />
                <button onClick={importFromJson} style={{ background: '#28a745', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>
                    📥 استيراد الأسئلة
                </button>
                <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                    تنسيق JSON: مصفوفة من الأسئلة مع الحقول: type, question, options, correct_answer, points
                </small>
            </div>

            {questions.map((question, index) => (
                <div key={question.id} className="question-builder">
                    <div className="question-header">
                        <h6>السؤال {index + 1}</h6>
                        <button type="button" onClick={() => removeQuestion(question.id)}>❌</button>
                    </div>
                    
                    <div className="form-group">
                        <label>نص السؤال</label>
                        <textarea 
                            value={question.question}
                            onChange={e => updateQuestion(question.id, 'question', e.target.value)}
                            rows="2"
                        />
                    </div>

                    {question.type === 'multiple_choice' && (
                        <div className="options-section">
                            <label>الخيارات</label>
                            {question.options.map((option, optionIndex) => (
                                <div key={optionIndex} className="option-input">
                                    <input 
                                        type="text"
                                        value={option}
                                        onChange={e => {
                                            const newOptions = [...question.options];
                                            newOptions[optionIndex] = e.target.value;
                                            updateQuestion(question.id, 'options', newOptions);
                                        }}
                                        placeholder={`الخيار ${optionIndex + 1}`}
                                    />
                                    <input 
                                        type="radio"
                                        name={`correct_${question.id}`}
                                        checked={question.correct_answer === optionIndex.toString()}
                                        onChange={() => updateQuestion(question.id, 'correct_answer', optionIndex.toString())}
                                    />
                                    <label>صحيح</label>
                                </div>
                            ))}
                        </div>
                    )}

                    {question.type === 'true_false' && (
                        <div className="true-false-section">
                            <label>الإجابة الصحيحة</label>
                            <div>
                                <input 
                                    type="radio"
                                    name={`tf_${question.id}`}
                                    checked={question.correct_answer === 'true'}
                                    onChange={() => updateQuestion(question.id, 'correct_answer', 'true')}
                                />
                                <label>صح</label>
                                
                                <input 
                                    type="radio"
                                    name={`tf_${question.id}`}
                                    checked={question.correct_answer === 'false'}
                                    onChange={() => updateQuestion(question.id, 'correct_answer', 'false')}
                                />
                                <label>خطأ</label>
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label>النقاط</label>
                        <input 
                            type="number"
                            value={question.points}
                            onChange={e => updateQuestion(question.id, 'points', parseFloat(e.target.value))}
                            min="0.5"
                            step="0.5"
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

const CourseSchedulerPage = ({ user, course, schedule: initialSchedule }) => {
    const [schedule, setSchedule] = useState(initialSchedule);
    const [message, setMessage] = useState('');
    const [showAutoFill, setShowAutoFill] = useState(false);
    const [autoFillTemplate, setAutoFillTemplate] = useState({
        meeting_link_template: '',
        content_url_template: '',
        url_numbering_start: 1,
        url_numbering_end: schedule.length,
        default_exam_title: 'امتحان اليوم الدراسي **',
        default_exam_time: 60,
        default_costs_level_1: 'مراجعة التقارير اليومية وتقييم الأداء',
        default_costs_level_2: 'إعداد المحتوى وتقييم الطلاب',
        default_costs_level_3: 'حل الامتحان وأداء الواجبات'
    });

    const handleSaveDay = async (dayDetails) => {
        try {
            const response = await fetch(`/api/courses/${course.id}/schedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...dayDetails, course_id: course.id })
            });
            const result = await response.json();
            if (response.ok) {
                setMessage(`✅ ${result.message}`);
                // تحديث الحالة المحلية بعد الحفظ
                setSchedule(prev => prev.map(d => d.day_number === dayDetails.day_number ? dayDetails : d));
            } else {
                setMessage(`⚠️ ${result.message}`);
            }
        } catch (err) {
            setMessage('🚫 خطأ في الاتصال بالخادم.');
        }
    };

    const addDay = () => {
        const nextDayNumber = schedule.length + 1;
        setSchedule([...schedule, { day_number: nextDayNumber, title: `اليوم الدراسي ${nextDayNumber}` }]);
    };

    const handleAutoFill = () => {
        const updatedSchedule = schedule.map(day => {
            const dayNumber = day.day_number;
            const paddedNumber = dayNumber.toString().padStart(2, '0');
            
            return {
                ...day,
                meeting_link: autoFillTemplate.meeting_link_template,
                content_url: autoFillTemplate.content_url_template.replace(/\*\*/g, paddedNumber),
                exam_content: {
                    ...day.exam_content,
                    title: autoFillTemplate.default_exam_title.replace(/\*\*/g, dayNumber),
                    time_limit: autoFillTemplate.default_exam_time
                },
                assignments: {
                    level_1: autoFillTemplate.default_costs_level_1,
                    level_2: autoFillTemplate.default_costs_level_2,
                    level_3: autoFillTemplate.default_costs_level_3
                }
            };
        });
        
        setSchedule(updatedSchedule);
        setMessage('✅ تم تطبيق الملء التلقائي بنجاح وتم ملء جميع المربعات');
        setShowAutoFill(false);
    };

    const saveAsTemplate = async () => {
        try {
            const templateData = {
                name: `قالب ${course.name}`,
                description: course.description || 'قالب دورة محفوظ',
                duration_days: course.duration_days || 7,
                target_roles: course.participant_config ? 
                    Object.values(course.participant_config).flatMap(level => level.roles || []) : 
                    ['student'],
                min_capacity: course.participant_config?.level_3?.min || 7,
                max_capacity: course.participant_config?.level_3?.max || 15,
                optimal_capacity: course.participant_config?.level_3?.optimal || 12,
                pricing: {
                    cost: course.details?.cost || 0,
                    currency: course.details?.currency || 'EGP'
                },
                daily_content_template: schedule.map(day => ({
                    day_number: day.day_number,
                    title: day.title,
                    content_url: day.content_url,
                    meeting_link: day.meeting_link,
                    exam_content: day.exam_content,
                    assignments: day.assignments
                })),
                participant_config: course.participant_config || {},
                auto_fill_template: autoFillTemplate,
                launch_settings: course.auto_launch_settings || {}
            };

            const response = await fetch('/api/courses/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(templateData)
            });

            const result = await response.json();
            if (response.ok) {
                setMessage('✅ تم حفظ الدورة كقالب بنجاح');
            } else {
                console.error('Template save error:', result);
                setMessage(`⚠️ خطأ في حفظ القالب: ${result.message || 'خطأ غير معروف'}`);
            }
        } catch (err) {
            console.error('Template save error:', err);
            setMessage('🚫 خطأ في الاتصال بالخادم');
        }
    };

    const publishCourse = async () => {
        try {
            const response = await fetch(`/api/courses/${course.id}/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();
            if (response.ok) {
                setMessage('✅ تم نشر الدورة بنجاح');
            } else {
                console.error('Course publish error:', result);
                setMessage(`⚠️ خطأ في نشر الدورة: ${result.message || 'خطأ غير معروف'}`);
            }
        } catch (err) {
            console.error('Course publish error:', err);
            setMessage('🚫 خطأ في الاتصال بالخادم');
        }
    };

    const launchCourse = async () => {
        if (confirm('هل أنت متأكد من بدء انطلاق الدورة؟ لن يمكن التراجع عن هذا الإجراء.')) {
            try {
                const response = await fetch(`/api/courses/${course.id}/launch`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    setMessage('✅ تم بدء انطلاق الدورة بنجاح');
                } else {
                    setMessage('⚠️ خطأ في بدء انطلاق الدورة');
                }
            } catch (err) {
                setMessage('🚫 خطأ في الاتصال بالخادم');
            }
        }
    };

    const saveAllChanges = async () => {
        if (confirm('هل تريد حفظ جميع التغييرات في كل الأيام؟')) {
            try {
                setMessage('⏳ جاري حفظ جميع التغييرات...');
                
                for (const day of schedule) {
                    const response = await fetch(`/api/courses/${course.id}/schedule`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...day, course_id: course.id })
                    });
                    
                    if (!response.ok) {
                        throw new Error(`فشل في حفظ اليوم ${day.day_number}`);
                    }
                }
                
                setMessage('✅ تم حفظ جميع التغييرات بنجاح في كل الأيام');
            } catch (err) {
                setMessage(`🚫 خطأ في حفظ التغييرات: ${err.message}`);
            }
        }
    };

    return (
        <Layout user={user}>
            <style jsx>{`
                .scheduler-header { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
                .scheduler-controls { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
                .scheduler-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 25px; }
                .day-scheduler { 
                    background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%); 
                    padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    border: 1px solid #e9ecef; transition: transform 0.2s ease;
                }
                .day-scheduler:hover { transform: translateY(-2px); }
                .day-scheduler h4 { color: var(--primary-color); margin-top: 0; font-size: 1.2em; }
                .exam-section, .assignments-section { background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0; }
                .exam-section h5, .assignments-section h5 { margin-top: 0; color: var(--secondary-color); }
                .form-group { margin-bottom: 15px; }
                .form-group label { display: block; font-weight: 500; margin-bottom: 5px; color: #333; }
                .form-group input, .form-group textarea, .form-group select { 
                    width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px; 
                    font-family: var(--font-tajawal);
                }
                .btn-exam-builder { 
                    background: var(--info-color); color: white; border: none; padding: 8px 12px; 
                    border-radius: 5px; cursor: pointer; margin: 10px 0;
                }
                .btn-save-day { 
                    background: var(--success-color); color: white; border: none; padding: 12px 20px; 
                    border-radius: 5px; cursor: pointer; width: 100%; margin-top: 15px;
                }
                .exam-builder { background: #fff; padding: 15px; border-radius: 5px; margin-top: 10px; }
                .exam-controls { margin-bottom: 15px; }
                .exam-controls button { 
                    background: var(--primary-color); color: white; border: none; padding: 8px 12px; 
                    border-radius: 5px; cursor: pointer; margin-right: 10px;
                }
                .question-builder { border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin-bottom: 15px; }
                .question-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
                .question-header h6 { margin: 0; color: var(--primary-color); }
                .question-header button { background: #dc3545; color: white; border: none; padding: 5px 8px; border-radius: 3px; cursor: pointer; }
                .option-input { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
                .option-input input[type="text"] { flex: 1; }
                .true-false-section { display: flex; gap: 20px; align-items: center; }
                .btn-add-day, .btn-control {
                    padding: 12px 20px; border: none; border-radius: 8px; cursor: pointer; 
                    font-weight: 500; margin: 5px;
                }
                .btn-add-day { background: var(--dark-color); color: white; width: 100%; margin-top: 20px; }
                .btn-primary { background: var(--primary-color); color: white; }
                .btn-success { background: var(--success-color); color: white; }
                .btn-warning { background: var(--warning-color); color: white; }
                .btn-info { background: var(--info-color); color: white; }
                .message-bar { padding: 10px; text-align: center; border-radius: 5px; margin-bottom: 15px; }
                .auto-fill-modal { 
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                    background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;
                }
                .auto-fill-content { 
                    background: white; padding: 30px; border-radius: 10px; max-width: 600px; width: 90%;
                    max-height: 80vh; overflow-y: auto;
                }
                .auto-fill-content h3 { margin-top: 0; color: var(--primary-color); }
                .modal-buttons { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
            `}</style>
            
            <div className="scheduler-header">
                <h1>🗓️ جدولة دورة: {course.name}</h1>
                <p>هنا يمكنك تحديد محتوى ومهام كل يوم دراسي في الدورة.</p>
                {message && <div className="message-bar" style={{ background: message.includes('✅') ? '#d4edda' : '#f8d7da' }}>{message}</div>}
            </div>

            <div className="scheduler-controls">
                <button className="btn-control btn-info" onClick={() => setShowAutoFill(true)}>
                    🤖 الملء التلقائي
                </button>
                <button className="btn-control btn-success" onClick={saveAllChanges}>
                    💾 حفظ جميع التغييرات
                </button>
                <button className="btn-control btn-warning" onClick={saveAsTemplate}>
                    💾 حفظ كقالب
                </button>
                <button className="btn-control btn-primary" onClick={publishCourse}>
                    📢 نشر الدورة
                </button>
                <button className="btn-control btn-success" onClick={launchCourse}>
                    🚀 بدء انطلاق الدورة
                </button>
            </div>
            
            <div className="scheduler-grid">
                {schedule.map(day => (
                    <DayScheduler key={day.day_number} day={day} onSave={handleSaveDay} />
                ))}
            </div>

            <button className="btn-add-day" onClick={addDay}>➕ إضافة يوم دراسي جديد</button>

            {showAutoFill && (
                <div className="auto-fill-modal">
                    <div className="auto-fill-content">
                        <h3>🤖 إعدادات الملء التلقائي</h3>
                        
                        <div className="form-group">
                            <label>🔗 رابط اللقاء الثابت</label>
                            <input 
                                type="text" 
                                value={autoFillTemplate.meeting_link_template}
                                onChange={e => setAutoFillTemplate({...autoFillTemplate, meeting_link_template: e.target.value})}
                                placeholder="https://zoom.us/j/123456789"
                            />
                        </div>

                        <div className="form-group">
                            <label>📂 رابط المحتوى (استخدم ** للترقيم التلقائي)</label>
                            <input 
                                type="text" 
                                value={autoFillTemplate.content_url_template}
                                onChange={e => setAutoFillTemplate({...autoFillTemplate, content_url_template: e.target.value})}
                                placeholder="https://example.com/lesson-**.pdf"
                            />
                        </div>

                        <div className="form-group">
                            <label>📝 عنوان الامتحان الافتراضي (استخدم ** لرقم اليوم)</label>
                            <input 
                                type="text" 
                                value={autoFillTemplate.default_exam_title}
                                onChange={e => setAutoFillTemplate({...autoFillTemplate, default_exam_title: e.target.value})}
                                placeholder="امتحان اليوم الدراسي **"
                            />
                        </div>

                        <div className="form-group">
                            <label>⏰ مدة الامتحان الافتراضية (بالدقائق)</label>
                            <input 
                                type="number" 
                                value={autoFillTemplate.default_exam_time}
                                onChange={e => setAutoFillTemplate({...autoFillTemplate, default_exam_time: parseInt(e.target.value)})}
                                min="5" max="180"
                            />
                        </div>

                        <h4>💼 التكاليف الافتراضية للدرجات الثلاثة</h4>
                        
                        <div className="form-group">
                            <label>🎯 تكاليف درجة 1 (المشرفين)</label>
                            <textarea 
                                value={autoFillTemplate.default_costs_level_1}
                                onChange={e => setAutoFillTemplate({...autoFillTemplate, default_costs_level_1: e.target.value})}
                                rows="2"
                                placeholder="التكاليف الافتراضية للمشرفين"
                            />
                        </div>

                        <div className="form-group">
                            <label>👨‍🏫 تكاليف درجة 2 (المعلمين/المدربين)</label>
                            <textarea 
                                value={autoFillTemplate.default_costs_level_2}
                                onChange={e => setAutoFillTemplate({...autoFillTemplate, default_costs_level_2: e.target.value})}
                                rows="2"
                                placeholder="التكاليف الافتراضية للمعلمين والمدربين"
                            />
                        </div>

                        <div className="form-group">
                            <label>🎓 تكاليف درجة 3 (الطلاب)</label>
                            <textarea 
                                value={autoFillTemplate.default_costs_level_3}
                                onChange={e => setAutoFillTemplate({...autoFillTemplate, default_costs_level_3: e.target.value})}
                                rows="2"
                                placeholder="التكاليف الافتراضية للطلاب"
                            />
                        </div>

                        <div className="modal-buttons">
                            <button className="btn-control btn-primary" onClick={handleAutoFill}>
                                ✅ تطبيق الملء التلقائي
                            </button>
                            <button className="btn-control" onClick={() => setShowAutoFill(false)}>
                                ❌ إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export const getServerSideProps = withAuth(async (context) => {
    const { id } = context.params;
    
    console.log('Schedule page - received id:', id);
    
    // Validate that id is a valid number
    if (!id || id === 'undefined' || id === 'null' || isNaN(parseInt(id))) {
        console.error('Invalid course ID:', id);
        return { 
            redirect: {
                destination: '/admin/courses/manage',
                permanent: false,
            }
        };
    }
    
    const courseId = parseInt(id);
    const courseResult = await pool.query('SELECT * FROM courses WHERE id = $1', [courseId]);
    if (courseResult.rows.length === 0) return { notFound: true };

    const scheduleResult = await pool.query('SELECT * FROM course_schedule WHERE course_id = $1 ORDER BY day_number ASC', [courseId]);
    
    // Fix date serialization issues
    const course = courseResult.rows[0];
    const schedule = scheduleResult.rows;
    
    return {
        props: safeProps({
            user: context.user,
            course: serializeDbRow(course),
            schedule: serializeDbRows(schedule),
        })
    };
}, { roles: ['admin', 'head'] });

export default CourseSchedulerPage;
