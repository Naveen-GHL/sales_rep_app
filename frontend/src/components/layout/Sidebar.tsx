import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  PhoneCall,
  History,
  Kanban,
  Briefcase,
  CalendarCheck,
  MapPin,
  Grid,
  Calendar,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Bell,
  Settings,
  Shield,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { FEATURES } from '../../constants/features';
import { PERMISSIONS } from '../../constants/permissions';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  feature?: string;
  permission?: string;
  badge?: string | number;
}

interface NavSection {
  header?: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRoute, onNavigate }) => {
  const { isSuperAdmin, tenant, enabledFeatures, permissions } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // Super Admin Navigation Map (Section 4.1)
  const superAdminSections: NavSection[] = [
    {
      items: [
        { id: 'admin-dashboard', label: 'Platform Console', icon: <LayoutDashboard size={18} /> },
        { id: 'admin-companies', label: 'Companies (Tenants)', icon: <Building2 size={18} /> },
        { id: 'admin-users', label: 'Cross-Tenant Users', icon: <Users size={18} /> },
        { id: 'admin-roles', label: 'Roles & Matrix', icon: <Shield size={18} /> },
        { id: 'admin-features', label: 'Feature Packages', icon: <Sparkles size={18} /> },
        { id: 'admin-call-config', label: 'Call Configuration', icon: <PhoneCall size={18} /> },
        { id: 'admin-audit', label: 'Platform Audit Logs', icon: <FileCheck size={18} /> },
      ],
    },
  ];

  // Company User Navigation Map (Section 4.2)
  const companySections: NavSection[] = [
    {
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
      ],
    },
    {
      header: 'Sales',
      items: [
        { id: 'leads', label: 'Leads', icon: <Users size={18} />, feature: FEATURES.LEADS, permission: PERMISSIONS.LEADS_VIEW },
        { id: 'customers', label: 'Customers 360', icon: <Building2 size={18} />, feature: FEATURES.CUSTOMERS, permission: PERMISSIONS.CUSTOMERS_VIEW },
        { id: 'pipeline', label: 'Pipeline', icon: <Kanban size={18} />, feature: FEATURES.DEALS, permission: PERMISSIONS.DEALS_VIEW },
        { id: 'deals', label: 'Deals', icon: <Briefcase size={18} />, feature: FEATURES.DEALS, permission: PERMISSIONS.DEALS_VIEW },
        { id: 'followups', label: 'Follow-ups', icon: <CalendarCheck size={18} />, feature: FEATURES.FOLLOWUPS, permission: PERMISSIONS.FOLLOWUPS_VIEW },
      ],
    },
    {
      header: 'Calling',
      items: [
        { id: 'call-center', label: 'Call Center', icon: <PhoneCall size={18} />, feature: FEATURES.CALLS, permission: PERMISSIONS.CALLS_MAKE },
        { id: 'call-history', label: 'Call History', icon: <History size={18} />, feature: FEATURES.CALLS, permission: PERMISSIONS.CALLS_VIEW },
      ],
    },
    {
      header: 'Operations', // Jamin specific
      items: [
        { id: 'projects', label: 'Projects', icon: <MapPin size={18} />, feature: FEATURES.PROPERTIES, permission: PERMISSIONS.PROPERTIES_VIEW },
        { id: 'plots', label: 'Plot Inventory', icon: <Grid size={18} />, feature: FEATURES.PROPERTIES, permission: PERMISSIONS.PROPERTIES_VIEW },
        { id: 'site-visits', label: 'Site Visits', icon: <Calendar size={18} />, feature: FEATURES.SITE_VISITS, permission: PERMISSIONS.SITE_VISITS_VIEW },
        { id: 'bookings', label: 'Bookings', icon: <CheckCircle size={18} />, feature: FEATURES.BOOKINGS, permission: PERMISSIONS.BOOKINGS_VIEW },
      ],
    },
    {
      header: 'Investors', // GHL specific
      items: [
        { id: 'investors', label: 'Investors 360', icon: <TrendingUp size={18} />, feature: FEATURES.INVESTORS, permission: PERMISSIONS.INVESTORS_VIEW },
        { id: 'consultations', label: 'Consultations', icon: <Calendar size={18} />, feature: FEATURES.CONSULTATIONS, permission: PERMISSIONS.CONSULTATIONS_VIEW },
        { id: 'opportunities', label: 'Opportunities', icon: <Briefcase size={18} />, feature: FEATURES.INVESTMENT_OPPORTUNITIES, permission: PERMISSIONS.OPPORTUNITIES_VIEW },
      ],
    },
    {
      header: 'Analytics',
      items: [
        { id: 'reports', label: 'Reports', icon: <BarChart3 size={18} />, feature: FEATURES.REPORTS, permission: PERMISSIONS.REPORTS_VIEW },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
      ],
    },
    {
      header: 'Administration',
      items: [
        { id: 'company-users', label: 'Users', icon: <Users size={18} />, feature: FEATURES.USERS, permission: PERMISSIONS.USERS_VIEW },
        { id: 'company-settings', label: 'Company Settings', icon: <Settings size={18} />, feature: FEATURES.COMPANY_SETTINGS, permission: PERMISSIONS.SETTINGS_VIEW },
        { id: 'company-audit', label: 'Audit Logs', icon: <FileCheck size={18} />, feature: FEATURES.AUDIT_LOGS, permission: PERMISSIONS.AUDIT_VIEW },
      ],
    },
  ];

  // Helper to filter items based on tenant-enabled features and user permissions
  const filterSection = (section: NavSection): NavItem[] => {
    return section.items.filter(item => {
      if (item.feature && !enabledFeatures.includes(item.feature)) return false;
      if (item.permission && !permissions.includes(item.permission)) return false;
      return true;
    });
  };

  const sectionsToRender = isSuperAdmin ? superAdminSections : companySections;

  return (
    <aside
      style={{
        width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        height: '100vh',
        backgroundColor: isSuperAdmin ? '#0b0f19' : 'var(--bg-surface)',
        borderRight: `1px solid ${isSuperAdmin ? '#1e293b' : 'var(--border-base)'}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width var(--transition-normal)',
        position: 'relative',
        zIndex: 60,
        userSelect: 'none',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          height: 'var(--topbar-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '0' : '0 20px',
          borderBottom: `1px solid ${isSuperAdmin ? '#1e293b' : 'var(--border-base)'}`,
        }}
      >
        {collapsed ? (
          isSuperAdmin ? (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 12,
              }}
            >
              ⚡
            </div>
          ) : tenant?.slug === 'jamin' ? (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#e10600',
                boxShadow: '0 2px 8px rgba(225, 6, 0, 0.3)',
              }}
            >
              <img
                src="/jamin-icon.png"
                alt="Jamin Bazaar"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => {
                  (e.currentTarget as HTMLImageElement).src = '/jamin-logo.png';
                }}
              />
            </div>
          ) : tenant?.slug === 'ghl' ? (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 12,
                letterSpacing: '-0.02em',
                boxShadow: '0 2px 8px rgba(220,38,38,0.35)',
              }}
            >
              GHL
            </div>
          ) : (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: `linear-gradient(135deg, ${tenant?.brandColor || '#8b5cf6'} 0%, #1e1b4b 100%)`,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 12,
              }}
            >
              {tenant?.name?.charAt(0) || 'T'}
            </div>
          )
        ) : tenant?.slug === 'jamin' ? (
          <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
            <img
              src="/jamin-logo.png"
              alt="Jamin Bazaar"
              style={{
                height: 38,
                maxWidth: 175,
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>
        ) : tenant?.slug === 'ghl' ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#0f172a',
              borderRadius: 8,
              padding: '4px 8px',
              overflow: 'hidden',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.15)',
            }}
          >
            <img
              src="/og-image -GHL Ventures.png"
              alt="GHL India Ventures"
              style={{
                height: 32,
                maxWidth: 160,
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>
        ) : !isSuperAdmin ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            {tenant?.logo ? (
              <img
                src={tenant.logo}
                alt={tenant.name}
                style={{ height: 38, maxWidth: 175, objectFit: 'contain', display: 'block' }}
              />
            ) : (
              <>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    minWidth: 36,
                    borderRadius: 10,
                    background: `linear-gradient(135deg, ${tenant?.brandColor || '#8b5cf6'} 0%, #1e1b4b 100%)`,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: 14,
                  }}
                >
                  {tenant?.name?.charAt(0) || 'T'}
                </div>
                <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      fontSize: 14,
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {tenant?.name}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: 600,
                    }}
                  >
                    {tenant?.tagline
                      ? tenant.tagline.length > 26
                        ? tenant.tagline.slice(0, 26) + '...'
                        : tenant.tagline
                      : 'Workspace'}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            <div
              style={{
                width: 38,
                height: 38,
                minWidth: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 13,
              }}
            >
              ⚡
            </div>
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 15,
                  color: isSuperAdmin ? '#ffffff' : 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                Platform Operator
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 600,
                }}
              >
                Super Admin Console
              </div>
            </div>
          </div>
        )}

        <button
          className="btn btn-ghost btn-icon btn-sm"
          style={{ color: isSuperAdmin ? '#94a3b8' : 'var(--text-muted)' }}
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {sectionsToRender.map((sec, sIdx) => {
          const visibleItems = filterSection(sec);
          // Omit section headers if zero children are permitted/enabled (Section 4.2 rule)
          if (visibleItems.length === 0) return null;

          return (
            <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {sec.header && !collapsed && (
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: isSuperAdmin ? '#64748b' : 'var(--text-muted)',
                    padding: '6px 12px 2px',
                  }}
                >
                  {sec.header}
                </div>
              )}

              {visibleItems.map(item => {
                const isActive = currentRoute === item.id;

                return (
                  <button
                    key={item.id}
                    className="btn btn-ghost"
                    style={{
                      width: '100%',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      padding: collapsed ? '10px 0' : '9px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isActive
                        ? isSuperAdmin
                          ? 'rgba(139, 92, 246, 0.18)'
                          : 'rgba(59, 130, 246, 0.1)'
                        : 'transparent',
                      color: isActive
                        ? isSuperAdmin
                          ? '#c084fc'
                          : 'var(--primary-600)'
                        : isSuperAdmin
                          ? '#cbd5e1'
                          : 'var(--text-secondary)',
                      fontWeight: isActive ? 700 : 500,
                      border: isActive
                        ? isSuperAdmin
                          ? '1px solid rgba(139, 92, 246, 0.3)'
                          : '1px solid rgba(59, 130, 246, 0.25)'
                        : '1px solid transparent',
                    }}
                    title={collapsed ? item.label : undefined}
                    onClick={() => onNavigate(item.id)}
                  >
                    <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                    {!collapsed && (
                      <span style={{ fontSize: 13, marginLeft: 12 }}>{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </aside>
  );
};