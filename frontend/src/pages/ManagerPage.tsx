import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Shield, Save, X, Search, Send, Bell } from 'lucide-react';
import API from '../api';

const InlineMessage: React.FC<{
  placeholder: string;
  onSend: (text: string) => Promise<void>;
}> = ({ placeholder, onSend }) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setNote('');
    try {
      await onSend(text.trim());
      setText('');
      setNote('ارسال شد. مخاطب پیام را در داشبورد می‌بیند.');
    } catch {
      setNote('ارسال پیام انجام نشد.');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginTop: '0.85rem' }}>
      <textarea
        rows={3}
        required
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={fieldStyle}
      />
      <button type="submit" disabled={sending} style={sendBtnStyle}>
        <Send style={{ width: '16px', height: '16px' }} />
        {sending ? 'در حال ارسال...' : 'ارسال پیام'}
      </button>
      {note && <span style={{ fontSize: '0.8rem', color: note.includes('نشد') ? '#fca5a5' : '#86efac' }}>{note}</span>}
    </form>
  );
};

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.7rem 0.85rem',
  backgroundColor: 'rgba(15, 10, 30, 0.8)',
  border: '1px solid rgba(202, 138, 4, 0.7)',
  borderRadius: '0.85rem',
  color: '#fff',
  resize: 'vertical',
  outline: 'none',
  boxSizing: 'border-box',
};

const sendBtnStyle: React.CSSProperties = {
  padding: '0.7rem 0.9rem',
  borderRadius: '0.85rem',
  border: 'none',
  background: 'linear-gradient(135deg, #facc15, #eab308)',
  color: '#1c1404',
  fontWeight: 800,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.4rem',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: 'rgba(23, 14, 46, 0.72)',
  border: '1.5px solid rgba(234, 179, 8, 0.32)',
  borderRadius: '1.35rem',
  padding: '1.15rem 1.2rem',
  boxShadow: '0 0 22px rgba(126, 34, 206, 0.16)',
  backdropFilter: 'blur(14px)',
};

export const ManagerPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'workgroups' | 'growth' | 'rings' | 'message'>('workgroups');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<{ [key: string]: number }>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedWorkgroup, setSelectedWorkgroup] = useState<any | null>(null);
  const [selectedRing, setSelectedRing] = useState<any | null>(null);
  const [growthSearch, setGrowthSearch] = useState('');
  const [openMessageKey, setOpenMessageKey] = useState<string | null>(null);

  const [msgTargetType, setMsgTargetType] = useState<'all' | 'workgroup' | 'ring' | 'user'>('all');
  const [msgTargetId, setMsgTargetId] = useState<string>('');
  const [targets, setTargets] = useState<{ workgroups: any[]; rings: any[]; users: any[] }>({
    workgroups: [],
    rings: [],
    users: [],
  });

  useEffect(() => {
    if (activeTab === 'message') {
      loadTargets();
      return;
    }
    fetchTabData(activeTab);
  }, [activeTab]);

  const fetchTabData = async (tab: string) => {
    setLoading(true);
    setOpenMessageKey(null);
    try {
      const res = await API.get(`manager/?section=${tab}`);
      setData(res.data);
      if (tab === 'workgroups' && res.data?.workgroups) {
        const initScores: any = {};
        res.data.workgroups.forEach((w: any) => { initScores[`workgroup_${w.id}`] = w.score; });
        setScores((prev) => ({ ...prev, ...initScores }));
      } else if (tab === 'rings' && res.data?.rings) {
        const initScores: any = {};
        res.data.rings.forEach((r: any) => { initScores[`ring_${r.id}`] = r.score; });
        setScores((prev) => ({ ...prev, ...initScores }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTargets = async () => {
    setLoading(true);
    try {
      const [workgroups, rings, growth] = await Promise.all([
        API.get('manager/?section=workgroups'),
        API.get('manager/?section=rings'),
        API.get('manager/?section=growth'),
      ]);
      setTargets({
        workgroups: workgroups.data?.workgroups || [],
        rings: rings.data?.rings || [],
        users: (growth.data?.growth_users || []).filter((u: any) => !u.is_manager),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (key: string, val: number) => {
    setScores((prev) => ({ ...prev, [key]: val }));
  };

  const saveScore = async (target: 'workgroup' | 'ring', id: number) => {
    const key = `${target}_${id}`;
    const scoreVal = scores[key];
    if (!scoreVal || scoreVal < 1 || scoreVal > 10) {
      alert('امتیاز باید بین ۱ تا ۱۰ باشد.');
      return;
    }
    setSavingId(key);
    try {
      await API.post('manager/', { target, id, score: scoreVal });
      alert('امتیاز با موفقیت ذخیره شد');
      fetchTabData(activeTab);
    } catch {
      alert('خطا در ثبت امتیاز.');
    } finally {
      setSavingId(null);
    }
  };

  const sendTargetMessage = async (
    targetType: 'all' | 'workgroup' | 'ring' | 'user',
    targetId: number | null,
    text: string
  ) => {
    await API.post('manager/send-message/', {
      target_type: targetType,
      target_id: targetId,
      text,
    });
  };

  const filteredGrowthUsers = (data?.growth_users || []).filter((u: any) => {
    if (u.is_manager) return false;
    const query = growthSearch.trim();
    if (!query) return true;
    return String(u.full_name || '').includes(query) || String(u.group_code || '').includes(query);
  });

  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: 'workgroups', label: 'کارگروه‌ها' },
    { id: 'growth', label: 'رشد فردی' },
    { id: 'rings', label: 'حلقه‌ها' },
    { id: 'message', label: 'پیام همگانی' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#05010f',
      backgroundImage: `
        radial-gradient(circle at 12% 18%, rgba(234, 179, 8, 0.12) 0%, transparent 36%),
        radial-gradient(circle at 88% 12%, rgba(168, 85, 247, 0.18) 0%, transparent 40%),
        radial-gradient(circle at 50% 90%, rgba(124, 58, 237, 0.16) 0%, transparent 48%)
      `,
      color: '#fff',
      padding: '1.5rem 1rem',
      boxSizing: 'border-box',
      direction: 'rtl',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: '950px', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div style={{ padding: '0.65rem', borderRadius: '1rem', backgroundColor: 'rgba(234, 179, 8, 0.16)', border: '1px solid rgba(250, 204, 21, 0.7)', boxShadow: '0 0 18px rgba(234, 179, 8, 0.25)' }}>
              <Shield style={{ width: '28px', height: '28px', color: '#facc15' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#facc15', margin: 0 }}>پنل نظارتی مربی</h1>
              <p style={{ fontSize: '0.78rem', color: '#cbd5e1', margin: '0.15rem 0 0' }}>امتیاز، جستجو و پیام به اعضا</p>
            </div>
          </div>
          <button
            onClick={() => { localStorage.clear(); navigate('/login'); }}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: '1rem',
              border: '1.5px solid rgba(239, 68, 68, 0.45)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#fecaca',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 700,
            }}
          >
            <LogOut style={{ width: '18px', height: '18px' }} /> خروج
          </button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.8rem 0.4rem',
                borderRadius: '1rem',
                border: activeTab === tab.id ? '1px solid #facc15' : '1px solid rgba(168, 85, 247, 0.28)',
                background: activeTab === tab.id
                  ? 'linear-gradient(135deg, #ca8a04, #a16207)'
                  : 'rgba(30, 20, 55, 0.72)',
                color: '#fff',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: activeTab === tab.id ? '0 0 16px rgba(234, 179, 8, 0.35)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && <div style={{ textAlign: 'center', color: '#fde68a', padding: '1.5rem' }}>در حال بارگذاری...</div>}

        {!loading && activeTab === 'workgroups' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {(data?.workgroups || []).map((wg: any) => {
              const key = `workgroup-${wg.id}`;
              return (
                <div key={wg.id} style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div>
                      <button type="button" onClick={() => setSelectedWorkgroup(wg)} style={linkTitle}>
                        {wg.name}
                      </button>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>{wg.members?.length || 0} عضو</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>امتیاز</span>
                      <input
                        type="number" min="1" max="10"
                        value={scores[`workgroup_${wg.id}`] ?? wg.score}
                        onChange={(e) => handleScoreChange(`workgroup_${wg.id}`, parseInt(e.target.value, 10))}
                        style={{ width: '58px', padding: '0.35rem', borderRadius: '0.55rem', backgroundColor: 'rgba(15, 10, 30, 0.8)', border: '1px solid #ca8a04', color: '#fff', textAlign: 'center' }}
                      />
                      <button
                        onClick={() => saveScore('workgroup', wg.id)}
                        disabled={savingId === `workgroup_${wg.id}`}
                        style={{ padding: '0.42rem 0.65rem', borderRadius: '0.55rem', border: 'none', backgroundColor: '#eab308', color: '#1c1404', fontWeight: 800, cursor: 'pointer' }}
                      >
                        <Save style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>
                  </div>
                  <button onClick={() => setOpenMessageKey(openMessageKey === key ? null : key)} style={ghostBtn}>
                    <Bell style={{ width: '16px', height: '16px' }} />
                    پیام به اعضای این کارگروه
                  </button>
                  {openMessageKey === key && (
                    <InlineMessage
                      placeholder={`پیام برای اعضای ${wg.name}`}
                      onSend={(text) => sendTargetMessage('workgroup', wg.id, text)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && activeTab === 'growth' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(15, 10, 30, 0.8)', border: '1px solid rgba(234, 179, 8, 0.45)', borderRadius: '1rem', padding: '0.7rem 1rem' }}>
              <Search style={{ width: '18px', height: '18px', color: '#facc15' }} />
              <input
                type="text"
                placeholder="جستجوی نام یا کد گروهی..."
                value={growthSearch}
                onChange={(e) => setGrowthSearch(e.target.value)}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '0.95rem' }}
              />
            </div>
            {filteredGrowthUsers.length === 0 && (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '1.2rem' }}>کسی با این نام در رشد فردی پیدا نشد.</div>
            )}
            {filteredGrowthUsers.map((u: any) => {
              const key = `user-${u.id}`;
              return (
                <div key={u.id} style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div>
                      <button onClick={() => setSelectedUser(u)} style={{ background: 'none', border: 'none', padding: 0, fontSize: '1.05rem', fontWeight: 800, color: '#facc15', cursor: 'pointer' }}>
                        {u.full_name}
                      </button>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                        کد: #{u.group_code} | آخرین ثبت: <span style={{ color: '#fde68a' }}>{u.last_custom_item}</span>
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#34d399' }}>{u.attendance_rate}</span>
                      <button onClick={() => setOpenMessageKey(openMessageKey === key ? null : key)} style={ghostBtn}>
                        <Send style={{ width: '15px', height: '15px' }} /> پیام
                      </button>
                    </div>
                  </div>
                  {openMessageKey === key && (
                    <InlineMessage
                      placeholder={`پیام خصوصی برای ${u.full_name}`}
                      onSend={(text) => sendTargetMessage('user', u.id, text)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && activeTab === 'rings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {(data?.rings || []).map((rg: any) => {
              const key = `ring-${rg.id}`;
              return (
                <div key={rg.id} style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div>
                      <button type="button" onClick={() => setSelectedRing(rg)} style={linkTitle}>
                        حلقه {rg.ring_number} - {rg.name}
                      </button>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>{rg.members?.length || 0} عضو</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>امتیاز</span>
                      <input
                        type="number" min="1" max="10"
                        value={scores[`ring_${rg.id}`] ?? rg.score}
                        onChange={(e) => handleScoreChange(`ring_${rg.id}`, parseInt(e.target.value, 10))}
                        style={{ width: '58px', padding: '0.35rem', borderRadius: '0.55rem', backgroundColor: 'rgba(15, 10, 30, 0.8)', border: '1px solid #ca8a04', color: '#fff', textAlign: 'center' }}
                      />
                      <button
                        onClick={() => saveScore('ring', rg.id)}
                        disabled={savingId === `ring_${rg.id}`}
                        style={{ padding: '0.42rem 0.65rem', borderRadius: '0.55rem', border: 'none', backgroundColor: '#eab308', color: '#1c1404', fontWeight: 800, cursor: 'pointer' }}
                      >
                        <Save style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>
                  </div>
                  <button onClick={() => setOpenMessageKey(openMessageKey === key ? null : key)} style={ghostBtn}>
                    <Bell style={{ width: '16px', height: '16px' }} />
                    پیام به اعضای این حلقه
                  </button>
                  {openMessageKey === key && (
                    <InlineMessage
                      placeholder={`پیام برای اعضای حلقه ${rg.name}`}
                      onSend={(text) => sendTargetMessage('ring', rg.id, text)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && activeTab === 'message' && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: '1.12rem', fontWeight: 800, color: '#facc15', margin: '0 0 0.35rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Bell style={{ width: '20px', height: '20px' }} /> پیام همگانی یا انتخابی
            </h2>
            <p style={{ margin: '0 0 1rem', color: '#94a3b8', fontSize: '0.82rem' }}>پیام کارگروه، حلقه و فرد را از همان بخش‌ها هم می‌توانید بفرستید.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <select
                value={msgTargetType}
                onChange={(e) => {
                  setMsgTargetType(e.target.value as 'all' | 'workgroup' | 'ring' | 'user');
                  setMsgTargetId('');
                }}
                style={fieldStyle}
              >
                <option value="all">همه اعضای صفا ۲۷</option>
                <option value="workgroup">یک کارگروه</option>
                <option value="ring">یک حلقه</option>
                <option value="user">یک نفر</option>
              </select>
              {msgTargetType === 'workgroup' && (
                <select value={msgTargetId} onChange={(e) => setMsgTargetId(e.target.value)} style={fieldStyle} required>
                  <option value="">انتخاب کارگروه</option>
                  {targets.workgroups.map((wg) => <option key={wg.id} value={wg.id}>{wg.name}</option>)}
                </select>
              )}
              {msgTargetType === 'ring' && (
                <select value={msgTargetId} onChange={(e) => setMsgTargetId(e.target.value)} style={fieldStyle}>
                  <option value="">انتخاب حلقه</option>
                  {targets.rings.map((rg) => <option key={rg.id} value={rg.id}>حلقه {rg.ring_number} - {rg.name}</option>)}
                </select>
              )}
              {msgTargetType === 'user' && (
                <select value={msgTargetId} onChange={(e) => setMsgTargetId(e.target.value)} style={fieldStyle}>
                  <option value="">انتخاب فرد</option>
                  {targets.users.map((u) => <option key={u.id} value={u.id}>{u.full_name} (#{u.group_code})</option>)}
                </select>
              )}
            </div>
            <InlineMessage
              placeholder="متن پیام را بنویسید"
              onSend={async (text) => {
                if (msgTargetType !== 'all' && !msgTargetId) {
                  throw new Error('target');
                }
                await sendTargetMessage(msgTargetType, msgTargetType === 'all' ? null : Number(msgTargetId), text);
              }}
            />
          </div>
        )}
      </div>

      {selectedWorkgroup && (
        <div style={overlayStyle}>
          <div style={{ ...cardStyle, width: '100%', maxWidth: '640px', maxHeight: '86vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
              <h3 style={{ margin: 0, color: '#facc15' }}>{selectedWorkgroup.name}</h3>
              <button onClick={() => setSelectedWorkgroup(null)} style={closeBtn}><X style={{ width: '20px', height: '20px' }} /></button>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>{selectedWorkgroup.members?.length || 0} عضو</p>

            <h4 style={sectionTitle}>جلسات ثبت‌شده</h4>
            {(selectedWorkgroup.meetings || []).length === 0 && <p style={emptyText}>جلسه‌ای ثبت نشده است.</p>}
            {(selectedWorkgroup.meetings || []).map((meeting: any) => (
              <div key={meeting.id} style={detailBox}>
                <strong style={{ color: '#fde68a' }}>{meeting.meeting_shamsi_date}</strong>
                <p style={detailLine}>حاضرین: {meeting.attendees_text || 'ثبت نشده'}</p>
                <p style={detailLine}>{meeting.descriptions_and_titles}</p>
              </div>
            ))}

            <h4 style={sectionTitle}>نظرها و پیشنهادهای کارگروه</h4>
            {(selectedWorkgroup.feedbacks || []).length === 0 && <p style={emptyText}>نظری ثبت نشده است.</p>}
            {(selectedWorkgroup.feedbacks || []).map((item: any) => (
              <div key={item.id} style={detailBox}>
                <strong style={{ color: '#fde68a' }}>{item.author}</strong>
                <span style={{ color: '#94a3b8', fontSize: '0.75rem', marginRight: '0.5rem' }}>{item.created_at}</span>
                <p style={detailLine}>{item.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedRing && (
        <div style={overlayStyle}>
          <div style={{ ...cardStyle, width: '100%', maxWidth: '560px', maxHeight: '86vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#facc15' }}>حلقه {selectedRing.ring_number} - {selectedRing.name}</h3>
              <button onClick={() => setSelectedRing(null)} style={closeBtn}><X style={{ width: '20px', height: '20px' }} /></button>
            </div>
            <h4 style={sectionTitle}>درصد حضور اعضا</h4>
            {(selectedRing.members || []).length === 0 && <p style={emptyText}>عضوی در این حلقه نیست.</p>}
            {(selectedRing.members || []).map((member: any) => (
              <div key={member.id} style={{ ...detailBox, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                <div>
                  <strong>{member.full_name}</strong>
                  <p style={{ ...detailLine, marginTop: '0.15rem' }}>کد #{member.group_code}</p>
                </div>
                <span style={{ fontWeight: 800, color: member.attendance_rate === 'یافت نشد' ? '#fca5a5' : '#86efac' }}>
                  {member.attendance_rate}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40, padding: '1rem' }}>
          <div style={{ ...cardStyle, width: '100%', maxWidth: '640px', maxHeight: '86vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#facc15' }}>{selectedUser.full_name}</h3>
              <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>گزارش‌های ۷ روز اخیر</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {(selectedUser.records_7_days || []).length === 0 && <span style={{ color: '#94a3b8' }}>گزارشی ثبت نشده است.</span>}
              {(selectedUser.records_7_days || []).map((rec: any, idx: number) => (
                <div key={idx} style={{ background: 'rgba(15,10,30,0.65)', borderRadius: '0.85rem', padding: '0.75rem 0.85rem', fontSize: '0.86rem' }}>
                  <strong style={{ color: '#fde68a' }}>{rec.shamsi_date}</strong>
                  <p style={detailLine}>ورزش: {rec.exercise_hours ?? 0} ساعت</p>
                  <p style={detailLine}>مطالعه: {rec.reading_pages ?? 0} صفحه</p>
                  <p style={detailLine}>مسئولیت: {rec.daily_responsibility?.trim() || 'ثبت نشده'}</p>
                  <p style={detailLine}>مهارت: {rec.skill_learning?.trim() || 'ثبت نشده'}</p>
                  <p style={detailLine}>اوقات فراغت: {rec.leisure_time?.trim() || 'ثبت نشده'}</p>
                </div>
              ))}
            </div>
            <InlineMessage
              placeholder={`پیام برای ${selectedUser.full_name}`}
              onSend={(text) => sendTargetMessage('user', selectedUser.id, text)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const linkTitle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  margin: 0,
  fontSize: '1.12rem',
  fontWeight: 800,
  color: '#facc15',
  cursor: 'pointer',
  textDecoration: 'underline',
  textUnderlineOffset: '4px',
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.72)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 40,
  padding: '1rem',
};

const closeBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#e2e8f0',
  cursor: 'pointer',
};

const sectionTitle: React.CSSProperties = {
  margin: '1rem 0 0.45rem',
  color: '#f8fafc',
  fontSize: '0.95rem',
};

const emptyText: React.CSSProperties = {
  margin: '0 0 0.4rem',
  color: '#94a3b8',
  fontSize: '0.85rem',
};

const detailBox: React.CSSProperties = {
  background: 'rgba(15,10,30,0.65)',
  borderRadius: '0.8rem',
  padding: '0.65rem 0.8rem',
  marginBottom: '0.45rem',
};

const detailLine: React.CSSProperties = {
  margin: '0.3rem 0 0',
  color: '#e2e8f0',
  fontSize: '0.84rem',
  lineHeight: 1.7,
  whiteSpace: 'pre-wrap',
};

const ghostBtn: React.CSSProperties = {
  marginTop: '0.8rem',
  padding: '0.45rem 0.8rem',
  borderRadius: '0.75rem',
  border: '1px solid rgba(250, 204, 21, 0.45)',
  background: 'rgba(234, 179, 8, 0.08)',
  color: '#fde68a',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.35rem',
};

export default ManagerPage;
