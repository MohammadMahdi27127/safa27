import React, { useState, useEffect } from 'react';
import { Download, AlertCircle, CheckCircle } from 'lucide-react';
import API from '../api';

interface SkillsAssessmentCardProps {
  workgroupId: number;
  workgroupName: string;
  onlyTrainingManager?: boolean;
}

type PeriodType = 'sunday' | 'thursday';

interface UserInfo {
  id: number;
  full_name: string;
  group_code: string;
  is_manager: boolean;
  workgroup_id?: number;
}

export const SkillsAssessmentCard: React.FC<SkillsAssessmentCardProps> = ({
  workgroupId,
  workgroupName
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('thursday');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [currentPeriod, setCurrentPeriod] = useState<PeriodType>('thursday');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  
  // ✅ دریافت اطلاعات کاربر از localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user_info');
    if (savedUser) {
      try {
        setUserInfo(JSON.parse(savedUser));
      } catch (e) {
        console.error('Error parsing user info:', e);
      }
    }
  }, []);

  // دریافت دوره فعال جاری
  useEffect(() => {
    const today = new Date();
    const weekday = today.getDay();
    
    // در JavaScript: 0=یکشنبه، 1=دوشنبه، ..., 5=جمعه، 6=شنبه
    // در Python: 0=دوشنبه، 1=سه‌شنبه، ..., 4=جمعه، 5=شنبه، 6=یکشنبه
    
    // تبدیل به فرمت Python
    let pythonWeekday: number;
    if (weekday === 0) {
      pythonWeekday = 6; // یکشنبه
    } else {
      pythonWeekday = weekday - 1; // بقیه روزها
    }
    
    // تعیین دوره
    if (pythonWeekday >= 5 || pythonWeekday === 6) {
      // جمعه (4)، شنبه (5)، یکشنبه (6) → دوره یکشنبه
      setCurrentPeriod('sunday');
      setSelectedPeriod('sunday');
    } else {
      // دوشنبه (0) تا پنج‌شنبه (4) → دوره پنج‌شنبه
      setCurrentPeriod('thursday');
      setSelectedPeriod('thursday');
    }
  }, []);

  const handleDownloadExcel = async (period: PeriodType) => {
    setLoading(true);
    setMessage('');

    try {
      const response = await API.get(
        `workgroup/training/export-skills-excel/?workgroup_id=${workgroupId}&period=${period}`,
        {
          responseType: 'blob'
        }
      );

      // ✅ بررسی وضعیت پاسخ - اگر خطا بود به جای blob، JSON است
      if (response.status >= 400) {
        throw new Error(`Server error: ${response.status}`);
      }

      // اگر blob یک JSON error است (check for 403, 404, 500)
      if (response.data instanceof Blob) {
        // بررسی content-type
        const contentType = (response.headers['content-type'] as string) || '';
        if (contentType.includes('application/json')) {
          // اگر JSON است، آن را parse کن
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
      
      // استخراج نام فایل از Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      let filename = `skills_export_${period}.xlsx`;
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

      setMessage('فایل با موفقیت دانلود شد ✓');
      setMessageType('success');
    } catch (err: any) {
      console.error('Error downloading skills export:', err);
      
      // ✅ بهتر شناخت خطاهای مختلف
      if (err.response?.status === 403) {
        setMessage('شما دسترسی به این قابلیت را ندارید.');
      } else if (err.response?.status === 404) {
        setMessage('کارگروه پیدا نشد.');
      } else if (err.response?.status === 500) {
        setMessage('خطا در سرور. لطفاً بعداً دوباره تلاش کنید.');
      } else if (err.message?.includes('Network')) {
        setMessage('خطا در اتصال به سرور. اتصال اینترنت خود را بررسی کنید.');
      } else {
        setMessage('خطا در دانلود فایل. لطفاً دوباره تلاش کنید.');
      }
      
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const isCurrentPeriod = (period: PeriodType): boolean => {
    return period === currentPeriod;
  };

  // ✅ بررسی دسترسی: فقط کاربرانی با کد گروهی 27118 می‌توانند دسترسی داشته باشند
  if (!userInfo || userInfo.group_code !== '27118') {
    return null; // عدم نمایش کارت برای کاربران بدون دسترسی
  }

  return (
    <div
      style={{
        backgroundColor: 'rgba(23, 14, 46, 0.72)',
        border: '1.5px solid rgba(6, 182, 212, 0.3)',
        borderRadius: '1.35rem',
        padding: '1.15rem 1.2rem',
        boxShadow: '0 0 22px rgba(6, 182, 212, 0.15)',
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
          borderBottom: '1px solid rgba(6, 182, 212, 0.2)'
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '1.1rem',
            fontWeight: 800,
            color: '#06b6d4',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <CheckCircle style={{ width: '20px', height: '20px' }} />
          ارزیابی مهارت‌ها و صادرات
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
        صادرات مهارت‌های اعضاء کارگروه "{workgroupName}" برای دوره انتخاب‌شده شامل: نام عضو، کد گروهی، تاریخ ثبت، و مهارت‌های ثبت‌شده.
      </p>

      {/* بخش انتخاب دوره */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}
      >
        {/* دوره یکشنبه */}
        <button
          onClick={() => setSelectedPeriod('sunday')}
          style={{
            padding: '0.85rem',
            borderRadius: '0.85rem',
            border: selectedPeriod === 'sunday' ? '2px solid #06b6d4' : '1.5px solid rgba(6, 182, 212, 0.3)',
            backgroundColor:
              selectedPeriod === 'sunday'
                ? 'rgba(6, 182, 212, 0.15)'
                : 'rgba(6, 182, 212, 0.05)',
            color: '#06b6d4',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            if (selectedPeriod !== 'sunday') {
              e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedPeriod !== 'sunday') {
              e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.05)';
            }
          }}
        >
          <div>جمعه تا یکشنبه</div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(6, 182, 212, 0.7)', marginTop: '0.2rem' }}>
            (۳ روزه)
          </div>
          {isCurrentPeriod('sunday') && (
            <div
              style={{
                position: 'absolute',
                top: '0.3rem',
                right: '0.3rem',
                width: '8px',
                height: '8px',
                backgroundColor: '#06b6d4',
                borderRadius: '50%'
              }}
            />
          )}
        </button>

        {/* دوره پنج‌شنبه */}
        <button
          onClick={() => setSelectedPeriod('thursday')}
          style={{
            padding: '0.85rem',
            borderRadius: '0.85rem',
            border: selectedPeriod === 'thursday' ? '2px solid #06b6d4' : '1.5px solid rgba(6, 182, 212, 0.3)',
            backgroundColor:
              selectedPeriod === 'thursday'
                ? 'rgba(6, 182, 212, 0.15)'
                : 'rgba(6, 182, 212, 0.05)',
            color: '#06b6d4',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            if (selectedPeriod !== 'thursday') {
              e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedPeriod !== 'thursday') {
              e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.05)';
            }
          }}
        >
          <div>دوشنبه تا پنج‌شنبه</div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(6, 182, 212, 0.7)', marginTop: '0.2rem' }}>
            (۴ روزه)
          </div>
          {isCurrentPeriod('thursday') && (
            <div
              style={{
                position: 'absolute',
                top: '0.3rem',
                right: '0.3rem',
                width: '8px',
                height: '8px',
                backgroundColor: '#06b6d4',
                borderRadius: '50%'
              }}
            />
          )}
        </button>
      </div>

      {/* دکمه دانلود */}
      <button
        onClick={() => handleDownloadExcel(selectedPeriod)}
        disabled={loading}
        style={{
          width: '100%',
          padding: '0.85rem',
          borderRadius: '0.85rem',
          border: 'none',
          background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
          boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)',
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
            e.currentTarget.style.boxShadow = '0 0 25px rgba(6, 182, 212, 0.6)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.currentTarget.style.boxShadow = '0 0 15px rgba(6, 182, 212, 0.4)';
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        <Download style={{ width: '18px', height: '18px' }} />
        {loading ? 'در حال دانلود...' : 'دانلود فایل اکسل'}
      </button>

      {/* توضیح اضافی */}
      <div
        style={{
          marginTop: '0.75rem',
          padding: '0.75rem',
          backgroundColor: 'rgba(6, 182, 212, 0.08)',
          borderRadius: '0.75rem',
          fontSize: '0.8rem',
          color: 'rgba(6, 182, 212, 0.8)',
          lineHeight: '1.4'
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>محتوای فایل:</div>
        <ul style={{ margin: '0.3rem 0', paddingRight: '1.2rem' }}>
          <li>نام کامل عضو</li>
          <li>کد گروهی</li>
          <li>تاریخ و ساعت ثبت</li>
          <li>مهارت‌های ثبت‌شده در فرم روزانه</li>
        </ul>
      </div>
    </div>
  );
};

export default SkillsAssessmentCard;
