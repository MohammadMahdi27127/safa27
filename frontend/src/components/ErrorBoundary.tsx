import React from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

/**
 * ✅ Error Boundary for catching and handling errors
 * - Catches component errors
 * - Shows user-friendly error UI
 * - Provides recovery options (refresh, logout)
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorCount: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Error caught:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);
  }

  handleRefresh = () => {
    this.setState((prevState) => ({
      errorCount: prevState.errorCount + 1,
    }));

    if (this.state.errorCount > 2) {
      // Too many refresh attempts - logout
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_info');
      window.location.href = '/login';
    } else {
      window.location.reload();
    }
  };

  handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      const is401 = this.state.error?.message?.includes('401') ||
                    this.state.error?.message?.includes('Unauthorized');

      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#0c071e',
          backgroundImage: 'radial-gradient(circle at 50% 10%, rgba(217, 70, 239, 0.2) 0%, transparent 60%)',
          padding: '1rem',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '500px',
            backgroundColor: 'rgba(23, 14, 46, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(217, 70, 239, 0.4)',
            borderRadius: '1.75rem',
            padding: '2rem',
            textAlign: 'center',
          }}>
            {/* Icon */}
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 1.5rem',
              borderRadius: '1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '2px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <AlertTriangle style={{
                width: '40px',
                height: '40px',
                color: '#ef4444',
              }} />
            </div>

            {/* Title */}
            <h2 style={{
              margin: '0 0 0.75rem',
              fontSize: '1.3rem',
              fontWeight: 700,
              color: '#f1f5f9',
            }}>
              {is401 ? 'جلسه کاری منقضی شده' : 'خطای سیستم'}
            </h2>

            {/* Message */}
            <p style={{
              margin: '0 0 1.5rem',
              fontSize: '0.95rem',
              color: '#cbd5e1',
              lineHeight: '1.5',
            }}>
              {is401
                ? 'توکن دسترسی شما منقضی شده است. لطفا دوباره وارد شوید.'
                : 'یک خطای غیرمنتظره رخ داد. لطفا دوباره سعی کنید یا با پشتیبانی تماس بگیرید.'}
            </p>

            {/* Error Details (dev only) */}
            {import.meta.env.DEV && this.state.error && (
              <div style={{
                margin: '1rem 0',
                padding: '1rem',
                backgroundColor: 'rgba(30, 30, 30, 0.8)',
                borderRadius: '0.5rem',
                textAlign: 'left',
                fontSize: '0.8rem',
                color: '#94a3b8',
                maxHeight: '150px',
                overflow: 'auto',
              }}>
                <strong style={{ color: '#f1f5f9' }}>Debug Info:</strong>
                <pre style={{
                  margin: '0.5rem 0 0',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                }}>
                  {this.state.error.toString()}
                </pre>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              flexDirection: 'column',
              marginTop: '2rem',
            }}>
              <button
                onClick={this.handleRefresh}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                }}
              >
                <RefreshCw style={{ width: '18px', height: '18px' }} />
                <span>دوباره سعی کنید</span>
              </button>

              <button
                onClick={this.handleLogout}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  color: '#fca5a5',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                }}
              >
                <LogOut style={{ width: '18px', height: '18px' }} />
                <span>خروج و ورود دوباره</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
