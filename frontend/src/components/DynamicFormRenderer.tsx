import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Send } from 'lucide-react';
import API from '../api';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'radio' | 'checkbox';
  required?: boolean;
  order?: number;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

interface CustomFormData {
  id: number;
  title: string;
  description?: string;
  fields_schema: FormField[];
  expiration_date: string;
  is_expired: boolean;
}

interface DynamicFormRendererProps {
  onFormSubmitted?: () => void;
}

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({ onFormSubmitted }) => {
  const [form, setForm] = useState<CustomFormData | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  useEffect(() => {
    fetchActiveForm();
  }, []);

  const fetchActiveForm = async () => {
    try {
      setLoading(true);
      const response = await API.get('custom-forms/active/');
      
      if (response.data && response.data.length > 0) {
        // دریافت اولین فرم فعال
        const activeForm = response.data[0];
        setForm(activeForm);
        
        // اگر کاربر قبلاً پاسخ داده بود، آن را دریافت کن
        if (activeForm.id) {
          fetchExistingResponse(activeForm.id);
        }
      } else {
        setForm(null);
      }
      setMessage('');
    } catch (err: any) {
      console.error('Error fetching active form:', err);
      setMessage('خطا در دریافت فرم.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingResponse = async (formId: number) => {
    try {
      // فرض می‌کنیم endpoint GET برای مشاهده پاسخ موجود
      const response = await API.get(`custom-forms/${formId}/responses/`);
      if (response.data && response.data.length > 0) {
        setAnswers(response.data[0].answers);
      }
    } catch (err) {
      // اگر پاسخی نبود، کاربر می‌تواند فرم را برای بار اول پر کند
      console.log('No existing response found');
    }
  };

  const handleInputChange = (fieldName: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleCheckboxChange = (fieldName: string, value: string, checked: boolean) => {
    setAnswers(prev => {
      const current = prev[fieldName] || [];
      if (checked) {
        return {
          ...prev,
          [fieldName]: [...current, value]
        };
      } else {
        return {
          ...prev,
          [fieldName]: current.filter((v: string) => v !== value)
        };
      }
    });
  };

  const validateForm = (): boolean => {
    if (!form) return false;

    for (const field of form.fields_schema) {
      if (field.required) {
        const value = answers[field.name];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          setMessage(`فیلد "${field.label}" الزامی است.`);
          setMessageType('error');
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form) return;
    if (!validateForm()) return;

    setSubmitting(true);
    setMessage('');

    try {
      const response = await API.post(`custom-forms/${form.id}/submit/`, {
        answers
      });

      if (response.status === 201 || response.status === 200) {
        setMessage('پاسخ‌های شما با موفقیت ثبت شد ✨');
        setMessageType('success');
        setAnswers({});
        
        if (onFormSubmitted) {
          setTimeout(() => onFormSubmitted(), 1500);
        }
      }
    } catch (err: any) {
      console.error('Error submitting form:', err);
      setMessage('خطا در ثبت پاسخ‌ها. لطفاً دوباره تلاش کنید.');
      setMessageType('error');
    } finally {
      setSubmitting(false);
    }
  };

  // اگر در حال بارگذاری است
  if (loading) {
    return (
      <div style={{
        backgroundColor: 'rgba(23, 14, 46, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1.5px solid rgba(217, 70, 239, 0.4)',
        borderRadius: '1.75rem',
        padding: '1.5rem',
        boxShadow: '0 0 30px rgba(162, 28, 175, 0.25)',
        color: '#e9d5ff',
        textAlign: 'center'
      }}>
        فرم‌های سفارشی را بارگذاری می‌کنم...
      </div>
    );
  }

  // اگر فرم فعالی نیست
  if (!form) {
    return (
      <div style={{
        backgroundColor: 'rgba(23, 14, 46, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1.5px solid rgba(217, 70, 239, 0.4)',
        borderRadius: '1.75rem',
        padding: '1.5rem',
        boxShadow: '0 0 30px rgba(162, 28, 175, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        color: '#a8a8ff'
      }}>
        <AlertCircle style={{ width: '20px', height: '20px' }} />
        <span>هیچ فرم فعالی برای تکمیل وجود ندارد.</span>
      </div>
    );
  }

  // اگر فرم منقضی شده است
  if (form.is_expired) {
    return (
      <div style={{
        backgroundColor: 'rgba(23, 14, 46, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1.5px solid rgba(217, 70, 239, 0.4)',
        borderRadius: '1.75rem',
        padding: '1.5rem',
        boxShadow: '0 0 30px rgba(162, 28, 175, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        color: '#ff6b6b'
      }}>
        <AlertCircle style={{ width: '20px', height: '20px' }} />
        <span>این فرم انقضا شده است و دیگر قابل تکمیل نیست.</span>
      </div>
    );
  }

  // مرتب کردن فیلدها بر اساس order
  const sortedFields = [...form.fields_schema].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div style={{
      backgroundColor: 'rgba(23, 14, 46, 0.85)',
      backdropFilter: 'blur(16px)',
      border: '1.5px solid rgba(217, 70, 239, 0.4)',
      borderRadius: '1.75rem',
      padding: '1.5rem',
      boxShadow: '0 0 30px rgba(162, 28, 175, 0.25)'
    }}>
      {/* سرتیتر فرم */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.25rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid rgba(217, 70, 239, 0.2)'
      }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.3rem', color: '#f0abfc' }}>
            {form.title}
          </h3>
          {form.description && (
            <p style={{ fontSize: '0.85rem', color: '#d8b4fe', margin: 0 }}>
              {form.description}
            </p>
          )}
        </div>
        <CheckCircle style={{ width: '24px', height: '24px', color: '#86efac' }} />
      </div>

      {/* پیام‌ها */}
      {message && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.75rem',
          backgroundColor: messageType === 'success' ? 'rgba(34, 197, 94, 0.2)' : 
                           messageType === 'error' ? 'rgba(239, 68, 68, 0.2)' : 
                           'rgba(59, 130, 246, 0.2)',
          border: messageType === 'success' ? '1px solid rgba(34, 197, 94, 0.4)' :
                  messageType === 'error' ? '1px solid rgba(239, 68, 68, 0.4)' :
                  '1px solid rgba(59, 130, 246, 0.4)',
          borderRadius: '0.75rem',
          color: messageType === 'success' ? '#86efac' : 
                 messageType === 'error' ? '#ef5350' :
                 '#60a5fa',
          fontSize: '0.85rem',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}

      {/* فرم */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {sortedFields.map((field) => (
          <div key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{
              fontSize: '0.8rem',
              color: '#d8b4fe',
              fontWeight: 600
            }}>
              {field.label}
              {field.required && <span style={{ color: '#ef5350' }}>*</span>}
            </label>

            {/* حقل متن ساده */}
            {field.type === 'text' && (
              <input
                type="text"
                placeholder={field.placeholder || ''}
                value={answers[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                required={field.required}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(15, 10, 30, 0.7)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  borderRadius: '0.75rem',
                  padding: '0.6rem 0.8rem',
                  color: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
            )}

            {/* حقل متن چند‌خطی */}
            {field.type === 'textarea' && (
              <textarea
                rows={3}
                placeholder={field.placeholder || ''}
                value={answers[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                required={field.required}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(15, 10, 30, 0.7)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  borderRadius: '0.75rem',
                  padding: '0.6rem 0.8rem',
                  color: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'none',
                  fontFamily: 'inherit'
                }}
              />
            )}

            {/* حقل عددی */}
            {field.type === 'number' && (
              <input
                type="number"
                placeholder={field.placeholder || ''}
                value={answers[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value ? parseFloat(e.target.value) : '')}
                required={field.required}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(15, 10, 30, 0.7)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  borderRadius: '0.75rem',
                  padding: '0.6rem 0.8rem',
                  color: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
            )}

            {/* لیست انتخاب */}
            {field.type === 'select' && (
              <select
                value={answers[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                required={field.required}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(15, 10, 30, 0.7)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  borderRadius: '0.75rem',
                  padding: '0.6rem 0.8rem',
                  color: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              >
                <option value="">انتخاب کنید...</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value} style={{ color: '#000' }}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            {/* دکمه‌های رادیویی */}
            {field.type === 'radio' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {field.options?.map((opt) => (
                  <label key={opt.value} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    color: '#e9d5ff',
                    fontSize: '0.9rem'
                  }}>
                    <input
                      type="radio"
                      name={field.name}
                      value={opt.value}
                      checked={answers[field.name] === opt.value}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      required={field.required}
                      style={{ cursor: 'pointer', accentColor: '#a21caf' }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            )}

            {/* چک‌باکس‌ها */}
            {field.type === 'checkbox' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {field.options?.map((opt) => (
                  <label key={opt.value} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    color: '#e9d5ff',
                    fontSize: '0.9rem'
                  }}>
                    <input
                      type="checkbox"
                      value={opt.value}
                      checked={(answers[field.name] || []).includes(opt.value)}
                      onChange={(e) => handleCheckboxChange(field.name, opt.value, e.target.checked)}
                      style={{ cursor: 'pointer', accentColor: '#a21caf' }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* دکمه ارسال */}
        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: '0.5rem',
            padding: '0.85rem',
            borderRadius: '1rem',
            border: 'none',
            background: 'linear-gradient(90deg, #c026d3 0%, #9333ea 50%, #4f46e5 100%)',
            boxShadow: '0 0 20px rgba(192, 38, 211, 0.5)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '1rem',
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <Send style={{ width: '18px', height: '18px' }} />
          {submitting ? 'در حال ارسال...' : 'ارسال پاسخ‌ها'}
        </button>
      </form>
    </div>
  );
};

export default DynamicFormRenderer;
