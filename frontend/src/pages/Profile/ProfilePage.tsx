import React, { useState, useEffect, useMemo } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  User,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Star,
  Award,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  Shield,
  Activity,
  BarChart2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit3,
  Save,
  Key,
  Headphones,
  Users,
  RefreshCw,
  Briefcase,
  Globe,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { storageService } from '../../services/storageService';
import './ProfilePage.css';

// ── Helpers ─────────────────────────────────────────────────────────────────

const fmtDuration = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
};

const fmtAvgDuration = (secs: number) => {
  if (!secs) return '0m 0s';
  return fmtDuration(Math.round(secs));
};

/** Gauge bar component */
const GaugeBar: React.FC<{ label: string; value: number; color: string; suffix?: string }> = ({
  label, value, color, suffix = '%',
}) => (
  <div className="profile-gauge-item">
    <div className="profile-gauge-header">
      <span className="profile-gauge-label">{label}</span>
      <span className="profile-gauge-pct">{value}{suffix}</span>
    </div>
    <div className="profile-gauge-track">
      <div className="profile-gauge-fill" style={{ width: `${Math.min(value, 100)}%`, background: color }} />
    </div>
  </div>
);

// ── Tabs ─────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'performance' | 'edit';

// ── Main Component ───────────────────────────────────────────────────────────
export const ProfilePage: React.FC = () => {
  const { user, tenant, setUser } = useAuth();
  const { availability } = useCall();

  const [tab, setTab] = useState<Tab>('overview');

  // ── Live data from storage ────────────────────────────────────────────────
  const allCalls = useMemo(() => storageService.getCalls(tenant?.id), [tenant?.id]);
  const allLeads = useMemo(() => storageService.getLeads(tenant?.id), [tenant?.id]);
  const allFollowups = useMemo(() => storageService.getFollowups(tenant?.id), [tenant?.id]);

  const myCalls = useMemo(
    () => allCalls.filter(c => c.agentId === user?.id || c.agentName === user?.name),
    [allCalls, user]
  );
  const myLeads = useMemo(
    () => allLeads.filter(l => l.assignedAgentId === user?.id || l.assignedAgentName === user?.name),
    [allLeads, user]
  );
  const myFollowups = useMemo(
    () => allFollowups.filter(f => f.assignedAgentId === user?.id || f.assignedAgentName === user?.name),
    [allFollowups, user]
  );

  // ── KPI Metrics ──────────────────────────────────────────────────────────
  const totalCalls = myCalls.length;
  const inboundCalls = myCalls.filter(c => c.direction === 'inbound').length;
  const outboundCalls = myCalls.filter(c => c.direction === 'outbound').length;
  const avgDuration = totalCalls ? myCalls.reduce((s, c) => s + c.duration, 0) / totalCalls : 0;
  const convertedCalls = myCalls.filter(c => c.disposition === 'Converted').length;
  const interestedCalls = myCalls.filter(c => c.disposition === 'Interested').length;
  const conversionRate = totalCalls ? Math.round((convertedCalls / totalCalls) * 100) : 0;
  const activeLeads = myLeads.filter(l => !['Converted', 'Lost', 'Junk', 'Not Interested'].includes(l.status)).length;
  const convertedLeads = myLeads.filter(l => l.status === 'Converted').length;
  const pendingFollowups = myFollowups.filter(f => f.status === 'Pending').length;
  const completedFollowups = myFollowups.filter(f => f.status === 'Completed').length;
  const followupCompletionRate = myFollowups.length
    ? Math.round((completedFollowups / myFollowups.length) * 100)
    : 0;

  // ── Disposition breakdown ─────────────────────────────────────────────────
  const dispoMap: Record<string, { color: string }> = {
    'Interested':        { color: '#10b981' },
    'Converted':         { color: '#2563eb' },
    'Follow-up Required':{ color: '#f59e0b' },
    'Call Back':         { color: '#8b5cf6' },
    'Not Interested':    { color: '#ef4444' },
    'Wrong Number':      { color: '#64748b' },
    'No Response':       { color: '#94a3b8' },
  };

  const dispoBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    myCalls.forEach(c => {
      counts[c.disposition] = (counts[c.disposition] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count, color: dispoMap[name]?.color || '#64748b' }));
  }, [myCalls]);

  const maxDispo = dispoBreakdown[0]?.count || 1;

  // ── Edit form state ───────────────────────────────────────────────────────
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editDesignation, setEditDesignation] = useState(user?.designation || '');
  const [editSkills, setEditSkills] = useState((user?.skills || []).join(', '));
  const [editLanguages, setEditLanguages] = useState((user?.languages || []).join(', '));
  const [editSpecializations, setEditSpecializations] = useState((user?.specializations || []).join(', '));
  const [editMaxLeads, setEditMaxLeads] = useState(String(user?.maxActiveLeads || 50));
  const [editWorkStart, setEditWorkStart] = useState(user?.workingHours?.start || '09:00');
  const [editWorkEnd, setEditWorkEnd] = useState(user?.workingHours?.end || '18:00');
  const [editSaved, setEditSaved] = useState(false);

  // Password change state
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditPhone(user.phone);
      setEditDesignation(user.designation || '');
      setEditSkills((user.skills || []).join(', '));
      setEditLanguages((user.languages || []).join(', '));
      setEditSpecializations((user.specializations || []).join(', '));
      setEditMaxLeads(String(user.maxActiveLeads || 50));
      setEditWorkStart(user.workingHours?.start || '09:00');
      setEditWorkEnd(user.workingHours?.end || '18:00');
    }
  }, [user]);

  const handleSaveProfile = () => {
    if (!user) return;
    const updated = {
      ...user,
      name: editName,
      phone: editPhone,
      designation: editDesignation,
      skills: editSkills.split(',').map(s => s.trim()).filter(Boolean),
      languages: editLanguages.split(',').map(s => s.trim()).filter(Boolean),
      specializations: editSpecializations.split(',').map(s => s.trim()).filter(Boolean),
      maxActiveLeads: parseInt(editMaxLeads) || 50,
      workingHours: { start: editWorkStart, end: editWorkEnd, days: user.workingHours?.days || ['Mon','Tue','Wed','Thu','Fri'] },
    };
    setUser(updated);
    storageService.saveUser(updated);
    setEditSaved(true);
    setTimeout(() => setEditSaved(false), 2200);
  };

  const handleChangePassword = () => {
    if (!newPwd || newPwd.length < 6) { setPwdMsg('New password must be at least 6 characters.'); return; }
    if (newPwd !== confirmPwd) { setPwdMsg('Passwords do not match.'); return; }
    setPwdMsg('✓ Password changed successfully (simulated).');
    setOldPwd(''); setNewPwd(''); setConfirmPwd('');
    setTimeout(() => setPwdMsg(''), 3000);
  };

  // ── Static enrichment data ────────────────────────────────────────────────
  const skills = user?.skills?.length ? user.skills : ['Lead Qualification', 'CRM Management', 'Cold Calling', 'Objection Handling', 'Deal Closing'];
  const languages = user?.languages?.length ? user.languages : ['English', 'Hindi', 'Kannada'];
  const specializations = user?.specializations?.length ? user.specializations : ['Residential Real Estate', 'High-Value Investors', 'NRI Clients'];
  const workDays = user?.workingHours?.days || ['Mon','Tue','Wed','Thu','Fri'];
  const allDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const designation = user?.designation || (user?.role?.code === 'sales_executive' ? 'Sales Executive' : user?.role?.name || 'Agent');
  const employeeCode = user?.employeeCode || `EMP-${user?.id?.slice(-4).toUpperCase() || '0001'}`;
  const joinedAt = user?.joinedAt || user?.createdAt || '2024-01-15';
  const routingPriority = user?.routingPriority || 2;
  const maxLeads = user?.maxActiveLeads || 50;

  // Avatar initials
  const initials = (user?.name || 'Agent')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const availStatusClass = availability === 'Available' ? 'available' : availability === 'Busy' ? 'busy' : 'offline';

  // ── Recent activity (from calls) ──────────────────────────────────────────
  const recentActivity = useMemo(() => {
    const items: { icon: React.ReactNode; bgColor: string; title: string; sub: string; }[] = [];
    const sorted = [...myCalls].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
    sorted.forEach(c => {
      const isIn = c.direction === 'inbound';
      items.push({
        icon: isIn ? <PhoneIncoming size={14} /> : <PhoneOutgoing size={14} />,
        bgColor: isIn ? 'rgba(16,185,129,0.12)' : 'rgba(37,99,235,0.12)',
        title: `${isIn ? 'Inbound' : 'Outbound'} call — ${c.contactName}`,
        sub: `${fmtDuration(c.duration)} · ${c.disposition} · ${new Date(c.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`,
      });
    });
    if (!items.length) {
      items.push({
        icon: <Activity size={14} />,
        bgColor: 'rgba(100,116,139,0.12)',
        title: 'No recent call activity',
        sub: 'Start making or receiving calls to see activity here.',
      });
    }
    return items;
  }, [myCalls]);

  // ── Certifications (static demo data) ─────────────────────────────────────
  const certs = [
    { name: 'Certified Sales Professional (CSP)', issuer: 'Sales & Marketing Association', date: '2024-03-10', color: '#2563eb' },
    { name: 'Call Center Excellence Badge', issuer: 'Nexus Platform', date: '2025-01-20', color: '#7c3aed' },
    { name: 'Real Estate Fundamentals', issuer: 'RERA Board', date: '2023-11-05', color: '#059669' },
    { name: 'CRM Power User', issuer: 'Internal — GHL India', date: '2025-06-01', color: '#d97706' },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="profile-page">

      {/* ── Hero banner ── */}
      <div className="profile-hero">
        <div className="profile-hero-banner" />
        <div className="profile-hero-body">
          {/* Avatar */}
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">{initials}</div>
            <div className={`profile-avatar-status ${availStatusClass}`} />
          </div>

          {/* Identity info */}
          <div className="profile-hero-info">
            <h1 className="profile-name">{user?.name || 'Sales Agent'}</h1>
            <div className="profile-designation">
              <span className="profile-role-badge">
                <Shield size={11} /> {user?.role?.name || 'Agent'}
              </span>
              <span>{designation}</span>
            </div>
            <div className="profile-meta-row">
              <span className="profile-meta-item"><Briefcase size={12} /><strong>{employeeCode}</strong></span>
              <span className="profile-meta-item"><Mail size={12} /><strong>{user?.email}</strong></span>
              <span className="profile-meta-item"><Phone size={12} /><strong>{user?.phone}</strong></span>
              <span className="profile-meta-item"><MapPin size={12} /><strong>{tenant?.city || tenant?.name || 'Bengaluru'}</strong></span>
              <span className="profile-meta-item">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: availability === 'Available' ? '#10b981' : availability === 'Busy' ? '#f59e0b' : '#64748b' }} />
                <strong>{availability}</strong>
              </span>
            </div>
          </div>

          {/* Right side actions */}
          <div className="profile-hero-actions">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setTab('edit')}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Edit3 size={14} /> Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="profile-tab-bar">
          {([
            { id: 'overview', label: 'Overview', icon: <User size={13} /> },
            { id: 'performance', label: 'Performance', icon: <BarChart2 size={13} /> },
            { id: 'edit', label: 'Edit Profile', icon: <Edit3 size={13} /> },
          ] as { id: Tab; label: string; icon: React.ReactNode }[]).map(t => (
            <button
              key={t.id}
              id={`profile-tab-${t.id}`}
              className={`profile-tab-btn${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: OVERVIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'overview' && (
        <div className="profile-grid">

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Personal Details */}
            <div className="profile-card">
              <div className="profile-card-title"><User size={14} /> Personal Details</div>
              <div className="profile-info-rows">
                <div className="profile-info-row">
                  <div className="profile-info-icon"><Mail size={14} /></div>
                  <div>
                    <div className="profile-info-label">Email</div>
                    <div className="profile-info-value">{user?.email || '—'}</div>
                  </div>
                </div>
                <div className="profile-info-row">
                  <div className="profile-info-icon"><Phone size={14} /></div>
                  <div>
                    <div className="profile-info-label">Phone</div>
                    <div className="profile-info-value">{user?.phone || '—'}</div>
                  </div>
                </div>
                <div className="profile-info-row">
                  <div className="profile-info-icon"><Briefcase size={14} /></div>
                  <div>
                    <div className="profile-info-label">Designation</div>
                    <div className="profile-info-value">{designation}</div>
                  </div>
                </div>
                <div className="profile-info-row">
                  <div className="profile-info-icon"><Calendar size={14} /></div>
                  <div>
                    <div className="profile-info-label">Joined</div>
                    <div className="profile-info-value">{new Date(joinedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                  </div>
                </div>
                <div className="profile-info-row">
                  <div className="profile-info-icon"><Globe size={14} /></div>
                  <div>
                    <div className="profile-info-label">Company</div>
                    <div className="profile-info-value">{tenant?.name || user?.companyName || '—'}</div>
                  </div>
                </div>
                <div className="profile-info-row">
                  <div className="profile-info-icon"><Clock size={14} /></div>
                  <div>
                    <div className="profile-info-label">Last Active</div>
                    <div className="profile-info-value">{user?.lastLogin || 'Just now'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="profile-card">
              <div className="profile-card-title"><Zap size={14} /> Skills</div>
              <div className="profile-tags-wrap">
                {skills.map(s => <span key={s} className="profile-tag">{s}</span>)}
              </div>

              <div className="profile-card-title" style={{ marginTop: 2 }}><Globe size={14} /> Languages</div>
              <div className="profile-tags-wrap">
                {languages.map(l => <span key={l} className="profile-tag lang">{l}</span>)}
              </div>

              <div className="profile-card-title" style={{ marginTop: 2 }}><Star size={14} /> Specializations</div>
              <div className="profile-tags-wrap">
                {specializations.map(s => <span key={s} className="profile-tag spec">{s}</span>)}
              </div>
            </div>

            {/* Shift Schedule */}
            <div className="profile-card">
              <div className="profile-card-title"><Clock size={14} /> Shift Schedule</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Clock size={14} color="var(--primary-600)" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {user?.workingHours?.start || '09:00'} – {user?.workingHours?.end || '18:00'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>IST</span>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Working Days</div>
                  <div className="profile-shift-days">
                    {allDays.map(d => (
                      <div key={d} className={`profile-shift-day ${workDays.includes(d) ? 'active' : 'off'}`}>{d.slice(0, 2)}</div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Target size={14} color="var(--primary-600)" />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Max Active Leads: <strong style={{ color: 'var(--text-primary)' }}>{maxLeads}</strong>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Activity size={14} color="#f59e0b" />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Routing Priority: <strong style={{ color: 'var(--text-primary)' }}>P{routingPriority}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="profile-right-col">

            {/* KPI Quick Stats */}
            <div className="profile-card">
              <div className="profile-card-title"><PhoneCall size={14} /> My Call Stats (All Time)</div>
              <div className="profile-kpi-grid">
                <div className="profile-kpi-box">
                  <div className="profile-kpi-icon" style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb' }}><PhoneCall size={16} /></div>
                  <div className="profile-kpi-value">{totalCalls}</div>
                  <div className="profile-kpi-label">Total Calls</div>
                </div>
                <div className="profile-kpi-box">
                  <div className="profile-kpi-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><PhoneIncoming size={16} /></div>
                  <div className="profile-kpi-value">{inboundCalls}</div>
                  <div className="profile-kpi-label">Inbound</div>
                </div>
                <div className="profile-kpi-box">
                  <div className="profile-kpi-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#7c3aed' }}><PhoneOutgoing size={16} /></div>
                  <div className="profile-kpi-value">{outboundCalls}</div>
                  <div className="profile-kpi-label">Outbound</div>
                </div>
                <div className="profile-kpi-box">
                  <div className="profile-kpi-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><Clock size={16} /></div>
                  <div className="profile-kpi-value">{fmtAvgDuration(avgDuration)}</div>
                  <div className="profile-kpi-label">Avg Duration</div>
                </div>
                <div className="profile-kpi-box">
                  <div className="profile-kpi-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><CheckCircle size={16} /></div>
                  <div className="profile-kpi-value">{convertedCalls}</div>
                  <div className="profile-kpi-label">Converted</div>
                </div>
                <div className="profile-kpi-box">
                  <div className="profile-kpi-icon" style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb' }}><TrendingUp size={16} /></div>
                  <div className="profile-kpi-value">{conversionRate}%</div>
                  <div className="profile-kpi-label">Conv. Rate</div>
                </div>
              </div>

              {/* Lead & Followup summary */}
              <div className="profile-divider" />
              <div className="profile-kpi-grid">
                <div className="profile-kpi-box">
                  <div className="profile-kpi-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}><Users size={16} /></div>
                  <div className="profile-kpi-value">{myLeads.length}</div>
                  <div className="profile-kpi-label">Total Leads</div>
                </div>
                <div className="profile-kpi-box">
                  <div className="profile-kpi-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><Star size={16} /></div>
                  <div className="profile-kpi-value">{activeLeads}</div>
                  <div className="profile-kpi-label">Active Leads</div>
                </div>
                <div className="profile-kpi-box">
                  <div className="profile-kpi-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><Calendar size={16} /></div>
                  <div className="profile-kpi-value">{pendingFollowups}</div>
                  <div className="profile-kpi-label">Pending Follow‑ups</div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="profile-card">
              <div className="profile-card-title"><Activity size={14} /> Recent Activity</div>
              <div className="profile-timeline">
                {recentActivity.map((item, i) => (
                  <div key={i} className="profile-tl-item">
                    <div className="profile-tl-dot" style={{ background: item.bgColor, color: 'var(--primary-600)' }}>
                      {item.icon}
                    </div>
                    <div className="profile-tl-body">
                      <div className="profile-tl-title">{item.title}</div>
                      <div className="profile-tl-sub">{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="profile-card">
              <div className="profile-card-title"><Award size={14} /> Certifications & Badges</div>
              <div className="profile-cert-list">
                {certs.map((c, i) => (
                  <div key={i} className="profile-cert-item">
                    <div className="profile-cert-icon" style={{ background: `${c.color}18`, color: c.color }}>
                      <Award size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="profile-cert-name">{c.name}</div>
                      <div className="profile-cert-date">{c.issuer} · {new Date(c.date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</div>
                    </div>
                    <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: PERFORMANCE
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'performance' && (
        <div className="profile-grid">
          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Monthly Targets */}
            <div className="profile-card">
              <div className="profile-card-title"><Target size={14} /> This Month's Targets</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="profile-target-row">
                  <div className="profile-target-icon" style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb' }}><PhoneCall size={18} /></div>
                  <div style={{ flex: 1 }}>
                    <div className="profile-target-label">Calls Target</div>
                    <div className="profile-target-value">{totalCalls} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>/ 200</span></div>
                    <div className="profile-target-sub">{Math.round((totalCalls / 200) * 100)}% achieved</div>
                  </div>
                </div>
                <div className="profile-target-row">
                  <div className="profile-target-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><TrendingUp size={18} /></div>
                  <div style={{ flex: 1 }}>
                    <div className="profile-target-label">Conversions Target</div>
                    <div className="profile-target-value">{convertedCalls} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>/ 15</span></div>
                    <div className="profile-target-sub">{Math.round((convertedCalls / 15) * 100)}% achieved</div>
                  </div>
                </div>
                <div className="profile-target-row">
                  <div className="profile-target-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><Calendar size={18} /></div>
                  <div style={{ flex: 1 }}>
                    <div className="profile-target-label">Follow-ups Completed</div>
                    <div className="profile-target-value">{completedFollowups} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>/ {myFollowups.length}</span></div>
                    <div className="profile-target-sub">{followupCompletionRate}% completion rate</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Skill Proficiency */}
            <div className="profile-card">
              <div className="profile-card-title"><BarChart2 size={14} /> Skill Proficiency</div>
              <div className="profile-gauge-row">
                <GaugeBar label="Lead Qualification" value={88} color="#2563eb" />
                <GaugeBar label="Cold Calling" value={74} color="#7c3aed" />
                <GaugeBar label="Objection Handling" value={81} color="#059669" />
                <GaugeBar label="CRM Proficiency" value={92} color="#d97706" />
                <GaugeBar label="Product Knowledge" value={79} color="#db2777" />
                <GaugeBar label="Deal Closing" value={conversionRate || 65} color="#2563eb" />
              </div>
            </div>

            {/* Routing & Capacity */}
            <div className="profile-card">
              <div className="profile-card-title"><Headphones size={14} /> Routing & Capacity</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-base)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Routing Priority</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary-600)' }}>P{routingPriority}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-base)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Max Active Leads</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{maxLeads}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-base)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Current Active Leads</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: activeLeads > maxLeads * 0.8 ? '#f59e0b' : '#10b981' }}>{activeLeads}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-base)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Capacity Used</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{maxLeads ? Math.round((activeLeads / maxLeads) * 100) : 0}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="profile-right-col">

            {/* Performance Scores */}
            <div className="profile-card">
              <div className="profile-card-title"><Star size={14} /> Performance Scores</div>
              <div className="profile-gauge-row">
                <GaugeBar label="Overall Performance" value={Math.min(Math.round((conversionRate + followupCompletionRate) / 2 + 30), 100)} color="linear-gradient(90deg, #2563eb, #7c3aed)" />
                <GaugeBar label="Call Conversion Rate" value={conversionRate} color="#10b981" />
                <GaugeBar label="Follow-up Completion" value={followupCompletionRate} color="#f59e0b" />
                <GaugeBar label="Customer Satisfaction (CSAT)" value={87} color="#6366f1" />
                <GaugeBar label="First Call Resolution (FCR)" value={72} color="#059669" />
                <GaugeBar label="Attendance & Punctuality" value={96} color="#db2777" />
              </div>
            </div>

            {/* Disposition Breakdown */}
            <div className="profile-card">
              <div className="profile-card-title"><BarChart2 size={14} /> Call Disposition Breakdown</div>
              {dispoBreakdown.length > 0 ? (
                <div className="profile-dispo-list">
                  {dispoBreakdown.map(d => (
                    <div key={d.name} className="profile-dispo-item">
                      <div className="profile-dispo-dot" style={{ background: d.color }} />
                      <span className="profile-dispo-name">{d.name}</span>
                      <span className="profile-dispo-count">{d.count}</span>
                      <div className="profile-dispo-bar-wrap">
                        <div
                          className="profile-dispo-bar"
                          style={{ width: `${Math.round((d.count / maxDispo) * 100)}%`, background: d.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                  No call disposition data yet.
                </div>
              )}
            </div>

            {/* Lead Funnel */}
            <div className="profile-card">
              <div className="profile-card-title"><TrendingUp size={14} /> Lead Funnel</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Total Leads Assigned', count: myLeads.length, color: '#6366f1' },
                  { label: 'Active / In-Progress', count: activeLeads, color: '#2563eb' },
                  { label: 'Interested', count: interestedCalls, color: '#10b981' },
                  { label: 'Converted', count: convertedLeads, color: '#059669' },
                  { label: 'Not Interested', count: myLeads.filter(l => l.status === 'Not Interested').length, color: '#ef4444' },
                ].map(item => (
                  <div key={item.label} className="profile-dispo-item">
                    <div className="profile-dispo-dot" style={{ background: item.color }} />
                    <span className="profile-dispo-name">{item.label}</span>
                    <span className="profile-dispo-count">{item.count}</span>
                    <div className="profile-dispo-bar-wrap">
                      <div
                        className="profile-dispo-bar"
                        style={{ width: myLeads.length ? `${Math.round((item.count / myLeads.length) * 100)}%` : '0%', background: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: EDIT PROFILE
      ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'edit' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

          {/* Personal Info */}
          <div className="profile-card">
            <div className="profile-card-title"><User size={14} /> Personal Information</div>
            <div className="profile-edit-grid">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your full name" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+91 98000 00000" />
              </div>
              <div className="form-group profile-edit-full">
                <label className="form-label">Email <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>(read-only)</span></label>
                <input className="form-input" value={user?.email || ''} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
              <div className="form-group profile-edit-full">
                <label className="form-label">Designation</label>
                <input className="form-input" value={editDesignation} onChange={e => setEditDesignation(e.target.value)} placeholder="e.g. Senior Sales Executive" />
              </div>
            </div>

            <div style={{ marginTop: 4 }}>
              <button
                id="profile-save-btn"
                className="btn btn-primary profile-save-btn"
                onClick={handleSaveProfile}
                style={{ display: 'flex', alignItems: 'center', gap: 7 }}
              >
                {editSaved ? <CheckCircle size={15} /> : <Save size={15} />}
                {editSaved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Skills & Languages */}
          <div className="profile-card">
            <div className="profile-card-title"><Zap size={14} /> Skills & Languages</div>
            <div className="form-group">
              <label className="form-label">Skills <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>(comma-separated)</span></label>
              <input className="form-input" value={editSkills} onChange={e => setEditSkills(e.target.value)} placeholder="e.g. Lead Qualification, Cold Calling" />
            </div>
            <div className="form-group">
              <label className="form-label">Languages <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>(comma-separated)</span></label>
              <input className="form-input" value={editLanguages} onChange={e => setEditLanguages(e.target.value)} placeholder="e.g. English, Hindi" />
            </div>
            <div className="form-group">
              <label className="form-label">Specializations <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>(comma-separated)</span></label>
              <input className="form-input" value={editSpecializations} onChange={e => setEditSpecializations(e.target.value)} placeholder="e.g. Real Estate, HNW Investors" />
            </div>
          </div>

          {/* Working Hours */}
          <div className="profile-card">
            <div className="profile-card-title"><Clock size={14} /> Working Hours & Capacity</div>
            <div className="profile-edit-grid">
              <div className="form-group">
                <label className="form-label">Shift Start</label>
                <input className="form-input" type="time" value={editWorkStart} onChange={e => setEditWorkStart(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Shift End</label>
                <input className="form-input" type="time" value={editWorkEnd} onChange={e => setEditWorkEnd(e.target.value)} />
              </div>
              <div className="form-group profile-edit-full">
                <label className="form-label">Max Active Leads</label>
                <input className="form-input" type="number" min="1" max="500" value={editMaxLeads} onChange={e => setEditMaxLeads(e.target.value)} />
              </div>
            </div>
            <div>
              <button
                className="btn btn-primary profile-save-btn"
                onClick={handleSaveProfile}
                style={{ display: 'flex', alignItems: 'center', gap: 7 }}
              >
                {editSaved ? <CheckCircle size={15} /> : <Save size={15} />}
                {editSaved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Change Password */}
          <div className="profile-card">
            <div className="profile-card-title"><Key size={14} /> Change Password</div>
            <div className="profile-password-section">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Current Password</label>
                  <input className="form-input" type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} placeholder="Enter current password" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">New Password</label>
                  <input className="form-input" type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Min. 6 characters" />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Confirm New Password</label>
                  <input className="form-input" type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Repeat new password" />
                </div>
                {pwdMsg && (
                  <div style={{ fontSize: 12, color: pwdMsg.startsWith('✓') ? '#10b981' : '#ef4444', fontWeight: 600 }}>{pwdMsg}</div>
                )}
                <button
                  className="btn btn-secondary"
                  onClick={handleChangePassword}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, alignSelf: 'flex-start' }}
                >
                  <RefreshCw size={14} /> Update Password
                </button>
              </div>
            </div>
            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Shield size={11} /> Session-based simulated change — no backend call is made in demo mode.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
