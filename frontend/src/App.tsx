import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { AuthLayout } from './layouts/AuthLayout';
import { SalesLayout } from './layouts/SalesLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Sales Core Pages
import { DashboardPage } from './pages/Dashboard/DashboardPage';
import { LeadsPage } from './pages/Leads/LeadsPage';
import { CustomersPage } from './pages/Customers/CustomersPage';
import { PipelinePage } from './pages/Pipeline/PipelinePage';
import { DealsPage } from './pages/Deals/DealsPage';
import { FollowupsPage } from './pages/Followups/FollowupsPage';
import { CallCenterPage } from './pages/CallCenter/CallCenterPage';
import { CallHistoryPage } from './pages/CallHistory/CallHistoryPage';
import { ReportsPage } from './pages/Reports/ReportsPage';
import { NotificationsPage } from './pages/Notifications/NotificationsPage';

// Tenant Specific: Jamin
import { ProjectsPage } from './pages/Properties/ProjectsPage';
import { PlotsPage } from './pages/Plots/PlotsPage';
import { SiteVisitsPage } from './pages/SiteVisits/SiteVisitsPage';
import { BookingsPage } from './pages/Bookings/BookingsPage';

// Tenant Specific: GHL
import { InvestorsPage } from './pages/Investors/InvestorsPage';
import { ConsultationsPage } from './pages/Consultations/ConsultationsPage';
import { OpportunitiesPage } from './pages/InvestmentOpportunities/OpportunitiesPage';

// Company Admin
import { CompanyUsersPage } from './pages/Company/CompanyUsersPage';
import { CompanySettingsPage } from './pages/Company/CompanySettingsPage';
import { CompanyAuditPage } from './pages/Company/CompanyAuditPage';

// Super Admin Platform Pages
import { PlatformDashboardPage } from './pages/Admin/Dashboard/PlatformDashboardPage';
import { CompaniesPage } from './pages/Admin/Companies/CompaniesPage';
import { PlatformUsersPage } from './pages/Admin/Users/PlatformUsersPage';
import { PlatformRolesPage } from './pages/Admin/Roles/PlatformRolesPage';
import { PlatformFeaturesPage } from './pages/Admin/Features/PlatformFeaturesPage';
import { PlatformCallConfigPage } from './pages/Admin/CallConfig/PlatformCallConfigPage';
import { PlatformAuditPage } from './pages/Admin/Audit/PlatformAuditPage';

// Guards
import { ProtectedRoute } from './components/common/Guards';
import { Modal } from './components/common/Modal';
import { storageService } from './services/storageService';

export const App: React.FC = () => {
  const { isAuthenticated, isSuperAdmin, tenant, user } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>('dashboard');

  // Quick Create Modal State
  const [quickCreateType, setQuickCreateType] = useState<
    'lead' | 'followup' | 'deal' | 'visit' | 'consultation' | null
  >(null);

  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('+91 ');
  const [quickNotes, setQuickNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [scheduledTime, setScheduledTime] = useState('11:00');

  // Handle route change
  const navigate = (route: string) => {
    setCurrentRoute(route);
  };

  const handleOpenQuickCreate = (type: 'lead' | 'followup' | 'deal' | 'visit' | 'consultation') => {
    setQuickCreateType(type);
    setQuickName('');
    setQuickNotes('');
    setScheduledDate(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    setScheduledTime('11:00');
  };

  const handleSaveQuickCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName) return;

    if (quickCreateType === 'lead') {
      storageService.saveLead({
        id: `lead-${Date.now()}`,
        companyId: tenant?.id || 't-ghl-01',
        name: quickName,
        phone: quickPhone,
        email: '',
        location: 'Bengaluru',
        source: 'Quick Create',
        status: 'New',
        priority: 'Medium',
        assignedAgentId: user?.id || 'usr-exec',
        assignedAgentName: user?.name || 'Agent',
        createdAt: new Date().toISOString().split('T')[0],
        notes: quickNotes,
        customFields: {},
      });
    } else if (quickCreateType === 'followup') {
      const combinedDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();
      storageService.saveFollowup({
        id: `flw-${Date.now()}`,
        companyId: tenant?.id || 't-ghl-01',
        contactId: `contact-${Date.now()}`,
        contactName: quickName,
        contactPhone: quickPhone,
        contactType: 'lead',
        scheduledAt: combinedDateTime,
        scheduledDate,
        scheduledTime,
        priority: 'High',
        status: 'Pending',
        notes: quickNotes,
        assignedAgentId: user?.id || 'usr-exec',
        assignedAgentName: user?.name || 'Agent',
      });
    } else if (quickCreateType === 'deal') {
      storageService.saveDeal({
        id: `deal-${Date.now()}`,
        companyId: tenant?.id || 't-ghl-01',
        title: quickName,
        customerId: `cust-${Date.now()}`,
        customerName: quickNotes || 'Direct Customer',
        stage: 'new',
        value: 5000000,
        expectedCloseDate: '30 Days',
        assignedAgentId: user?.id || 'usr-exec',
        assignedAgentName: user?.name || 'Agent',
        notes: quickNotes,
        createdAt: new Date().toISOString().split('T')[0],
      });
    }

    setQuickCreateType(null);
  };

  // If unauthenticated
  if (!isAuthenticated) {
    return <AuthLayout />;
  }

  // Super Admin Console
  if (isSuperAdmin) {
    return (
      <AdminLayout currentRoute={currentRoute} onNavigate={navigate}>
        {currentRoute === 'admin-dashboard' || currentRoute === 'dashboard' ? (
          <PlatformDashboardPage onNavigate={navigate} />
        ) : currentRoute === 'admin-companies' ? (
          <CompaniesPage />
        ) : currentRoute === 'admin-users' ? (
          <PlatformUsersPage />
        ) : currentRoute === 'admin-roles' ? (
          <PlatformRolesPage />
        ) : currentRoute === 'admin-features' ? (
          <PlatformFeaturesPage />
        ) : currentRoute === 'admin-call-config' ? (
          <PlatformCallConfigPage />
        ) : currentRoute === 'admin-audit' ? (
          <PlatformAuditPage />
        ) : (
          <PlatformDashboardPage onNavigate={navigate} />
        )}
      </AdminLayout>
    );
  }

  // Company User Layout (GHL & Jamin)
  return (
    <SalesLayout
      currentRoute={currentRoute}
      onNavigate={navigate}
      onOpenQuickCreate={handleOpenQuickCreate}
    >
      {currentRoute === 'dashboard' ? (
        <DashboardPage onNavigate={navigate} onOpenQuickCreate={handleOpenQuickCreate} />
      ) : currentRoute === 'leads' ? (
        <LeadsPage />
      ) : currentRoute === 'customers' ? (
        <CustomersPage />
      ) : currentRoute === 'pipeline' ? (
        <PipelinePage />
      ) : currentRoute === 'deals' ? (
        <DealsPage onNavigate={navigate} />
      ) : currentRoute === 'followups' ? (
        <FollowupsPage />
      ) : currentRoute === 'call-center' ? (
        <CallCenterPage />
      ) : currentRoute === 'call-history' ? (
        <CallHistoryPage />
      ) : currentRoute === 'projects' ? (
        <ProjectsPage onNavigate={navigate} />
      ) : currentRoute === 'plots' ? (
        <PlotsPage />
      ) : currentRoute === 'site-visits' ? (
        <SiteVisitsPage />
      ) : currentRoute === 'bookings' ? (
        <BookingsPage />
      ) : currentRoute === 'investors' ? (
        <InvestorsPage />
      ) : currentRoute === 'consultations' ? (
        <ConsultationsPage />
      ) : currentRoute === 'opportunities' ? (
        <OpportunitiesPage />
      ) : currentRoute === 'reports' ? (
        <ReportsPage />
      ) : currentRoute === 'notifications' ? (
        <NotificationsPage onNavigate={navigate} />
      ) : currentRoute === 'company-users' ? (
        <CompanyUsersPage />
      ) : currentRoute === 'company-settings' ? (
        <CompanySettingsPage />
      ) : currentRoute === 'company-audit' ? (
        <CompanyAuditPage />
      ) : (
        <DashboardPage onNavigate={navigate} onOpenQuickCreate={handleOpenQuickCreate} />
      )}

      {/* Global Quick Action Modal */}
      <Modal
        isOpen={!!quickCreateType}
        onClose={() => setQuickCreateType(null)}
        title={`Quick Create: ${quickCreateType?.toUpperCase()}`}
        subtitle={`Instant creation into ${tenant?.name}`}
      >
        <form onSubmit={handleSaveQuickCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">
              {quickCreateType === 'deal' ? 'Deal Title *' : 'Contact Name *'}
            </label>
            <input
              type="text"
              className="form-input"
              required
              value={quickName}
              onChange={e => setQuickName(e.target.value)}
              placeholder="e.g. Ramesh Chandra"
            />
          </div>

          {quickCreateType !== 'deal' && (
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                value={quickPhone}
                onChange={e => setQuickPhone(e.target.value)}
              />
            </div>
          )}

          {quickCreateType === 'followup' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Scheduled Date *</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Scheduled Time *</label>
                <input
                  type="time"
                  className="form-input"
                  required
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Quick Notes</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={quickNotes}
              onChange={e => setQuickNotes(e.target.value)}
              placeholder="Brief requirement summary..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setQuickCreateType(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Entry
            </button>
          </div>
        </form>
      </Modal>
    </SalesLayout>
  );
};

export default App;
