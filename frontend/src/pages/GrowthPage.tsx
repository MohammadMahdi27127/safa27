import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, Dumbbell, BookOpen, CheckCircle, Award, Sparkles, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import API from '../api';
import { DynamicFormRenderer } from '../components/DynamicFormRenderer';
import { CustomFormCard } from '../components/CustomFormCard';

export const GrowthPage: React.FC = () => {
    const navigate = useNavigate();

    // فیلدهای فرم
    const [shamsiDate, setShamsiDate] = useState('');
    const [exerciseHours, setExerciseHours] = useState('');
    const [readingPages, setReadingPages] = useState('');
    const [dailyResponsibility, setDailyResponsibility] = useState('');
    const [skillLearning, setSkillLearning] = useState('');
    const [leisureTime, setLeisureTime] = useState('');

    // استیت‌های پاپ‌آپ ➕
    const [showModal, setShowModal] = useState(false);
    const [itemType, setItemType] = useState<'exercise' | 'book'>('exercise');
    const [customTitle, setCustomTitle] = useState('');
    const [customItems, setCustomItems] = useState<{ id: number; item_type: string; title: string }[]>([]);

    // ✅ Active Forms State
    const [activeForms, setActiveForms] = useState<any[]>([]);
    const [formsLoading, setFormsLoading] = useState(false);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchGrowthInitialData();
        fetchActiveForms();
    }, []);

    const fetchActiveForms = async () => {
        setFormsLoading(true);
        try {
            const res = await API.get('/api/custom-forms/active/');
            setActiveForms(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error fetching active forms:', err);
            setActiveForms([]);
        } finally {
            setFormsLoading(false);
        }
    };

    const fetchGrowthInitialData = async () => {
        try {
            const res = await API.get('growth/');
            setShamsiDate(res.data.today_shamsi);
            setCustomItems(res.data.custom_items || []);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSaveRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            await API.post('growth/', {
                exercise_hours: parseFloat(exerciseHours) || 0,
                reading_pages: parseInt(readingPages, 10) || 0,
                daily_responsibility: dailyResponsibility,
                skill_learning: skillLearning,
                leisure_time: leisureTime,
            });
            setMessage('گزارش رشد فردی امروز با موفقیت ثبت شد ✨');
            setTimeout(() => navigate('/dashboard'), 1500);
        } catch (err) {
            setMessage('خطا در ثبت گزارش. لطفاً دوباره تلاش کنید.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCustomItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customTitle.trim()) return;

        try {
            const res = await API.post('growth/custom-item/', {
                item_type: itemType,
                title: customTitle.trim(),
            });
            setCustomItems((prev) => [...prev, res.data]);
            setCustomTitle('');
            setShowModal(false);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{
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
        }}>
            <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* هدر صفحه */}
                <header style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%'
                }}>
                    {/* آیکون بازگشت مینیمال و شیشه‌ای */}
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
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#06b6d4';
                            e.currentTarget.style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)';
                            e.currentTarget.style.boxShadow = '0 0 15px rgba(168, 85, 247, 0.25)';
                        }}
                    >
                        <ArrowRight style={{ width: '22px', height: '22px' }} />
                    </button>

                    <h1 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#f0abfc' }}>
                        رشد فردی شبانه
                    </h1>

                    {/* دکمه باز کردن پاپ‌آپ ➕ */}
                    <button
                        onClick={() => setShowModal(true)}
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
                        title="افزودن کتاب یا برنامه ورزشی"
                    >
                        <Plus style={{ width: '24px', height: '24px' }} />
                    </button>
                </header>

                {/* کارت فرم ثبت گزارش */}
                <div style={{
                    backgroundColor: 'rgba(23, 14, 46, 0.85)',
                    backdropFilter: 'blur(16px)',
                    border: '1.5px solid rgba(217, 70, 239, 0.4)',
                    borderRadius: '1.75rem',
                    padding: '1.5rem',
                    boxShadow: '0 0 30px rgba(162, 28, 175, 0.25)'
                }}>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1.25rem',
                        paddingBottom: '0.75rem',
                        borderBottom: '1px solid rgba(217, 70, 239, 0.2)'
                    }}>
                        <span style={{ fontSize: '0.9rem', color: '#e879f9', fontWeight: 600 }}>تاریخ امروز:</span>
                        <span style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8' }}>{shamsiDate || '...'}</span>
                    </div>

                    {message && (
                        <div style={{
                            marginBottom: '1rem',
                            padding: '0.75rem',
                            backgroundColor: 'rgba(34, 197, 94, 0.2)',
                            border: '1px solid rgba(34, 197, 94, 0.4)',
                            borderRadius: '0.75rem',
                            color: '#86efac',
                            fontSize: '0.85rem',
                            textAlign: 'center'
                        }}>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSaveRecord} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                        {/* ورزش و مطالعه */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#d8b4fe', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <Dumbbell style={{ width: '15px', height: '15px' }} /> ورزش (ساعت)
                                </label>
                                <input
                                    type="number"
                                    step="0.5"
                                    placeholder="مثال: 1.5"
                                    value={exerciseHours}
                                    onChange={(e) => setExerciseHours(e.target.value)}
                                    style={{
                                        width: '100%',
                                        backgroundColor: 'rgba(15, 10, 30, 0.7)',
                                        border: '1px solid rgba(168, 85, 247, 0.4)',
                                        borderRadius: '0.75rem',
                                        padding: '0.6rem 0.8rem',
                                        color: '#fff',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.8rem', color: '#d8b4fe', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <BookOpen style={{ width: '15px', height: '15px' }} /> مطالعه (صفحه)
                                </label>
                                <input
                                    type="number"
                                    placeholder="مثال: 20"
                                    value={readingPages}
                                    onChange={(e) => setReadingPages(e.target.value)}
                                    style={{
                                        width: '100%',
                                        backgroundColor: 'rgba(15, 10, 30, 0.7)',
                                        border: '1px solid rgba(168, 85, 247, 0.4)',
                                        borderRadius: '0.75rem',
                                        padding: '0.6rem 0.8rem',
                                        color: '#fff',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>

                        {/* مسئولیت روزانه */}
                        <div>
                            <label style={{ fontSize: '0.8rem', color: '#d8b4fe', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <CheckCircle style={{ width: '15px', height: '15px' }} /> مسئولیت امروز
                            </label>
                            <textarea
                                rows={2}
                                placeholder="وظایف یا کارهایی که امروز به سرانجام رسوندی..."
                                value={dailyResponsibility}
                                onChange={(e) => setDailyResponsibility(e.target.value)}
                                style={{
                                    width: '100%',
                                    backgroundColor: 'rgba(15, 10, 30, 0.7)',
                                    border: '1px solid rgba(168, 85, 247, 0.4)',
                                    borderRadius: '0.75rem',
                                    padding: '0.6rem 0.8rem',
                                    color: '#fff',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    resize: 'none'
                                }}
                            />
                        </div>

                        {/* یادگیری مهارت */}
                        <div>
                            <label style={{ fontSize: '0.8rem', color: '#d8b4fe', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <Award style={{ width: '15px', height: '15px' }} /> یادگیری مهارت
                            </label>
                            <textarea
                                rows={2}
                                placeholder="چه مهارت یا دانش جدیدی یاد گرفتی؟"
                                value={skillLearning}
                                onChange={(e) => setSkillLearning(e.target.value)}
                                style={{
                                    width: '100%',
                                    backgroundColor: 'rgba(15, 10, 30, 0.7)',
                                    border: '1px solid rgba(168, 85, 247, 0.4)',
                                    borderRadius: '0.75rem',
                                    padding: '0.6rem 0.8rem',
                                    color: '#fff',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    resize: 'none'
                                }}
                            />
                        </div>

                        {/* اوقات فراغت */}
                        <div>
                            <label style={{ fontSize: '0.8rem', color: '#d8b4fe', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <Sparkles style={{ width: '15px', height: '15px' }} /> اوقات فراغت
                            </label>
                            <input
                                type="text"
                                placeholder="تفریح، استراحت یا کارهای مورد علاقه..."
                                value={leisureTime}
                                onChange={(e) => setLeisureTime(e.target.value)}
                                style={{
                                    width: '100%',
                                    backgroundColor: 'rgba(15, 10, 30, 0.7)',
                                    border: '1px solid rgba(168, 85, 247, 0.4)',
                                    borderRadius: '0.75rem',
                                    padding: '0.6rem 0.8rem',
                                    color: '#fff',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* دکمه ثبت نهایی */}
                        <button
                            type="submit"
                            disabled={loading}
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
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.6 : 1
                            }}
                        >
                            {loading ? 'در حال ثبت...' : 'ثبت گزارش امشب'}
                        </button>
                    </form>
                </div>

                {/* لیست آیتم‌های اضافه شده با دکمه ➕ */}
                {customItems.length > 0 && (
                    <div style={{
                        backgroundColor: 'rgba(23, 14, 46, 0.7)',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        borderRadius: '1.25rem',
                        padding: '1rem'
                    }}>
                        <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: '#e879f9' }}>آرشیو اهداف و کتاب‌های شما:</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {customItems.map((item) => (
                                <span
                                    key={item.id}
                                    style={{
                                        backgroundColor: 'rgba(88, 28, 135, 0.4)',
                                        border: '1px solid rgba(168, 85, 247, 0.4)',
                                        padding: '0.3rem 0.7rem',
                                        borderRadius: '0.6rem',
                                        fontSize: '0.8rem',
                                        color: '#e2e8f0'
                                    }}
                                >
                                    {item.item_type === 'exercise' ? '🏃‍♂️ ' : '📚 '} {item.title}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* مودال پاپ‌آپ ➕ */}
            {showModal && (
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
                        maxWidth: '420px',
                        backgroundColor: 'rgba(23, 14, 46, 0.95)',
                        border: '1.5px solid #d946ef',
                        borderRadius: '1.75rem',
                        padding: '1.5rem',
                        boxShadow: '0 0 35px rgba(217, 70, 239, 0.4)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f0abfc' }}>
                                افزودن مورد جدید
                            </h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}>
                                <X style={{ width: '20px', height: '20px' }} />
                            </button>
                        </div>

                        {/* انتخاب نوع (کتاب یا ورزش) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            <button
                                type="button"
                                onClick={() => setItemType('exercise')}
                                style={{
                                    padding: '0.6rem',
                                    borderRadius: '0.75rem',
                                    border: 'none',
                                    backgroundColor: itemType === 'exercise' ? '#a21caf' : 'rgba(40, 20, 70, 0.6)',
                                    color: '#fff',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                برنامه ورزشی
                            </button>
                            <button
                                type="button"
                                onClick={() => setItemType('book')}
                                style={{
                                    padding: '0.6rem',
                                    borderRadius: '0.75rem',
                                    border: 'none',
                                    backgroundColor: itemType === 'book' ? '#a21caf' : 'rgba(40, 20, 70, 0.6)',
                                    color: '#fff',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                عنوان کتاب
                            </button>
                        </div>

                        {/* اینپوت عنوان */}
                        <input
                            type="text"
                            placeholder={itemType === 'exercise' ? 'مثال: ۵ ست شنا + بارفیکس' : 'مثال: کتاب انسان در جستجوی معنا'}
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value)}
                            style={{
                                width: '100%',
                                backgroundColor: 'rgba(15, 10, 30, 0.8)',
                                border: '1px solid rgba(217, 70, 239, 0.5)',
                                borderRadius: '0.75rem',
                                padding: '0.75rem',
                                color: '#fff',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />

                        <button
                            onClick={handleAddCustomItem}
                            style={{
                                padding: '0.75rem',
                                borderRadius: '0.75rem',
                                border: 'none',
                                background: 'linear-gradient(90deg, #d946ef, #9333ea)',
                                color: '#fff',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            افزودن به آرشیو
                        </button>
                    </div>
                </div>
            )}

            {/* ✅ فرم‌های سفارشی فعال - چندین کانتینر */}
            {formsLoading ? (
                <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: '#cbd5e1',
                    fontSize: '0.9rem'
                }}>
                    درحال بارگذاری فرم‌ها...
                </div>
            ) : activeForms.length > 0 ? (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem'
                }}>
                    <h3 style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: '#f0abfc',
                        margin: 0,
                        marginTop: '0.5rem'
                    }}>
                        📋 فرم‌های فعال برای تکمیل
                    </h3>
                    {activeForms.map((form) => (
                        <CustomFormCard
                            key={form.id}
                            form={form}
                            onSuccess={fetchActiveForms}
                        />
                    ))}
                </div>
            ) : null}

            {/* فرم‌های سفارشی - DynamicFormRenderer */}
            <DynamicFormRenderer onFormSubmitted={fetchGrowthInitialData} />
        </div>
    );
};