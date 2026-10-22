import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, PlusCircle, Bell, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import API from '../api';

interface WorkgroupItem {
  id: number;
  name: string;
}

interface NotificationItem {
  id: number;
  text: string;
  created_at: string;
}

export const ResolutionOfficerPage: React.FC = () => {
  const navigate = useNavigate();
  const [workgroups, setWorkgroups] = useState<WorkgroupItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedWorkgroup, setSelectedWorkgroup] = useState<string>('');
  const [resolutionTitle, setResolutionTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await API.get('resolution-officer/');
      setWorkgroups(res.data?.workgroups || []);
      setNotifications(res.data?.notifications || []);
      if (res.data?.workgroups && res.data.workgroups.length > 0) {
        setSelectedWorkgroup(String(res.data.workgroups[0].id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkgroup || !resolutionTitle.trim()) return;

    setSubmitting(true);
    setStatusMessage(null);

    try {
      const forEveryone = selectedWorkgroup === 'all';
      await API.post('resolution-officer/', {
        workgroup: forEveryone ? 'all' : Number(selectedWorkgroup),
        title: resolutionTitle.trim(),
        is_completed: false,
      });

      setStatusMessage({
        type: 'success',
        text: forEveryone ? 'مصوبه برای همه کارگروه‌ها ابلاغ شد.' : 'مصوبه با موفقیت ابلاغ شد.',
      });
      setResolutionTitle('');
    } catch (err: any) {
      setStatusMessage({ 
        type: 'error', 
        text: err.response?.data?.error || 'خطا در ثبت مصوبه.' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0c071e', color: '#06b6d4' }}>
        در حال بارگذاری...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#0c071e',
      backgroundImage: 'radial-gradient(circle at 50% 10%, rgba(6, 182, 212, 0.25) 0%, transparent 60%)',
      color: '#fff',
      padding: '1.5rem 1rem',
      boxSizing: 'border-box',
      direction: 'rtl',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{ width: '100%', maxWidth: '750px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'rgba(30, 20, 55, 0.7)',
              border: '1.5px solid rgba(6, 182, 212, 0.4)',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a5f3fc',
              cursor: 'pointer',
            }}
          >
            <ArrowRight style={{ width: '22px', height: '22px' }} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck style={{ width: '26px', height: '26px', color: '#06b6d4' }} />
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#38bdf8' }}>
              پنل مسئول مصوبات
            </h1>
          </div>

          <div style={{ width: '44px' }} />
        </header>

        <div style={{
          backgroundColor: 'rgba(23, 14, 46, 0.85)',
          border: '1.5px solid rgba(6, 182, 212, 0.45)',
          borderRadius: '1.75rem',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: '#38bdf8' }}>
            <PlusCircle style={{ width: '22px', height: '22px' }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>ابلاغ مصوبه جدید</h2>
          </div>

          {statusMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: '0.85rem',
              marginBottom: '1rem',
              backgroundColor: statusMessage.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${statusMessage.type === 'success' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              color: statusMessage.type === 'success' ? '#86efac' : '#fca5a5',
              fontSize: '0.88rem',
            }}>
              {statusMessage.type === 'success' ? <CheckCircle2 style={{ width: '18px', height: '18px' }} /> : <AlertCircle style={{ width: '18px', height: '18px' }} />}
              {statusMessage.text}
            </div>
          )}

          <form onSubmit={handleCreateResolution} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                کارگروه:
              </label>
              <select
                value={selectedWorkgroup}
                onChange={(e) => setSelectedWorkgroup(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'rgba(15, 10, 30, 0.8)',
                  border: '1.5px solid rgba(6, 182, 212, 0.4)',
                  borderRadius: '1rem',
                  color: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="all" style={{ backgroundColor: '#170e2e', color: '#fff' }}>همه کارگروه‌ها</option>
                {workgroups.map((wg) => (
                  <option key={wg.id} value={wg.id} style={{ backgroundColor: '#170e2e', color: '#fff' }}>
                    {wg.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                عنوان مصوبه:
              </label>
              <input
                type="text"
                required
                value={resolutionTitle}
                onChange={(e) => setResolutionTitle(e.target.value)}
                placeholder="شرح مصوبه..."
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'rgba(15, 10, 30, 0.8)',
                  border: '1.5px solid rgba(6, 182, 212, 0.4)',
                  borderRadius: '1rem',
                  color: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '0.85rem',
                borderRadius: '1rem',
                border: 'none',
                background: 'linear-gradient(90deg, #0891b2 0%, #0284c7 100%)',
                color: '#fff',
                fontWeight: 800,
                cursor: submitting ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <Send style={{ width: '18px', height: '18px' }} />
              {submitting ? 'در حال ثبت...' : 'ثبت و ابلاغ مصوبه'}
            </button>
          </form>
        </div>

        <div style={{
          backgroundColor: 'rgba(23, 14, 46, 0.85)',
          border: '1.5px solid rgba(168, 85, 247, 0.4)',
          borderRadius: '1.75rem',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c084fc', marginBottom: '1rem' }}>
            <Bell style={{ width: '22px', height: '22px' }} />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>آخرین مصوبات انجام‌شده</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.85rem 1rem',
                    backgroundColor: 'rgba(15, 10, 30, 0.7)',
                    borderRadius: '1rem',
                    border: '1px solid rgba(168, 85, 247, 0.25)',
                  }}
                >
                  <CheckCircle2 style={{ width: '18px', height: '18px', color: '#34d399' }} />
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#e2e8f0' }}>{notif.text}</p>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem' }}>
                اعلانی دریافت نشده است.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ResolutionOfficerPage;