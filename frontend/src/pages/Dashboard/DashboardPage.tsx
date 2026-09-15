import React, { useState, useEffect } from 'react';
import {
  Users,
  PhoneCall,
  Calendar,
  Briefcase,
  TrendingUp,
  MapPin,
  Clock,
  ArrowUpRight,
  Phone,
  CheckCircle2,
  AlertCircle,
  Plus,
  PhoneMissed,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { storageService } from '../../services/storageService';
import { StatusChip } from '../../components/common/StatusChip';
import { FEATURES } from '../../constants/features';

interface DashboardPageProps {
  onNavigate: (route: string) => void;
  onOpenQuickCreate: (type: 'lead' | 'followup' | 'deal' | 'visit' | 'consultation') => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onOpenQuickCreate }) => {
  const { user, tenant, isSuperAdmin, enabledFeatures } = useAuth();
  const { initiateCall } = useCall();

  const [leads, setLeads] = useState(storageService.getLeads(tenant?.id));
  const [deals, setDeals] = useState(storageService.getDeals(tenant?.id));
  const [calls, setCalls] = useState(storageService.getCalls(tenant?.id));
  const [followups, setFollowups] = useState(storageService.getFollowups(tenant?.id));
  const [plots, setPlots] = useState(storageService.getPlots());
  const [siteVisits, setSiteVisits] = useState(storageService.getSiteVisits(tenant?.id));
  const [consultations, setConsultations] = useState(storageService.getConsultations(tenant?.id));

  // Sync with storage updates
  useEffect(() => {
    const handleUpdate = () => {
      setLeads(storageService.getLeads(tenant?.id));
      setDeals(storageService.getDeals(tenant?.id));
      setCalls(storageService.getCalls(tenant?.id));
      setFollowups(storageService.getFollowups(tenant?.id));
      setPlots(storageService.getPlots());
      setSiteVisits(storageService.getSiteVisits(tenant?.id));
      setConsultations(storageService.getConsultations(tenant?.id));
    };
    window.addEventListener('nexus_storage_updated', handleUpdate);
    return () => window.removeEventListener('nexus_storage_updated', handleUpdate);
  }, [tenant?.id]);

  // ── Role-based scoping (Task 2) ──────────────────────────────────────────
  const roleCode = user?.role?.code;
  const isExec = roleCode === 'sales_executive';

  const scopedLeads = isExec
    ? leads.filter(l =>
        (l.assignedAgentId && l.assignedAgentId === user?.id) ||
        (l.assignedAgentName && l.assignedAgentName === user?.name)
      )
    : leads;

  const scopedDeals = isExec
    ? deals.filter(d =>
        (d.assignedAgentId && d.assignedAgentId === user?.id) ||
        (d.assignedAgentName && d.assignedAgentName === user?.name)
      )
    : deals;

  const scopedCalls = isExec
    ? calls.filter(c =>
        (c.agentId && c.agentId === user?.id) ||
        (c.agentName && c.agentName === user?.name)
      )
    : calls;

  const scopedFollowups = isExec
    ? followups.filter(f =>
        (f.assignedAgentId && f.assignedAgentId === user?.id) ||
        (f.assignedAgentName && f.assignedAgentName === user?.name)
      )
    : followups;

  // ── Derived metrics ──────────────────────────────────────────────────────
  const totalPipelineValue = scopedDeals.reduce((acc, d) => acc + d.value, 0);
  const overdueFollowups = scopedFollowups.filter(
    f => f.status === 'Pending' && f.scheduledAt.toLowerCase().includes('yesterday')
  );
  const pendingFollowups = scopedFollowups.filter(f => f.status === 'Pending');

  // Task 1a — real "+N this week" delta from scopedLeads.createdAt
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const leadsThisWeek = scopedLeads.filter(l => {
    if (!l.createdAt) return false;
    const d = new Date(l.createdAt);
    return !isNaN(d.getTime()) && d.getTime() >= sevenDaysAgo;
  }).length;

  // Task 1b — real avg-duration from scopedCalls (same formula as ReportsPage)
  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };
  const connectedCalls = scopedCalls.filter(c => c.duration > 0);
  const totalConnectedDuration = connectedCalls.reduce((sum, c) => sum + (c.duration || 0), 0);
  const avgDuration =
    connectedCalls.length > 0
      ? formatDuration(Math.round(totalConnectedDuration / connectedCalls.length))
      : '0s';

  // Task 4 — missed calls: duration === 0 or disposition === 'No Response'
  const missedCalls = scopedCalls.filter(
    c => c.duration === 0 || c.disposition === 'No Response'
  ).length;

  // Format currency
  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  // ── Task 3 — label helpers ───────────────────────────────────────────────
  const label = {
    activeleads:     isExec ? 'MY ACTIVE LEADS'       : 'ACTIVE LEADS',
    pendingfollowups: isExec ? 'MY PENDING FOLLOW-UPS' : 'PENDING FOLLOW-UPS',
    callslogged:     isExec ? 'MY CALLS LOGGED'       : 'CALLS LOGGED',
    pipelinevalue:   isExec ? 'MY PIPELINE VALUE'     : 'PIPELINE VALUE',
    bannerSubtitle:  isExec
      ? "Here's your personal pipeline, assigned leads, and today's action items."
      : 'Here is your daily pipeline, incoming inquiries, and pending action items for today.',
    recentLeads:     isExec ? 'My Recent Leads'                   : 'Recent Inbound Leads',
    followupsTable:  isExec ? 'My Follow-ups & Reminders'         : 'Scheduled Reminders & Follow-ups',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          padding: '24px 28px',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', fontWeight: 700 }}>
            {tenant?.name} • OPERATIONAL SNAPSHOT
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', marginTop: 4 }}>
            Welcome back, {user?.name.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize: 13, color: '#cbd5e1', marginTop: 4 }}>
            {label.bannerSubtitle}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-secondary btn-sm"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)' }}
            onClick={() => onOpenQuickCreate('lead')}
          >
            <Plus size={14} /> Quick Lead
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => onOpenQuickCreate('followup')}
          >
            <Calendar size={14} /> Log Follow-up
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {/* Card 1: Active Leads */}
        <div className="card card-hover" style={{ cursor: 'pointer' }} onClick={() => onNavigate('leads')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>{label.activeleads}</span>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 12, color: 'var(--text-primary)' }}>
            {scopedLeads.length}
          </div>
          <div style={{ fontSize: 12, color: '#059669', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontWeight: 600 }}>
            <ArrowUpRight size={14} /> +{leadsThisWeek} this week
          </div>
        </div>

        {/* Card 2: Follow-ups */}
        <div className="card card-hover" style={{ cursor: 'pointer' }} onClick={() => onNavigate('followups')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>{label.pendingfollowups}</span>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 12, color: 'var(--text-primary)' }}>
            {pendingFollowups.length}
          </div>
          <div style={{ fontSize: 12, color: overdueFollowups.length > 0 ? '#dc2626' : '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontWeight: 600 }}>
            {overdueFollowups.length > 0 ? (
              <>
                <AlertCircle size={14} /> {overdueFollowups.length} overdue item!
              </>
            ) : (
              'All scheduled on time'
            )}
          </div>
        </div>

        {/* Card 3: Calls Logged */}
        <div className="card card-hover" style={{ cursor: 'pointer' }} onClick={() => onNavigate('call-history')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>{label.callslogged}</span>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PhoneCall size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 12, color: 'var(--text-primary)' }}>
            {scopedCalls.length}
          </div>
          {/* Task 4 — Missed Calls inline stat for Sales Executive */}
          {isExec ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Avg duration: {avgDuration}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  color: missedCalls > 0 ? '#dc2626' : '#64748b',
                  backgroundColor: missedCalls > 0 ? 'rgba(220,38,38,0.08)' : 'var(--bg-surface-hover)',
                  border: `1px solid ${missedCalls > 0 ? 'rgba(220,38,38,0.2)' : 'var(--border-base)'}`,
                  borderRadius: 6,
                  padding: '2px 7px',
                }}
              >
                <PhoneMissed size={11} />
                {missedCalls} missed
              </span>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Avg duration: {avgDuration}
            </div>
          )}
        </div>

        {/* Card 4: Pipeline Value */}
        <div className="card card-hover" style={{ cursor: 'pointer' }} onClick={() => onNavigate('pipeline')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>{label.pipelinevalue}</span>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'rgba(139, 92, 246, 0.1)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 12, color: 'var(--text-primary)' }}>
            {formatCurrency(totalPipelineValue)}
          </div>
          <div style={{ fontSize: 12, color: '#2563eb', marginTop: 4, fontWeight: 600 }}>
            {scopedDeals.length} active deals
          </div>
        </div>

        {/* Tenant Specific 5th Card — plots (not scoped per-agent per spec) */}
        {enabledFeatures.includes(FEATURES.PROPERTIES) && (
          <div className="card card-hover" style={{ cursor: 'pointer' }} onClick={() => onNavigate('plots')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>PLOT INVENTORY</span>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'rgba(5, 150, 105, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={18} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 12, color: 'var(--text-primary)' }}>
              {plots.filter(p => p.status === 'Available').length}{' '}
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>/ {plots.length}</span>
            </div>
            <div style={{ fontSize: 12, color: '#d97706', marginTop: 4, fontWeight: 600 }}>
              {plots.filter(p => p.status === 'Hold').length} currently on Hold
            </div>
          </div>
        )}

        {enabledFeatures.includes(FEATURES.INVESTORS) && (
          <div className="card card-hover" style={{ cursor: 'pointer' }} onClick={() => onNavigate('consultations')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>CONSULTATIONS</span>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={18} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 12, color: 'var(--text-primary)' }}>
              {consultations.length}
            </div>
            <div style={{ fontSize: 12, color: '#059669', marginTop: 4, fontWeight: 600 }}>
              {consultations.filter(c => c.status === 'Scheduled').length} upcoming this week
            </div>
          </div>
        )}
      </div>

      {/* Main Split Row: Recent Inquiries & Actionable Followups */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20 }}>
        {/* Recent Leads Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>{label.recentLeads}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Click phone icon to dial immediately</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('leads')}>
              View All Leads &rarr;
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-base)', color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left' }}>Contact</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left' }}>Priority</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right' }}>Quick Call</th>
                </tr>
              </thead>
              <tbody>
                {scopedLeads.slice(0, 4).map(l => (
                  <tr key={l.id} style={{ borderBottom: '1px solid var(--border-base)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{l.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.phone} • {l.location}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusChip status={l.status} size="sm" />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusChip status={l.priority} size="sm" />
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        className="btn btn-call btn-sm btn-icon"
                        style={{ width: 30, height: 30, borderRadius: 8 }}
                        title={`Call ${l.name}`}
                        onClick={() => initiateCall(l.name, l.phone, 'lead', l.id)}
                      >
                        <Phone size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Due Follow-ups & Reminders */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>{label.followupsTable}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Critical agent engagement tasks</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('followups')}>
              View All &rarr;
            </button>
          </div>

          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {scopedFollowups.slice(0, 4).map(f => (
              <div
                key={f.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface-hover)',
                  border: '1px solid var(--border-base)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{f.contactName}</span>
                    <StatusChip status={f.priority} size="sm" />
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {f.notes}
                  </p>
                  <div style={{ fontSize: 11, color: '#d97706', marginTop: 4, fontWeight: 600 }}>
                    ⏰ {f.scheduledAt} • Assignee: {f.assignedAgentName}
                  </div>
                </div>

                <button
                  className="btn btn-call btn-sm"
                  onClick={() => initiateCall(f.contactName, f.contactPhone, 'lead', f.contactId)}
                >
                  <Phone size={13} /> Call Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};