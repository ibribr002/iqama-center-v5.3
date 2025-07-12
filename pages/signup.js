import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    role: 'student',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    gender: 'male',
    birth_date: '',
    nationality: '',
    country: '',
    otherCountryName: '',
    preferredLanguage: 'ar',
    languages: '',
    parentContactOptional: '',
    fatherPerspective: '',
    motherPerspective: '',
    workerSpecializations: [],
    agreeTerms: false
  });
  
  const countries = [
    'السعودية', 'مصر', 'الإمارات', 'الكويت', 'قطر', 'البحرين', 'عمان',
    'الأردن', 'لبنان', 'سوريا', 'العراق', 'فلسطين', 'المغرب', 'الجزائر',
    'تونس', 'ليبيا', 'السودان', 'اليمن', 'الصومال', 'جيبوتي', 'موريتانيا',
    'أخرى'
  ];

  const workerSpecializations = [
    'معلم', 'مدرب', 'مشرف حلقة', 'مسؤول بيانات الطلاب', 'مسؤول بيانات العاملين',
    'مصمم تسويقي', 'مصمم كتاب علمي', 'منتج علمي', 'باحث علمي', 'مدير مالي',
    'مدير اقتصادي', 'دعم المكتبة', 'خدمة عملاء', 'مبرمج', 'رئيس قسم', 'إدارة عليا'
  ];

  const nationalities = [
    'سعودي', 'مصري', 'إماراتي', 'كويتي', 'قطري', 'بحريني', 'عماني',
    'أردني', 'لبناني', 'سوري', 'عراقي', 'فلسطيني', 'مغربي', 'جزائري',
    'تونسي', 'ليبي', 'سوداني', 'يمني', 'صومالي', 'جيبوتي', 'موريتاني',
    'أخرى'
  ];
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox' && name === 'workerSpecializations') {
      setFormData((prev) => ({
        ...prev,
        workerSpecializations: checked
          ? [...prev.workerSpecializations, value]
          : prev.workerSpecializations.filter(spec => spec !== value)
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const isParentContactRequired = () => {
    if (formData.role === 'student' && formData.birth_date) {
      const age = calculateAge(formData.birth_date);
      return age < 10;
    }
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setIsError(false);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setMessage('كلمات المرور غير متطابقة');
      setIsError(true);
      return;
    }

    if (!formData.agreeTerms) {
      setMessage('يجب الموافقة على الشروط والأحكام');
      setIsError(true);
      return;
    }

    // Check if parent contact is required for young students
    if (isParentContactRequired() && !formData.parentContactOptional.trim()) {
      setMessage('بريد/هاتف ولي الأمر مطلوب للطلاب تحت سن 10 سنوات');
      setIsError(true);
      return;
    }

    const { fullName, email, phone, password, role, confirmPassword, agreeTerms, ...details } = formData;
    if (details.languages) {
        details.languages = details.languages.split(',').map(s => s.trim());
    }

    const data = { fullName, email, phone, password, role, details };

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      setMessage(result.message);

      if (response.ok) {
        setIsError(false);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setIsError(true);
      }
    } catch (err) {
      setMessage('لا يمكن الاتصال بالخادم.');
      setIsError(true);
    }
  };

  return (
    <>
      <Head>
        <title>إنشاء حساب جديد</title>
        
      </Head>
      <div className="form-page-container">
        <div className="form-container">
          <h2>إنشاء حساب جديد</h2>
          {message && (
            <div className={`message ${isError ? 'error' : 'success'}`}>
              {message}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="role">أنا أسجل كـ:</label>
                <select id="role" name="role" value={formData.role} onChange={handleChange} required>
                  <option value="student">طالب</option>
                  <option value="parent">ولي أمر</option>
                  <option value="worker">عامل/موظف</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="fullName">الاسم رباعي *</label>
                <input 
                  type="text" 
                  id="fullName" 
                  name="fullName" 
                  value={formData.fullName} 
                  onChange={handleChange} 
                  placeholder="الاسم الأول الثاني الثالث الرابع"
                  required 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="gender">الجنس *</label>
                <select id="gender" name="gender" value={formData.gender} onChange={handleChange} required>
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="birth_date">تاريخ الميلاد *</label>
                <input 
                  type="date" 
                  id="birth_date" 
                  name="birth_date" 
                  value={formData.birth_date} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">رقم الهاتف *</label>
                <input 
                  type="tel" 
                  id="phone" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  placeholder="+966xxxxxxxxx"
                  required 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">البريد الإلكتروني *</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  placeholder="example@domain.com"
                  required 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">كلمة السر *</label>
                <input 
                  type="password" 
                  id="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  placeholder="8 أحرف على الأقل"
                  minLength="8"
                  required 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">تأكيد كلمة السر *</label>
                <input 
                  type="password" 
                  id="confirmPassword" 
                  name="confirmPassword" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  placeholder="أعد كتابة كلمة السر"
                  required 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="nationality">الجنسية *</label>
                <select id="nationality" name="nationality" value={formData.nationality} onChange={handleChange} required>
                  <option value="">اختر الجنسية</option>
                  {nationalities.map(nat => (
                    <option key={nat} value={nat}>{nat}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="country">دولة الإقامة *</label>
                <select id="country" name="country" value={formData.country} onChange={handleChange} required>
                  <option value="">اختر دولة الإقامة</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
              
              {/* Other Country Name - Show if "أخرى" is selected */}
              {formData.country === 'أخرى' && (
                <div className="form-group">
                  <label htmlFor="otherCountryName">اسم الدولة *</label>
                  <input 
                    type="text" 
                    id="otherCountryName" 
                    name="otherCountryName" 
                    value={formData.otherCountryName} 
                    onChange={handleChange} 
                    placeholder="أدخل اسم الدولة"
                    required 
                  />
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="preferredLanguage">اللغة المفضلة *</label>
                <select id="preferredLanguage" name="preferredLanguage" value={formData.preferredLanguage} onChange={handleChange} required>
                  <option value="ar">عربي</option>
                  <option value="en">English</option>
                </select>
              </div>
              
              <div className="form-group full-width">
                <label htmlFor="languages">اللغات التي تتقنها (افصل بينها بفاصلة)</label>
                <input 
                  type="text" 
                  id="languages" 
                  name="languages" 
                  value={formData.languages} 
                  onChange={handleChange} 
                  placeholder="العربية, الإنجليزية, الفرنسية"
                />
              </div>
              
              {/* Parent Contact - Required for students under 10, optional for others */}
              {formData.role === 'student' && (
                <div className="form-group full-width">
                  <label htmlFor="parentContactOptional">
                    بريد/هاتف ولي الأمر {isParentContactRequired() ? '(مطلوب)' : '(اختياري)'}
                  </label>
                  <input 
                    type="text" 
                    id="parentContactOptional" 
                    name="parentContactOptional" 
                    value={formData.parentContactOptional} 
                    onChange={handleChange} 
                    placeholder={isParentContactRequired() ? "مطلوب للطلاب تحت سن 10 سنوات" : "يمكن إضافته لاحقاً"}
                    required={isParentContactRequired()}
                  />
                </div>
              )}

              {/* Parent Information for Parents */}
              {formData.role === 'parent' && (
                <div className="form-group full-width">
                  <div className="info-box">
                    <i className="fas fa-info-circle"></i>
                    <p>يمكنك إضافة حسابات للأطفال بعد التسجيل من خلال لوحة التحكم الخاصة بك.</p>
                  </div>
                </div>
              )}

              {/* Worker Specializations - Only for workers */}
              {formData.role === 'worker' && (
                <div className="form-group full-width">
                  <label>التخصصات المفضلة (اختياري - يمكن تغييرها لاحقاً)</label>
                  <div className="info-text">
                    <small>هذه فقط كرغبات لكن لن يتم اعتماد شيء إلا بعد اكتمال التدريب وتأكيد المدرب على التخصص الأنسب.</small>
                  </div>
                  <div className="specializations-grid">
                    {workerSpecializations.map(spec => (
                      <label key={spec} className="checkbox-label">
                        <input
                          type="checkbox"
                          name="workerSpecializations"
                          value={spec}
                          checked={formData.workerSpecializations.includes(spec)}
                          onChange={handleChange}
                        />
                        <span>{spec}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Parent Perspectives - Only for students */}
              {formData.role === 'student' && (
                  <>
                      <div className="form-group full-width">
                          <label htmlFor="fatherPerspective">مميزات وعيوب وطموحات من وجهة نظر الأب (اختياري)</label>
                          <textarea id="fatherPerspective" name="fatherPerspective" value={formData.fatherPerspective} onChange={handleChange} rows="3" placeholder="يمكن للأب كتابة ملاحظاته هنا حول نقاط القوة والضعف والطموحات"></textarea>
                      </div>
                      <div className="form-group full-width">
                          <label htmlFor="motherPerspective">مميزات وعيوب وطموحات من وجهة نظر الأم (اختياري)</label>
                          <textarea id="motherPerspective" name="motherPerspective" value={formData.motherPerspective} onChange={handleChange} rows="3" placeholder="يمكن للأم كتابة ملاحظاتها هنا حول نقاط القوة والضعف والطموحات"></textarea>
                      </div>
                  </>
              )}
              
              {/* Terms and Conditions */}
              <div className="form-group full-width">
                <div className="checkbox-group">
                  <input 
                    type="checkbox" 
                    id="agreeTerms" 
                    name="agreeTerms" 
                    checked={formData.agreeTerms} 
                    onChange={(e) => setFormData(prev => ({...prev, agreeTerms: e.target.checked}))}
                    required 
                  />
                  <label htmlFor="agreeTerms">
                    أوافق على <a href="/terms" target="_blank">الشروط والأحكام</a> و
                    <a href="/privacy" target="_blank">سياسة الخصوصية</a> *
                  </label>
                </div>
              </div>
            </div>
            
            <button type="submit" className="submit-btn">إنشاء الحساب</button>
          </form>
           <p className="form-link">
            لديك حساب بالفعل؟ <Link href="/login">تسجيل الدخول</Link>
          </p>
          <p className="form-link">
            <Link href="/">العودة للصفحة الرئيسية</Link>
          </p>
        </div>
      </div>
      <style jsx>{`
        .form-page-container {
          font-family: 'Tajawal', sans-serif;
          background-color: #f4f4f4;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px 0;
        }
        .form-container {
          background: white;
          padding: 40px;
          width: 100%;
          max-width: 600px;
          border-radius: 8px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        h2 {
          text-align: center;
          margin-bottom: 30px;
          color: #0056b3;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .form-group {
          margin-bottom: 15px;
        }
        .full-width {
          grid-column: 1 / -1;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }
        input,
        select,
        textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 5px;
          font-size: 1rem;
        }
        button {
          width: 100%;
          padding: 15px;
          font-size: 1.1rem;
          cursor: pointer;
          border: none;
          border-radius: 5px;
          background-color: #28a745;
          color: white;
        }
        .message {
          text-align: center;
          padding: 10px;
          margin-bottom: 15px;
          border-radius: 5px;
        }
        .message.error {
          color: #721c24;
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
        }
        .message.success {
          color: #155724;
          background-color: #d4edda;
          border: 1px solid #c3e6cb;
        }
        .form-link {
          text-align: center;
          margin-top: 20px;
        }
        
        .info-box {
          background: #e3f2fd;
          border: 1px solid #2196f3;
          border-radius: 5px;
          padding: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .info-box i {
          color: #2196f3;
          font-size: 1.2rem;
        }
        
        .info-box p {
          margin: 0;
          color: #1976d2;
        }
        
        .info-text {
          margin-bottom: 10px;
        }
        
        .info-text small {
          color: #666;
          font-style: italic;
        }
        
        .specializations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          margin-top: 10px;
        }
        
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .checkbox-label:hover {
          background-color: #f8f9fa;
        }
        
        .checkbox-label input[type="checkbox"] {
          width: auto;
          margin: 0;
        }
        
        .checkbox-label span {
          font-size: 0.9rem;
        }
      `}</style>
    </>
  );
}
