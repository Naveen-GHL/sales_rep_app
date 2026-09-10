import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Building2, UserCheck, RefreshCw, ChevronDown } from 'lucide-react';
import { storageService } from '../../services/storageService';

export const PersonaSwitcher: React.FC = () => {
  const { user, tenant, isSuperAdmin, switchPersona } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const personas = [
    {
      label: 'Super Admin (Console)',
      role: 'super_admin' as const,
      badge: 'Platform Operator',
      icon: <Shield size={14} color="#8b5cf6" />,
      desc: 'Cross-tenant administration, onboarding wizard, audit logs',
    },
    {
      label: 'GHL India (Admin)',
      role: 'company_admin' as const,
      slug: 'ghl' as const,
      badge: 'Wealth & Advisory',
      icon: <Building2 size={14} color="#0284c7" />,
      desc: 'Investors, Consultations, Opportunities, Full Admin',
    },
    {
      label: 'GHL India (Executive)',
      role: 'sales_executive' as const,
      slug: 'ghl' as const,
      badge: 'Sales Agent',
      icon: <UserCheck size={14} color="#0284c7" />,
      desc: 'Assigned Leads, Calling, Consultations',
    },
    {
      label: 'Jamin Bazaar (Admin)',
      role: 'company_admin' as const,
      slug: 'jamin' as const,
      badge: 'Plotted Real Estate',
      icon: <Building2 size={14} color="#059669" />,
      desc: 'Plot Inventory, Site Visits, Bookings, Full Admin',
    },
    {
      label: 'Jamin Bazaar (Executive)',
      role: 'sales_executive' as const,
      slug: 'jamin' as const,
      badge: 'Sales Agent',
      icon: <UserCheck size={14} color="#059669" />,
      desc: 'Assigned Leads, Calling, Plot Holds, Site Visits',
    },
  ];

  const handleResetData = () => {
    if (confirm('Reset demo data to initial defaults?')) {
      storageService.resetData();
      window.location.reload();
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="btn btn-secondary btn-sm"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: isSuperAdmin ? 'rgba(139, 92, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
          border: `1px solid ${isSuperAdmin ? '#8b5cf6' : 'var(--primary-500)'}`,
          padding: '5px 12px',
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: isSuperAdmin ? '#8b5cf6' : 'var(--primary-600)' }}>
          ROLE:
        </span>
        <span style={{ fontSize: 12, fontWeight: 600 }}>
          {isSuperAdmin ? 'Super Admin' : `${tenant?.name} (${user?.role.name})`}
        </span>
        <ChevronDown size={14} />
      </button>

      {isOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 1000 }}
            onClick={() => setIsOpen(false)}
          />
          <div
            className="card animate-slide-down"
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 8,
              zIndex: 1050,
              width: 320,
              padding: 8,
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div
              style={{
                padding: '8px 12px 10px',
                borderBottom: '1px solid var(--border-base)',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>Switch Tenant Persona</span>
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 10, padding: '2px 6px', color: 'var(--text-muted)' }}
                onClick={handleResetData}
                title="Reset local storage"
              >
                <RefreshCw size={11} /> Reset Data
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
              {personas.map((p, idx) => {
                const isActive =
                  p.role === 'super_admin'
                    ? isSuperAdmin
                    : tenant?.slug === p.slug && user?.role.code === p.role;

                return (
                  <button
                    key={idx}
                    className="btn btn-ghost"
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isActive ? 'var(--primary-50)' : 'transparent',
                      border: isActive ? '1px solid var(--primary-100)' : '1px solid transparent',
                    }}
                    onClick={() => {
                      switchPersona(p.role, (p as any).slug);
                      setIsOpen(false);
                    }}
                  >
                    <div style={{ marginTop: 2, marginRight: 10 }}>{p.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                          {p.label}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            padding: '1px 6px',
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--bg-surface-hover)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {p.badge}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {p.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
