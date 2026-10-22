import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, User as UserIcon, Camera, Calendar, 
  X, FileSpreadsheet, CheckCircle2, XCircle, KeyRound, Lock, Send, Eye, EyeOff, Pencil
} from 'lucide-react';
import API, { mediaUrl } from '../api';

interface ProgramRecord {
    title: string;
    value: string;
    status?: boolean;
}

interface UserProfile {
    full_name: string;
    group_code: string;
    ring_name?: string;
    is_manager?: boolean;
    is_resolution_officer?: boolean;
    is_workgroup_leader?: boolean;
    avatar?: string | null;
    attendance_rate?: string;
    recent_programs?: ProgramRecord[];
    last_10_columns?: ProgramRecord[];
    sheet_data?: {
        attendance_rate?: string;
        last_10_columns?: ProgramRecord[];
    };
}

export const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPlansModal, setShowPlansModal] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [showPasswordDisplay, setShowPasswordDisplay] = useState(false);

    // استیت‌های مودال تغییر رمز عبور
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await API.get('profile/');
            setProfile(res.data);
        } catch (err) {
            console.error(err);
            const saved = localStorage.getItem('user_info');
            const u = saved ? JSON.parse(saved) : null;
            setProfile({
                full_name: u?.full_name || 'محمد مهدی',
                group_code: u?.group_code || '101',
                ring_name: 'حلقه صفا ۲۷',
                is_manager: u?.is_manager ?? true,
                is_resolution_officer: u?.is_resolution_officer ?? true,
                is_workgroup_leader: u?.is_workgroup_leader ?? true,
                avatar: null,
                attendance_rate: '۹۲%',
                recent_programs: [
                    { title: 'کلاس تفسیر (7/16)', value: 'حاضر', status: true },
                    { title: 'کلاس مواعظ (7/16)', value: 'حاضر', status: true },
                    { title: 'جلسه گروهی (7/13)', value: 'غایب', status: false },
                ],
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('avatar', file);

        setUploadingAvatar(true);
        try {
            const res = await API.patch('profile/avatar/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setProfile((prev) => prev ? { ...prev, avatar: res.data.avatar } : null);
        } catch (err) {
            console.error('خطا در آپلود عکس:', err);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (newPassword !== confirmPassword) {
            setPasswordError('رمز عبور جدید با تکرار آن یکسان نیست.');
            return;
        }

        setPasswordLoading(true);
        try {
            await API.post('profile/change-password/', {
                current_password: currentPassword,
                new_password: newPassword,
            });
            setPasswordSuccess('رمز عبور شما با موفقیت تغییر یافت.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                setShowPasswordModal(false);
                setPasswordSuccess('');
            }, 1500);
        } catch (err: any) {
            setPasswordError(err.response?.data?.error || 'خطا در تغییر رمز عبور.');
        } finally {
            setPasswordLoading(false);
        }
    };

    const attendanceRate = profile?.attendance_rate || profile?.sheet_data?.attendance_rate || '۰%';
    const programsList = profile?.recent_programs || profile?.last_10_columns || profile?.sheet_data?.last_10_columns || [];

    const attendancePercent = (() => {
        const faToEn: Record<string, string> = { '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9' };
        const cleaned = String(attendanceRate).replace(/[٪%]/g, '').split('').map((c) => faToEn[c] ?? c).join('');
        const n = parseFloat(cleaned);
        return isNaN(n) ? 0 : Math.min(100, Math.max(0, n));
    })();

    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (attendancePercent / 100) * circumference;

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0c071e', color: '#38bdf8' }}>
                در حال بارگذاری پروفایل...
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            width: '100vw',
            backgroundColor: '#05010f',
            backgroundImage: `
                radial-gradient(circle at 15% 20%, rgba(56, 189, 248, 0.12) 0%, transparent 40%),
                radial-gradient(circle at 85% 30%, rgba(168, 85, 247, 0.18) 0%, transparent 42%),
                radial-gradient(circle at 50% 80%, rgba(124, 58, 237, 0.16) 0%, transparent 50%),
                radial-gradient(circle at 75% 65%, rgba(34, 211, 238, 0.10) 0%, transparent 35%)
            `,
            color: '#fff',
            padding: '1.5rem 1rem',
            boxSizing: 'border-box',
            direction: 'rtl',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            overflowX: 'hidden',
        }}>
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `
                    linear-gradient(rgba(56, 189, 248, 0.035) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(168, 85, 247, 0.035) 1px, transparent 1px)
                `,
                backgroundSize: '48px 48px',
                pointerEvents: 'none',
                zIndex: 0,
            }} />
            <div style={{ width: '100%', maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', zIndex: 1 }}>

                {/* ۱. هدر */}
                <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        aria-label="بازگشت به داشبورد"
                        style={{
                            background: 'rgba(23, 14, 46, 0.85)',
                            border: '1.5px solid rgba(168, 85, 247, 0.55)',
                            borderRadius: '50%',
                            width: '46px',
                            height: '46px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#c084fc',
                            cursor: 'pointer',
                            boxShadow: '0 0 16px rgba(168, 85, 247, 0.35)',
                        }}
                    >
                        <ArrowRight style={{ width: '22px', height: '22px' }} />
                    </button>

                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: '#ffffff', textShadow: '0 0 16px rgba(168, 85, 247, 0.35)' }}>
                        پروفایل کاربری
                    </h1>

                    <div style={{ width: '46px' }} />
                </header>

                {/* ۲. کارت مشخصات فردی */}
                <div style={{
                    backgroundColor: 'rgba(18, 10, 38, 0.55)',
                    backdropFilter: 'blur(32px) saturate(140%)',
                    WebkitBackdropFilter: 'blur(32px) saturate(140%)',
                    border: '1.5px solid rgba(168, 85, 247, 0.7)',
                    borderRadius: '1.75rem',
                    padding: '2.25rem 1.75rem',
                    boxShadow: '0 0 50px rgba(139, 92, 246, 0.4), 0 0 90px rgba(56, 189, 248, 0.12), inset 0 0 30px rgba(139, 92, 246, 0.06)',
                    textAlign: 'center',
                    position: 'relative',
                }}>
                    <div style={{ position: 'relative', width: '110px', height: '110px', margin: '0 auto 1.5rem' }}>
                        <div style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            border: '2.5px solid #38bdf8',
                            backgroundColor: '#0f0a24',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 28px rgba(56, 189, 248, 0.55), 0 0 50px rgba(168, 85, 247, 0.3), inset 0 0 18px rgba(56, 189, 248, 0.15)',
                        }}>
                            {profile?.avatar ? (
                                <img src={mediaUrl(profile.avatar) || ''} alt="پروفایل" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <UserIcon style={{ width: '56px', height: '56px', color: '#c084fc', filter: 'drop-shadow(0 0 6px rgba(168, 85, 247, 0.8))' }} />
                            )}
                        </div>

                        <label style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            backgroundColor: '#7c3aed',
                            border: '2px solid #c4b5fd',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: uploadingAvatar ? 'wait' : 'pointer',
                            opacity: uploadingAvatar ? 0.6 : 1,
                            boxShadow: '0 0 14px rgba(124, 58, 237, 0.7)',
                            transition: 'transform 0.2s',
                        }} title="تغییر عکس پروفایل">
                            <Camera style={{ width: '17px', height: '17px', color: '#fff' }} />
                            <input
                                type="file"
                                accept="image/*"
                                disabled={uploadingAvatar}
                                onChange={handleAvatarChange}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>

                    {/* ردیف‌های اطلاعات کاربر */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.75rem' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.7rem 1rem',
                            backgroundColor: 'rgba(15, 10, 30, 0.6)',
                            border: '1px solid rgba(168, 85, 247, 0.3)',
                            borderRadius: '1rem',
                        }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>{profile?.full_name}</span>
                            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#c084fc' }}>نام:</span>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.7rem 1rem',
                            backgroundColor: 'rgba(15, 10, 30, 0.6)',
                            border: '1px solid rgba(168, 85, 247, 0.3)',
                            borderRadius: '1rem',
                        }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#7dd3fc', fontFamily: 'monospace', direction: 'ltr' }}>{profile?.group_code}</span>
                            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#c084fc' }}>کد گروهی:</span>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.7rem 1rem',
                            backgroundColor: 'rgba(15, 10, 30, 0.6)',
                            border: '1px solid rgba(168, 85, 247, 0.3)',
                            borderRadius: '1rem',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e2e8f0', fontFamily: 'monospace', direction: 'ltr', letterSpacing: '2px' }}>
                                    {showPasswordDisplay ? '••••••••' : '••••••••'}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordDisplay(!showPasswordDisplay)}
                                    style={{ background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', display: 'flex' }}
                                    title="نمایش/مخفی کردن رمز"
                                >
                                    {showPasswordDisplay ? <EyeOff style={{ width: '18px', height: '18px' }} /> : <Eye style={{ width: '18px', height: '18px' }} />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(true)}
                                    style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer', display: 'flex' }}
                                    title="ویرایش رمز عبور"
                                >
                                    <Pencil style={{ width: '17px', height: '17px' }} />
                                </button>
                            </div>
                            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#c084fc' }}>رمز عبور:</span>
                        </div>
                    </div>

                    {/* نقش‌ها */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        {profile?.is_manager && (
                            <span style={{ backgroundColor: 'rgba(147, 51, 234, 0.25)', border: '1px solid rgba(168, 85, 247, 0.6)', color: '#d8b4fe', padding: '0.3rem 0.85rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 700, boxShadow: '0 0 10px rgba(168, 85, 247, 0.25)' }}>
                                👑 مربی (مدیر کل)
                            </span>
                        )}
                        {profile?.is_resolution_officer && (
                            <span style={{ backgroundColor: 'rgba(34, 211, 238, 0.18)', border: '1px solid rgba(34, 211, 238, 0.6)', color: '#a5f3fc', padding: '0.3rem 0.85rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 700, boxShadow: '0 0 10px rgba(34, 211, 238, 0.25)' }}>
                                ✍️ مسئول مصوبات
                            </span>
                        )}
                        {profile?.is_workgroup_leader && (
                            <span style={{ backgroundColor: 'rgba(74, 222, 128, 0.18)', border: '1px solid rgba(74, 222, 128, 0.6)', color: '#bbf7d0', padding: '0.3rem 0.85rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 700, boxShadow: '0 0 10px rgba(74, 222, 128, 0.25)' }}>
                                🎯 مسئول کارگروه
                            </span>
                        )}
                        <span style={{ backgroundColor: 'rgba(30, 20, 55, 0.7)', border: '1px solid rgba(168, 85, 247, 0.45)', color: '#e9d5ff', padding: '0.3rem 0.85rem', borderRadius: '1rem', fontSize: '0.8rem' }}>
                            حلقه: {profile?.ring_name || 'صفا ۲۷'}
                        </span>
                    </div>

                    {/* آمار حضور به صورت دایره‌ای + وضعیت فعال */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '1.75rem',
                    }}>
                        <div style={{ position: 'relative', width: '140px', height: '140px' }}>
                            <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
                                <defs>
                                    <linearGradient id="attendanceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#22d3ee" />
                                        <stop offset="100%" stopColor="#d946ef" />
                                    </linearGradient>
                                </defs>
                                <circle
                                    cx="70" cy="70" r={radius}
                                    fill="none"
                                    stroke="rgba(168, 85, 247, 0.15)"
                                    strokeWidth="10"
                                />
                                <circle
                                    cx="70" cy="70" r={radius}
                                    fill="none"
                                    stroke="url(#attendanceGradient)"
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={dashOffset}
                                    style={{ filter: 'drop-shadow(0 0 6px rgba(34, 211, 238, 0.7))', transition: 'stroke-dashoffset 0.8s ease' }}
                                />
                            </svg>
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <div style={{ fontSize: '0.8rem', color: '#a5b4fc', fontWeight: 600 }}>درصد حضور:</div>
                                <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#ffffff', fontFamily: 'monospace', direction: 'ltr', lineHeight: 1.1 }}>
                                    {attendanceRate}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.15rem' }}>در کل جلسات این ماه</div>
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            backgroundColor: 'rgba(16, 185, 129, 0.12)',
                            border: '1px solid rgba(52, 211, 153, 0.45)',
                            padding: '0.4rem 1rem',
                            borderRadius: '999px',
                            boxShadow: '0 0 12px rgba(52, 211, 153, 0.2)',
                        }}>
                            <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#4ade80', boxShadow: '0 0 8px #4ade80' }} />
                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#86efac' }}>وضعیت: فعال</span>
                        </div>
                    </div>

                    {/* دکمه‌های عملیاتی */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        <button
                            onClick={() => setShowPlansModal(true)}
                            style={{
                                width: '100%',
                                padding: '0.95rem',
                                borderRadius: '1.25rem',
                                border: 'none',
                                background: 'linear-gradient(90deg, #06b6d4 0%, #8b5cf6 55%, #d946ef 100%)',
                                boxShadow: '0 0 22px rgba(34, 211, 238, 0.5), 0 0 40px rgba(217, 70, 239, 0.3)',
                                color: '#fff',
                                fontWeight: 800,
                                fontSize: '1.05rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                            }}
                        >
                            <Calendar style={{ width: '19px', height: '19px' }} />
                            برنامه‌های من
                        </button>

                        <button
                            onClick={() => setShowPasswordModal(true)}
                            style={{
                                width: '100%',
                                padding: '0.85rem',
                                borderRadius: '1.25rem',
                                border: '1.5px solid rgba(168, 85, 247, 0.55)',
                                background: 'rgba(88, 28, 135, 0.3)',
                                color: '#e9d5ff',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                boxShadow: '0 0 14px rgba(168, 85, 247, 0.25)',
                            }}
                        >
                            <KeyRound style={{ width: '18px', height: '18px', color: '#c084fc' }} />
                            تغییر رمز عبور
                        </button>
                    </div>
                </div>
            </div>

            {/* ۳. مودال تیک و ضربدر برنامه‌ها */}
            {showPlansModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50,
                    padding: '1rem',
                }}>
                    <div style={{
                        width: '100%',
                        maxWidth: '520px',
                        backgroundColor: 'rgba(18, 10, 38, 0.95)',
                        backdropFilter: 'blur(24px)',
                        border: '1.5px solid rgba(168, 85, 247, 0.7)',
                        borderRadius: '1.75rem',
                        padding: '1.5rem',
                        boxShadow: '0 0 45px rgba(168, 85, 247, 0.45), 0 0 80px rgba(56, 189, 248, 0.12)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.25rem',
                        maxHeight: '85vh',
                        overflowY: 'auto',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#7dd3fc' }}>
                                <FileSpreadsheet style={{ width: '22px', height: '22px' }} />
                                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>برنامه‌ها و جلسات اخیر شما</h3>
                            </div>
                            <button
                                onClick={() => setShowPlansModal(false)}
                                style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
                            >
                                <X style={{ width: '22px', height: '22px' }} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {programsList.length > 0 ? (
                                programsList.map((col, index) => {
                                    const isPresent = col.value === 'حاضر' || col.status === true;
                                    return (
                                        <div
                                            key={index}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                backgroundColor: 'rgba(15, 10, 30, 0.75)',
                                                border: `1px solid ${isPresent ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                                borderRadius: '0.85rem',
                                                padding: '0.75rem 1rem',
                                            }}
                                        >
                                            <span style={{ fontSize: '0.9rem', color: '#e2e8f0', fontWeight: 600 }}>{col.title}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                {isPresent ? (
                                                    <CheckCircle2 style={{ width: '18px', height: '18px', color: '#34d399' }} />
                                                ) : (
                                                    <XCircle style={{ width: '18px', height: '18px', color: '#f87171' }} />
                                                )}
                                                <span style={{
                                                    fontSize: '0.85rem',
                                                    fontWeight: 700,
                                                    padding: '0.2rem 0.6rem',
                                                    borderRadius: '0.5rem',
                                                    backgroundColor: isPresent ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                                    color: isPresent ? '#86efac' : '#fca5a5',
                                                }}>
                                                    {col.value}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '1rem', fontSize: '0.85rem' }}>
                                    اطلاعاتی در شیت برای این کد یافت نشد.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ۴. مودال تغییر رمز عبور */}
            {showPasswordModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50,
                    padding: '1rem',
                }}>
                    <div style={{
                        width: '100%',
                        maxWidth: '440px',
                        backgroundColor: 'rgba(18, 10, 38, 0.95)',
                        backdropFilter: 'blur(24px)',
                        border: '1.5px solid rgba(168, 85, 247, 0.7)',
                        borderRadius: '1.75rem',
                        padding: '1.5rem',
                        boxShadow: '0 0 45px rgba(168, 85, 247, 0.45), 0 0 80px rgba(217, 70, 239, 0.15)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e9d5ff' }}>
                                <Lock style={{ width: '20px', height: '20px', color: '#c084fc' }} />
                                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>تغییر رمز عبور</h3>
                            </div>
                            <button
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    setPasswordError('');
                                    setPasswordSuccess('');
                                }}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                            >
                                <X style={{ width: '22px', height: '22px' }} />
                            </button>
                        </div>

                        {passwordError && (
                            <div style={{
                                padding: '0.6rem 0.8rem',
                                borderRadius: '0.75rem',
                                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                color: '#fca5a5',
                                fontSize: '0.8rem',
                            }}>
                                {passwordError}
                            </div>
                        )}

                        {passwordSuccess && (
                            <div style={{
                                padding: '0.6rem 0.8rem',
                                borderRadius: '0.75rem',
                                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                                border: '1px solid rgba(34, 197, 94, 0.4)',
                                color: '#86efac',
                                fontSize: '0.8rem',
                            }}>
                                {passwordSuccess}
                            </div>
                        )}

                        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>رمز عبور فعلی</label>
                                <input
                                    type="password"
                                    required
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="••••••"
                                    style={{
                                        width: '100%',
                                        padding: '0.65rem 0.8rem',
                                        backgroundColor: 'rgba(15, 10, 30, 0.75)',
                                        border: '1px solid rgba(168, 85, 247, 0.55)',
                                        borderRadius: '0.85rem',
                                        color: '#fff',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        direction: 'ltr',
                                        boxShadow: '0 0 10px rgba(168, 85, 247, 0.15)',
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>رمز عبور جدید</label>
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••"
                                    style={{
                                        width: '100%',
                                        padding: '0.65rem 0.8rem',
                                        backgroundColor: 'rgba(15, 10, 30, 0.75)',
                                        border: '1px solid rgba(168, 85, 247, 0.55)',
                                        borderRadius: '0.85rem',
                                        color: '#fff',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        direction: 'ltr',
                                        boxShadow: '0 0 10px rgba(168, 85, 247, 0.15)',
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>تکرار رمز عبور جدید</label>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••"
                                    style={{
                                        width: '100%',
                                        padding: '0.65rem 0.8rem',
                                        backgroundColor: 'rgba(15, 10, 30, 0.75)',
                                        border: '1px solid rgba(168, 85, 247, 0.55)',
                                        borderRadius: '0.85rem',
                                        color: '#fff',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        direction: 'ltr',
                                        boxShadow: '0 0 10px rgba(168, 85, 247, 0.15)',
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={passwordLoading}
                                style={{
                                    padding: '0.8rem',
                                    borderRadius: '1.1rem',
                                    border: 'none',
                                    background: 'linear-gradient(90deg, #06b6d4 0%, #8b5cf6 55%, #d946ef 100%)',
                                    color: '#fff',
                                    fontWeight: 800,
                                    cursor: passwordLoading ? 'wait' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.4rem',
                                    marginTop: '0.4rem',
                                    boxShadow: '0 0 20px rgba(34, 211, 238, 0.45), 0 0 35px rgba(217, 70, 239, 0.25)',
                                }}
                            >
                                <Send style={{ width: '16px', height: '16px' }} />
                                {passwordLoading ? 'در حال ذخیره...' : 'ذخیره رمز جدید'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;