import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const CourseForm = ({ course: initialCourse, allUsers = [] }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [course, setCourse] = useState({
        name: '',
        description: '',
        content_outline: '',
        duration_days: 7,
        start_date: '',
        days_per_week: 5,
        hours_per_day: 2.0,
        details: {
            cost: 0,
            currency: 'EGP',
            max_seats: 15,
            teachers: [],
        },
        participant_config: {
            level_1: { name: 'مشرف', roles: ['admin', 'head'], min: 1, max: 2, optimal: 1 },
            level_2: { name: 'معلم/مدرب', roles: ['teacher'], min: 1, max: 3, optimal: 2 },
            level_3: { name: 'طالب', roles: ['student'], min: 5, max: 20, optimal: 12 }
        },
        auto_launch_settings: {
            auto_launch_on_max_capacity: false,
            auto_launch_on_optimal_capacity: false,
            auto_launch_on_min_capacity: false
        }
    });
    const router = useRouter();

    useEffect(() => {
        if (initialCourse) {
            // Parse JSON fields safely
            const parseJsonField = (field, defaultValue) => {
                if (typeof field === 'string') {
                    try {
                        return JSON.parse(field);
                    } catch (e) {
                        return defaultValue;
                    }
                }
                return field || defaultValue;
            };

            setCourse({
                ...initialCourse,
                name: initialCourse.name || '',
                description: initialCourse.description || '',
                duration_days: initialCourse.duration_days || 7,
                start_date: initialCourse.start_date || '',
                days_per_week: initialCourse.days_per_week || 5,
                hours_per_day: initialCourse.hours_per_day || 2.0,
                content_outline: initialCourse.content_outline || '',
                details: parseJsonField(initialCourse.details, {
                    cost: 0,
                    currency: 'EGP',
                    max_seats: 15,
                    teachers: []
                }),
                participant_config: parseJsonField(initialCourse.participant_config, {
                    level_1: { name: 'مشرف', roles: ['admin', 'head'], min: 1, max: 2, optimal: 1 },
                    level_2: { name: 'معلم/مدرب', roles: ['teacher'], min: 1, max: 3, optimal: 2 },
                    level_3: { name: 'طالب', roles: ['student'], min: 5, max: 20, optimal: 12 }
                }),
                auto_launch_settings: parseJsonField(initialCourse.auto_launch_settings, {
                    auto_launch_on_max_capacity: false,
                    auto_launch_on_optimal_capacity: false,
                    auto_launch_on_min_capacity: false
                })
            });
        }
    }, [initialCourse]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCourse(prev => ({ ...prev, [name]: value }));
    };

    const handleDetailsChange = (e) => {
        const { name, value, type } = e.target;
        setCourse(prev => ({
            ...prev,
            details: {
                ...prev.details,
                [name]: type === 'number' ? parseInt(value, 10) : value
            }
        }));
    };

    const handleTeachersChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setCourse(prev => ({
            ...prev,
            details: { ...prev.details, teachers: selectedOptions }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Form submitted explicitly by user click'); // Debug log
        
        // Ensure this is a real submit event, not accidental
        if (e.type !== 'submit') {
            console.log('Prevented non-submit event:', e.type);
            return;
        }
        
        const url = initialCourse ? `/api/courses/${initialCourse.id}` : '/api/courses/create-advanced';
        const method = initialCourse ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(course)
            });

            const result = await response.json();
            if (response.ok) {
                alert('✅ تم حفظ الدورة بنجاح!');
                
                if (initialCourse) {
                    // For editing existing course - redirect to schedule page
                    router.push(`/admin/courses/${initialCourse.id}/schedule`);
                } else {
                    // For creating new course - use returned ID
                    if (result.id) {
                        router.push(`/admin/courses/${result.id}/schedule`);
                    } else {
                        console.error('Course ID is missing:', result);
                        alert('⚠️ تم حفظ الدورة لكن حدث خطأ في التوجيه. يرجى الذهاب لقائمة الدورات.');
                        router.push('/admin/courses/manage');
                    }
                }
            } else {
                alert('⚠️ خطأ: ' + result.message);
            }
        } catch (err) {
            alert('🚫 خطأ في الاتصال بالخادم.');
        }
    };

    const handleParticipantConfigChange = (level, field, value) => {
        setCourse(prev => ({
            ...prev,
            participant_config: {
                ...prev.participant_config,
                [level]: {
                    ...prev.participant_config[level],
                    [field]: value
                }
            }
        }));
    };

    const handleAutoLaunchChange = (setting, value) => {
        console.log('Auto launch change:', setting, value); // Debug log
        setCourse(prev => ({
            ...prev,
            auto_launch_settings: {
                ...prev.auto_launch_settings,
                [setting]: value
            }
        }));
    };

    const nextStep = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setCurrentStep(prev => Math.min(prev + 1, 3));
    };
    
    const prevStep = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    // فلترة المستخدمين لعرض المعلمين فقط
    const teacherUsers = allUsers.filter(u => u.role === 'teacher');

    const renderStep1 = () => (
        <div className="step-content">
            <h3>📋 المعلومات الأساسية للدورة</h3>
            <div className="form-grid">
                <div className="form-group full-width">
                    <label htmlFor="name">🏷️ اسم الدورة</label>
                    <input type="text" id="name" name="name" value={course.name} onChange={handleChange} required />
                </div>

                <div className="form-group full-width">
                    <label htmlFor="description">📝 وصف الدورة السريع</label>
                    <textarea id="description" name="description" value={course.description} onChange={handleChange} rows="3"></textarea>
                </div>

                <div className="form-group full-width">
                    <label htmlFor="content_outline">📚 جدول محتويات الدورة</label>
                    <textarea id="content_outline" name="content_outline" value={course.content_outline} onChange={handleChange} rows="5" placeholder="اكتب محتويات الدورة بالتفصيل..."></textarea>
                </div>

                <div className="form-group">
                    <label htmlFor="duration_days">📅 مدة الدورة (بالأيام)</label>
                    <input type="number" id="duration_days" name="duration_days" value={course.duration_days} onChange={handleChange} min="1" max="365" />
                </div>

                <div className="form-group">
                    <label htmlFor="start_date">🗓️ تاريخ بدء الدورة</label>
                    <input type="date" id="start_date" name="start_date" value={course.start_date} onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label htmlFor="days_per_week">📆 عدد أيام الدورة في الأسبوع</label>
                    <select id="days_per_week" name="days_per_week" value={course.days_per_week} onChange={handleChange}>
                        <option value="1">يوم واحد</option>
                        <option value="2">يومان</option>
                        <option value="3">ثلاثة أيام</option>
                        <option value="4">أربعة أيام</option>
                        <option value="5">خمسة أيام</option>
                        <option value="6">ستة أيام</option>
                        <option value="7">سبعة أيام</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="hours_per_day">⏰ مدة اليوم (بالساعات)</label>
                    <input type="number" id="hours_per_day" name="hours_per_day" value={course.hours_per_day} onChange={handleChange} step="0.5" min="0.5" max="12" />
                </div>

                <div className="form-group">
                    <label htmlFor="cost">💰 التكلفة</label>
                    <input type="number" id="cost" name="cost" value={course.details.cost} onChange={handleDetailsChange} />
                </div>
                
                <div className="form-group">
                    <label htmlFor="currency">💱 العملة</label>
                    <select id="currency" name="currency" value={course.details.currency} onChange={handleDetailsChange}>
                        <option value="EGP">جنيه مصري (EGP)</option>
                        <option value="SAR">ريال سعودي (SAR)</option>
                        <option value="USD">دولار أمريكي (USD)</option>
                    </select>
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="step-content">
            <h3>👥 تكوين المشاركين حسب الدرجات</h3>
            <p className="step-description">حدد الأصناف والأعداد المطلوبة لكل درجة من درجات المشاركين</p>
            
            {Object.entries(course.participant_config).map(([level, config]) => (
                <div key={level} className="participant-level-config">
                    <h4>
                        {level === 'level_1' && '🎯 درجة 1 - المشرف'}
                        {level === 'level_2' && '👨‍🏫 درجة 2 - المسؤول'}
                        {level === 'level_3' && '🎓 درجة 3 - المتلقي'}
                    </h4>
                    
                    <div className="form-grid">
                        <div className="form-group">
                            <label>اسم الدرجة</label>
                            <input 
                                type="text" 
                                value={config.name} 
                                onChange={(e) => handleParticipantConfigChange(level, 'name', e.target.value)}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>الأدوار المستهدفة</label>
                            <select 
                                multiple 
                                value={config.roles} 
                                onChange={(e) => handleParticipantConfigChange(level, 'roles', Array.from(e.target.selectedOptions, option => option.value))}
                                style={{ height: '80px' }}
                            >
                                <option value="admin">مدير</option>
                                <option value="head">رئيس قسم</option>
                                <option value="teacher">معلم</option>
                                <option value="student">طالب</option>
                                <option value="parent">ولي أمر</option>
                                <option value="worker">عامل</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>الحد الأدنى</label>
                            <input 
                                type="number" 
                                value={config.min} 
                                onChange={(e) => handleParticipantConfigChange(level, 'min', parseInt(e.target.value))}
                                min="0"
                            />
                        </div>

                        <div className="form-group">
                            <label>الحد الأقصى</label>
                            <input 
                                type="number" 
                                value={config.max} 
                                onChange={(e) => handleParticipantConfigChange(level, 'max', parseInt(e.target.value))}
                                min="1"
                            />
                        </div>

                        <div className="form-group">
                            <label>العدد المثالي</label>
                            <input 
                                type="number" 
                                value={config.optimal} 
                                onChange={(e) => handleParticipantConfigChange(level, 'optimal', parseInt(e.target.value))}
                                min="1"
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderStep3 = () => (
        <div className="step-content">
            <h3>🚀 إعدادات النشر والانطلاق</h3>
            
            <div className="form-group">
                <label htmlFor="teachers">👨‍🏫 المعلمون المكلفون</label>
                <select id="teachers" name="teachers" multiple value={course.details.teachers} onChange={handleTeachersChange} style={{ height: '120px' }}>
                    {teacherUsers.map(teacher => (
                        <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>
                    ))}
                </select>
            </div>

            <div className="auto-launch-settings">
                <h4>⚙️ إعدادات الانطلاق التلقائي</h4>
                
                <div className="form-group checkbox-group">
                    <label onClick={(e) => e.preventDefault()}>
                        <input 
                            type="checkbox" 
                            checked={course.auto_launch_settings.auto_launch_on_max_capacity || false}
                            onChange={(e) => {
                                e.stopPropagation();
                                handleAutoLaunchChange('auto_launch_on_max_capacity', e.target.checked);
                            }}
                        />
                        <span>انطلاق تلقائي عند اكتمال العدد الأقصى قبل تاريخ بدء الدورة</span>
                    </label>
                </div>

                <div className="form-group checkbox-group">
                    <label onClick={(e) => e.preventDefault()}>
                        <input 
                            type="checkbox" 
                            checked={course.auto_launch_settings.auto_launch_on_optimal_capacity || false}
                            onChange={(e) => {
                                e.stopPropagation();
                                handleAutoLaunchChange('auto_launch_on_optimal_capacity', e.target.checked);
                            }}
                        />
                        <span>انطلاق تلقائي عند بلوغ العدد المثالي قبل بدء الدورة بيوم واحد</span>
                    </label>
                </div>

                <div className="form-group checkbox-group">
                    <label onClick={(e) => e.preventDefault()}>
                        <input 
                            type="checkbox" 
                            checked={course.auto_launch_settings.auto_launch_on_min_capacity || false}
                            onChange={(e) => {
                                e.stopPropagation();
                                handleAutoLaunchChange('auto_launch_on_min_capacity', e.target.checked);
                            }}
                        />
                        <span>انطلاق تلقائي عند بلوغ الحد الأدنى قبل بدء الدورة بيوم واحد</span>
                    </label>
                </div>
            </div>
        </div>
    );

    return (
        <div className="form-container modern-form">
            <style jsx>{`
                .modern-form { background: #fff; padding: 30px; border-radius: 12px; box-shadow: var(--shadow-lg); }
                .step-indicator { display: flex; justify-content: center; margin-bottom: 30px; }
                .step { padding: 10px 20px; margin: 0 5px; border-radius: 20px; background: #f8f9fa; color: #6c757d; }
                .step.active { background: var(--primary-color); color: white; }
                .step.completed { background: var(--success-color); color: white; }
                .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 25px; }
                .full-width { grid-column: 1 / -1; }
                .form-group { display: flex; flex-direction: column; }
                .form-group label { margin-bottom: 8px; font-weight: 500; color: #333; }
                .form-group input, .form-group textarea, .form-group select {
                    padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem;
                    font-family: var(--font-tajawal);
                }
                .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
                    outline: none; border-color: var(--primary-color); box-shadow: 0 0 0 3px rgba(0, 86, 179, 0.1);
                }
                .participant-level-config { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                .participant-level-config h4 { margin-top: 0; color: var(--primary-color); }
                .auto-launch-settings { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px; }
                .checkbox-group label { flex-direction: row; align-items: center; cursor: pointer; }
                .checkbox-group input { width: auto; margin-right: 10px; cursor: pointer; }
                .step-description { color: #6c757d; margin-bottom: 20px; }
                .navigation-buttons { display: flex; justify-content: space-between; margin-top: 30px; }
                .btn { padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; }
                .btn-primary { background: var(--primary-color); color: white; }
                .btn-secondary { background: #6c757d; color: white; }
                .btn-success { background: var(--success-color); color: white; }
                .btn:hover { transform: translateY(-2px); }
                .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
            `}</style>
            
            <div className="step-indicator">
                <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                    1. المعلومات الأساسية
                </div>
                <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                    2. تكوين المشاركين
                </div>
                <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
                    3. إعدادات النشر
                </div>
            </div>

            <form 
                onSubmit={handleSubmit} 
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.type !== 'submit') {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }}
                onMouseOver={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
            >
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}

                <div className="navigation-buttons">
                    <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            prevStep(e);
                        }}
                        onMouseEnter={(e) => e.stopPropagation()}
                        disabled={currentStep === 1}
                    >
                        ← السابق
                    </button>
                    
                    {currentStep < 3 ? (
                        <button 
                            type="button" 
                            className="btn btn-primary" 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                nextStep(e);
                            }}
                            onMouseEnter={(e) => e.stopPropagation()}
                        >
                            التالي →
                        </button>
                    ) : (
                        <button 
                            type="submit" 
                            className="btn btn-success"
                            onMouseEnter={(e) => e.stopPropagation()}
                            onMouseLeave={(e) => e.stopPropagation()}
                            onFocus={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                console.log('Submit button clicked');
                                e.stopPropagation();
                            }}
                        >
                            {initialCourse ? '💾 تحديث الدورة والانتقال للجدولة' : '➕ إنشاء الدورة والانتقال للجدولة'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default CourseForm;