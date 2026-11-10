import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import API from '../api';

interface WorkgroupStat {
  id: number;
  name: string;
  meeting_count: number;
  member_count: number;
  avg_attendance: number;
  avg_submissions: number;
  overall_score: number;
}

type WorkgroupMetric = 'overall_score' | 'meeting_count' | 'avg_attendance' | 'avg_submissions';

// ✅ Custom Tooltip with Persian labels
const CustomTooltip: React.FC<any> = ({ active, payload, metric }: { active?: boolean; payload?: any[]; metric: WorkgroupMetric }) => {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  const metricLabels: Record<WorkgroupMetric, { label: string; unit: string }> = {
    overall_score: { label: 'امتیاز شاخص کل', unit: 'امتیاز' },
    meeting_count: { label: 'تعداد جلسات', unit: 'جلسه' },
    avg_attendance: { label: 'میانگین درصد حضور', unit: '٪' },
    avg_submissions: { label: 'میانگین تعداد پر کردن', unit: 'مرتبه' },
  };

  const info = metricLabels[metric];
  const value = metric === 'meeting_count' 
    ? data[metric] 
    : (data[metric] as number).toFixed(1);

  return (
    <div style={{
      backgroundColor: 'rgba(15, 10, 30, 0.95)',
      border: '1px solid rgba(168, 85, 247, 0.5)',
      borderRadius: '0.5rem',
      padding: '0.75rem',
      direction: 'rtl',
    }}>
      <p style={{ margin: '0.25rem 0', color: '#e2e8f0', fontSize: '0.85rem' }}>
        <strong>{data.name}</strong>
      </p>
      <p style={{ margin: '0.25rem 0', color: '#10B981', fontSize: '0.8rem' }}>
        {info.label}: <strong>{value} {info.unit}</strong>
      </p>
    </div>
  );
};

export const WorkgroupsAnalyticsChart: React.FC = () => {
  const [days, setDays] = useState(7);
  const [metric, setMetric] = useState<WorkgroupMetric>('overall_score');
  const [workgroups, setWorkgroups] = useState<WorkgroupStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const metricLabels: Record<WorkgroupMetric, { label: string; unit: string; color: string }> = {
    overall_score: { label: 'امتیاز شاخص کل', unit: 'امتیاز', color: '#F59E0B' },
    meeting_count: { label: 'تعداد جلسات', unit: 'جلسه', color: '#10B981' },
    avg_attendance: { label: 'میانگین حضور', unit: '٪', color: '#3B82F6' },
    avg_submissions: { label: 'میانگین پر کردن', unit: 'مرتبه', color: '#8B5CF6' },
  };

  const fetchData = async (selectedDays: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get(`/mentor/workgroups-stats/?days=${selectedDays}`);
      if (res.data?.workgroups) {
        const sorted = [...res.data.workgroups].sort((a, b) => b[metric] - a[metric]);
        setWorkgroups(sorted);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'خطا در بارگذاری داده‌ها');
      setWorkgroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(days);
  }, [days, metric]);

  const currentMetricInfo = metricLabels[metric];

  const filterSelectStyle: React.CSSProperties = {
    padding: '0.5rem 0.75rem',
    borderRadius: '0.6rem',
    border: '1px solid rgba(168, 85, 247, 0.4)',
    backgroundColor: 'rgba(15, 10, 30, 0.8)',
    color: '#cbd5e1',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '0.85rem',
  };

  return (
    <div style={{
      backgroundColor: 'rgba(23, 14, 46, 0.72)',
      border: '1.5px solid rgba(234, 179, 8, 0.32)',
      borderRadius: '1.35rem',
      padding: '1.5rem',
      boxShadow: '0 0 22px rgba(126, 34, 206, 0.16)',
      backdropFilter: 'blur(14px)',
      marginTop: '1.5rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <TrendingUp style={{ width: '24px', height: '24px', color: '#10B981' }} />
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#10B981' }}>آمار کارگروه‌ها</h3>
      </div>

      {/* Filter Controls - Dropdowns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        {/* Metric Dropdown */}
        <div>
          <label style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
            شاخص ارزیابی
          </label>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as WorkgroupMetric)}
            style={{
              ...filterSelectStyle,
              width: '100%',
              borderColor: currentMetricInfo.color,
              backgroundColor: `${currentMetricInfo.color}10`,
            }}
          >
            <option value="overall_score">امتیاز شاخص کل</option>
            <option value="meeting_count">تعداد جلسات</option>
            <option value="avg_attendance">میانگین حضور</option>
            <option value="avg_submissions">میانگین پر کردن</option>
          </select>
        </div>

        {/* Time Range Dropdown */}
        <div>
          <label style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
            <Calendar style={{ width: '14px', height: '14px', display: 'inline', marginLeft: '0.3rem' }} />
            بازه زمانی
          </label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            style={{
              ...filterSelectStyle,
              width: '100%',
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
            }}
          >
            <option value={7}>۱ هفته گذشته</option>
            <option value={14}>۲ هفته گذشته</option>
            <option value={30}>۱ ماه گذشته</option>
          </select>
        </div>
      </div>

      {/* Loading / Error */}
      {loading && <div style={{ textAlign: 'center', color: '#fde68a', padding: '1rem' }}>درحال بارگذاری...</div>}
      {error && <div style={{ textAlign: 'center', color: '#fca5a5', padding: '1rem' }}>{error}</div>}

      {/* Chart */}
      {!loading && workgroups.length > 0 && (
        <>
          <div style={{
            overflowX: 'auto',
            marginBottom: '2rem',
            borderRadius: '0.75rem',
            backgroundColor: 'rgba(15, 10, 30, 0.4)',
            padding: '1rem',
          }}>
            <ResponsiveContainer width={Math.max(workgroups.length * 50, 600)} height={280}>
              <BarChart data={workgroups} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(168, 85, 247, 0.1)" />
                <XAxis
                  dataKey="name"
                  angle={-30}
                  textAnchor="end"
                  height={70}
                  tick={{ fill: '#cbd5e1', fontSize: 11 }}
                />
                <YAxis tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip metric={metric} />} cursor={{ fill: 'rgba(168, 85, 247, 0.1)' }} />
                <Bar
                  dataKey={metric}
                  fill={currentMetricInfo.color}
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={true}
                >
                  {workgroups.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? '#F59E0B' : currentMetricInfo.color}
                      opacity={index === 0 ? 1 : 0.7}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Stats Table */}
          <div>
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
                minWidth: '500px',
              }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(168, 85, 247, 0.2)' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'center', color: '#cbd5e1', fontWeight: 600, width: '60px' }}>رتبه</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right', color: '#cbd5e1', fontWeight: 600 }}>نام کارگروه</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center', color: '#cbd5e1', fontWeight: 600 }}>اعضا</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center', color: '#cbd5e1', fontWeight: 600 }}>جلسات</th>
                    <th style={{ padding: '0.5rem', textAlign: 'center', color: '#cbd5e1', fontWeight: 600 }}>میانگین حضور</th>
                  </tr>
                </thead>
                <tbody>
                  {workgroups.map((wg, index) => (
                    <tr
                      key={wg.id}
                      style={{
                        borderBottom: '1px solid rgba(168, 85, 247, 0.1)',
                        backgroundColor: index === 0 ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontSize: '1.1rem' }}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#e2e8f0', fontWeight: 500 }}>
                        {wg.name}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: '#cbd5e1' }}>
                        {wg.member_count}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: '#cbd5e1', fontWeight: 500 }}>
                        {wg.meeting_count}
                      </td>
                      <td style={{
                        padding: '0.75rem 0.5rem',
                        textAlign: 'center',
                        color: currentMetricInfo.color,
                        fontWeight: 700,
                      }}>
                        {wg.avg_attendance.toFixed(1)}٪
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stats Summary */}
          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(15, 10, 30, 0.5)', borderRadius: '0.75rem' }}>
            <p style={{ margin: '0.5rem 0', fontSize: '0.85rem', color: '#cbd5e1' }}>
              📊 <strong>جمع کل:</strong> {workgroups.length} کارگروه | 
              <strong style={{ marginRight: '1rem' }}>میانگین:</strong> {(workgroups.reduce((sum, w) => sum + w[metric], 0) / workgroups.length).toFixed(1)} {currentMetricInfo.unit}
            </p>
          </div>
        </>
      )}

      {!loading && workgroups.length === 0 && !error && (
        <div style={{ textAlign: 'center', color: '#cbd5e1', padding: '2rem' }}>
          داده‌ای برای نمایش وجود ندارد
        </div>
      )}
    </div>
  );
};
