import React, { useState } from 'react';
import { BarChart3, Download, TrendingUp, PhoneCall, Users, Calendar, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { FEATURES } from '../../constants/features';

export const ReportsPage: React.FC = () => {
  const { tenant, enabledFeatures } = useAuth();
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  const handleExport = () => {
    alert(`Generating automated ${tenant?.name} performance report for CSV download...`);
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
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>TOTAL INBOUND LEADS</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginTop: 8 }}>
            142
          </div>
          <div style={{ fontSize: 12, color: '#059669', marginTop: 4, fontWeight: 600 }}>
            ↑ 22.4% vs last period
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>OVERALL CONVERSION</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#2563eb', marginTop: 8 }}>
            18.6%
          </div>
          <div style={{ fontSize: 12, color: '#059669', marginTop: 4, fontWeight: 600 }}>
            Target: 15% (Exceeded)
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>TELEPHONE CONNECT RATE</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#059669', marginTop: 8 }}>
            84.2%
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Avg response time: 4m 12s
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>CLOSED VALUE</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#7c3aed', marginTop: 8 }}>
            {tenant?.slug === 'ghl' ? '₹12.5 Cr' : '₹3.4 Cr'}
          </div>
          <div style={{ fontSize: 12, color: '#059669', marginTop: 4, fontWeight: 600 }}>
            +18% against target
          </div>
        </div>
      </div>

      {/* Visual Funnel and Calling Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20 }}>
        {/* Conversion Funnel Card */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
            Lead-to-Close Conversion Funnel
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: '1. Inbound Leads Captured', count: 142, pct: '100%', color: '#3b82f6' },
              { label: '2. Contacted via Phone / WhatsApp', count: 120, pct: '84.5%', color: '#6366f1' },
              { label: tenant?.slug === 'jamin' ? '3. Site Visit Completed' : '3. Advisory Consultation Completed', count: 54, pct: '38.0%', color: '#8b5cf6' },
              { label: tenant?.slug === 'jamin' ? '4. Plot Selected / Hold' : '4. Mandate Term Sheet Shared', count: 32, pct: '22.5%', color: '#ec4899' },
              { label: '5. Converted / Closed Won', count: 26, pct: '18.3%', color: '#10b981' },
            ].map((step, idx) => (
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
        </div>

        {/* Call Outcomes Distribution Card */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
            Call Center Outcomes Distribution
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { disposition: 'Interested / Progressing', count: 68, pct: 45, color: '#10b981' },
              { disposition: 'Follow-up Scheduled', count: 42, pct: 28, color: '#f59e0b' },
              { disposition: 'Call Back Requested', count: 22, pct: 15, color: '#3b82f6' },
              { disposition: 'Not Interested / Lost', count: 12, pct: 8, color: '#ef4444' },
              { disposition: 'No Response / Voicemail', count: 6, pct: 4, color: '#94a3b8' },
            ].map((disp, idx) => (
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
        </div>
      </div>

      {/* Agent Performance Leaderboard (Manager/Admin View) */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-base)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Award size={18} color="#f59e0b" />
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Sales Agent Performance Leaderboard</h3>
        </div>

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
            {[
              { name: 'Vikram Malhotra', role: 'Head of Wealth Advisory', calls: 94, duration: '5m 12s', converted: 12, revenue: '₹8.5 Cr' },
              { name: 'Ananya Iyer', role: 'Senior Sales Executive', calls: 142, duration: '4m 05s', converted: 9, revenue: '₹4.0 Cr' },
              { name: 'Pooja Hegde', role: 'Client Relationship Manager', calls: 168, duration: '3m 48s', converted: 14, revenue: '₹3.2 Cr' },
            ].map((agent, aIdx) => (
              <tr key={aIdx} style={{ borderBottom: '1px solid var(--border-base)' }}>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{agent.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{agent.role}</div>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600 }}>{agent.calls}</td>
                <td style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>{agent.duration}</td>
                <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: '#059669' }}>
                  {agent.converted}
                </td>
                <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 800, color: '#2563eb' }}>
                  {agent.revenue}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
