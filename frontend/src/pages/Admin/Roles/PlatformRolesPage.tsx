import React, { useState } from 'react';
import { Shield, Check, Save } from 'lucide-react';
import { PERMISSIONS } from '../../../constants/permissions';
import { ROLES } from '../../../services/mockData';

export const PlatformRolesPage: React.FC = () => {
  const [savedSuccess, setSavedSuccess] = useState(false);

  const permissionGroups = [
    {
      group: 'Leads Management',
      keys: [
        PERMISSIONS.LEADS_VIEW,
        PERMISSIONS.LEADS_CREATE,
        PERMISSIONS.LEADS_UPDATE,
        PERMISSIONS.LEADS_DELETE,
        PERMISSIONS.LEADS_ASSIGN,
        PERMISSIONS.LEADS_CONVERT,
        PERMISSIONS.LEADS_EXPORT,
        PERMISSIONS.LEADS_IMPORT,
      ],
    },
    {
      group: 'Customer 360 & Deals',
      keys: [
        PERMISSIONS.CUSTOMERS_VIEW,
        PERMISSIONS.CUSTOMERS_CREATE,
        PERMISSIONS.CUSTOMERS_UPDATE,
        PERMISSIONS.DEALS_VIEW,
        PERMISSIONS.DEALS_CREATE,
        PERMISSIONS.DEALS_UPDATE,
      ],
    },
    {
      group: 'Telephony & Live Calling',
      keys: [
        PERMISSIONS.CALLS_MAKE,
        PERMISSIONS.CALLS_RECEIVE,
        PERMISSIONS.CALLS_VIEW,
        PERMISSIONS.CALLS_RECORDINGS_PLAY,
      ],
    },
    {
      group: 'Operations & Real Estate (Jamin)',
      keys: [
        PERMISSIONS.PROPERTIES_VIEW,
        PERMISSIONS.PROPERTIES_UPDATE,
        PERMISSIONS.SITE_VISITS_VIEW,
        PERMISSIONS.SITE_VISITS_CREATE,
        PERMISSIONS.BOOKINGS_VIEW,
        PERMISSIONS.BOOKINGS_CREATE,
      ],
    },
    {
      group: 'Investors & Advisory (GHL)',
      keys: [
        PERMISSIONS.INVESTORS_VIEW,
        PERMISSIONS.INVESTORS_CREATE,
        PERMISSIONS.CONSULTATIONS_VIEW,
        PERMISSIONS.CONSULTATIONS_CREATE,
        PERMISSIONS.OPPORTUNITIES_VIEW,
        PERMISSIONS.OPPORTUNITIES_CREATE,
      ],
    },
    {
      group: 'Analytics & Administration',
      keys: [
        PERMISSIONS.REPORTS_VIEW,
        PERMISSIONS.REPORTS_EXPORT,
        PERMISSIONS.USERS_VIEW,
        PERMISSIONS.USERS_MANAGE,
        PERMISSIONS.SETTINGS_VIEW,
        PERMISSIONS.SETTINGS_UPDATE,
      ],
    },
  ];

  const roles = [
    { code: 'company_admin', name: 'Company Admin', desc: 'Full Tenant Scope' },
    { code: 'sales_manager', name: 'Sales Manager', desc: 'Team Scope' },
    { code: 'sales_executive', name: 'Sales Executive', desc: 'Own Assigned Records' },
  ];

  const hasPermission = (roleCode: string, perm: string) => {
    return ROLES[roleCode]?.permissions.includes(perm);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#ffffff' }}>
            <Shield size={24} color="#8b5cf6" /> Master Role-Permission Matrix
          </h1>
          <p className="page-subtitle" style={{ color: '#94a3b8' }}>
            Canonical RBAC privilege grid defining system behaviors for tenant roles.
          </p>
        </div>

        <button
          className="btn btn-primary"
          style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' }}
          onClick={() => {
            setSavedSuccess(true);
            setTimeout(() => setSavedSuccess(false), 2500);
          }}
        >
          <Save size={15} /> Save Matrix Definitions
        </button>
      </div>

      {savedSuccess && (
        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderRadius: 8, border: '1px solid #10b981' }}>
          ✓ Role permission matrix updated across all active tenant nodes.
        </div>
      )}

      <div className="card" style={{ padding: 0, backgroundColor: '#0f172a', borderColor: '#334155', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, color: '#cbd5e1' }}>
          <thead>
            <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: 11, textTransform: 'uppercase' }}>
              <th style={{ padding: '14px 20px', textAlign: 'left', width: '40%' }}>Action / Permission Key</th>
              {roles.map(r => (
                <th key={r.code} style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <div style={{ color: '#ffffff', fontWeight: 700 }}>{r.name}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'none' }}>{r.desc}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissionGroups.map(group => (
              <React.Fragment key={group.group}>
                <tr style={{ background: '#141e33', borderBottom: '1px solid #334155' }}>
                  <td colSpan={4} style={{ padding: '8px 20px', fontWeight: 800, color: '#8b5cf6', fontSize: 12 }}>
                    ● {group.group.toUpperCase()}
                  </td>
                </tr>
                {group.keys.map(key => (
                  <tr key={key} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '10px 20px', fontFamily: 'monospace', fontSize: 12 }}>
                      {key}
                    </td>
                    {roles.map(r => (
                      <td key={r.code} style={{ padding: '10px 16px', textAlign: 'center' }}>
                        {hasPermission(r.code, key) ? (
                          <span style={{ color: '#34d399', fontWeight: 800 }}>✓ Granted</span>
                        ) : (
                          <span style={{ color: '#64748b' }}>—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
