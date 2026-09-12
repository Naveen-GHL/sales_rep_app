import React, { useState, useEffect } from 'react';
import { BarChart3, Download, TrendingUp, PhoneCall, Users, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { PIPELINE_STAGES } from '../../constants/pipelineStages';
import { EmptyState } from '../../components/common/EmptyState';
import { Lead, Deal, CallRecord } from '../../types';

export const ReportsPage: React.FC = () => {
  const { tenant } = useAuth();
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [calls, setCalls] = useState<CallRecord[]>([]);

  const loadData = () => {
    setLeads(storageService.getLeads(tenant?.id));
    setDeals(storageService.getDeals(tenant?.id));
    setCalls(storageService.getCalls(tenant?.id));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('nexus_storage_updated', handleUpdate);
    return () => window.removeEventListener('nexus_storage_updated', handleUpdate);
  }, [tenant?.id]);

  // Currency Formatter
  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  // Duration Formatter
  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  // Filter leads by selected period using lead.createdAt
  const isWithinPeriod = (dateStr: string, p: 'week' | 'month' | 'quarter'): boolean => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const now = new Date();

    const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays < 0) return true; // today or future

    if (p === 'week') {
      return diffDays <= 7;
    }
    if (p === 'month') {
      if (diffDays <= 30) return true;
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) return true;
      return false;
    }
    if (p === 'quarter') {
      if (diffDays <= 90) return true;
      const nowQuarter = Math.floor(now.getMonth() / 3);
      const dQuarter = Math.floor(d.getMonth() / 3);
      if (nowQuarter === dQuarter && d.getFullYear() === now.getFullYear()) return true;
      return false;
    }
    return true;
  };

  const periodLeads = leads.filter(l => isWithinPeriod(l.createdAt, period));
  const convertedPeriodLeads = periodLeads.filter(l => l.status === 'Converted');
  const overallConversionRate = periodLeads.length > 0
    ? ((convertedPeriodLeads.length / periodLeads.length) * 100).toFixed(1)
    : null;

  // Telephone connect rate
  const totalCalls = calls.length;
  const connectedCalls = calls.filter(c => c.duration > 0);
  const connectRate = totalCalls > 0
    ? ((connectedCalls.length / totalCalls) * 100).toFixed(1)
    : null;
  const totalConnectedDuration = connectedCalls.reduce((sum, c) => sum + (c.duration || 0), 0);
  const avgDuration = connectedCalls.length > 0
    ? formatDuration(Math.round(totalConnectedDuration / connectedCalls.length))
    : '0s';

  // Stages and Closed Value
  const stages = tenant?.slug === 'jamin'
    ? PIPELINE_STAGES.jamin
    : tenant?.slug === 'ghl'
    ? PIPELINE_STAGES.ghl
    : PIPELINE_STAGES.default;

  const wonStage = stages.find(s => s.id === 'won' || s.id === 'converted')
    || (stages[stages.length - 1].id === 'lost' ? stages[stages.length - 2] : stages[stages.length - 1]);

  const wonStageId = wonStage?.id || 'won';

  const wonDeals = deals.filter(d => d.stage === wonStageId || d.stage === 'won' || d.stage === 'converted');
  const closedValue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);

  // Conversion Funnel steps
  const funnelSteps = stages.map((stage, idx) => {
    const count = deals.filter(d => d.stage === stage.id).length;
    const pct = deals.length > 0 ? `${((count / deals.length) * 100).toFixed(1)}%` : '0%';
    return {
      label: `${idx + 1}. ${stage.name}`,
      count,
      pct,
      color: stage.color || '#3b82f6',
    };
  });

  // Call Outcomes Distribution
  const DISPOSITION_COLORS: Record<string, string> = {
    'Interested': '#10b981',
    'Converted': '#059669',
    'Follow-up Required': '#f59e0b',
    'Call Back': '#3b82f6',
    'Not Interested': '#ef4444',
    'Wrong Number': '#6b7280',
    'No Response': '#94a3b8',
  };
  const COLOR_PALETTE = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#94a3b8', '#14b8a6'];

  const dispositionMap: Record<string, number> = {};
  calls.forEach(c => {
    const disp = c.disposition || 'Unassigned';
    dispositionMap[disp] = (dispositionMap[disp] || 0) + 1;
  });

  const callOutcomes = Object.entries(dispositionMap)
    .sort((a, b) => b[1] - a[1])
    .map(([disp, count], idx) => ({
      disposition: disp,
      count,
      pct: Math.round((count / calls.length) * 100),
      color: DISPOSITION_COLORS[disp] || COLOR_PALETTE[idx % COLOR_PALETTE.length],
    }));

  // Agent Performance Leaderboard
  interface AgentPerformance {
    id: string;
    name: string;
    role?: string;
    calls: number;
    totalDuration: number;
    convertedLeads: number;
    revenue: number;
  }

  const agentMap = new Map<string, AgentPerformance>();

  // Include tenant users so configured staff are visible
  const tenantUsers = storageService.getUsers(tenant?.slug);
  tenantUsers.forEach(u => {
    agentMap.set(u.id, {
      id: u.id,
      name: u.name,
      role: u.role?.name || 'Sales Executive',
      calls: 0,
      totalDuration: 0,
      convertedLeads: 0,
      revenue: 0,
    });
  });

  calls.forEach(c => {
    const key = c.agentId || c.agentName;
    if (!key) return;
    if (!agentMap.has(key)) {
      agentMap.set(key, {
        id: key,
        name: c.agentName || 'Agent',
        role: 'Sales Representative',
        calls: 0,
        totalDuration: 0,
        convertedLeads: 0,
        revenue: 0,
      });
    }
    const stat = agentMap.get(key)!;
    stat.calls += 1;
    stat.totalDuration += (c.duration || 0);
    if (!stat.name && c.agentName) stat.name = c.agentName;
  });

  leads.forEach(l => {
    if (l.status === 'Converted') {
      const key = l.assignedAgentId || l.assignedAgentName;
      if (!key) return;
      if (!agentMap.has(key)) {
        agentMap.set(key, {
          id: key,
          name: l.assignedAgentName || 'Agent',
          role: 'Sales Representative',
          calls: 0,
          totalDuration: 0,
          convertedLeads: 0,
          revenue: 0,
        });
      }
      const stat = agentMap.get(key)!;
      stat.convertedLeads += 1;
      if (!stat.name && l.assignedAgentName) stat.name = l.assignedAgentName;
    }
  });

  deals.forEach(d => {
    const isWon = d.stage === wonStageId || d.stage === 'won' || d.stage === 'converted';
    const key = d.assignedAgentId || d.assignedAgentName;
    if (!key) return;
    if (!agentMap.has(key)) {
      agentMap.set(key, {
        id: key,
        name: d.assignedAgentName || 'Agent',
        role: 'Sales Representative',
        calls: 0,
        totalDuration: 0,
        convertedLeads: 0,
        revenue: 0,
      });
    }
    const stat = agentMap.get(key)!;
    if (isWon) {
      stat.revenue += (d.value || 0);
    }
    if (!stat.name && d.assignedAgentName) stat.name = d.assignedAgentName;
  });

  const leaderboard = Array.from(agentMap.values())
    .filter(a => a.calls > 0 || a.convertedLeads > 0 || a.revenue > 0 || tenantUsers.some(u => u.id === a.id))
    .sort((a, b) => b.revenue - a.revenue || b.calls - a.calls);

  const handleExport = () => {
    alert(`Generating automated ${tenant?.name || 'Workspace'} performance report for CSV download...`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <BarChart3 size={24} color="var(--primary-600)" /> Analytics & Performance Reports
          </h1>
          <p className="page-subtitle">
            Aggregate conversion funnels, agent leaderboards, and calling telemetry for {tenant?.name}.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-md)', padding: 3 }}>
            {(['week', 'month', 'quarter'] as const).map(p => (
              <button
                key={p}
                className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-ghost'}`}
                style={{ textTransform: 'capitalize', fontSize: 12, padding: '4px 12px' }}
                onClick={() => setPeriod(p)}
              >
                This {p}
              </button>
            ))}
          </div>

          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Top Aggregates */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {/* Total Inbound Leads */}
        {periodLeads.length === 0 ? (
          <EmptyState
            icon={<Users size={20} />}
            title="No Inbound Leads"
            description={`No leads found for this ${period}.`}
          />
        ) : (
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>TOTAL INBOUND LEADS</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginTop: 8 }}>
              {periodLeads.length}
            </div>
            <div style={{ fontSize: 12, color: '#059669', marginTop: 4, fontWeight: 600 }}>
              Recorded in this {period}
            </div>
          </div>
        )}

        {/* Overall Conversion */}
        {overallConversionRate === null ? (
          <EmptyState
            icon={<TrendingUp size={20} />}
            title="No Conversion Data"
            description={`No leads in this ${period} to compute conversion.`}
          />
        ) : (
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>OVERALL CONVERSION</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#2563eb', marginTop: 8 }}>
              {overallConversionRate}%
            </div>
            <div style={{ fontSize: 12, color: Number(overallConversionRate) >= 15 ? '#059669' : 'var(--text-secondary)', marginTop: 4, fontWeight: 600 }}>
              {convertedPeriodLeads.length} of {periodLeads.length} converted
            </div>
          </div>
        )}

        {/* Telephone Connect Rate */}
        {connectRate === null ? (
          <EmptyState
            icon={<PhoneCall size={20} />}
            title="No Call Telemetry"
            description="No logged calls available to compute connect rate."
          />
        ) : (
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>TELEPHONE CONNECT RATE</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#059669', marginTop: 8 }}>
              {connectRate}%
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Avg duration: {avgDuration} ({connectedCalls.length}/{totalCalls})
            </div>
          </div>
        )}

        {/* Closed Value */}
        {deals.length === 0 || wonDeals.length === 0 ? (
          <EmptyState
            icon={<TrendingUp size={20} />}
            title="No Closed Value"
            description="No closed won deals recorded yet."
          />
        ) : (
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>CLOSED VALUE</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#7c3aed', marginTop: 8 }}>
              {formatCurrency(closedValue)}
            </div>
            <div style={{ fontSize: 12, color: '#059669', marginTop: 4, fontWeight: 600 }}>
              {wonDeals.length} won {wonDeals.length === 1 ? 'deal' : 'deals'}
            </div>
          </div>
        )}
      </div>

      {/* Visual Funnel and Calling Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20 }}>
        {/* Conversion Funnel Card */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
            Lead-to-Close Conversion Funnel
          </h3>

          {deals.length === 0 ? (
            <EmptyState
              icon={<TrendingUp size={24} />}
              title="No Pipeline Deals"
              description="No deals currently in the pipeline to construct a conversion funnel."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {funnelSteps.map((step, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    <span>{step.label}</span>
                    <span>{step.count} ({step.pct})</span>
                  </div>
                  <div style={{ height: 10, backgroundColor: 'var(--bg-surface-hover)', borderRadius: 5, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: step.pct,
                        backgroundColor: step.color,
                        borderRadius: 5,
                        transition: 'width 0.8s ease-in-out',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Call Outcomes Distribution Card */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
            Call Center Outcomes Distribution
          </h3>

          {callOutcomes.length === 0 ? (
            <EmptyState
              icon={<PhoneCall size={24} />}
              title="No Call Records"
              description="No logged calls available to compute disposition breakdown."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {callOutcomes.map((disp, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: disp.color }} />
                    <span>{disp.disposition}</span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>
                    {disp.count} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({disp.pct}%)</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Agent Performance Leaderboard (Manager/Admin View) */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-base)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Award size={18} color="#f59e0b" />
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Sales Agent Performance Leaderboard</h3>
        </div>

        {leaderboard.length === 0 ? (
          <div style={{ padding: 24 }}>
            <EmptyState
              icon={<Award size={24} />}
              title="No Agent Records"
              description="No sales agent performance data logged yet."
            />
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-base)', color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 20px', textAlign: 'left' }}>Sales Agent</th>
                <th style={{ padding: '10px 16px', textAlign: 'center' }}>Calls Made</th>
                <th style={{ padding: '10px 16px', textAlign: 'center' }}>Avg Duration</th>
                <th style={{ padding: '10px 16px', textAlign: 'center' }}>Leads Converted</th>
                <th style={{ padding: '10px 20px', textAlign: 'right' }}>Total Revenue Value</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((agent, aIdx) => (
                <tr key={agent.id || aIdx} style={{ borderBottom: '1px solid var(--border-base)' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{agent.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{agent.role || 'Sales Representative'}</div>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600 }}>{agent.calls}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {agent.calls > 0 ? formatDuration(Math.round(agent.totalDuration / agent.calls)) : '0s'}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: '#059669' }}>
                    {agent.convertedLeads}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 800, color: '#2563eb' }}>
                    {formatCurrency(agent.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

