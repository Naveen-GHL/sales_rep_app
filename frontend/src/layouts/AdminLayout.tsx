import React from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { TopBar } from '../components/layout/TopBar';

interface AdminLayoutProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentRoute,
  onNavigate,
  children,
}) => {
  return (
    <div className="app-container admin-theme">
      {/* Super Admin Dark Console Sidebar */}
      <Sidebar currentRoute={currentRoute} onNavigate={onNavigate} />

      {/* Main Content Area */}
      <div className="main-content-area" style={{ backgroundColor: '#090d16' }}>
        <TopBar onNavigate={onNavigate} onOpenQuickCreate={() => {}} />

        {/* Global Environment Banner */}
        <div
          style={{
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderBottom: '1px solid rgba(139, 92, 246, 0.25)',
            padding: '6px 24px',
            fontSize: 11,
            color: '#c084fc',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>⚡ PLATFORM OPERATOR CONSOLE — SYSTEM-WIDE GOVERNANCE & MULTI-TENANT PROVISIONING</span>
          <span style={{ color: '#94a3b8' }}>API v2.4 • System Health: 99.98%</span>
        </div>

        <main className="page-scrollable">{children}</main>
      </div>
    </div>
  );
};
