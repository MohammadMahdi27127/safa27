import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, Eye, MoonStar, Send, User } from 'lucide-react';

const sections = [
  {
    id: 'monitor',
    label: 'پایش و کارنامه',
    title: 'اطلاعات خود را مشاهده کنید',
    body: 'دسترسی فوری به کارنامه جامع تربیتی، درصد حضور و غیاب شیت، مشخصات هم‌حلقه‌ای‌ها و سوابق برنامه‌ها.',
    icon: Eye,
    accent: '#38bdf8',
  },
  {
    id: 'growth',
    label: 'رشد فردی شبانه',
    title: 'گزارش شبانه خود را ثبت کنید',
    body: 'ورزش، مطالعه، مسئولیت امروز، یادگیری مهارت و اوقات فراغت را هر شب در یک گزارش ثبت کنید.',
    icon: MoonStar,
    accent: '#c084fc',
  },
  {
    id: 'resolutions',
    label: 'مصوبات و کارگروه',
    title: 'مصوبات خود را چک نمایید',
    body: 'پیگیری تکالیف ابلاغ‌شده مسئول مصوبات، چک‌لیست اقدامات کارگروه و ثبت تیک اجرای پروژه‌های تیمی.',
    icon: Check,
    accent: '#34d399',
  },
  {
    id: 'contact',
    label: 'ارتباط و تعامل',
    title: 'با مربی خود در ارتباط باشید',
    body: 'ارتباط تعاملی سریع، ارسال پیشنهادات و بازخوردها و دریافت پیام‌های اختصاصی از مربی و مسئولین سامانه.',
    icon: User,
    accent: '#e879f9',
  },
];

const FeatureCopy: React.FC<{ title: string; body: string }> = ({ title, body }) => {
  const [titleDone, setTitleDone] = useState(false);
  const finishTitle = React.useCallback(() => setTitleDone(true), []);
  return (
    <div className="feature-copy">
      <h2><Typed text={title} speed={28} onDone={finishTitle} /></h2>
      <p>{titleDone ? <Typed text={body} speed={16} /> : <i className="caret" aria-hidden="true" />}</p>
    </div>
  );
};

const Typed: React.FC<{ text: string; speed?: number; className?: string; onDone?: () => void }> = ({
  text,
  speed = 34,
  className,
  onDone,
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setCount(index);
      if (index >= text.length) {
        window.clearInterval(timer);
        onDone?.();
      }
    }, speed);
    return () => window.clearInterval(timer);
  }, [text, speed, onDone]);

  const typing = count < text.length;
  return (
    <span className={className}>
      {text.slice(0, count)}
      <i className={typing ? 'caret' : 'caret idle'} aria-hidden="true" />
    </span>
  );
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState(sections[0].id);
  const [welcomeDone, setWelcomeDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const section = sections.find((item) => item.id === activeId) ?? sections[0];
  const Icon = section.icon;

  useEffect(() => {
    const body = document.body;
    const root = document.getElementById('root');
    const previous = {
      display: body.style.display,
      alignItems: body.style.alignItems,
      rootWidth: root?.style.width ?? '',
    };
    body.style.display = 'block';
    if (root) root.style.width = '100%';
    return () => {
      body.style.display = previous.display;
      body.style.alignItems = previous.alignItems;
      if (root) root.style.width = previous.rootWidth;
    };
  }, []);

  const finishWelcome = React.useCallback(() => setWelcomeDone(true), []);

  const copySupportId = async () => {
    try {
      await navigator.clipboard.writeText('@127_27');
    } catch {
      const input = document.createElement('textarea');
      input.value = '@127_27';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="landing">
      <div className="orb orb-a" />
      <div className="orb orb-b" />
      <main className="landing-shell">
        <div className="landing-badge"><i />سامانه پایش صفا 27</div>
        <h1>سامانه صفا ۲۷</h1>

        <section className="welcome-window">
          <div className="welcome-bar">
            <span>safa27://dashboard.welcome</span>
            <span className="dots" aria-hidden="true">
              <i className="dot red" />
              <i className="dot yellow" />
              <i className="dot green" />
            </span>
          </div>
          <p><Typed text="سلام دوست عزیز، خوش آمدید!" speed={46} onDone={finishWelcome} /></p>
          <span className="hint">
            {welcomeDone ? <Typed text="شما در اینجا می‌توانید:" speed={40} /> : <i className="caret" />}
          </span>
        </section>

        <nav className="section-nav" aria-label="بخش‌های سامانه">
          {sections.map((item) => {
            const TabIcon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={activeId === item.id ? 'active' : ''}
                style={{ ['--accent' as string]: item.accent }}
                onClick={() => setActiveId(item.id)}
              >
                <TabIcon />
                {item.label}
              </button>
            );
          })}
        </nav>

        <article className="feature-card" style={{ ['--accent' as string]: section.accent }}>
          <FeatureCopy key={section.id} title={section.title} body={section.body} />
          <div className="feature-icon" aria-hidden="true">
            <Icon />
          </div>
        </article>

        <button type="button" className="enter-btn" onClick={() => navigate('/login')}>
          ورود به سامانه
          <ChevronLeft />
        </button>

        <button type="button" className="support-card" onClick={copySupportId}>
          <div>
            <strong>پشتیبانی و ارتباط در پیام‌رسان بله</strong>
            <span>پاسخگویی به سوالات و راهنمایی اعضا</span>
            <em>{copied ? 'کپی شد' : '@127_27'}</em>
          </div>
          <span className="plane"><Send /></span>
        </button>
      </main>

      <style>{`
        .landing {
          min-height: 100vh;
          width: 100vw;
          box-sizing: border-box;
          direction: rtl;
          color: #f8fafc;
          position: relative;
          overflow-x: clip;
          background:
            linear-gradient(rgba(129, 140, 248, 0.14) 1px, transparent 1px),
            linear-gradient(90deg, rgba(129, 140, 248, 0.14) 1px, transparent 1px),
            radial-gradient(circle at 50% -10%, #2e1065 0%, transparent 46%),
            #070418;
          background-size: 42px 42px, 42px 42px, auto, auto;
          padding: 2.2rem 1rem 2.6rem;
        }
        .orb { position: absolute; border-radius: 50%; filter: blur(40px); pointer-events: none; }
        .orb-a { width: 280px; height: 280px; background: rgba(59, 130, 246, 0.22); top: 8%; right: 8%; }
        .orb-b { width: 320px; height: 320px; background: rgba(168, 85, 247, 0.2); bottom: 6%; left: 6%; }
        .landing-shell {
          width: min(860px, 100%);
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          position: relative;
          z-index: 1;
        }
        .landing-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          border: 1px solid rgba(196, 181, 253, 0.65);
          background: rgba(49, 16, 110, 0.72);
          color: #f5f3ff;
          border-radius: 999px;
          padding: 0.42rem 0.95rem;
          font-size: 0.9rem;
          font-weight: 700;
          box-shadow: 0 0 22px rgba(168, 85, 247, 0.35);
        }
        .landing-badge i {
          width: 8px; height: 8px; border-radius: 50%;
          background: #22d3ee;
          box-shadow: 0 0 10px #22d3ee;
        }
        .landing h1 {
          margin: 0.15rem 0 0.15rem;
          font-size: clamp(2.6rem, 8vw, 4.6rem);
          font-weight: 900;
          line-height: 1.15;
          background: linear-gradient(180deg, #ffffff 20%, #93c5fd 62%, #c4b5fd 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          filter: drop-shadow(0 8px 18px rgba(99, 102, 241, 0.35));
          text-align: center;
        }
        .welcome-window, .feature-card, .support-card, .section-nav {
          width: 100%;
          box-sizing: border-box;
          border-radius: 1.7rem;
          background: linear-gradient(180deg, rgba(30, 16, 68, 0.92), rgba(14, 8, 36, 0.92));
          border: 1px solid rgba(167, 139, 250, 0.38);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.03) inset, 0 18px 50px rgba(15, 8, 40, 0.45);
          backdrop-filter: blur(10px);
        }
        .welcome-window { padding: 1rem 1.25rem 1.35rem; min-height: 168px; }
        .welcome-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #ddd6fe;
          font-size: 0.8rem;
          margin-bottom: 1.15rem;
          font-family: ui-monospace, monospace;
        }
        .dots { display: flex; gap: 0.38rem; }
        .dot { width: 11px; height: 11px; border-radius: 50%; display: block; }
        .green { background: #22c55e; box-shadow: 0 0 8px #22c55e; }
        .yellow { background: #eab308; box-shadow: 0 0 8px #eab308; }
        .red { background: #ef4444; box-shadow: 0 0 8px #ef4444; }
        .welcome-window p {
          margin: 0 0 0.4rem;
          min-height: 1.5em;
          color: #38bdf8;
          font-size: clamp(1.25rem, 3vw, 1.75rem);
          font-weight: 800;
        }
        .hint { display: block; min-height: 1.4em; color: #e0f2fe; font-weight: 650; }
        .caret {
          display: inline-block;
          width: 2px;
          height: 1em;
          margin-inline-start: 3px;
          background: currentColor;
          vertical-align: text-bottom;
          animation: blink 0.75s steps(1) infinite;
        }
        .caret.idle { opacity: 0.35; animation: none; }
        @keyframes blink { 50% { opacity: 0; } }
        .section-nav {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.4rem;
          padding: 0.45rem;
        }
        .section-nav button {
          border: none;
          background: transparent;
          color: #ddd6fe;
          border-radius: 1.15rem;
          padding: 0.7rem 0.3rem 0.62rem;
          font-weight: 800;
          cursor: pointer;
          font-size: 0.86rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.28rem;
        }
        .section-nav button svg { width: 18px; height: 18px; color: var(--accent); }
        .section-nav button.active {
          background: linear-gradient(180deg, #7c3aed, #5b21b6);
          color: #fff;
          box-shadow: 0 0 22px rgba(124, 58, 237, 0.55);
        }
        .section-nav button.active svg { color: #fff; }
        .feature-card {
          min-height: 168px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.35rem 1.25rem;
          border-color: color-mix(in srgb, var(--accent) 70%, transparent);
          box-shadow: 0 0 28px color-mix(in srgb, var(--accent) 22%, transparent);
        }
        .feature-copy { flex: 1; min-width: 0; }
        .feature-card h2 {
          margin: 0 0 0.55rem;
          min-height: 1.4em;
          font-size: clamp(1.2rem, 2.6vw, 1.65rem);
        }
        .feature-card p {
          margin: 0;
          min-height: 3.6em;
          color: #ede9fe;
          line-height: 1.9;
          font-size: 0.98rem;
        }
        .feature-icon {
          width: 78px;
          height: 78px;
          flex: 0 0 78px;
          border-radius: 1.35rem;
          display: grid;
          place-items: center;
          color: var(--accent);
          border: 1.5px solid var(--accent);
          background: color-mix(in srgb, var(--accent) 12%, transparent);
          box-shadow: 0 0 18px color-mix(in srgb, var(--accent) 40%, transparent);
        }
        .feature-icon svg { width: 34px; height: 34px; }
        .enter-btn {
          border: none;
          cursor: pointer;
          color: #fff;
          font-weight: 900;
          font-size: 1.12rem;
          border-radius: 999px;
          padding: 0.92rem 2.5rem;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: linear-gradient(90deg, #3b82f6, #7c3aed 70%);
          box-shadow: 0 0 26px rgba(99, 102, 241, 0.55);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .enter-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(99, 102, 241, 0.6); }
        .enter-btn svg { width: 22px; height: 22px; }
        .support-card {
          color: inherit;
          text-align: right;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.95rem 1.1rem;
          transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
        }
        .support-card:hover {
          transform: translateY(-8px);
          border-color: rgba(56, 189, 248, 0.85);
          box-shadow: 0 16px 34px rgba(14, 165, 233, 0.28), 0 0 26px rgba(56, 189, 248, 0.35);
        }
        .support-card strong { display: block; font-size: 1rem; }
        .support-card span, .support-card em { display: block; color: #bae6fd; font-style: normal; margin-top: 0.15rem; }
        .support-card em { color: #67e8f9; font-weight: 800; direction: ltr; text-align: right; }
        .plane {
          width: 52px; height: 52px; border-radius: 50%;
          display: grid; place-items: center;
          border: 1px solid rgba(56, 189, 248, 0.7);
          color: #38bdf8;
          box-shadow: 0 0 16px rgba(56, 189, 248, 0.35);
          flex: 0 0 auto;
        }
        .plane svg { width: 22px; height: 22px; }
        @media (max-width: 760px) {
          .landing { padding: 1.3rem 0.7rem 2rem; }
          .section-nav { grid-template-columns: 1fr 1fr; }
          .section-nav button { font-size: 0.78rem; }
          .feature-card { align-items: flex-start; }
          .feature-icon { width: 58px; height: 58px; flex-basis: 58px; }
          .feature-card p { min-height: 5.2em; }
          .welcome-bar { font-size: 0.68rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .caret { animation: none; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
