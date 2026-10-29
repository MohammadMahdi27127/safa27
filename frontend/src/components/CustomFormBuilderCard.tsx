import React, { useState, useEffect } from 'react';
import { Plus, X, Download, Save, AlertCircle } from 'lucide-react';
import API from '../api';

interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'radio' | 'checkbox';
  required: boolean;
  options?: string[];
}

interface CustomFormBuilderCardProps {
  workgroupId: number;
  workgroupName: string;
}

export const CustomFormBuilderCard: React.FC<CustomFormBuilderCardProps> = ({
  workgroupId,
  workgroupName
}) => {
  // فرم اصلی
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [expirationDate, setExpirationDate] = useState('');

  // فیلدهای دینامیک
  const [fields, setFields] = useState<FormField[]>([]);
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState<'text' | 'textarea' | 'radio' | 'checkbox'>('text');
  const [fieldOptions, setFieldOptions] = useState('');
  const [fieldRequired, setFieldRequired] = useState(false);

  // وضعیت فرم
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  
  // ✅ برای نمایش فرم‌های منتشر شده با تعداد پاسخ‌ها
  const [publishedForms, setPublishedForms] = useState<Array<{
    id: number;
    title: string;
    response_count: number;
  }>>([]);
  
  // ✅ برای مودال صادرات
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedFormForExport, setSelectedFormForExport] = useState<{ id: number; title: string } | null>(null);
  const [selectedDays, setSelectedDays] = useState(7);
  
  // بارگذاری فرم‌های منتشرشده هنگام Mount
  useEffect(() => {
    fetchPublishedForms();
  }, [workgroupId]);
  
  const fetchPublishedForms = async () => {
    try {
      const response = await API.get(`custom-forms/list/?workgroup_id=${workgroupId}`);
      if (response.data) {
        setPublishedForms(response.data);
      }
    } catch (err) {
      console.error('Error fetching published forms:', err);
    }
  };

  // افزودن فیلد جدید
  const handleAddField = () => {
    if (!fieldLabel.trim()) {
      setMessage('برچسب فیلد را وارد کنید');
      setMessageType('error');
      return;
    }

    const options = fieldType === 'radio' || fieldType === 'checkbox'
      ? fieldOptions.split('\n').filter(o => o.trim())
      : [];

    if ((fieldType === 'radio' || fieldType === 'checkbox') && options.length === 0) {
      setMessage('گزینه‌های فیلد را وارد کنید (هر سطر یک گزینه)');
      setMessageType('error');
      return;
    }

    const newField: FormField = {
      id: `field_${Date.now()}`,
      name: fieldLabel.toLowerCase().replace(/\s+/g, '_'),
      label: fieldLabel,
      type: fieldType,
      required: fieldRequired,
      options: options.length > 0 ? options : undefined
    };

    setFields([...fields, newField]);
    
    // پاک کردن فرم افزودن فیلد
    setFieldLabel('');
    setFieldType('text');
    setFieldOptions('');
    setFieldRequired(false);
    setMessage('');
  };

  // حذف فیلد
  const handleRemoveField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId));
  };

  // انتشار فرم
  const handlePublishForm = async () => {
    // اعتبارسنجی
    if (!formTitle.trim()) {
      setMessage('عنوان فرم الزامی است');
      setMessageType('error');
      return;
    }

    if (!expirationDate) {
      setMessage('تاریخ انقضا الزامی است');
      setMessageType('error');
      return;
    }

    if (fields.length === 0) {
      setMessage('حداقل یک فیلد برای فرم اضافه کنید');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const payload = {
        title: formTitle,
        description: formDescription,
        expiration_date: expirationDate,
        fields_schema: fields,
        workgroup_id: workgroupId
      };

      const response = await API.post('custom-forms/create/', payload);

      if (response.data?.id) {
        setMessage('فرم با موفقیت منتشر شد ✓');
        setMessageType('success');

        // بازنشانی فرم
        setTimeout(() => {
          setFormTitle('');
          setFormDescription('');
          setExpirationDate('');
          setFields([]);
          setMessage('');
        }, 1500);
      }
    } catch (err: any) {
      console.error('Error publishing form:', err);
      const errorMsg = err.response?.data?.error || 'خطا در انتشار فرم. لطفاً دوباره تلاش کنید.';
      setMessage(errorMsg);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ باز کردن مودال صادرات
  const handleOpenExportModal = (formId: number, formTitle: string, responseCount: number) => {
    if (responseCount === 0) {
      setMessage('این فرم هنوز پاسخی دریافت نکرده است.');
      setMessageType('info');
      return;
    }
    
    setSelectedFormForExport({ id: formId, title: formTitle });
    setSelectedDays(7);
    setShowExportModal(true);
  };

  // صادرات پاسخ‌ها
  const handleExportResponses = async () => {
    if (!selectedFormForExport) return;
    
    setLoading(true);
    setMessage('');

    try {
      const response = await API.get(
        `custom-forms/${selectedFormForExport.id}/export/?days=${selectedDays}`,
        {
          responseType: 'blob'
        }
      );

      // ✅ بررسی خطاهای blob (similar to skills export)
      if (response.status >= 400) {
        throw new Error(`Server error: ${response.status}`);
      }

      if (response.data instanceof Blob) {
        const contentType = (response.headers['content-type'] as string) || '';
        if (contentType.includes('application/json')) {
          const errorText = await response.data.text();
          try {
            const errorJson = JSON.parse(errorText);
            setMessage(errorJson.error || 'خطا نامعلوم در سرور');
          } catch {
            setMessage(errorText || 'خطا در دریافت فایل');
          }
          setMessageType('error');
          setLoading(false);
          return;
        }
      }

      // ایجاد لینک دانلود
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      let filename = `form_responses_${selectedFormForExport.id}.xlsx`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) {
          filename = decodeURIComponent(match[1]);
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage('پاسخ‌ها با موفقیت دانلود شدند ✓');
      setMessageType('success');
      
      // بستن مودال بعد از ۱.۵ ثانیه
      setTimeout(() => {
        setShowExportModal(false);
        setSelectedFormForExport(null);
      }, 1500);
    } catch (err: any) {
      console.error('Error exporting responses:', err);
      setMessage('خطا در دانلود پاسخ‌ها. لطفاً دوباره تلاش کنید.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div
      style={{
        backgroundColor: 'rgba(23, 14, 46, 0.72)',
        border: '1.5px solid rgba(168, 85, 247, 0.3)',
        borderRadius: '1.35rem',
        padding: '1.15rem 1.2rem',
        boxShadow: '0 0 22px rgba(168, 85, 247, 0.15)',
        backdropFilter: 'blur(14px)',
        direction: 'rtl'
      }}
    >
      {/* سرتیتر */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid rgba(168, 85, 247, 0.2)'
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '1.1rem',
            fontWeight: 800,
            color: '#a855f7',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Plus style={{ width: '20px', height: '20px' }} />
          سازنده فرم سفارشی
        </h3>
      </div>

      {/* پیام */}
      {message && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.75rem',
            backgroundColor:
              messageType === 'success'
                ? 'rgba(34, 197, 94, 0.2)'
                : messageType === 'error'
                  ? 'rgba(239, 68, 68, 0.2)'
                  : 'rgba(59, 130, 246, 0.2)',
            border:
              messageType === 'success'
                ? '1px solid rgba(34, 197, 94, 0.4)'
                : messageType === 'error'
                  ? '1px solid rgba(239, 68, 68, 0.4)'
                  : '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '0.75rem',
            color:
              messageType === 'success'
                ? '#86efac'
                : messageType === 'error'
                  ? '#ef5350'
                  : '#60a5fa',
            fontSize: '0.85rem',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <AlertCircle style={{ width: '16px', height: '16px' }} />
          {message}
        </div>
      )}

      {/* توضیح */}
      <p
        style={{
          margin: '0 0 1rem',
          fontSize: '0.85rem',
          color: '#a8a8ff',
          lineHeight: '1.4'
        }}
      >
        برای کارگروه "{workgroupName}" فرم سفارشی ایجاد کنید و پاسخ‌های اعضا را جمع‌آوری کنید.
      </p>

      {/* بخش اطلاعات فرم */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#a855f7',
              marginBottom: '0.35rem'
            }}
          >
            عنوان فرم
          </label>
          <input
            type="text"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="مثال: بازخورد رضایت اعضا"
            style={{
              width: '100%',
              padding: '0.65rem 0.75rem',
              borderRadius: '0.75rem',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              backgroundColor: 'rgba(168, 85, 247, 0.05)',
              color: '#fff',
              fontSize: '0.9rem',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#a855f7',
              marginBottom: '0.35rem'
            }}
          >
            توضیح
          </label>
          <textarea
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder="توضیح برای اعضاء..."
            style={{
              width: '100%',
              padding: '0.65rem 0.75rem',
              borderRadius: '0.75rem',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              backgroundColor: 'rgba(168, 85, 247, 0.05)',
              color: '#fff',
              fontSize: '0.9rem',
              boxSizing: 'border-box',
              resize: 'vertical',
              minHeight: '3rem',
              fontFamily: 'inherit'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginBottom: '1rem' }}>
          {/* تاریخ انقضا */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#a855f7',
                marginBottom: '0.35rem'
              }}
            >
              تاریخ انقضا
            </label>
            <input
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                backgroundColor: 'rgba(168, 85, 247, 0.05)',
                color: '#fff',
                fontSize: '0.9rem',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>
      </div>

      {/* بخش افزودن فیلدها */}
      <div style={{ 
        backgroundColor: 'rgba(168, 85, 247, 0.08)',
        borderRadius: '0.85rem',
        padding: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ marginBottom: '0.75rem', fontWeight: 600, color: '#a855f7', fontSize: '0.9rem' }}>
          افزودن فیلد جدید
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <input
            type="text"
            value={fieldLabel}
            onChange={(e) => setFieldLabel(e.target.value)}
            placeholder="برچسب فیلد (مثال: نام شما)"
            style={{
              width: '100%',
              padding: '0.6rem 0.7rem',
              borderRadius: '0.65rem',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              backgroundColor: 'rgba(168, 85, 247, 0.05)',
              color: '#fff',
              fontSize: '0.85rem',
              boxSizing: 'border-box',
              marginBottom: '0.5rem'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <select
            value={fieldType}
            onChange={(e) => setFieldType(e.target.value as any)}
            style={{
              padding: '0.6rem 0.7rem',
              borderRadius: '0.65rem',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              backgroundColor: 'rgba(168, 85, 247, 0.05)',
              color: '#a8a8ff',
              fontSize: '0.85rem'
            }}
          >
            <option value="text">متن کوتاه</option>
            <option value="textarea">متن طولانی</option>
            <option value="radio">انتخاب واحد</option>
            <option value="checkbox">چند انتخاب</option>
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a8a8ff', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={fieldRequired}
              onChange={(e) => setFieldRequired(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            الزامی
          </label>
        </div>

        {(fieldType === 'radio' || fieldType === 'checkbox') && (
          <textarea
            value={fieldOptions}
            onChange={(e) => setFieldOptions(e.target.value)}
            placeholder="گزینه‌ها (هر سطر یک گزینه)"
            style={{
              width: '100%',
              padding: '0.6rem 0.7rem',
              borderRadius: '0.65rem',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              backgroundColor: 'rgba(168, 85, 247, 0.05)',
              color: '#fff',
              fontSize: '0.85rem',
              boxSizing: 'border-box',
              resize: 'vertical',
              minHeight: '2.5rem',
              fontFamily: 'inherit',
              marginBottom: '0.5rem'
            }}
          />
        )}

        <button
          onClick={handleAddField}
          style={{
            width: '100%',
            padding: '0.65rem',
            borderRadius: '0.65rem',
            border: 'none',
            backgroundColor: 'rgba(168, 85, 247, 0.2)',
            color: '#a855f7',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.2)';
          }}
        >
          <Plus style={{ width: '16px', height: '16px' }} />
          افزودن فیلد
        </button>
      </div>

      {/* لیست فیلدهای اضافه‌شده */}
      {fields.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 600, color: '#a855f7', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
            فیلدهای فرم ({fields.length})
          </div>
          {fields.map((field) => (
            <div
              key={field.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.65rem 0.75rem',
                backgroundColor: 'rgba(168, 85, 247, 0.08)',
                borderRadius: '0.65rem',
                marginBottom: '0.5rem',
                border: '1px solid rgba(168, 85, 247, 0.15)'
              }}
            >
              <div style={{ fontSize: '0.9rem', color: '#fff' }}>
                <div style={{ fontWeight: 600 }}>{field.label}</div>
                <div style={{ fontSize: '0.8rem', color: '#a8a8ff' }}>
                  {field.type === 'text' ? 'متن کوتاه' : field.type === 'textarea' ? 'متن طولانی' : field.type === 'radio' ? 'انتخاب واحد' : 'چند انتخاب'}
                  {field.required && ' • الزامی'}
                </div>
              </div>
              <button
                onClick={() => handleRemoveField(field.id)}
                style={{
                  padding: '0.4rem 0.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef5350',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                }}
              >
                <X style={{ width: '14px', height: '14px' }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* دکمه‌های عمل */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <button
          onClick={handlePublishForm}
          disabled={loading}
          style={{
            padding: '0.85rem',
            borderRadius: '0.85rem',
            border: 'none',
            background: 'linear-gradient(135deg, #a855f7, #d946ef)',
            boxShadow: '0 0 15px rgba(168, 85, 247, 0.4)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.boxShadow = '0 0 25px rgba(168, 85, 247, 0.6)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.boxShadow = '0 0 15px rgba(168, 85, 247, 0.4)';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          <Save style={{ width: '18px', height: '18px' }} />
          {loading ? 'در حال انتشار...' : 'انتشار فرم'}
        </button>
      </div>

      {/* ✅ بخش فرم‌های منتشرشده */}
      {publishedForms.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ fontWeight: 600, color: '#a855f7', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
            فرم‌های منتشرشده ({publishedForms.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {publishedForms.map((form) => (
              <div
                key={form.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.85rem',
                  backgroundColor: 'rgba(168, 85, 247, 0.08)',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(168, 85, 247, 0.2)'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                    {form.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#a8a8ff', marginTop: '0.25rem' }}>
                    {form.response_count > 0 ? (
                      <>
                        <span style={{ color: '#10b981' }}>✓ {form.response_count} پاسخ ثبت‌شده</span>
                      </>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>درانتظار پاسخ...</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleOpenExportModal(form.id, form.title, form.response_count)}
                  disabled={form.response_count === 0 || loading}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: '0.65rem',
                    border: 'none',
                    backgroundColor: form.response_count > 0 ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.08)',
                    color: form.response_count > 0 ? '#a855f7' : '#94a3b8',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: form.response_count > 0 && !loading ? 'pointer' : 'not-allowed',
                    opacity: form.response_count > 0 ? 1 : 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (form.response_count > 0 && !loading) {
                      e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (form.response_count > 0) {
                      e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.2)';
                    }
                  }}
                >
                  <Download style={{ width: '14px', height: '14px' }} />
                  صادرات
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ✅ مودال انتخاب بازه زمانی صادرات */}
    {showExportModal && selectedFormForExport && (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '1rem',
        direction: 'rtl'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '450px',
          backgroundColor: 'rgba(23, 14, 46, 0.95)',
          border: '1.5px solid #a855f7',
          borderRadius: '1.5rem',
          padding: '1.5rem',
          boxShadow: '0 0 35px rgba(168, 85, 247, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          {/* سرتیتر */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#a855f7' }}>
              صادرات پاسخ‌ها
            </h3>
            <button onClick={() => setShowExportModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X style={{ width: '22px', height: '22px' }} />
            </button>
          </div>

          {/* نام فرم */}
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'rgba(168, 85, 247, 0.08)',
            borderRadius: '0.75rem',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            fontSize: '0.9rem',
            color: '#fff'
          }}>
            <div style={{ fontWeight: 600 }}>{selectedFormForExport.title}</div>
          </div>

          {/* سوال */}
          <div>
            <p style={{
              margin: '0 0 1rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: '#a8a8ff'
            }}>
              گزارش چند روز اخیر را می‌خواهید؟
            </p>

            {/* گزینه‌های سریع */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              {[3, 7, 14, 30].map((days) => (
                <button
                  key={days}
                  onClick={() => setSelectedDays(days)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.75rem',
                    border: selectedDays === days ? '2px solid #a855f7' : '1.5px solid rgba(168, 85, 247, 0.3)',
                    backgroundColor:
                      selectedDays === days
                        ? 'rgba(168, 85, 247, 0.2)'
                        : 'rgba(168, 85, 247, 0.05)',
                    color: selectedDays === days ? '#a855f7' : '#a8a8ff',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedDays !== days) {
                      e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedDays !== days) {
                      e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.05)';
                    }
                  }}
                >
                  {days} روز
                </button>
              ))}
            </div>

            {/* ورودی دستی */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', display: 'block' }}>
                یا تعداد روزهای خاص:
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={selectedDays}
                onChange={(e) => setSelectedDays(Math.max(1, Math.min(365, parseInt(e.target.value) || 7)))}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  backgroundColor: 'rgba(168, 85, 247, 0.05)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* پیام */}
          {message && (
            <div
              style={{
                padding: '0.75rem',
                backgroundColor:
                  messageType === 'success'
                    ? 'rgba(34, 197, 94, 0.2)'
                    : messageType === 'error'
                      ? 'rgba(239, 68, 68, 0.2)'
                      : 'rgba(59, 130, 246, 0.2)',
                border:
                  messageType === 'success'
                    ? '1px solid rgba(34, 197, 94, 0.4)'
                    : messageType === 'error'
                      ? '1px solid rgba(239, 68, 68, 0.4)'
                      : '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: '0.75rem',
                color:
                  messageType === 'success'
                    ? '#86efac'
                    : messageType === 'error'
                      ? '#ef5350'
                      : '#60a5fa',
                fontSize: '0.85rem',
                textAlign: 'center'
              }}
            >
              {message}
            </div>
          )}

          {/* دکمه‌های عمل */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              onClick={() => setShowExportModal(false)}
              style={{
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: '1.5px solid rgba(168, 85, 247, 0.3)',
                backgroundColor: 'rgba(168, 85, 247, 0.05)',
                color: '#a855f7',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.05)';
              }}
            >
              لغو
            </button>
            <button
              onClick={handleExportResponses}
              disabled={loading}
              style={{
                padding: '0.75rem',
                borderRadius: '0.75rem',
                border: 'none',
                background: 'linear-gradient(135deg, #a855f7, #d946ef)',
                boxShadow: '0 0 15px rgba(168, 85, 247, 0.4)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.boxShadow = '0 0 25px rgba(168, 85, 247, 0.6)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(168, 85, 247, 0.4)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <Download style={{ width: '16px', height: '16px' }} />
              {loading ? 'در حال دانلود...' : 'دریافت فایل اکسل'}
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
    </>
  );
};

export default CustomFormBuilderCard;
