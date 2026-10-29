import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, Download, Edit2, Trash2, Eye } from 'lucide-react';
import API from '../api';
import { FormBuilder } from '../components/FormBuilder';

interface FormSummary {
  id: number;
  title: string;
  description?: string;
  export_interval_days: number;
  expiration_date: string;
  is_active: boolean;
  is_expired: boolean;
  responses_count: number;
  created_at: string;
}

export const FormManagerPage: React.FC = () => {
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await API.get('custom-forms/list/');
      setForms(response.data);
      setMessage('');
    } catch (err: any) {
      console.error('Error fetching forms:', err);
      setMessage('خطا در دریافت فرم‌ها.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async (formId: number) => {
    try {
      const response = await API.get(`custom-forms/${formId}/export-excel/`, {
        responseType: 'blob'
      });

      // ایجاد لینک دانلود
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `form_responses_${formId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

      setMessage('فایل Excel با موفقیت دانلود شد.');
      setMessageType('success');
    } catch (err: any) {
      console.error('Error exporting Excel:', err);
      setMessage('خطا در صادرات فایل Excel.');
      setMessageType('error');
    }
  };

  const handleDeleteForm = async (formId: number) => {
    if (!window.confirm('آیا مطمئن هستید که می‌خواهید این فرم را حذف کنید؟')) {
      return;
    }

    try {
      await API.delete(`custom-forms/${formId}/`);
      setForms(forms.filter(f => f.id !== formId));
      setMessage('فرم با موفقیت حذف شد.');
      setMessageType('success');
    } catch (err: any) {
      console.error('Error deleting form:', err);
      setMessage('خطا در حذف فرم.');
      setMessageType('error');
    }
  };

  const handleFormCreated = () => {
    setShowBuilder(false);
    fetchForms();
  };

  const getStatusColor = (form: FormSummary) => {
    if (form.is_expired) return '#ef5350'; // قرمز
    if (form.is_active) return '#86efac'; // سبز
    return '#a8a8ff'; // بنفش
  };

  const getStatusText = (form: FormSummary) => {
    if (form.is_expired) return 'منقضی شده';
    if (form.is_active) return 'فعال';
    return 'غیرفعال';
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#0c071e',
        backgroundImage: 'radial-gradient(circle at 50% 10%, rgba(217, 70, 239, 0.2) 0%, transparent 60%)',
        color: '#fff',
        padding: '1.5rem 1rem',
        boxSizing: 'border-box',
        direction: 'rtl',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <div style={{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* هدر صفحه */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%'
          }}
        >
          <button
            onClick={() => navigate('/dashboard')}
            aria-label="بازگشت به داشبورد"
            style={{
              background: 'rgba(30, 20, 55, 0.7)',
              border: '1.5px solid rgba(168, 85, 247, 0.4)',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#e9d5ff',
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(168, 85, 247, 0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            <ArrowRight style={{ width: '22px', height: '22px' }} />
          </button>

          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#f0abfc' }}>
            مدیریت فرم‌های سفارشی
          </h1>

          <button
            onClick={() => setShowBuilder(!showBuilder)}
            style={{
              background: 'linear-gradient(135deg, #a21caf, #701a75)',
              border: '1.5px solid #f472b6',
              borderRadius: '1rem',
              width: '45px',
              height: '45px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(244, 114, 182, 0.4)'
            }}
            title={showBuilder ? 'بستن سازنده' : 'ایجاد فرم جدید'}
          >
            <Plus style={{ width: '24px', height: '24px' }} />
          </button>
        </header>

        {/* پیام */}
        {message && (
          <div
            style={{
              padding: '0.75rem',
              backgroundColor:
                messageType === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              border:
                messageType === 'success'
                  ? '1px solid rgba(34, 197, 94, 0.4)'
                  : '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '0.75rem',
              color: messageType === 'success' ? '#86efac' : '#ef5350',
              fontSize: '0.85rem',
              textAlign: 'center'
            }}
          >
            {message}
          </div>
        )}

        {/* فرم سازنده */}
        {showBuilder && (
          <div>
            <FormBuilder onFormCreated={handleFormCreated} />
          </div>
        )}

        {/* لیست فرم‌ها */}
        {loading ? (
          <div
            style={{
              backgroundColor: 'rgba(23, 14, 46, 0.85)',
              backdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(217, 70, 239, 0.4)',
              borderRadius: '1.75rem',
              padding: '2rem',
              boxShadow: '0 0 30px rgba(162, 28, 175, 0.25)',
              textAlign: 'center',
              color: '#e9d5ff'
            }}
          >
            در حال بارگذاری فرم‌ها...
          </div>
        ) : forms.length === 0 ? (
          <div
            style={{
              backgroundColor: 'rgba(23, 14, 46, 0.85)',
              backdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(217, 70, 239, 0.4)',
              borderRadius: '1.75rem',
              padding: '2rem',
              boxShadow: '0 0 30px rgba(162, 28, 175, 0.25)',
              textAlign: 'center',
              color: '#a8a8ff'
            }}
          >
            هیچ فرمی ایجاد نشده است. فرم جدید ایجاد کنید.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            {forms.map((form) => (
              <div
                key={form.id}
                style={{
                  backgroundColor: 'rgba(23, 14, 46, 0.85)',
                  backdropFilter: 'blur(16px)',
                  border: '1.5px solid rgba(217, 70, 239, 0.4)',
                  borderRadius: '1.25rem',
                  padding: '1.25rem',
                  boxShadow: '0 0 20px rgba(162, 28, 175, 0.2)'
                }}
              >
                {/* سرتیتر فرم */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: '1rem',
                    alignItems: 'start',
                    marginBottom: '0.75rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid rgba(217, 70, 239, 0.2)'
                  }}
                >
                  <div>
                    <h3 style={{ margin: '0 0 0.3rem', fontSize: '1.05rem', fontWeight: 700, color: '#f0abfc' }}>
                      {form.title}
                    </h3>
                    {form.description && (
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#d8b4fe' }}>
                        {form.description}
                      </p>
                    )}
                  </div>

                  {/* وضعیت */}
                  <div
                    style={{
                      padding: '0.4rem 0.8rem',
                      backgroundColor: 'rgba(40, 20, 70, 0.5)',
                      border: `1px solid ${getStatusColor(form)}`,
                      borderRadius: '0.5rem',
                      color: getStatusColor(form),
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {getStatusText(form)}
                  </div>
                </div>

                {/* اطلاعات فرم */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '1rem',
                    marginBottom: '1rem',
                    fontSize: '0.85rem',
                    color: '#d8b4fe'
                  }}
                >
                  <div>
                    <span style={{ color: '#a8a8ff' }}>دوره صادرات:</span>
                    <div style={{ fontWeight: 600, color: '#e9d5ff' }}>{form.export_interval_days} روز</div>
                  </div>
                  <div>
                    <span style={{ color: '#a8a8ff' }}>تاریخ انقضا:</span>
                    <div style={{ fontWeight: 600, color: '#e9d5ff' }}>
                      {new Date(form.expiration_date).toLocaleDateString('fa-IR')}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#a8a8ff' }}>پاسخ‌ها:</span>
                    <div style={{ fontWeight: 600, color: '#e9d5ff' }}>{form.responses_count} پاسخ</div>
                  </div>
                </div>

                {/* دکمه‌های عملیات */}
                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <button
                    onClick={() => setSelectedFormId(selectedFormId === form.id ? null : form.id)}
                    style={{
                      flex: 1,
                      minWidth: '120px',
                      padding: '0.6rem 1rem',
                      borderRadius: '0.75rem',
                      border: 'none',
                      backgroundColor: 'rgba(59, 130, 246, 0.3)',
                      color: '#60a5fa',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <Eye style={{ width: '16px', height: '16px' }} />
                    {selectedFormId === form.id ? 'بستن' : 'مشاهده'}
                  </button>

                  <button
                    onClick={() => handleExportExcel(form.id)}
                    disabled={form.responses_count === 0}
                    style={{
                      flex: 1,
                      minWidth: '120px',
                      padding: '0.6rem 1rem',
                      borderRadius: '0.75rem',
                      border: 'none',
                      backgroundColor:
                        form.responses_count === 0 ? 'rgba(107, 114, 128, 0.3)' : 'rgba(34, 197, 94, 0.3)',
                      color: form.responses_count === 0 ? '#9ca3af' : '#86efac',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: form.responses_count === 0 ? 'not-allowed' : 'pointer',
                      opacity: form.responses_count === 0 ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <Download style={{ width: '16px', height: '16px' }} />
                    صادرات
                  </button>

                  <button
                    onClick={() => alert('قابلیت ویرایش به زودی')}
                    style={{
                      flex: 1,
                      minWidth: '120px',
                      padding: '0.6rem 1rem',
                      borderRadius: '0.75rem',
                      border: 'none',
                      backgroundColor: 'rgba(168, 85, 247, 0.3)',
                      color: '#d8b4fe',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <Edit2 style={{ width: '16px', height: '16px' }} />
                    ویرایش
                  </button>

                  <button
                    onClick={() => handleDeleteForm(form.id)}
                    style={{
                      flex: 1,
                      minWidth: '120px',
                      padding: '0.6rem 1rem',
                      borderRadius: '0.75rem',
                      border: 'none',
                      backgroundColor: 'rgba(239, 68, 68, 0.3)',
                      color: '#ef5350',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <Trash2 style={{ width: '16px', height: '16px' }} />
                    حذف
                  </button>
                </div>

                {/* نمایش پاسخ‌ها */}
                {selectedFormId === form.id && form.responses_count > 0 && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(217, 70, 239, 0.2)' }}>
                    <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: '#e879f9' }}>
                      آخرین پاسخ‌ها
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: '#a8a8ff', margin: 0 }}>
                      برای مشاهده تمام پاسخ‌ها، فایل Excel را دانلود کنید.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormManagerPage;
