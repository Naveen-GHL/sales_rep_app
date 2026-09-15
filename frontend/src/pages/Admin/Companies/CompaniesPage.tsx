import React, { useState, useEffect } from 'react';
import { Building2, Plus, ArrowRight, Eye } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { storageService } from '../../../services/storageService';
import { Tenant, User } from '../../../types';
import { StatusChip } from '../../../components/common/StatusChip';
import { Modal } from '../../../components/common/Modal';
import { FEATURES } from '../../../constants/features';

export const CompaniesPage: React.FC = () => {
  const { switchPersona } = useAuth();
  const [companies, setCompanies] = useState<Tenant[]>(() => storageService.getTenants());

  useEffect(() => {
    const handleUpdate = () => setCompanies(storageService.getTenants());
    window.addEventListener('nexus_storage_updated', handleUpdate);
    return () => window.removeEventListener('nexus_storage_updated', handleUpdate);
  }, []);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  // Wizard state
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newIndustry, setNewIndustry] = useState('Commercial Real Estate');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    FEATURES.LEADS,
    FEATURES.CUSTOMERS,
    FEATURES.DEALS,
    FEATURES.CALLS,
    FEATURES.CALL_RECORDING,
    FEATURES.REPORTS,
  ]);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [didNumber, setDidNumber] = useState('+91 80 4700 9000');
  const [routingStrategy, setRoutingStrategy] = useState('Round-Robin');

  const toggleFeature = (feat: string) => {
    if (selectedFeatures.includes(feat)) {
      setSelectedFeatures(selectedFeatures.filter(f => f !== feat));
    } else {
      setSelectedFeatures([...selectedFeatures, feat]);
    }
  };

  const handleCompleteOnboarding = () => {
    if (!newCompanyName.trim()) return;
    const cleanSlug = newCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const slug = cleanSlug || `tenant-${Date.now().toString().slice(-4)}`;

    const newTenant: Tenant = {
      id: `t-${slug}-${Date.now()}`,
      name: newCompanyName.trim(),
      legalName: newCompanyName.trim(),
      slug,
      brandColor: '#8b5cf6',
      industry: newIndustry,
      tagline: `${newIndustry} Solutions`,
      enabledFeatures: selectedFeatures,
      timezone: 'Asia/Kolkata (IST)',
      currency: '₹ INR',
      businessHours: '09:00 AM - 06:00 PM IST',
      email: adminEmail.trim() || `admin@${slug}.com`,
      phone: didNumber,
      defaultRoutingStrategy: routingStrategy,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };

    storageService.saveTenant(newTenant);

    // Also provision the primary company admin account
    const newAdminUser: User = {
      id: `usr-${slug}-admin-${Date.now()}`,
      name: adminName.trim() || `${newCompanyName.trim()} Admin`,
      email: adminEmail.trim() || `admin@${slug}.com`,
      phone: didNumber || '+91 80 4700 9000',
      companyId: newTenant.id,
      companySlug: slug,
      companyName: newTenant.name,
      role: {
        id: 'r-company-admin',
        name: 'Company Admin',
        code: 'company_admin',
        permissions: [],
      },
      status: 'Active',
      createdAt: new Date().toISOString(),
    };
    storageService.saveUser(newAdminUser);

    storageService.addAuditLog({
      id: `aud-${Date.now()}`,
      timestamp: 'Just now',
      actorName: 'Super Admin',
      actorEmail: 'alex@nexusplatform.io',
      action: 'TENANT_ONBOARDED',
      entityType: 'Tenant',
      entityId: newTenant.id,
      companyId: newTenant.id,
      companyName: newTenant.name,
      details: `Provisioned tenant ${newTenant.name} with ${selectedFeatures.length} modules and admin ${newAdminUser.email}`,
    });

    setIsOnboardingModalOpen(false);
    setWizardStep(1);
    setNewCompanyName('');
    setAdminName('');
    setAdminEmail('');
  };

  const renderCompanyLogo = (c: Tenant) => {
    if (c.slug === 'ghl' || c.logo?.includes('ghl') || c.logo?.includes('Ventures')) {
      return (
        <div
          style={{
            height: 44,
            padding: '4px 8px',
            borderRadius: 8,
            backgroundColor: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #334155',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            flexShrink: 0,
          }}
        >
          <img
            src="/og-image -GHL Ventures.png"
            alt={c.name}
            style={{ height: 32, maxWidth: 120, objectFit: 'contain', display: 'block' }}
          />
        </div>
      );
    }
    if (c.slug === 'jamin' || c.logo?.includes('jamin')) {
      return (
        <div
          style={{
            height: 44,
            padding: '4px 8px',
            borderRadius: 8,
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #334155',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            flexShrink: 0,
          }}
        >
          <img
            src="/jamin-logo.png"
            alt={c.name}
            style={{ height: 32, maxWidth: 110, objectFit: 'contain', display: 'block' }}
          />
        </div>
      );
    }
    if (c.logo) {
      return (
        <img
          src={c.logo}
          alt={c.name}
          style={{ height: 44, maxWidth: 120, objectFit: 'contain', borderRadius: 8, flexShrink: 0 }}
        />
      );
    }
    return (
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 8,
          background: `linear-gradient(135deg, ${c.brandColor || '#8b5cf6'} 0%, #1e1b4b 100%)`,
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
          fontSize: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          flexShrink: 0,
        }}
      >
        {c.name.charAt(0).toUpperCase()}
      </div>
    );
  };

  const isStepValid = () => {
    if (wizardStep === 1) return newCompanyName.trim().length > 0;
    if (wizardStep === 4) return adminName.trim().length > 0 && adminEmail.trim().length > 0;
    return true;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#ffffff' }}>
            <Building2 size={24} color="#8b5cf6" /> Tenant Companies & Organizations
          </h1>
          <p className="page-subtitle" style={{ color: '#94a3b8' }}>
            Onboard new enterprises, provision feature entitlement packages, and manage cross-tenant accounts.
          </p>
        </div>

        <button
          className="btn btn-primary"
          style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' }}
          onClick={() => {
            setWizardStep(1);
            setIsOnboardingModalOpen(true);
          }}
        >
          <Plus size={15} /> Onboard New Tenant (6-Step Wizard)
        </button>
      </div>

      {/* Companies List Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
        {companies.map(c => (
          <div key={c.id} className="card card-hover" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16, backgroundColor: '#0f172a', borderColor: '#334155' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {renderCompanyLogo(c)}
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>{c.name}</h3>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>ID: {c.id}</div>
                </div>
              </div>

              <StatusChip status={c.status || 'Active'} size="sm" />
            </div>

            <p style={{ fontSize: 12, color: '#cbd5e1' }}>{c.tagline}</p>

            <div style={{ backgroundColor: '#1e293b', padding: '12px 14px', borderRadius: 'var(--radius-md)', fontSize: 12 }}>
              <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: 6 }}>
                Active Entitlement Package ({c.enabledFeatures.length} features):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {c.enabledFeatures.slice(0, 6).map((f: string) => (
                  <span
                    key={f}
                    style={{
                      fontSize: 10,
                      padding: '2px 6px',
                      borderRadius: 4,
                      backgroundColor: 'rgba(139, 92, 246, 0.2)',
                      color: '#c084fc',
                      fontWeight: 600,
                    }}
                  >
                    {f}
                  </span>
                ))}
                {c.enabledFeatures.length > 6 && (
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>
                    +{c.enabledFeatures.length - 6} more
                  </span>
                )}
              </div>
            </div>

            {/* Drill-in "View as Company" action (Blueprint Section 7.16) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #334155', paddingTop: 14, marginTop: 'auto' }}>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                {c.businessHours}
              </span>

              <button
                className="btn btn-secondary btn-sm"
                style={{ backgroundColor: '#1e293b', color: '#ffffff', borderColor: '#475569' }}
                title="Impersonate / Drill into tenant workspace"
                onClick={() => switchPersona('company_admin', c.slug)}
              >
                <Eye size={13} /> View as Company
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 6-Step Onboarding Wizard Modal (Blueprint Section 7.16) */}
      <Modal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
        title={`Tenant Onboarding Wizard (Step ${wizardStep} of 6)`}
        subtitle="Provision isolated tenant workspace with feature entitlements and phone routing"
        maxWidth={620}
        footer={
          <>
            {wizardStep > 1 && (
              <button
                className="btn btn-secondary"
                onClick={() => setWizardStep(s => s - 1)}
              >
                Back
              </button>
            )}

            {wizardStep < 6 ? (
              <button
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                  opacity: isStepValid() ? 1 : 0.5,
                  cursor: isStepValid() ? 'pointer' : 'not-allowed',
                }}
                disabled={!isStepValid()}
                onClick={() => isStepValid() && setWizardStep(s => s + 1)}
              >
                Next Step <ArrowRight size={14} />
              </button>
            ) : (
              <button
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  opacity: isStepValid() ? 1 : 0.5,
                  cursor: isStepValid() ? 'pointer' : 'not-allowed',
                }}
                disabled={!isStepValid()}
                onClick={handleCompleteOnboarding}
              >
                Review & Activate Tenant
              </button>
            )}
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Step 1: Details */}
          {wizardStep === 1 && (
            <>
              <h4 style={{ fontSize: 14, fontWeight: 700 }}>Step 1: Organization Details</h4>
              <div className="form-group">
                <label className="form-label">Legal Company Name *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={newCompanyName}
                  onChange={e => setNewCompanyName(e.target.value)}
                  placeholder="e.g. Prestige Plotted Ventures"
                />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Required to generate tenant namespace and isolated storage.
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Industry Domain *</label>
                <select
                  className="form-select"
                  value={newIndustry}
                  onChange={e => setNewIndustry(e.target.value)}
                >
                  <option value="Plotted Communities & Farmland">Plotted Communities & Farmland (Real Estate)</option>
                  <option value="Commercial High-Yield REITs">Commercial High-Yield REITs (Wealth Advisory)</option>
                  <option value="Luxury Residential">Luxury Residential Villa Development</option>
                  <option value="Logistics & Warehousing Parks">Logistics & Warehousing Parks</option>
                </select>
              </div>
            </>
          )}

          {/* Step 2: Feature Package Checklist */}
          {wizardStep === 2 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: 14, fontWeight: 700 }}>Step 2: Feature Package Selection</h4>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 11, padding: '2px 8px' }}
                    onClick={() => setSelectedFeatures(Object.values(FEATURES))}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 11, padding: '2px 8px' }}
                    onClick={() => setSelectedFeatures([])}
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Select entitlement flags to be activated for this company ({selectedFeatures.length} of {Object.values(FEATURES).length} active):
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {Object.values(FEATURES).map((val: string) => (
                  <label
                    key={val}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 12,
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: selectedFeatures.includes(val)
                        ? 'rgba(139, 92, 246, 0.1)'
                        : 'var(--bg-surface-hover)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFeatures.includes(val)}
                      onChange={() => toggleFeature(val)}
                      style={{ width: 15, height: 15 }}
                    />
                    <span style={{ fontWeight: selectedFeatures.includes(val) ? 700 : 400 }}>
                      {val}
                    </span>
                  </label>
                ))}
              </div>
            </>
          )}

          {/* Step 3: Default Roles */}
          {wizardStep === 3 && (
            <>
              <h4 style={{ fontSize: 14, fontWeight: 700 }}>Step 3: Default Role Templates</h4>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                The following standard RBAC role definitions will be provisioned in the tenant's namespace:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {['Company Admin (Full tenant privileges)', 'Sales Manager (Team management, reports, reassignment)', 'Sales Executive (Own leads, calling dialer, status updates)'].map((r, i) => (
                  <div key={i} style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface-hover)', fontSize: 12 }}>
                    ✓ <strong>{r}</strong>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Step 4: Admin Account */}
          {wizardStep === 4 && (
            <>
              <h4 style={{ fontSize: 14, fontWeight: 700 }}>Step 4: Initial Company Admin Account</h4>
              <div className="form-group">
                <label className="form-label">Admin Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={adminName}
                  onChange={e => setAdminName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Corporate Email Address *</label>
                <input
                  type="email"
                  className="form-input"
                  required
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  placeholder="ramesh@company.com"
                />
              </div>
            </>
          )}

          {/* Step 5: Call Configuration */}
          {wizardStep === 5 && (
            <>
              <h4 style={{ fontSize: 14, fontWeight: 700 }}>Step 5: Telephony & Call Routing Configuration</h4>
              <div className="form-group">
                <label className="form-label">Virtual Inbound DID Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={didNumber}
                  onChange={e => setDidNumber(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Routing Strategy</label>
                <select
                  className="form-select"
                  value={routingStrategy}
                  onChange={e => setRoutingStrategy(e.target.value)}
                >
                  <option value="Round-Robin">Round-Robin (Equally distributed among available agents)</option>
                  <option value="Least-Busy">Least-Busy Agent (Shortest cumulative talk time)</option>
                  <option value="Skill-Based">Skill-Based / VIP Priority Routing</option>
                </select>
              </div>
            </>
          )}

          {/* Step 6: Review & Activate */}
          {wizardStep === 6 && (
            <>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>
                Step 6: Review Configuration & Activate
              </h4>
              <div style={{ padding: 16, backgroundColor: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <div><strong>Company:</strong> {newCompanyName || 'New Venture'} ({newIndustry})</div>
                <div><strong>Admin:</strong> {adminName || 'Admin'} ({adminEmail || 'admin@company.com'})</div>
                <div><strong>DID Number:</strong> {didNumber} ({routingStrategy})</div>
                <div><strong>Enabled Modules:</strong> {selectedFeatures.join(', ')}</div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};