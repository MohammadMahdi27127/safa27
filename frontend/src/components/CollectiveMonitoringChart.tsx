import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import API from '../api';

interface Member {
  id: number;
  full_name: string;
  group_code: string;
  exercise_hours: number;
  reading_pages: number;
  attendance_rate: number;
  growth_submissions: number;
  overall_score: number;
}

export const CollectiveMonitoringChart: React.FC = () => {
  const [days, setDays] = useState(7);
  const [metric, setMetric] = useState<'overall_score' | 'exercise_hours' | 'reading_pages' | 'attendance_rate' | 'growth_submissions'>('overall_score');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (selectedDays: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get(`/api/mentor/collective-monitoring/?days=${selectedDays}`);
      if (res.data?.members) {
        // ✅ Sort by selected metric descending
        const sorted = [...res.data.members].sort((a, b) => b[metric] - a[metric]);
        setMembers(sorted);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'خطا در بارگذاری داده‌ها');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(days);
  }, [days, metric]);

  const metricLabels: Record<string, { label: string; unit: string; color: string }> = {
    overall_score: { label: 'شاخص کل', unit: 'امتیاز', color: '#F59E0B' },
    exercise_hours: { label: 'ورزش', unit: 'ساعت', color: '#10B981' },
    reading_pages: { label: 'مطالعه', unit: 'صفحه', color: '#3B82F6' },
    attendance_rate: { label: 'درصد حضور', unit: '%', color: '#8B5CF6' },
    growth_submissions: { label: 'پر کردن سامانه', unit: 'تعداد', color: '#EC4899' },
  };

  const timeRangeButtons = [
    { label: '۱ هفته', value: 7 },
    { label: '۲ هفته', value: 14 },
    { label: '۱ ماه', value: 30 },
  ];

  const metricButtons = [
    { label: 'شاخص کل', value: 'overall_score' as const },
    { label: 'ورزش', value: 'exercise_hours' as const },
    { label: 'مطالعه', value: 'reading_pages' as const },
    { label: 'حضور', value: 'attendance_rate' as const },
    { label: 'سامانه', value: 'growth_submissions' as const },
  ];

  const currentMetricInfo = metricLabels[metric];
  const getRankMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  return (
    <div style={{
      backgroundColor: 'rgba(23, 14, 46, 0.72)',
      border: '1.5px solid rgba(234, 179, 8, 0.32)',
      borderRadius: '1.35rem',
      padding: '1.5rem',
      boxShadow: '0 0 22px rgba(126, 34, 206, 0.16)',
      backdropFilter: 'blur(14px)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <TrendingUp style={{ width: '24px', height: '24px', color: '#F59E0B' }} />
        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#facc15' }}>نظارت جمعی اعضا</h2>
      </div>

      {/* Time Range Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Calendar style={{ width: '16px', height: '16px' }} /> بازه زمانی:
        </span>
        {timeRangeButtons.map((btn) => (
          <button
            key={btn.value}
            onClick={() => setDays(btn.value)}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '0.6rem',
              border: days === btn.value ? '2px solid #F59E0B' : '1px solid rgba(168, 85, 247, 0.3)',
              background: days === btn.value ? 'rgba(245, 158, 11, 0.1)' : 'rgba(15, 10, 30, 0.6)',
              color: days === btn.value ? '#F59E0B' : '#cbd5e1',
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
      {!loading && members.length > 0 && (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={members} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(168, 85, 247, 0.1)" />
              <XAxis
                dataKey="full_name"
                angle={-45}
                textAnchor="end"
                height={80}
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
                {members.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? '#F59E0B' : currentMetricInfo.color}
                    opacity={index === 0 ? 1 : 0.7}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Leaderboard Table */}
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0' }}>
              جدول رتبه‌بندی: {currentMetricInfo.label}
            </h3>
            <div style={{
              overflowX: 'auto',
              backgroundColor: 'rgba(15, 10, 30, 0.6)',
              borderRadius: '0.75rem',
              padding: '0.75rem',
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.85rem',
              }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(168, 85, 247, 0.2)' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'right', color: '#cbd5e1', fontWeight: 600 }}>رتبه</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right', color: '#cbd5e1', fontWeight: 600 }}>نام</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right', color: '#cbd5e1', fontWeight: 600 }}>کد گروهی</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center', color: '#cbd5e1', fontWeight: 600 }}>
                      {currentMetricInfo.label} ({currentMetricInfo.unit})
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member, index) => (
                    <tr
                      key={member.id}
                      style={{
                        borderBottom: '1px solid rgba(168, 85, 247, 0.1)',
                        backgroundColor: index === 0 ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontSize: '1.2rem' }}>
                        {getRankMedal(index)}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#e2e8f0' }}>
                        {member.full_name}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#94a3b8' }}>
                        {member.group_code}
                      </td>
                      <td style={{
                        padding: '0.75rem 0.5rem',
                        textAlign: 'center',
                        color: currentMetricInfo.color,
                        fontWeight: 700,
                      }}>
                        {metric === 'reading_pages' || metric === 'growth_submissions'
                          ? member[metric]
                          : member[metric].toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!loading && members.length === 0 && !error && (
        <div style={{ textAlign: 'center', color: '#cbd5e1', padding: '2rem' }}>
          داده‌ای برای نمایش وجود ندارد
        </div>
      )}
    </div>
  );
};
