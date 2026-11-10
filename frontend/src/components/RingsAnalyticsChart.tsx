import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import API from '../api';

interface RingStat {
  id: number;
  name: string;
  ring_number: number;
  member_count: number;
  avg_attendance: number;
  avg_submissions: number;
  overall_score: number;
}

export const RingsAnalyticsChart: React.FC = () => {
  const [days, setDays] = useState(7);
  const [metric, setMetric] = useState<'overall_score' | 'avg_attendance' | 'avg_submissions'>('overall_score');
  const [rings, setRings] = useState<RingStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (selectedDays: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get(`/api/mentor/rings-stats/?days=${selectedDays}`);
      if (res.data?.rings) {
        const sorted = [...res.data.rings].sort((a, b) => b[metric] - a[metric]);
        setRings(sorted);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'خطا در بارگذاری داده‌ها');
      setRings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(days);
  }, [days, metric]);

  const metricLabels: Record<string, { label: string; unit: string; color: string }> = {
    overall_score: { label: 'شاخص کل', unit: 'امتیاز', color: '#F59E0B' },
    avg_attendance: { label: 'میانگین حضور', unit: '%', color: '#8B5CF6' },
    avg_submissions: { label: 'میانگین پر کردن', unit: 'تعداد', color: '#EC4899' },
  };

  const timeRangeButtons = [
    { label: '۱ هفته', value: 7 },
    { label: '۲ هفته', value: 14 },
    { label: '۱ ماه', value: 30 },
  ];

  const metricButtons = [
    { label: 'شاخص کل', value: 'overall_score' as const },
    { label: 'حضور', value: 'avg_attendance' as const },
    { label: 'پر کردن', value: 'avg_submissions' as const },
  ];

  const currentMetricInfo = metricLabels[metric];

  return (
    <div style={{
      backgroundColor: 'rgba(23, 14, 46, 0.72)',
      border: '1.5px solid rgba(168, 85, 247, 0.32)',
      borderRadius: '1.35rem',
      padding: '1.5rem',
      boxShadow: '0 0 22px rgba(126, 34, 206, 0.16)',
      backdropFilter: 'blur(14px)',
      marginTop: '1.5rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <TrendingUp style={{ width: '24px', height: '24px', color: '#8B5CF6' }} />
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#8B5CF6' }}>آمار حلقه‌ها</h3>
      </div>

      {/* Time Range Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Calendar style={{ width: '16px', height: '16px' }} /> بازه:
        </span>
        {timeRangeButtons.map((btn) => (
          <button
            key={btn.value}
            onClick={() => setDays(btn.value)}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '0.6rem',
              border: days === btn.value ? '2px solid #8B5CF6' : '1px solid rgba(168, 85, 247, 0.3)',
              background: days === btn.value ? 'rgba(139, 92, 246, 0.1)' : 'rgba(15, 10, 30, 0.6)',
              color: days === btn.value ? '#8B5CF6' : '#cbd5e1',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Metric Toggle Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {metricButtons.map((btn) => (
          <button
            key={btn.value}
            onClick={() => setMetric(btn.value)}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '0.6rem',
              border: metric === btn.value ? `2px solid ${metricLabels[btn.value].color}` : '1px solid rgba(168, 85, 247, 0.3)',
              background: metric === btn.value ? `${metricLabels[btn.value].color}15` : 'rgba(15, 10, 30, 0.6)',
              color: metric === btn.value ? metricLabels[btn.value].color : '#cbd5e1',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Loading / Error */}
      {loading && <div style={{ textAlign: 'center', color: '#fde68a', padding: '1rem' }}>درحال بارگذاری...</div>}
      {error && <div style={{ textAlign: 'center', color: '#fca5a5', padding: '1rem' }}>{error}</div>}

      {/* Chart */}
      {!loading && rings.length > 0 && (
        <>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={rings} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(168, 85, 247, 0.1)" />
              <XAxis
                dataKey="name"
                angle={-30}
                textAnchor="end"
                height={70}
                tick={{ fill: '#cbd5e1', fontSize: 11 }}
              />
              <YAxis tick={{ fill: '#cbd5e1', fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 10, 30, 0.95)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '0.5rem',
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar
                dataKey={metric}
                fill={currentMetricInfo.color}
                radius={[8, 8, 0, 0]}
                isAnimationActive={true}
              >
                {rings.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? '#F59E0B' : currentMetricInfo.color}
                    opacity={index === 0 ? 1 : 0.7}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Stats Table */}
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{
              overflowX: 'auto',
              backgroundColor: 'rgba(15, 10, 30, 0.6)',
              borderRadius: '0.75rem',
              padding: '0.75rem',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(168, 85, 247, 0.2)' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'right', color: '#cbd5e1', fontWeight: 600 }}>رتبه</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right', color: '#cbd5e1', fontWeight: 600 }}>نام حلقه</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center', color: '#cbd5e1', fontWeight: 600 }}>شماره</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center', color: '#cbd5e1', fontWeight: 600 }}>اعضا</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center', color: '#cbd5e1', fontWeight: 600 }}>میانگین حضور</th>
                  </tr>
                </thead>
                <tbody>
                  {rings.map((ring, index) => (
                    <tr
                      key={ring.id}
                      style={{
                        borderBottom: '1px solid rgba(168, 85, 247, 0.1)',
                        backgroundColor: index === 0 ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '0.5rem', textAlign: 'center', fontSize: '1rem', fontWeight: 700 }}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                      </td>
                      <td style={{ padding: '0.5rem', color: '#e2e8f0' }}>{ring.name}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'center', color: '#cbd5e1' }}>
                        {ring.ring_number}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center', color: '#cbd5e1' }}>{ring.member_count}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'center', color: '#8B5CF6', fontWeight: 600 }}>
                        {ring.avg_attendance.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!loading && rings.length === 0 && !error && (
        <div style={{ textAlign: 'center', color: '#cbd5e1', padding: '2rem' }}>
          داده‌ای برای نمایش وجود ندارد
        </div>
      )}
    </div>
  );
};
