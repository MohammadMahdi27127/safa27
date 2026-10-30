import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Users, Award, Calendar, Bell,
  CheckCircle2, Circle, PlusCircle, MessageSquarePlus,
  X, Send, FileText
} from 'lucide-react';
import API from '../api';
import { SkillsAssessmentCard } from '../components/SkillsAssessmentCard';
import { CustomFormBuilderCard } from '../components/CustomFormBuilderCard';
import { SportsExportCard } from '../components/SportsExportCard';
import { IslamicStudiesExportCard } from '../components/IslamicStudiesExportCard';

interface Resolution {
  id: number;
  title: string;
  is_completed: boolean;
}

interface Announcement {
  id: number;
  text: string;
  created_at: string;
}

interface Member {
  id: number;
  full_name: string;
  group_code: string;
}

interface WorkgroupData {
  workgroup_id: number;
  workgroup_name: string;
  score: number;
  today_shamsi: string;
  announcements: Announcement[];
  resolutions: Resolution[];
  members: Member[];
  members_count: number;
}

interface UserInfo {
  id: number;
  full_name: string;
  group_code: string;
}

export const WorkgroupPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<WorkgroupData | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // استیت‌های مودال ثبت جلسه
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingDate, setMeetingDate] = useState('');
  const [attendeesText, setAttendeesText] = useState('');
  const [meetingDescriptions, setMeetingDescriptions] = useState('');
  const [submittingMeeting, setSubmittingMeeting] = useState(false);

  // استیت‌های مودال ثبت پیشنهاد و نظر
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackSubject, setFeedbackSubject] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    fetchWorkgroupData();
  }, []);

  const fetchWorkgroupData = async () => {
    try {
      const res = await API.get('workgroup/');
      setData(res.data);
      if (res.data?.today_shamsi) {
        setMeetingDate(res.data.today_shamsi);
      }

      // دریافت اطلاعات کاربر فعلی
      try {
        const profileRes = await API.get('profile/');
        setUserInfo(profileRes.data);
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    } catch (err: any) {
      console.error('Workgroup Fetch Error:', err);
      setData(null);
      setLoadError(err.response?.data?.error || 'کارگروهی به این حساب وصل نیست.');
    } finally {
      setLoading(false);
    }
  };

  // تیک زدن زنده مصوبه
  const handleToggleResolution = async (id: number) => {
    try {
      const res = await API.post(`workgroup/resolution/${id}/toggle/`);
      if (res.data?.status === 'ok') {
        setData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            resolutions: prev.resolutions.map((r) =>
              r.id === id ? { ...r, is_completed: res.data.is_completed } : r
            ),
          };
        });
      }
    } catch (err) {
      console.error('Toggle Resolution Error:', err);
    }
  };

  // ثبت جلسه جدید
  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.workgroup_id || !meetingDescriptions.trim()) return;

    setSubmittingMeeting(true);
    try {
      await API.post('workgroup/meeting/', {
        workgroup: data.workgroup_id,
        meeting_shamsi_date: meetingDate,
        attendees_text: attendeesText,
        descriptions_and_titles: meetingDescriptions,
      });
      alert('جلسه با موفقیت ثبت شد.');
      setShowMeetingModal(false);
      setAttendeesText('');
      setMeetingDescriptions('');
    } catch (err) {
      console.error('Create Meeting Error:', err);
      alert('خطا در ثبت جلسه. لطفاً مجدداً تلاش فرمایید.');
    } finally {
      setSubmittingMeeting(false);
    }
  };

  // ارسال پیشنهاد و نظر
  const handleCreateFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.workgroup_id || !feedbackMessage.trim()) return;

    setSubmittingFeedback(true);
    try {
      const payloadContent = feedbackSubject.trim()
        ? `[${feedbackSubject.trim()}] ${feedbackMessage.trim()}`
        : feedbackMessage.trim();

      await API.post('workgroup/feedback/', {
        workgroup: data.workgroup_id,
        content: payloadContent,
        subject: feedbackSubject.trim(),
        message: feedbackMessage.trim(),
      });

      alert('نظر و پیشنهاد شما با موفقیت برای مدیریت ارسال شد.');
      setShowFeedbackModal(false);
      setFeedbackSubject('');
      setFeedbackMessage('');
    } catch (err: any) {
      console.error('Feedback Error:', err.response?.data || err);
      alert('خطا در ارسال پیشنهاد: ' + JSON.stringify(err.response?.data || 'دوباره تلاش کنید'));
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0c071e', color: '#0284c7' }}>
        در حال بارگذاری اطلاعات کارگروه...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', backgroundColor: '#0c071e', color: '#e2e8f0', direction: 'rtl' }}>
        <p style={{ margin: 0 }}>{loadError || 'اطلاعات کارگروه در دسترس نیست.'}</p>
        <button onClick={() => navigate('/dashboard')} style={{ padding: '0.7rem 1.2rem', borderRadius: '0.9rem', border: 'none', background: '#0284c7', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
          بازگشت به داشبورد
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#0c071e',
      backgroundImage: 'radial-gradient(circle at 50% 10%, rgba(2, 132, 199, 0.25) 0%, transparent 60%)',
      color: '#fff',
      padding: '1.25rem 1rem',
      boxSizing: 'border-box',
      direction: 'rtl',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{ width: '100%', maxWidth: '850px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ۱. هدر ناوبری */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <button
            onClick={() => navigate('/dashboard')}
            aria-label="بازگشت"
            style={{
              background: 'rgba(30, 20, 55, 0.7)',
              border: '1.5px solid rgba(2, 132, 199, 0.4)',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#e0f2fe',
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(2, 132, 199, 0.25)',
            }}
          >
            <ArrowRight style={{ width: '22px', height: '22px' }} />
          </button>

          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#38bdf8' }}>
            {data?.workgroup_name || 'کارگروه'}
          </h1>

          <div style={{ width: '44px' }} />
        </header>

        {/* ۲. کارت‌های آماری بالا (امتیاز، اعضا، تاریخ) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.75rem',
        }}>
          {/* امتیاز */}
          <div style={{
            backgroundColor: 'rgba(23, 14, 46, 0.85)',
            border: '1px solid rgba(2, 132, 199, 0.4)',
            borderRadius: '1.25rem',
            padding: '1rem',
            textAlign: 'center',
            boxShadow: '0 0 20px rgba(2, 132, 199, 0.15)',
            backdropFilter: 'blur(10px)'
          }}>
            <Award style={{ width: '22px', height: '22px', color: '#facc15', margin: '0 auto 0.3rem' }} />
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>امتیاز کارگروه</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#facc15' }}>{data?.score ?? 0} / ۱۰</span>
          </div>

          {/* اعضا */}
          <div style={{
            backgroundColor: 'rgba(23, 14, 46, 0.85)',
            border: '1px solid rgba(2, 132, 199, 0.4)',
            borderRadius: '1.25rem',
            padding: '1rem',
            textAlign: 'center',
            boxShadow: '0 0 20px rgba(2, 132, 199, 0.15)',
            backdropFilter: 'blur(10px)'
          }}>
            <Users style={{ width: '22px', height: '22px', color: '#38bdf8', margin: '0 auto 0.3rem' }} />
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>تعداد اعضا</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38bdf8' }}>{data?.members_count ?? 0} نفر</span>
          </div>

          {/* تاریخ */}
          <div style={{
            backgroundColor: 'rgba(23, 14, 46, 0.85)',
            border: '1px solid rgba(2, 132, 199, 0.4)',
            borderRadius: '1.25rem',
            padding: '1rem',
            textAlign: 'center',
            boxShadow: '0 0 20px rgba(2, 132, 199, 0.15)',
            backdropFilter: 'blur(10px)'
          }}>
            <Calendar style={{ width: '22px', height: '22px', color: '#a855f7', margin: '0 auto 0.3rem' }} />
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>امروز</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#e9d5ff', direction: 'ltr' }}>
              {data?.today_shamsi || '---'}
            </span>
          </div>
        </div>

        {/* ۳. تابلوی اعلانات */}
        <div style={{
          backgroundColor: 'rgba(23, 14, 46, 0.85)',
          border: '1.5px solid rgba(168, 85, 247, 0.4)',
          borderRadius: '1.5rem',
          padding: '1.25rem',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 0 25px rgba(126, 34, 206, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.9rem', color: '#c084fc' }}>
            <Bell style={{ width: '20px', height: '20px' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>اعلانات مهم کارگروه</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {data?.announcements && data.announcements.length > 0 ? (
              data.announcements.map((item) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: 'rgba(15, 10, 30, 0.7)',
                    border: '1px solid rgba(168, 85, 247, 0.25)',
                    borderRadius: '0.85rem',
                    padding: '0.7rem 0.9rem',
                    fontSize: '0.88rem',
                    color: '#e2e8f0',
                    lineHeight: '1.5'
                  }}
                >
                  {item.text}
                </div>
              ))
            ) : (
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>اعلانی برای نمایش وجود ندارد.</span>
            )}
          </div>
        </div>

        {/* ۴. چک‌لیست مصوبات تعاملی */}
        <div style={{
          backgroundColor: 'rgba(23, 14, 46, 0.85)',
          border: '1.5px solid rgba(2, 132, 199, 0.45)',
          borderRadius: '1.5rem',
          padding: '1.25rem',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 0 25px rgba(2, 132, 199, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8' }}>
              <FileText style={{ width: '20px', height: '20px' }} />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>مصوبات ابلاغی</h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              برای ثبت وضعیت کلیک کنید
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {data?.resolutions && data.resolutions.length > 0 ? (
              data.resolutions.map((res) => (
                <div
                  key={res.id}
                  onClick={() => handleToggleResolution(res.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: res.is_completed ? 'rgba(16, 185, 129, 0.12)' : 'rgba(15, 10, 30, 0.7)',
                    borderRadius: '1rem',
                    border: `1.5px solid ${res.is_completed ? 'rgba(52, 211, 153, 0.5)' : 'rgba(2, 132, 199, 0.3)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: res.is_completed ? '#86efac' : '#f8fafc',
                    textDecoration: res.is_completed ? 'line-through' : 'none',
                  }}>
                    {res.title}
                  </span>
                  {res.is_completed ? (
                    <CheckCircle2 style={{ width: '22px', height: '22px', color: '#34d399', flexShrink: 0 }} />
                  ) : (
                    <Circle style={{ width: '22px', height: '22px', color: '#0284c7', flexShrink: 0 }} />
                  )}
                </div>
              ))
            ) : (
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>هیچ مصوبه‌ای برای این کارگروه ثبت نشده است.</span>
            )}
          </div>
        </div>

        {/* ۵. دکمه‌های عملیاتی (ثبت جلسه و ثبت پیشنهاد) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem' }}>
          <button
            onClick={() => setShowMeetingModal(true)}
            style={{
              padding: '0.9rem',
              borderRadius: '1.25rem',
              border: 'none',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 0 20px rgba(2, 132, 199, 0.4)'
            }}
          >
            <PlusCircle style={{ width: '20px', height: '20px' }} />
            ثبت جلسه جدید
          </button>

          <button
            onClick={() => setShowFeedbackModal(true)}
            style={{
              padding: '0.9rem',
              borderRadius: '1.25rem',
              border: 'none',
              background: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 0 20px rgba(147, 51, 234, 0.4)'
            }}
          >
            <MessageSquarePlus style={{ width: '20px', height: '20px' }} />
            ثبت نظر و پیشنهاد
          </button>
        </div>

        {/* ۶. کارت ارزیابی مهارت‌ها (برای مسئول کارگروه) */}
        {data?.workgroup_id && (
          <SkillsAssessmentCard
            workgroupId={data.workgroup_id}
            workgroupName={data.workgroup_name}
          />
        )}

        {/* ۷. کارت سازنده فرم سفارشی (برای مسئول کارگروه) */}
        {data?.workgroup_id && (
          <CustomFormBuilderCard
            workgroupId={data.workgroup_id}
            workgroupName={data.workgroup_name}
          />
        )}

        {/* ۸. کارت صادرات ورزش (برای سرپرست ورزش - کد 27114) */}
        {userInfo?.group_code === '27114' && (
          <SportsExportCard />
        )}

        {/* ۹. کارت صادرات مطالعات اسلامی (برای سرپرست مطالعات اسلامی - کد 27214) */}
        {userInfo?.group_code === '27214' && (
          <IslamicStudiesExportCard />
        )}
      </div>

      {/* مودال ثبت جلسه جدید */}
      {showMeetingModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '500px',
            backgroundColor: 'rgba(23, 14, 46, 0.95)',
            border: '1.5px solid #0284c7',
            borderRadius: '1.75rem',
            padding: '1.5rem',
            boxShadow: '0 0 35px rgba(2, 132, 199, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8' }}>فرم ثبت جلسه کارگروه</h3>
              <button onClick={() => setShowMeetingModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X style={{ width: '22px', height: '22px' }} />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>تاریخ برگزاری (شمسی)</label>
                <input
                  type="text"
                  required
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  placeholder="مثال: ۱۴۰۵/۰۷/۲۱"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    backgroundColor: 'rgba(15, 10, 30, 0.7)',
                    border: '1px solid rgba(2, 132, 199, 0.4)',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>اسامی حاضرین در جلسه</label>
                <input
                  type="text"
                  required
                  value={attendeesText}
                  onChange={(e) => setAttendeesText(e.target.value)}
                  placeholder="اسامی اعضا با ویرگول (کریمی، رضایی، ...)"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    backgroundColor: 'rgba(15, 10, 30, 0.7)',
                    border: '1px solid rgba(2, 132, 199, 0.4)',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>عناوین و شرح مباحث مطرح‌شده</label>
                <textarea
                  rows={4}
                  required
                  value={meetingDescriptions}
                  onChange={(e) => setMeetingDescriptions(e.target.value)}
                  placeholder="شرح کامل مصوبات و مباحث..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    backgroundColor: 'rgba(15, 10, 30, 0.7)',
                    border: '1px solid rgba(2, 132, 199, 0.4)',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submittingMeeting}
                style={{
                  padding: '0.75rem',
                  borderRadius: '1rem',
                  border: 'none',
                  backgroundColor: '#0284c7',
                  color: '#fff',
                  fontWeight: 800,
                  cursor: submittingMeeting ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  marginTop: '0.5rem'
                }}
              >
                <Send style={{ width: '16px', height: '16px' }} />
                {submittingMeeting ? 'در حال ثبت...' : 'ثبت قطعی جلسه'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* مودال ثبت نظر و پیشنهاد */}
      {showFeedbackModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '500px',
            backgroundColor: 'rgba(23, 14, 46, 0.95)',
            border: '1.5px solid #a855f7',
            borderRadius: '1.75rem',
            padding: '1.5rem',
            boxShadow: '0 0 35px rgba(168, 85, 247, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#e9d5ff' }}>ثبت نظر یا پیشنهاد</h3>
              <button onClick={() => setShowFeedbackModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X style={{ width: '22px', height: '22px' }} />
              </button>
            </div>

            <form onSubmit={handleCreateFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>موضوع پیشنهاد</label>
                <input
                  type="text"
                  required
                  value={feedbackSubject}
                  onChange={(e) => setFeedbackSubject(e.target.value)}
                  placeholder="مثال: درخواست تجهیزات جدید"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    backgroundColor: 'rgba(15, 10, 30, 0.7)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>متن نظر / پیشنهاد</label>
                <textarea
                  rows={4}
                  required
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="شرح پیشنهاد برای مدیریت..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.8rem',
                    backgroundColor: 'rgba(15, 10, 30, 0.7)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submittingFeedback}
                style={{
                  padding: '0.75rem',
                  borderRadius: '1rem',
                  border: 'none',
                  backgroundColor: '#7e22ce',
                  color: '#fff',
                  fontWeight: 800,
                  cursor: submittingFeedback ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  marginTop: '0.5rem'
                }}
              >
                <Send style={{ width: '16px', height: '16px' }} />
                {submittingFeedback ? 'در حال ارسال...' : 'ارسال به مدیریت'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// برای جلوگیری از هرگونه خطای ایمپورت در App.tsx
export default WorkgroupPage;