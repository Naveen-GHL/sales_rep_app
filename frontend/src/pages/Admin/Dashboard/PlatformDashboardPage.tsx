import React from 'react';
import {
  Building2,
  Users,
  PhoneCall,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  TrendingUp,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { storageService } from '../../../services/storageService';

interface PlatformDashboardPageProps {
  onNavigate: (route: string) => void;
}

export const PlatformDashboardPage: React.FC<PlatformDashboardPageProps> = ({ onNavigate }) => {
  const { switchPersona } = useAuth();
  const auditLogs = storageService.getAuditLogs();
  const tenants = storageService.getTenants();
  const users = storageService.getUsers();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Platform Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#ffffff' }}>
            ⚡ Platform Operator Console
          </h1>
          <p className="page-subtitle" style={{ color: '#94a3b8' }}>
            System-wide multi-tenant telemetry, telephony health, and cross-organization activity feeds.
          </p>
        </div>
      </div>

      {/* Cross-Tenant Telemetry Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div className="card" style={{ backgroundColor: '#0f172a', borderColor: '#334155' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>TOTAL TENANT COMPANIES</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#ffffff', marginTop: 8 }}>
            {tenants.length}
          </div>
          <div style={{ fontSize: 12, color: '#38bdf8', marginTop: 4, fontWeight: 600 }}>
            {tenants.map(t => t.name).join(' & ')}
          </div>
        </div>

        <div className="card" style={{ backgroundColor: '#0f172a', borderColor: '#334155' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>PLATFORM ACTIVE USERS</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#ffffff', marginTop: 8 }}>
            {users.length}
          </div>
          <div style={{ fontSize: 12, color: '#34d399', marginTop: 4, fontWeight: 600 }}>
            Registered Accounts
          </div>
        </div>

        <div className="card" style={{ backgroundColor: '#0f172a', borderColor: '#334155' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>SYSTEM CALLS TODAY</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#c084fc', marginTop: 8 }}>
            242
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            Zero carrier drops
          </div>
        </div>

        <div className="card" style={{ backgroundColor: '#0f172a', borderColor: '#334155' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>INFRASTRUCTURE HEALTH</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#34d399', marginTop: 8 }}>
            99.98%
          </div>
          <div style={{ fontSize: 12, color: '#34d399', marginTop: 4, fontWeight: 600 }}>
            All telephony trunks operational
          </div>
        </div>
      </div>

      {/* Per-Company Performance Matrix */}
      <div className="card" style={{ padding: 0, backgroundColor: '#0f172a', borderColor: '#334155', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>Tenant Organization Telemetry</h3>
          <button
            className="btn btn-ghost btn-sm"
            style={{ color: '#c084fc' }}
            onClick={() => onNavigate('admin-companies')}
          >
            Manage Organizations &rarr;
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, color: '#cbd5e1' }}>
          <thead>
            <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: 11, textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 20px', textAlign: 'left' }}>Tenant Name</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Domain Specialization</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Enabled Modules</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Virtual DID</th>
              <th style={{ padding: '12px 20px', textAlign: 'right' }}>Drill-in Support Action</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ fontWeight: 700, color: '#ffffff' }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>ID: {t.id}</div>
                </td>
                <td style={{ padding: '14px 16px' }}>{t.tagline}</td>
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <span style={{ padding: '3px 8px', borderRadius: 10, background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', fontWeight: 600 }}>
                    {t.enabledFeatures.length} Active
                  </span>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'center', fontFamily: 'monospace' }}>
                  +91 80 4700 800{t.slug === 'ghl' ? '1' : '2'}
                </td>
                <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ backgroundColor: '#1e293b', color: '#ffffff', borderColor: '#475569' }}
                    onClick={() => switchPersona('company_admin', t.slug)}
                  >
                    Drill In Read-Only
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Platform Security Audit Feed */}
      <div className="card" style={{ padding: 20, backgroundColor: '#0f172a', borderColor: '#334155' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', marginBottom: 14 }}>
          Live Cross-Tenant Security Audit Stream
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {auditLogs.slice(0, 4).map(l => (
            <div
              key={l.id}
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: 12 }}>
                    [{l.companyName || 'PLATFORM'}]
                  </span>
                  <span style={{ color: '#ffffff', fontWeight: 600, fontSize: 13 }}>{l.action}</span>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{l.details}</div>
              </div>
              <span style={{ fontSize: 11, color: '#64748b' }}>{l.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
