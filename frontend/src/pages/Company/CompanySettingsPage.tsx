import React, { useState } from 'react';
import { Settings, Save, Building2, Clock, Globe, Shield, Library } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DocumentUploader } from '../../components/common/DocumentUploader';
import { DocumentList } from '../../components/common/DocumentList';
import { PERMISSIONS } from '../../constants/permissions';

export const CompanySettingsPage: React.FC = () => {
  const { tenant, permissions } = useAuth();
  const canManageSettings = permissions.includes(PERMISSIONS.SETTINGS_UPDATE);
  const [companyName, setCompanyName] = useState(tenant?.name || '');
  const [tagline, setTagline] = useState(tenant?.tagline || '');
  const [timezone, setTimezone] = useState(tenant?.timezone || 'Asia/Kolkata (IST)');
  const [businessHours, setBusinessHours] = useState(tenant?.businessHours || '09:30 AM - 07:00 PM IST');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Settings size={24} color="var(--primary-600)" /> Company Profile & Settings
          </h1>
          <p className="page-subtitle">
            Configure organization branding, business hours, and operational defaults for {tenant?.name}.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {savedSuccess && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#059669',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            ✓ Settings saved successfully!
          </div>
        )}

        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>General Organization Profile</h3>

          <div className="form-group">
            <label className="form-label">Legal Organization Name</label>
            <input
              type="text"
              className="form-input"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Industry Subtitle / Tagline</label>
            <input
              type="text"
              className="form-input"
              value={tagline}
              onChange={e => setTagline(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Primary Timezone</label>
              <input
                type="text"
                className="form-input"
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Calling Business Hours</label>
              <input
                type="text"
                className="form-input"
                value={businessHours}
                onChange={e => setBusinessHours(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Subscription Feature Entitlements</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            These modules are enabled by your Platform Super Admin contract:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {tenant?.enabledFeatures.map(f => (
              <span
                key={f}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  color: 'var(--primary-600)',
                  fontSize: 11,
                  fontWeight: 600,
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                }}
              >
                ✓ {f}
              </span>
            ))}
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
          <Save size={15} /> Save Organization Settings
        </button>
      </form>

      {/* ── Company Document Library ── */}
      {tenant && (
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 680 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Library size={17} color="var(--primary-600)" />
              Company Document Library
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              Shared brochures, policy documents, and price lists available to all sales agents during calls.
            </p>
          </div>

          <DocumentUploader
            entityType="company"
            entityId={tenant.id}
            allowedCategories={['Brochure', 'Price List', 'Terms & Conditions', 'Policy Document', 'Other']}
          />

          <DocumentList
            entityType="company"
            entityId={tenant.id}
            canDelete={canManageSettings}
          />
        </div>
      )}
    </div>
  );
};
