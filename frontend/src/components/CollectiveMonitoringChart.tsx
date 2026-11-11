import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import API from '../api';

interface Member {
  id: number;
  full_name: string;
  group_code: string;
  ring_id?: number;
  ring_name?: string;
  ring_number?: number;
  workgroup_id?: number;
  workgroup_name?: string;
  exercise_hours: number;
  reading_pages: number;
  attendance_rate: number;
  growth_submissions: number;
  overall_score: number;
}

interface RingAgg {
  ring_id: number;
  ring_name: string;
  ring_number: number;
  member_count: number;
  avg_score: number;
  avg_exercise: number;
  avg_reading: number;
  avg_attendance: number;
  avg_submissions: number;
}

interface WorkgroupAgg {
  workgroup_id: number;
  workgroup_name: string;
  member_count: number;
  avg_score: number;
  avg_exercise: number;
  avg_reading: number;
  avg_attendance: number;
  avg_submissions: number;
}

type Metric = 'overall_score' | 'exercise_hours' | 'reading_pages' | 'attendance_rate' | 'growth_submissions' | 'rings_avg' | 'workgroups_avg';
type MemberFilter = 'top10' | 'bottom10' | 'all';

// ✅ Custom Tooltip with Persian labels
const CustomTooltip: React.FC<any> = ({ active, payload, metric }: { active?: boolean; payload?: any[]; metric: Metric }) => {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  
  const metricLabels: Record<Metric, { label: string; unit: string }> = {
    overall_score: { label: 'امتیاز شاخص کل', unit: 'امتیاز' },
    exercise_hours: { label: 'ساعت‌های ورزشی', unit: 'ساعت' },
    reading_pages: { label: 'تعداد صفحه‌های مطالعه شده', unit: 'صفحه' },
    attendance_rate: { label: 'درصد حضور', unit: '٪' },
    growth_submissions: { label: 'تعداد ثبت در سامانه', unit: 'مرتبه' },
    rings_avg: { label: 'میانگین نمره شاخص کل', unit: 'امتیاز' },
    workgroups_avg: { label: 'میانگین نمره شاخص کل', unit: 'امتیاز' },
  };

  const info = metricLabels[metric];
  
  if (metric === 'rings_avg' || metric === 'workgroups_avg') {
    const value = (data.avg_score as number).toFixed(1);
    const count = data.member_count;
    return (
      <div style={{
        backgroundColor: 'rgba(15, 10, 30, 0.95)',
        border: '1px solid rgba(168, 85, 247, 0.5)',
        borderRadius: '0.5rem',
        padding: '0.75rem',
        direction: 'rtl',
      }}>
        <p style={{ margin: '0.25rem 0', color: '#e2e8f0', fontSize: '0.85rem' }}>
          <strong>{data.ring_name || data.workgroup_name}</strong>
        </p>
        <p style={{ margin: '0.25rem 0', color: '#F59E0B', fontSize: '0.8rem' }}>
          {info.label}: <strong>{value} {info.unit}</strong>
        </p>
        <p style={{ margin: '0.25rem 0', color: '#94a3b8', fontSize: '0.8rem' }}>
          تعداد اعضا: <strong>{count} نفر</strong>
        </p>
      </div>
    );
  }

  const value = metric === 'reading_pages' || metric === 'growth_submissions' 
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
        <strong>{data.full_name}</strong>
      </p>
      <p style={{ margin: '0.25rem 0', color: '#F59E0B', fontSize: '0.8rem' }}>
        {info.label}: <strong>{value} {info.unit}</strong>
      </p>
    </div>
  );
};

export const CollectiveMonitoringChart: React.FC = () => {
  const [days, setDays] = useState(7);
  const [metric, setMetric] = useState<Metric>('overall_score');
  const [memberFilter, setMemberFilter] = useState<MemberFilter>('all');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const metricLabels: Record<Metric, { label: string; unit: string; color: string }> = {
    overall_score: { label: 'امتیاز شاخص کل', unit: 'امتیاز', color: '#F59E0B' },
    exercise_hours: { label: 'ساعت‌های ورزشی', unit: 'ساعت', color: '#10B981' },
    reading_pages: { label: 'صفحه‌های مطالعه شده', unit: 'صفحه', color: '#3B82F6' },
    attendance_rate: { label: 'درصد حضور', unit: '٪', color: '#8B5CF6' },
    growth_submissions: { label: 'تعداد ثبت در سامانه', unit: 'مرتبه', color: '#EC4899' },
    rings_avg: { label: 'رتبه‌بندی حلقه‌ها', unit: 'امتیاز', color: '#F59E0B' },
    workgroups_avg: { label: 'رتبه‌بندی کارگروه‌ها', unit: 'امتیاز', color: '#F59E0B' },
  };

  // ✅ Aggregate by rings
  const ringsAggregated = useMemo((): RingAgg[] => {
    const grouped: Record<number, Member[]> = {};
    members.forEach((m) => {
      if (!m.ring_id) return;
      if (!grouped[m.ring_id]) grouped[m.ring_id] = [];
      grouped[m.ring_id].push(m);
    });

    return Object.entries(grouped)
      .map(([ring_id, ringMembers]) => {
        const count = ringMembers.length;
        return {
          ring_id: Number(ring_id),
          ring_name: ringMembers[0].ring_name || 'حلقه نامشخص',
          ring_number: ringMembers[0].ring_number || 0,
          member_count: count,
          avg_score: ringMembers.reduce((sum, m) => sum + m.overall_score, 0) / count,
          avg_exercise: ringMembers.reduce((sum, m) => sum + m.exercise_hours, 0) / count,
          avg_reading: ringMembers.reduce((sum, m) => sum + m.reading_pages, 0) / count,
          avg_attendance: ringMembers.reduce((sum, m) => sum + m.attendance_rate, 0) / count,
          avg_submissions: ringMembers.reduce((sum, m) => sum + m.growth_submissions, 0) / count,
        };
      })
      .sort((a, b) => b.avg_score - a.avg_score);
  }, [members]);

  // ✅ Aggregate by workgroups
  const workgroupsAggregated = useMemo((): WorkgroupAgg[] => {
    const grouped: Record<number, Member[]> = {};
    members.forEach((m) => {
      if (!m.workgroup_id) return;
      if (!grouped[m.workgroup_id]) grouped[m.workgroup_id] = [];
      grouped[m.workgroup_id].push(m);
    });

    return Object.entries(grouped)
      .map(([wg_id, wgMembers]) => {
        const count = wgMembers.length;
        return {
          workgroup_id: Number(wg_id),
          workgroup_name: wgMembers[0].workgroup_name || 'کارگروه نامشخص',
          member_count: count,
          avg_score: wgMembers.reduce((sum, m) => sum + m.overall_score, 0) / count,
          avg_exercise: wgMembers.reduce((sum, m) => sum + m.exercise_hours, 0) / count,
          avg_reading: wgMembers.reduce((sum, m) => sum + m.reading_pages, 0) / count,
          avg_attendance: wgMembers.reduce((sum, m) => sum + m.attendance_rate, 0) / count,
          avg_submissions: wgMembers.reduce((sum, m) => sum + m.growth_submissions, 0) / count,
        };
      })
      .sort((a, b) => b.avg_score - a.avg_score);
  }, [members]);

  // ✅ Filter members based on selection
  const filteredMembers = useMemo(() => {
    if (metric === 'rings_avg') return ringsAggregated as any[];
    if (metric === 'workgroups_avg') return workgroupsAggregated as any[];

    const sorted = [...members].sort((a, b) => b[metric] - a[metric]);
    
    if (memberFilter === 'top10') return sorted.slice(0, 10);
    if (memberFilter === 'bottom10') return sorted.slice(-10).reverse();
    return sorted;
  }, [members, metric, memberFilter, ringsAggregated, workgroupsAggregated]);

  // ✅ Dynamic chart width for scrollable container
  const chartContainerWidth = Math.max(filteredMembers.length * 50, 800);

  const fetchData = async (selectedDays: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get(`/mentor/collective-monitoring/?days=${selectedDays}`);
      if (res.data?.members) {
        const sorted = [...res.data.members].sort((a: Member, b: Member) => b.overall_score - a.overall_score);
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
  }, [days]);

  const currentMetricInfo = metricLabels[metric];

  const getRankMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

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

  // ✅ Determine chart dataKey based on metric
  const getChartDataKey = (): string => {
    if (metric === 'rings_avg' || metric === 'workgroups_avg') return 'avg_score';
    return metric;
  };

  // ✅ Determine chart nameKey based on metric
  const getChartNameKey = (): string => {
    if (metric === 'rings_avg') return 'ring_name';
    if (metric === 'workgroups_avg') return 'workgroup_name';
    return 'full_name';
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

      {/* Filter Controls - Dropdowns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
            onChange={(e) => setMetric(e.target.value as Metric)}
            style={{
              ...filterSelectStyle,
              width: '100%',
              borderColor: currentMetricInfo.color,
              backgroundColor: `${currentMetricInfo.color}10`,
            }}
          >
            <option value="overall_score">امتیاز شاخص کل (برترین‌ها)</option>
            <option value="exercise_hours">ساعت‌های ورزشی</option>
            <option value="reading_pages">صفحه‌های مطالعه شده</option>
            <option value="attendance_rate">درصد حضور</option>
            <option value="growth_submissions">تعداد ثبت در سامانه</option>
            <option value="rings_avg">رتبه‌بندی حلقه‌ها</option>
            <option value="workgroups_avg">رتبه‌بندی کارگروه‌ها</option>
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
              borderColor: '#F59E0B',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
            }}
          >
            <option value={7}>۱ هفته گذشته</option>
            <option value={14}>۲ هفته گذشته</option>
            <option value={30}>۱ ماه گذشته</option>
          </select>
        </div>

        {/* Member Filter Dropdown - Hidden for group aggregations */}
        {metric !== 'rings_avg' && metric !== 'workgroups_avg' && (
          <div>
            <label style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
              نمایش اعضا
            </label>
            <select
              value={memberFilter}
              onChange={(e) => setMemberFilter(e.target.value as MemberFilter)}
              style={{
                ...filterSelectStyle,
                width: '100%',
                borderColor: '#8B5CF6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
              }}
            >
              <option value="top10">۱۰ نفر اول (برترین‌ها)</option>
              <option value="bottom10">۱۰ نفر آخر (نیازمند پیگیری)</option>
              <option value="all">همه اعضا (نمایش کامل)</option>
            </select>
          </div>
        )}
      </div>

      {/* Loading / Error */}
      {loading && <div style={{ textAlign: 'center', color: '#fde68a', padding: '1rem' }}>درحال بارگذاری...</div>}
      {error && <div style={{ textAlign: 'center', color: '#fca5a5', padding: '1rem' }}>{error}</div>}

      {/* Chart - Scrollable Container for many members */}
      {!loading && filteredMembers.length > 0 && (
        <>
          <div style={{
            overflowX: 'auto',
            marginBottom: '2rem',
            borderRadius: '0.75rem',
            backgroundColor: 'rgba(15, 10, 30, 0.4)',
            padding: '1rem',
          }}>
            <ResponsiveContainer width={chartContainerWidth} height={320}>
              <BarChart data={filteredMembers} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(168, 85, 247, 0.1)" />
                <XAxis
                  dataKey={getChartNameKey()}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: '#cbd5e1', fontSize: 11 }}
                />
                <YAxis tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip metric={metric} />} cursor={{ fill: 'rgba(168, 85, 247, 0.1)' }} />
                <Bar
                  dataKey={getChartDataKey()}
                  fill={currentMetricInfo.color}
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={true}
                >
                  {filteredMembers.map((_, index) => (
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

          {/* Leaderboard Table */}
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
                    {(metric === 'rings_avg' || metric === 'workgroups_avg') ? (
                      <>
                        <th style={{ padding: '0.5rem', textAlign: 'right', color: '#cbd5e1', fontWeight: 600 }}>
                          {metric === 'rings_avg' ? 'نام حلقه' : 'نام کارگروه'}
                        </th>
                        <th style={{ padding: '0.5rem', textAlign: 'center', color: '#cbd5e1', fontWeight: 600 }}>تعداد اعضا</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center', color: '#cbd5e1', fontWeight: 600 }}>میانگین نمره کل</th>
                      </>
                    ) : (
                      <>
                        <th style={{ padding: '0.5rem', textAlign: 'right', color: '#cbd5e1', fontWeight: 600 }}>نام</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center', color: '#cbd5e1', fontWeight: 600 }}>کد گروهی</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center', color: '#cbd5e1', fontWeight: 600 }}>
                          {currentMetricInfo.label} ({currentMetricInfo.unit})
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((item: any, index) => (
                    <tr
                      key={metric === 'rings_avg' ? item.ring_id : metric === 'workgroups_avg' ? item.workgroup_id : item.id}
                      style={{
                        borderBottom: '1px solid rgba(168, 85, 247, 0.1)',
                        backgroundColor: index === 0 ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', fontSize: '1.1rem' }}>
                        {getRankMedal(index)}
                      </td>
                      {(metric === 'rings_avg' || metric === 'workgroups_avg') ? (
                        <>
                          <td style={{ padding: '0.75rem 0.5rem', color: '#e2e8f0', fontWeight: 500 }}>
                            {metric === 'rings_avg' ? `حلقه ${item.ring_number} - ${item.ring_name}` : item.workgroup_name}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: '#cbd5e1' }}>
                            {item.member_count}
                          </td>
                          <td style={{
                            padding: '0.75rem 0.5rem',
                            textAlign: 'center',
                            color: currentMetricInfo.color,
                            fontWeight: 700,
                          }}>
                            {item.avg_score.toFixed(1)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '0.75rem 0.5rem', color: '#e2e8f0', fontWeight: 500 }}>
                            {item.full_name}
                          </td>
                          <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', color: '#94a3b8', fontFamily: 'monospace' }}>
                            {item.group_code}
                          </td>
                          <td style={{
                            padding: '0.75rem 0.5rem',
                            textAlign: 'center',
                            color: currentMetricInfo.color,
                            fontWeight: 700,
                          }}>
                            {metric === 'reading_pages' || metric === 'growth_submissions'
                              ? item[metric]
                              : (item[metric] as number).toFixed(1)}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stats Summary */}
          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(15, 10, 30, 0.5)', borderRadius: '0.75rem' }}>
            <p style={{ margin: '0.5rem 0', fontSize: '0.85rem', color: '#cbd5e1' }}>
              📊 <strong>جمع کل:</strong> {filteredMembers.length} {metric === 'rings_avg' ? 'حلقه' : metric === 'workgroups_avg' ? 'کارگروه' : 'عضو'} | 
              <strong style={{ marginRight: '1rem' }}>میانگین:</strong> {(filteredMembers.reduce((sum, item) => {
                if (metric === 'rings_avg' || metric === 'workgroups_avg') return sum + item.avg_score;
                return sum + item[metric];
              }, 0) / filteredMembers.length).toFixed(1)} {currentMetricInfo.unit}
            </p>
          </div>
        </>
      )}

      {!loading && filteredMembers.length === 0 && !error && (
        <div style={{ textAlign: 'center', color: '#cbd5e1', padding: '2rem' }}>
          داده‌ای برای نمایش وجود ندارد
        </div>
      )}
    </div>
  );
};
