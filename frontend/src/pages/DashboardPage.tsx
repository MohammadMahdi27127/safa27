import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, ChevronLeft, LogOut, User as UserIcon, 
  Search, Download, Video, Image as ImageIcon, Music, X, Award, Bell
} from 'lucide-react';
import API, { mediaUrl } from '../api';

interface RingMember {
  id: number;
  full_name: string;
  group_code: string;
  avatar: string | null;
  attendance_rate: string;
}

interface DashboardData {
  full_name: string;
  group_code: string;
  attendance_rate: string | null;
  user_found?: boolean;
  is_manager: boolean;
  is_resolution_officer: boolean;
  is_workgroup_leader: boolean;
  ring_name: string | null;
  ring_members: RingMember[];
  manager_messages?: string[];
  avatar?: string | null;
}

interface ArchiveItem {
  id: number;
  title: string;
  category: 'video' | 'image' | 'audio';
  zip_file: string;
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // استیت اسلایدر تصاویر پوشه media
  const [slides, setSlides] = useState<string[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [failedAvatars, setFailedAvatars] = useState<number[]>([]);
  const [headerAvatarFailed, setHeaderAvatarFailed] = useState(false);

  // استیت‌های مودال آرشیو عمومی
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveTab, setArchiveTab] = useState<'video' | 'image' | 'audio'>('video');
  const [searchQuery, setSearchQuery] = useState('');
  const [archiveItems, setArchiveItems] = useState<ArchiveItem[]>([]);

  useEffect(() => {
    fetchDashboardData();
    fetchSliderImages();
  }, []);

  // جابجایی خودکار اسلایدها هر ۳ ثانیه
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // دریافت تصاویر از پوشه media/slider بک‌اند
  const fetchSliderImages = async () => {
    try {
      const res = await API.get('slider-images/');
      if (res.data?.images && res.data.images.length > 0) {
        setSlides(res.data.images);
        setCurrentSlide(0);
      }
    } catch (err) {
      console.log('Slider fetch fallback to default images');
    }
  };

  const fetchDashboardData = async () => {
    try {
      const res = await API.get('dashboard/');
      if (res.data?.is_manager) {
        navigate('/manager', { replace: true });
        return;
      }
      setData(res.data);
    } catch (err: any) {
      console.error('Dashboard Error:', err);
      const savedUser = localStorage.getItem('user_info');
      const user = savedUser ? JSON.parse(savedUser) : null;
      if (user?.is_manager) {
        navigate('/manager', { replace: true });
        return;
      }
      setData({
        full_name: user?.full_name || 'کاربر',
        group_code: user?.group_code || '---',
        attendance_rate: null,
        user_found: false,
        is_manager: user?.is_manager ?? false,
        is_resolution_officer: user?.is_resolution_officer ?? false,
        is_workgroup_leader: user?.is_workgroup_leader ?? false,
        ring_name: null,
        ring_members: [],
        manager_messages: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const openArchive = async (category: 'video' | 'image' | 'audio') => {
    setArchiveTab(category);
    setShowArchiveModal(true);
    fetchArchive(category, searchQuery);
  };

  const fetchArchive = async (cat: string, search: string) => {
    try {
      const res = await API.get(`archive/?category=${cat}&search=${search}`);
      setArchiveItems(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    fetchArchive(archiveTab, query);
  };

  // محاسبه تعداد دکمه‌های مجاز پایین صفحه
  const visibleButtonsCount = 2 + 
    (data?.is_resolution_officer ? 1 : 0) + 
    (data?.is_workgroup_leader ? 1 : 0);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0c071e', color: '#c084fc' }}>
        در حال بارگذاری اطلاعات داشبورد...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#05010f',
      backgroundImage: `
        radial-gradient(circle at 12% 18%, rgba(56, 189, 248, 0.14) 0%, transparent 38%),
        radial-gradient(circle at 88% 22%, rgba(168, 85, 247, 0.18) 0%, transparent 40%),
        radial-gradient(circle at 50% 85%, rgba(124, 58, 237, 0.16) 0%, transparent 50%),
        radial-gradient(circle at 75% 60%, rgba(6, 182, 212, 0.10) 0%, transparent 35%),
        linear-gradient(180deg, rgba(5,1,15,0.6) 0%, rgba(10,3,30,0.9) 100%)
      `,
      color: '#fff',
      padding: '1.25rem 1rem',
      boxSizing: 'border-box',
      direction: 'rtl',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(56, 189, 248, 0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(168, 85, 247, 0.04) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{ width: '100%', maxWidth: '1100px', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', zIndex: 1 }}>

        {/* ۱. هدر بالا */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <button
            onClick={() => navigate('/profile')}
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              border: '2px solid #38bdf8',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              overflow: 'hidden',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 0 18px rgba(56, 189, 248, 0.6), inset 0 0 10px rgba(56, 189, 248, 0.15)'
            }}
          >
            {mediaUrl(data?.avatar) && !headerAvatarFailed ? (
              <img
                src={mediaUrl(data?.avatar) || ''}
                alt={data?.full_name || 'پروفایل'}
                onError={(e) => {
                  setHeaderAvatarFailed(true);
                  (e.target as HTMLImageElement).src = '/default-avatar.svg';
                }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <UserIcon style={{ width: '28px', height: '28px', color: '#e0e7ff' }} />
            )}
          </button>

          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: '2px solid #a855f7',
            boxShadow: '0 0 22px rgba(168, 85, 247, 0.7), 0 0 40px rgba(56, 189, 248, 0.35), inset 0 0 14px rgba(6, 182, 212, 0.4)',
            background: 'radial-gradient(circle at 30% 30%, rgba(56, 189, 248, 0.25), rgba(168, 85, 247, 0.35) 60%, rgba(15, 10, 30, 0.95) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.95rem',
            fontWeight: 900,
            color: '#f0abfc',
            textShadow: '0 0 8px rgba(217, 70, 239, 0.9)'
          }}>
            صفا 27
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '1rem',
              border: '1.5px solid rgba(168, 85, 247, 0.55)',
              backgroundColor: 'rgba(23, 14, 46, 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#c084fc',
              boxShadow: '0 0 14px rgba(168, 85, 247, 0.35)'
            }}
          >
            <LogOut style={{ width: '24px', height: '24px' }} />
          </button>
        </header>

        {/* ۲. اسلایدر تصاویر پویا از پوشه media */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '280px',
          borderRadius: '1.75rem',
          overflow: 'hidden',
          border: '1.5px solid rgba(168, 85, 247, 0.6)',
          boxShadow: '0 0 35px rgba(126, 34, 206, 0.4), 0 0 60px rgba(56, 189, 248, 0.12), inset 0 0 25px rgba(168, 85, 247, 0.08)',
          backdropFilter: 'blur(8px)'
        }}>
          {slides.length > 0 ? (
            <img
              src={slides[currentSlide]}
              alt="اسلاید"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c4b5fd',
              fontWeight: 700,
              background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.45), rgba(15, 23, 42, 0.8))'
            }}>
              عکسی در پوشه media پیدا نشد
            </div>
          )}

          {slides.length > 1 && <>
          <button
            onClick={() => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))}
            style={{
              position: 'absolute',
              right: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(15, 10, 30, 0.55)',
              border: '1px solid rgba(168, 85, 247, 0.6)',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              color: '#c084fc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 0 12px rgba(168, 85, 247, 0.5)'
            }}
          >
            <ChevronRight style={{ width: '24px', height: '24px' }} />
          </button>

          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
            style={{
              position: 'absolute',
              left: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'rgba(15, 10, 30, 0.55)',
              border: '1px solid rgba(56, 189, 248, 0.6)',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              color: '#7dd3fc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 0 12px rgba(56, 189, 248, 0.5)'
            }}
          >
            <ChevronLeft style={{ width: '24px', height: '24px' }} />
          </button>
          </>}

          <div style={{
            position: 'absolute',
            bottom: '14px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '8px'
          }}>
            {slides.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: idx === currentSlide ? '20px' : '7px',
                  height: '7px',
                  borderRadius: '4px',
                  backgroundColor: idx === currentSlide ? '#a855f7' : 'rgba(255, 255, 255, 0.45)',
                  boxShadow: idx === currentSlide ? '0 0 8px rgba(168, 85, 247, 0.9)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>

        {/* ۳. نوار پیام‌ها و دستورات ارسالی مربی */}
        {data?.manager_messages && data.manager_messages.length > 0 && (
          <div style={{
            backgroundColor: 'rgba(234, 179, 8, 0.12)',
            border: '1.5px solid rgba(234, 179, 8, 0.55)',
            borderRadius: '1.25rem',
            padding: '0.85rem 1.25rem',
            boxShadow: '0 0 25px rgba(234, 179, 8, 0.25)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#facc15', fontSize: '0.85rem', fontWeight: 800 }}>
              <Bell style={{ width: '18px', height: '18px' }} />
              پیام‌های مدیریت و مربی:
            </div>
            {data.manager_messages.map((msg: string, idx: number) => (
              <div key={idx} style={{
                color: '#fef08a',
                fontSize: '0.9rem',
                fontWeight: 600,
                backgroundColor: 'rgba(15, 10, 30, 0.65)',
                padding: '0.5rem 0.85rem',
                borderRadius: '0.75rem',
                border: '1px solid rgba(234, 179, 8, 0.3)'
              }}>
                {msg}
              </div>
            ))}
          </div>
        )}

        {/* ۴. باکس خوش‌آمدگویی و حضور کلی */}
        <div style={{
          backgroundColor: 'rgba(23, 14, 46, 0.6)',
          border: '1.5px solid rgba(168, 85, 247, 0.5)',
          borderRadius: '1.5rem',
          padding: '1rem 1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 0 22px rgba(126, 34, 206, 0.25), inset 0 0 12px rgba(168, 85, 247, 0.06)'
        }}>
          <div style={{ textAlign: 'right', flex: 1 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.25rem', color: '#f5f3ff' }}>
              سلام {data?.full_name || 'کاربر'}، حالت چطوره؟
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#a5b4fc', margin: 0, fontWeight: 400 }}>
              امیدوارم روز پرباری داشته باشی
            </p>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: data?.attendance_rate ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${data?.attendance_rate ? 'rgba(52, 211, 153, 0.45)' : 'rgba(239, 68, 68, 0.45)'}`,
            padding: '0.45rem 0.9rem',
            borderRadius: '1rem',
            boxShadow: data?.attendance_rate ? '0 0 12px rgba(52, 211, 153, 0.25)' : '0 0 12px rgba(239, 68, 68, 0.25)'
          }}>
            <Award style={{ width: '18px', height: '18px', color: data?.attendance_rate ? '#34d399' : '#f87171' }} />
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>حضور کلی</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: data?.attendance_rate ? '#34d399' : '#f87171', fontFamily: 'monospace' }}>
                {data?.attendance_rate || 'کاربر در شیت یافت نشد'}
              </span>
            </div>
          </div>
        </div>

        {/* ۵. باکس حلقه شما */}
        <div style={{
          backgroundColor: 'rgba(23, 14, 46, 0.6)',
          border: '1.5px solid rgba(168, 85, 247, 0.5)',
          borderRadius: '1.75rem',
          padding: '1.5rem',
          boxShadow: '0 0 30px rgba(126, 34, 206, 0.3), inset 0 0 18px rgba(168, 85, 247, 0.06)',
          backdropFilter: 'blur(16px)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            backgroundColor: 'rgba(88, 28, 135, 0.35)',
            border: '1px solid rgba(168, 85, 247, 0.55)',
            borderRadius: '1rem',
            padding: '0.5rem 1.5rem',
            width: 'fit-content',
            margin: '0 auto 1.5rem',
            fontSize: '1rem',
            fontWeight: 800,
            color: '#e9d5ff',
            boxShadow: '0 0 14px rgba(168, 85, 247, 0.35)'
          }}>
            <span>حلقه شما:</span>
            <span style={{ color: '#38bdf8' }}>{data?.ring_name || 'حلقه‌ای یافت نشد'}</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: '0.9rem'
          }}>
            {data?.ring_members && data.ring_members.length > 0 ? (
              data.ring_members.map((member) => (
                <div
                  key={member.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.7rem 0.9rem',
                    backgroundColor: 'rgba(15, 10, 30, 0.75)',
                    borderRadius: '1.1rem',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    boxShadow: '0 0 10px rgba(168, 85, 247, 0.12)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      border: '1.5px solid #a855f7',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#1e1b4b',
                      flexShrink: 0,
                      boxShadow: '0 0 8px rgba(168, 85, 247, 0.4)'
                    }}>
                      {mediaUrl(member.avatar) && !failedAvatars.includes(member.id) ? (
                        <img
                          src={mediaUrl(member.avatar) || ''}
                          alt={member.full_name}
                          onError={(e) => {
                            setFailedAvatars((prev) => prev.includes(member.id) ? prev : [...prev, member.id]);
                            (e.target as HTMLImageElement).src = '/default-avatar.svg';
                          }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <UserIcon style={{ width: '20px', height: '20px', color: '#c084fc' }} />
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {member.full_name}
                      </span>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.8rem',
                    color: member.attendance_rate !== 'یافت نشد' ? '#34d399' : '#f87171',
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    direction: 'ltr',
                    backgroundColor: member.attendance_rate !== 'یافت نشد' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '0.5rem',
                    border: `1px solid ${member.attendance_rate !== 'یافت نشد' ? 'rgba(52, 211, 153, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                    boxShadow: member.attendance_rate !== 'یافت نشد' ? '0 0 8px rgba(52, 211, 153, 0.25)' : '0 0 8px rgba(239, 68, 68, 0.25)'
                  }}>
                    {member.attendance_rate}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', gridColumn: '1 / -1', color: '#94a3b8', fontSize: '0.9rem', padding: '1.5rem 0' }}>
                کاربری در این حلقه ثبت نشده است
              </div>
            )}
          </div>
        </div>

        {/* ۶. دکمه‌های ناوبری پایین */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${visibleButtonsCount}, 1fr)`,
          gap: '0.9rem',
          width: '100%',
          marginTop: '0.25rem'
        }}>
          <button
            onClick={() => setShowArchiveModal(true)}
            style={{
              padding: '1rem 0.5rem',
              borderRadius: '999px',
              border: '1.5px solid rgba(168, 85, 247, 0.8)',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.5), rgba(88, 28, 135, 0.85))',
              color: '#fff',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 0 18px rgba(168, 85, 247, 0.55), 0 0 30px rgba(168, 85, 247, 0.2)'
            }}
          >
            آرشیو عمومی
          </button>

          <button
            onClick={() => navigate('/growth')}
            style={{
              padding: '1rem 0.5rem',
              borderRadius: '999px',
              border: '1.5px solid rgba(217, 70, 239, 0.8)',
              background: 'linear-gradient(135deg, rgba(217, 70, 239, 0.5), rgba(112, 26, 117, 0.85))',
              color: '#fff',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 0 18px rgba(217, 70, 239, 0.55), 0 0 30px rgba(217, 70, 239, 0.2)'
            }}
          >
            رشد فردی
          </button>

          {data?.is_resolution_officer && (
            <button
              onClick={() => navigate('/resolution-officer')}
              style={{
                padding: '1rem 0.5rem',
                borderRadius: '999px',
                border: '1.5px solid rgba(34, 211, 238, 0.8)',
                background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.5), rgba(8, 145, 178, 0.85))',
                color: '#fff',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 0 18px rgba(34, 211, 238, 0.55), 0 0 30px rgba(34, 211, 238, 0.2)'
              }}
            >
              ثبت مصوبه
            </button>
          )}

          {data?.is_workgroup_leader && (
            <button
              onClick={() => navigate('/workgroup')}
              style={{
                padding: '1rem 0.5rem',
                borderRadius: '999px',
                border: '1.5px solid rgba(59, 130, 246, 0.8)',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.5), rgba(30, 64, 175, 0.85))',
                color: '#fff',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 0 18px rgba(59, 130, 246, 0.55), 0 0 30px rgba(59, 130, 246, 0.2)'
              }}
            >
              کارگروه من
            </button>
          )}
        </div>
      </div>

      {/* مودال آرشیو عمومی */}
      {showArchiveModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '550px',
            backgroundColor: 'rgba(23, 14, 46, 0.95)',
            border: '1.5px solid #a855f7',
            borderRadius: '2rem',
            padding: '1.5rem',
            boxShadow: '0 0 35px rgba(168, 85, 247, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>آرشیو عمومی فایل‌ها</h3>
              <button onClick={() => setShowArchiveModal(false)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}>
                <X style={{ width: '22px', height: '22px' }} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              <button
                onClick={() => openArchive('video')}
                style={{
                  padding: '0.6rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  backgroundColor: archiveTab === 'video' ? '#7e22ce' : 'rgba(40, 20, 70, 0.6)',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <Video style={{ width: '16px', height: '16px' }} /> ویدیوها
              </button>
              <button
                onClick={() => openArchive('image')}
                style={{
                  padding: '0.6rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  backgroundColor: archiveTab === 'image' ? '#7e22ce' : 'rgba(40, 20, 70, 0.6)',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <ImageIcon style={{ width: '16px', height: '16px' }} /> تصاویر
              </button>
              <button
                onClick={() => openArchive('audio')}
                style={{
                  padding: '0.6rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  backgroundColor: archiveTab === 'audio' ? '#7e22ce' : 'rgba(40, 20, 70, 0.6)',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <Music style={{ width: '16px', height: '16px' }} /> صوت‌ها
              </button>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(15, 10, 30, 0.7)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              borderRadius: '0.75rem',
              padding: '0.5rem 0.75rem',
              gap: '0.5rem'
            }}>
              <Search style={{ width: '18px', height: '18px', color: '#a855f7' }} />
              <input
                type="text"
                placeholder="جستجوی نام فایل..."
                value={searchQuery}
                onChange={handleSearchChange}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {archiveItems.length > 0 ? (
                archiveItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.8rem',
                      backgroundColor: 'rgba(30, 20, 55, 0.6)',
                      borderRadius: '0.75rem',
                      border: '1px solid rgba(168, 85, 247, 0.25)'
                    }}
                  >
                    <span style={{ fontSize: '0.9rem' }}>{item.title}</span>
                    <a
                      href={item.zip_file}
                      download
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        backgroundColor: '#0284c7',
                        color: '#fff',
                        padding: '0.4rem 0.75rem',
                        borderRadius: '0.5rem',
                        textDecoration: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 700
                      }}
                    >
                      <Download style={{ width: '14px', height: '14px' }} /> دانلود ZIP
                    </a>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem', fontSize: '0.85rem' }}>
                  هیچ فایلی برای نمایش پیدا نشد.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;