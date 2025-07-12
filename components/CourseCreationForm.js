import React, { useState } from 'react';

const CourseCreationForm = ({ onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        tableOfContents: '',
        duration: '', // عدد أيام الدورة
        startDate: '',
        weekDays: '', // عدد أيام الدورة في الأسبوع
        dailyHours: '', // مدة اليوم كم ساعة
        
        // نظام التقييمات الثلاثة
        grade1: {
            title: 'المتلقي (درجة 3)',
            categories: [
                { name: 'طالب', count: 0, selected: false },
                { name: 'عامل', count: 0, selected: false }
            ]
        },
        grade2: {
            title: 'المسؤول (درجة 2)', 
            categories: [
                { name: 'معلم', count: 0, selected: false },
                { name: 'مدرب', count: 0, selected: false },
                { name: 'رئيس قسم', count: 0, selected: false }
            ]
        },
        grade3: {
            title: 'المشرف (درجة 1)',
            categories: [
                { name: 'مشرف', count: 0, selected: false },
                { name: 'رئيس قسم عليا', count: 0, selected: false },
                { name: 'إدارة عليا', count: 0, selected: false }
            ]
        },

        // خيارات الإطلاق التلقائي
        autoLaunchOptions: {
            auto_launch_on_max_capacity: false, // إطلاق تلقائي عند اكتمال العدد الأقصى
            auto_launch_on_optimal_capacity: false, // إطلاق تلقائي عند بلوغ العدد المثالي
            auto_launch_on_min_capacity: false // إطلاق تلقائي عند بلوغ الحد الأدنى
        },

        // إعدادات الملء التلقائي
        autoFill: {
            meetingLink: '',
            contentLinkPattern: '',
            startNumber: 1,
            endNumber: 10,
            defaultTasks: {
                grade1: '', // تكاليف درجة 3 (الطلاب)
                grade2: '', // تكاليف درجة 2 (المعلمين)
                grade3: ''  // تكاليف درجة 1 (المشرفين)
            }
        }
    });

    const [currentStep, setCurrentStep] = useState(1);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleGradeChange = (gradeKey, categoryIndex, field, value) => {
        setFormData(prev => ({
            ...prev,
            [gradeKey]: {
                ...prev[gradeKey],
                categories: prev[gradeKey].categories.map((cat, idx) => 
                    idx === categoryIndex ? { ...cat, [field]: value } : cat
                )
            }
        }));
    };

    const handleAutoLaunchChange = (option) => {
        setFormData(prev => ({
            ...prev,
            autoLaunchOptions: {
                ...prev.autoLaunchOptions,
                [option]: !prev.autoLaunchOptions[option]
            }
        }));
    };

    const handleAutoFillChange = (field, value) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setFormData(prev => ({
                ...prev,
                autoFill: {
                    ...prev.autoFill,
                    [parent]: {
                        ...prev.autoFill[parent],
                        [child]: value
                    }
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                autoFill: {
                    ...prev.autoFill,
                    [field]: value
                }
            }));
        }
    };

    const validateStep = (step) => {
        switch (step) {
            case 1:
                return formData.name && formData.description && formData.duration && formData.startDate;
            case 2:
                return Object.values(formData).some(grade => 
                    grade.categories && grade.categories.some(cat => cat.selected && cat.count > 0)
                );
            case 3:
                return true; // Auto-fill is optional
            default:
                return true;
        }
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 4));
            setMessage({ text: '', type: '' });
        } else {
            setMessage({ text: 'يرجى ملء جميع الحقول المطلوبة', type: 'error' });
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
        setMessage({ text: '', type: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validateStep(currentStep)) {
            try {
                await onSubmit(formData);
                setMessage({ text: 'تم إنشاء الدورة بنجاح!', type: 'success' });
            } catch (error) {
                setMessage({ text: 'حدث خطأ في إنشاء الدورة', type: 'error' });
            }
        }
    };

    const renderStep1 = () => (
        <div className="step-content">
            <h3><i className="fas fa-info-circle"></i> معلومات الدورة الأساسية</h3>
            
            <div className="form-group">
                <label>اسم الدورة *</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="أدخل اسم الدورة"
                    required
                />
            </div>

            <div className="form-group">
                <label>الوصف السريع *</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="وصف مختصر للدورة"
                    rows="3"
                    required
                />
            </div>

            <div className="form-group">
                <label>جدول المحتويات</label>
                <textarea
                    name="tableOfContents"
                    value={formData.tableOfContents}
                    onChange={handleInputChange}
                    placeholder="قائمة بمحتويات الدورة"
                    rows="5"
                />
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>مدة الدورة (بالأيام) *</label>
                    <input
                        type="number"
                        name="duration"
                        value={formData.duration}
                        onChange={handleInputChange}
                        min="1"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>تاريخ بدء الدورة *</label>
                    <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        required
                    />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>عدد أيام الدورة في الأسبوع</label>
                    <select
                        name="weekDays"
                        value={formData.weekDays}
                        onChange={handleInputChange}
                    >
                        <option value="">اختر عدد الأيام</option>
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
                    <label>مدة اليوم (بالساعات)</label>
                    <input
                        type="number"
                        name="dailyHours"
                        value={formData.dailyHours}
                        onChange={handleInputChange}
                        min="0.5"
                        step="0.5"
                        placeholder="مثال: 2.5"
                    />
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="step-content">
            <h3><i className="fas fa-users"></i> نظام التقييمات والأدوار</h3>
            <p className="step-description">حدد الأدوار المختلفة والعدد المطلوب من كل دور</p>

            {Object.entries(formData).filter(([key]) => key.startsWith('grade')).map(([gradeKey, grade]) => (
                <div key={gradeKey} className="grade-section">
                    <h4>{grade.title}</h4>
                    <div className="categories-grid">
                        {grade.categories.map((category, idx) => (
                            <div key={idx} className="category-item">
                                <div className="category-header">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={category.selected}
                                            onChange={(e) => handleGradeChange(gradeKey, idx, 'selected', e.target.checked)}
                                        />
                                        <span>{category.name}</span>
                                    </label>
                                </div>
                                {category.selected && (
                                    <div className="category-count">
                                        <label>العدد المطلوب:</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={category.count}
                                            onChange={(e) => handleGradeChange(gradeKey, idx, 'count', parseInt(e.target.value) || 0)}
                                            placeholder="0"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <div className="auto-launch-section">
                <h4><i className="fas fa-rocket"></i> خيارات الإطلاق التلقائي</h4>
                <div className="auto-launch-options">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={formData.autoLaunchOptions.auto_launch_on_max_capacity}
                            onChange={() => handleAutoLaunchChange('auto_launch_on_max_capacity')}
                        />
                        <span>انطلاق تلقائي عند اكتمال العدد الأقصى قبل تاريخ بدء الدورة</span>
                    </label>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={formData.autoLaunchOptions.auto_launch_on_optimal_capacity}
                            onChange={() => handleAutoLaunchChange('auto_launch_on_optimal_capacity')}
                        />
                        <span>انطلاق تلقائي عند بلوغ العدد المثالي قبل بدء الدورة بيوم واحد</span>
                    </label>
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={formData.autoLaunchOptions.auto_launch_on_min_capacity}
                            onChange={() => handleAutoLaunchChange('auto_launch_on_min_capacity')}
                        />
                        <span>انطلاق تلقائي عند بلوغ الحد الأدنى قبل بدء الدورة بيوم واحد</span>
                    </label>
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="step-content">
            <h3><i className="fas fa-magic"></i> الملء التلقائي (اختياري)</h3>
            <p className="step-description">يمكنك تعيين قيم افتراضية لتسريع عملية جدولة الدورة</p>

            <div className="form-group">
                <label>رابط اللقاء الثابت</label>
                <input
                    type="url"
                    value={formData.autoFill.meetingLink}
                    onChange={(e) => handleAutoFillChange('meetingLink', e.target.value)}
                    placeholder="https://zoom.us/j/123456789"
                />
            </div>

            <div className="form-group">
                <label>نمط رابط المحتوى (استخدم ** للأرقام المتغيرة)</label>
                <input
                    type="text"
                    value={formData.autoFill.contentLinkPattern}
                    onChange={(e) => handleAutoFillChange('contentLinkPattern', e.target.value)}
                    placeholder="https://example.com/lesson-**.pdf"
                />
                <small>مثال: https://example.com/lesson-**.pdf سيصبح lesson-01.pdf, lesson-02.pdf</small>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>رقم البداية</label>
                    <input
                        type="number"
                        value={formData.autoFill.startNumber}
                        onChange={(e) => handleAutoFillChange('startNumber', parseInt(e.target.value) || 1)}
                        min="1"
                    />
                </div>
                <div className="form-group">
                    <label>رقم النهاية</label>
                    <input
                        type="number"
                        value={formData.autoFill.endNumber}
                        onChange={(e) => handleAutoFillChange('endNumber', parseInt(e.target.value) || 10)}
                        min="1"
                    />
                </div>
            </div>

            <div className="default-tasks-section">
                <h4>التكاليف الافتراضية لكل درجة</h4>
                
                <div className="form-group">
                    <label>تكاليف المتلقين (درجة 3) - الطلاب</label>
                    <textarea
                        value={formData.autoFill.defaultTasks.grade1}
                        onChange={(e) => handleAutoFillChange('defaultTasks.grade1', e.target.value)}
                        placeholder="امتحان اليوم، مراجعة المحتوى..."
                        rows="3"
                    />
                </div>

                <div className="form-group">
                    <label>تكاليف المسؤولين (درجة 2) - المعلمين</label>
                    <textarea
                        value={formData.autoFill.defaultTasks.grade2}
                        onChange={(e) => handleAutoFillChange('defaultTasks.grade2', e.target.value)}
                        placeholder="إعداد المحتوى، متابعة الطلاب..."
                        rows="3"
                    />
                </div>

                <div className="form-group">
                    <label>تكاليف المشرفين (درجة 1)</label>
                    <textarea
                        value={formData.autoFill.defaultTasks.grade3}
                        onChange={(e) => handleAutoFillChange('defaultTasks.grade3', e.target.value)}
                        placeholder="مراجعة التقارير، تقييم الأداء..."
                        rows="3"
                    />
                </div>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="step-content">
            <h3><i className="fas fa-check-circle"></i> مراجعة وتأكيد</h3>
            <div className="summary">
                <div className="summary-section">
                    <h4>معلومات الدورة</h4>
                    <p><strong>الاسم:</strong> {formData.name}</p>
                    <p><strong>المدة:</strong> {formData.duration} أيام</p>
                    <p><strong>تاريخ البدء:</strong> {formData.startDate}</p>
                </div>

                <div className="summary-section">
                    <h4>الأدوار المحددة</h4>
                    {Object.entries(formData).filter(([key]) => key.startsWith('grade')).map(([gradeKey, grade]) => (
                        <div key={gradeKey}>
                            <strong>{grade.title}:</strong>
                            <ul>
                                {grade.categories.filter(cat => cat.selected).map((cat, idx) => (
                                    <li key={idx}>{cat.name}: {cat.count}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="course-creation-form">
            <div className="form-header">
                <h2>إنشاء دورة جديدة</h2>
                <div className="step-indicator">
                    {[1, 2, 3, 4].map(step => (
                        <div key={step} className={`step ${currentStep >= step ? 'active' : ''}`}>
                            {step}
                        </div>
                    ))}
                </div>
            </div>

            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}

                <div className="form-actions">
                    {currentStep > 1 && (
                        <button type="button" onClick={prevStep} className="btn-secondary">
                            السابق
                        </button>
                    )}
                    
                    {currentStep < 4 ? (
                        <button type="button" onClick={nextStep} className="btn-primary">
                            التالي
                        </button>
                    ) : (
                        <button type="submit" className="btn-success">
                            إنشاء الدورة
                        </button>
                    )}
                    
                    <button type="button" onClick={onCancel} className="btn-cancel">
                        إلغاء
                    </button>
                </div>
            </form>

            <style jsx>{`
                .course-creation-form {
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 12px;
                    padding: 30px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                }

                .form-header {
                    text-align: center;
                    margin-bottom: 30px;
                }

                .step-indicator {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    margin-top: 20px;
                }

                .step {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #e0e0e0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    transition: all 0.3s;
                }

                .step.active {
                    background: var(--primary-color);
                    color: white;
                }

                .step-content {
                    margin-bottom: 30px;
                }

                .step-description {
                    color: #666;
                    margin-bottom: 20px;
                }

                .form-group {
                    margin-bottom: 20px;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #333;
                }

                .form-group input,
                .form-group textarea,
                .form-group select {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    font-size: 14px;
                    transition: border-color 0.3s;
                }

                .form-group input:focus,
                .form-group textarea:focus,
                .form-group select:focus {
                    outline: none;
                    border-color: var(--primary-color);
                }

                .form-group small {
                    display: block;
                    margin-top: 5px;
                    color: #666;
                    font-size: 12px;
                }

                .grade-section {
                    margin-bottom: 30px;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }

                .grade-section h4 {
                    margin-bottom: 15px;
                    color: var(--primary-color);
                }

                .categories-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 15px;
                }

                .category-item {
                    background: white;
                    padding: 15px;
                    border-radius: 8px;
                    border: 2px solid #e0e0e0;
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    font-weight: 500;
                }

                .checkbox-label input[type="checkbox"] {
                    width: auto;
                }

                .category-count {
                    margin-top: 10px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .category-count input {
                    width: 80px;
                }

                .auto-launch-section {
                    margin-top: 30px;
                    padding: 20px;
                    background: #f0f8ff;
                    border-radius: 8px;
                }

                .auto-launch-options {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .default-tasks-section {
                    margin-top: 30px;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 8px;
                }

                .summary {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                }

                .summary-section {
                    margin-bottom: 20px;
                }

                .summary-section h4 {
                    color: var(--primary-color);
                    margin-bottom: 10px;
                }

                .summary-section ul {
                    margin: 10px 0;
                    padding-left: 20px;
                }

                .message {
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    text-align: center;
                }

                .message.success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }

                .message.error {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }

                .form-actions {
                    display: flex;
                    justify-content: space-between;
                    gap: 15px;
                    margin-top: 30px;
                }

                .btn-primary,
                .btn-secondary,
                .btn-success,
                .btn-cancel {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .btn-primary {
                    background: var(--primary-color);
                    color: white;
                }

                .btn-secondary {
                    background: #6c757d;
                    color: white;
                }

                .btn-success {
                    background: #28a745;
                    color: white;
                }

                .btn-cancel {
                    background: #dc3545;
                    color: white;
                }

                .btn-primary:hover,
                .btn-secondary:hover,
                .btn-success:hover,
                .btn-cancel:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }

                @media (max-width: 768px) {
                    .form-row {
                        grid-template-columns: 1fr;
                    }
                    
                    .categories-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .form-actions {
                        flex-direction: column;
                    }
                }
            `}</style>
        </div>
    );
};

export default CourseCreationForm;