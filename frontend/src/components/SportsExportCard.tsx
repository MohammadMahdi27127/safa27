import React, { useState } from 'react';
import { Download, Dumbbell } from 'lucide-react';
import API from '../api';

export const SportsExportCard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  const handleExport = async (period: 'sunday' | 'thursday') => {
    setLoading(true);
    setMessage('');

    try {
      const response = await API.get('workgroup/sports/export-exercise-excel/', {
        params: { period },
        responseType: 'blob'
      });

      // بارگذاری فایل
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Sports_Export_${period}_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage(`فایل صادرات ورزش (${period === 'sunday' ? 'جمعه-شنبه-یکشنبه' : 'دوشنبه-سه‌شنبه-چهارشنبه-پنج‌شنبه'}) با موفقیت دانلود شد ✨`);
      setMessageType('success');
    } catch (err: any) {
      console.error('Error exporting sports data:', err);
      if (err.response?.status === 403) {
        setMessage('دسترسی غیرمجاز. این قابلیت فقط برای سرپرست ورزش است.');
      } else {
        setMessage('خطا در صادرات فایل. لطفاً دوباره تلاش کنید.');
      }
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: 'rgba(23, 14, 46, 0.85)',
      backdropFilter: 'blur(16px)',
      border: '1.5px solid rgba(217, 70, 239, 0.4)',
      borderRadius: '1.75rem',
      padding: '1.5rem',
      boxShadow: '0 0 30px rgba(162, 28, 175, 0.25)',
      color: '#fff',
      width: '100%'
    }}>
      {/* سرتیتر */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.25rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid rgba(217, 70, 239, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Dumbbell style={{ width: '24px', height: '24px', color: '#f97316' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#f0abfc' }}>
            ارزیابی ورزش و صادرات
          </h3>
        </div>
      </div>

      {/* پیام */}
      {message && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.75rem',
          backgroundColor: messageType === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          border: messageType === 'success' ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '0.75rem',
          color: messageType === 'success' ? '#86efac' : '#ef5350',
          fontSize: '0.85rem',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}

      {/* دکمه‌های صادرات */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.75rem'
      }}>
        <button
          onClick={() => handleExport('sunday')}
          disabled={loading}
          style={{
            padding: '0.85rem',
            borderRadius: '1rem',
            border: 'none',
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            boxShadow: '0 0 15px rgba(249, 115, 22, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.boxShadow = '0 0 20px rgba(249, 115, 22, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.boxShadow = '0 0 15px rgba(249, 115, 22, 0.3)';
            }
          }}
        >
          <Download style={{ width: '16px', height: '16px' }} />
          جمعه-یکشنبه
        </button>

        <button
          onClick={() => handleExport('thursday')}
          disabled={loading}
          style={{
            padding: '0.85rem',
            borderRadius: '1rem',
            border: 'none',
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            boxShadow: '0 0 15px rgba(249, 115, 22, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.boxShadow = '0 0 20px rgba(249, 115, 22, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.boxShadow = '0 0 15px rgba(249, 115, 22, 0.3)';
            }
          }}
        >
          <Download style={{ width: '16px', height: '16px' }} />
          دوشنبه-پنج‌شنبه
        </button>
      </div>

      {/* توضیح */}
      <p style={{
        fontSize: '0.8rem',
        color: '#d8b4fe',
        marginTop: '0.75rem',
        marginBottom: 0,
        textAlign: 'center'
      }}>
        صادرات ساعت‌های ورزش تمام اعضا برای دوره انتخاب‌شده
      </p>
    </div>
  );
};

export default SportsExportCard;
