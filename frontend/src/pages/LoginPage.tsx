import React, { useState } from 'react';
import { Shield, Star, Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react';
import API from '../api';
import { useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const [groupCode, setGroupCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await API.post('auth/login/', {
        group_code: groupCode.trim(),
        password: password,
      });

      if (response.data?.access) {
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('refresh_token', response.data.refresh);
        const user = response.data.user;
        localStorage.setItem('user_info', JSON.stringify(user));

        if (user.is_manager) {
          navigate('/manager', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'کد گروهی یا رمز عبور اشتباه است.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#05010f',
      backgroundImage: `
        radial-gradient(circle at 18% 22%, rgba(59, 130, 246, 0.18) 0%, transparent 42%),
        radial-gradient(circle at 82% 78%, rgba(147, 51, 234, 0.22) 0%, transparent 45%),
        radial-gradient(circle at 50% 50%, rgba(76, 29, 149, 0.12) 0%, transparent 70%),
        radial-gradient(circle at 75% 15%, rgba(37, 99, 235, 0.12) 0%, transparent 35%)
      `,
      padding: '1rem',
      direction: 'rtl',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: 'rgba(18, 10, 38, 0.55)',
        backdropFilter: 'blur(32px) saturate(140%)',
        WebkitBackdropFilter: 'blur(32px) saturate(140%)',
        border: '1.5px solid rgba(168, 85, 247, 0.75)',
        borderRadius: '1.75rem',
        padding: '2.5rem 2.25rem',
        boxShadow: '0 0 50px rgba(139, 92, 246, 0.45), 0 0 90px rgba(59, 130, 246, 0.18), inset 0 0 30px rgba(139, 92, 246, 0.06)',
        textAlign: 'center',
        boxSizing: 'border-box'
      }}>
        <div style={{
          width: '78px',
          height: '78px',
          margin: '0 auto 1.25rem',
          borderRadius: '1.25rem',
          border: '1.5px solid rgba(96, 165, 250, 0.8)',
          backgroundColor: 'rgba(30, 58, 138, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 28px rgba(59, 130, 246, 0.55), inset 0 0 18px rgba(96, 165, 250, 0.25)',
          position: 'relative'
        }}>
          <Shield style={{ width: '44px', height: '44px', color: '#60a5fa', filter: 'drop-shadow(0 0 6px rgba(96, 165, 250, 0.9))' }} />
          <Star style={{ width: '18px', height: '18px', color: '#dbeafe', fill: '#dbeafe', position: 'absolute', filter: 'drop-shadow(0 0 4px rgba(191, 219, 254, 0.9))' }} />
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.35rem', letterSpacing: '0.01em', textShadow: '0 0 18px rgba(168, 85, 247, 0.35)' }}>
          ورود به دنیای 27
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#a5b4fc', margin: '0 0 2rem', fontWeight: 300 }}>
          کارهاتو ثبت کن و خودتو بساز
        </p>

        {error && (
          <div style={{
            marginBottom: '1rem',
            padding: '0.6rem',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '0.75rem',
            color: '#fca5a5',
            fontSize: '0.8rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(20, 12, 42, 0.85)',
            border: '1.5px solid rgba(168, 85, 247, 0.85)',
            borderRadius: '1rem',
            padding: '0.8rem 1rem',
            boxShadow: '0 0 14px rgba(168, 85, 247, 0.35), inset 0 0 10px rgba(168, 85, 247, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#c084fc' }}>
              <CheckCircle2 style={{ width: '18px', height: '18px' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>ID</span>
            </div>
            <input
              type="text"
              placeholder="کد گروهی"
              value={groupCode}
              onChange={(e) => setGroupCode(e.target.value)}
              required
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ffffff',
                textAlign: 'left',
                direction: 'ltr',
                paddingLeft: '0.75rem',
                fontSize: '0.95rem'
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(20, 12, 42, 0.85)',
            border: '1.5px solid rgba(168, 85, 247, 0.85)',
            borderRadius: '1rem',
            padding: '0.8rem 1rem',
            boxShadow: '0 0 14px rgba(168, 85, 247, 0.35), inset 0 0 10px rgba(168, 85, 247, 0.08)'
          }}>
            <span style={{ color: '#c084fc' }}>
              <Lock style={{ width: '18px', height: '18px' }} />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="رمز عبور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ffffff',
                textAlign: 'left',
                direction: 'ltr',
                paddingLeft: '0.75rem',
                paddingRight: '0.75rem',
                fontSize: '0.95rem'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', display: 'flex' }}
            >
              {showPassword ? <EyeOff style={{ width: '18px', height: '18px' }} /> : <Eye style={{ width: '18px', height: '18px' }} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              padding: '0.9rem',
              borderRadius: '1rem',
              border: 'none',
              background: 'linear-gradient(90deg, #a21caf 0%, #7c3aed 45%, #2563eb 100%)',
              boxShadow: '0 0 22px rgba(124, 58, 237, 0.7), 0 0 40px rgba(37, 99, 235, 0.35)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '1.05rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              letterSpacing: '0.02em'
            }}
          >
            {loading ? 'در حال ورود...' : 'ورود'}
          </button>
        </form>
      </div>
    </div>
  );
};