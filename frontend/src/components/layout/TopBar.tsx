import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Plus,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AgentAvailabilityToggle } from '../calling/CallCenterComponents';
import { PersonaSwitcher } from './PersonaSwitcher';
import { storageService } from '../../services/storageService';
import { FEATURES } from '../../constants/features';

interface TopBarProps {
  onNavigate: (route: string, extraState?: any) => void;
  onOpenQuickCreate: (type: 'lead' | 'followup' | 'deal' | 'visit' | 'consultation') => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onNavigate, onOpenQuickCreate }) => {
  const { user, tenant, isSuperAdmin, logout, enabledFeatures } = useAuth();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notifications state
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(storageService.getNotifications());

  // Quick New state
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);

  // User menu
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);



  // Sync notifications
  useEffect(() => {
    const handleUpdate = () => {
      setNotifications(storageService.getNotifications());
    };
    window.addEventListener('nexus_storage_updated', handleUpdate);
    return () => window.removeEventListener('nexus_storage_updated', handleUpdate);
  }, []);

  // Global search items
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();

    const leads = storageService.getLeads(tenant?.id).filter(l =>
      l.name.toLowerCase().includes(q) || l.phone.includes(q) || l.email.toLowerCase().includes(q)
    );

    const customers = storageService.getCustomers(tenant?.id).filter(c =>
      c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q)
    );

    const deals = storageService.getDeals(tenant?.id).filter(d =>
      d.title.toLowerCase().includes(q) || d.customerName.toLowerCase().includes(q)
    );

    const plots = enabledFeatures.includes(FEATURES.PROPERTIES)
      ? storageService.getPlots().filter(p => p.plotNumber.toLowerCase().includes(q))
      : [];

    const investors = enabledFeatures.includes(FEATURES.INVESTORS)
      ? storageService.getInvestors(tenant?.id).filter(i =>
        i.name.toLowerCase().includes(q) || i.phone.includes(q)
      )
      : [];

    // Role-based scoping: Sales Executives only see their own leads/customers/deals.
    // plots and investors are company-wide shared records — never scoped.
    const roleCode = user?.role?.code;
    const isExec = roleCode === 'sales_executive';
    const scopedLeads = isExec
      ? leads.filter(l => l.assignedAgentId === user?.id || l.assignedAgentName === user?.name)
      : leads;
    const scopedCustomers = isExec
      ? customers.filter(c => c.assignedAgentId === user?.id || c.assignedAgentName === user?.name)
      : customers;
    const scopedDeals = isExec
      ? deals.filter(d => d.assignedAgentId === user?.id || d.assignedAgentName === user?.name)
      : deals;

    return { leads: scopedLeads, customers: scopedCustomers, deals: scopedDeals, plots, investors };
  }, [searchQuery, tenant?.id, enabledFeatures, user?.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header
      style={{
        height: 'var(--topbar-height)',
        backgroundColor: '#000000',
        borderBottom: '1px solid var(--border-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Hidden SVG Gradient definition for Red Gradient icon stroke */}
      <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
        <defs>
          <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>
        </defs>
      </svg>
      {/* Left: Global Search Input */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 380 }} ref={searchRef}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: 12, color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            className="form-input"
            style={{
              paddingLeft: 38,
              height: 38,
              backgroundColor: 'var(--bg-surface-hover)',
              borderRadius: 'var(--radius-full)',
              fontSize: 13,
            }}
            placeholder="Search leads, customers, deals, plots... (Press /)"
            value={searchQuery}
            onFocus={() => setIsSearchOpen(true)}
            onChange={e => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
          />
        </div>

        {/* Global Search Results Dropdown */}
        {isSearchOpen && searchResults && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 100 }}
              onClick={() => setIsSearchOpen(false)}
            />
            <div
              className="card animate-slide-down"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: 8,
                zIndex: 110,
                maxHeight: 420,
                overflowY: 'auto',
                padding: '10px 0',
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              {searchResults.leads.length === 0 &&
                searchResults.customers.length === 0 &&
                searchResults.deals.length === 0 &&
                searchResults.plots.length === 0 &&
                searchResults.investors.length === 0 ? (
                <div style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>
                  No matches found for "{searchQuery}".
                </div>
              ) : (
                <>
                  {searchResults.leads.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ padding: '4px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                        LEADS
                      </div>
                      {searchResults.leads.map(lead => (
                        <div
                          key={lead.id}
                          style={{
                            padding: '8px 16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                          className="btn-ghost"
                          onClick={() => {
                            onNavigate('leads', { selectId: lead.id });
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{lead.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lead.phone} • {lead.location}</div>
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--primary-600)', fontWeight: 600 }}>{lead.status}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.customers.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ padding: '4px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                        CUSTOMERS
                      </div>
                      {searchResults.customers.map(cust => (
                        <div
                          key={cust.id}
                          style={{
                            padding: '8px 16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                          className="btn-ghost"
                          onClick={() => {
                            onNavigate('customers', { selectId: cust.id });
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{cust.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cust.phone} • {cust.location}</div>
                          </div>
                          <span style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>{cust.status}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.deals.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ padding: '4px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                        DEALS
                      </div>
                      {searchResults.deals.map(deal => (
                        <div
                          key={deal.id}
                          style={{
                            padding: '8px 16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                          className="btn-ghost"
                          onClick={() => {
                            onNavigate('deals');
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{deal.title}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{deal.customerName}</div>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600 }}>₹{(deal.value / 100000).toFixed(1)}L</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.plots.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ padding: '4px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
                        PLOTS (JAMIN)
                      </div>
                      {searchResults.plots.map(plot => (
                        <div
                          key={plot.id}
                          style={{
                            padding: '8px 16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                          className="btn-ghost"
                          onClick={() => {
                            onNavigate('plots');
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{plot.plotNumber} ({plot.sizeSqft} sqft)</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{plot.projectName}</div>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600 }}>{plot.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Agent Availability (Only for company users) */}
        {!isSuperAdmin && <AgentAvailabilityToggle />}

        {/* Persona Switcher for easy demo */}
        <PersonaSwitcher />

        {/* "+ New" Action Menu */}
        {!isSuperAdmin && (
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-primary btn-sm"
              style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)' }}
              onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
            >
              <Plus size={15} /> New <ChevronDown size={12} />
            </button>

            {isNewMenuOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 100 }}
                  onClick={() => setIsNewMenuOpen(false)}
                />
                <div
                  className="card animate-slide-down"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 8,
                    zIndex: 110,
                    width: 190,
                    padding: 6,
                    boxShadow: 'var(--shadow-xl)',
                  }}
                >
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                    onClick={() => {
                      setIsNewMenuOpen(false);
                      onOpenQuickCreate('lead');
                    }}
                  >
                    + New Lead
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                    onClick={() => {
                      setIsNewMenuOpen(false);
                      onOpenQuickCreate('followup');
                    }}
                  >
                    + New Follow-up
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start' }}
                    onClick={() => {
                      setIsNewMenuOpen(false);
                      onOpenQuickCreate('deal');
                    }}
                  >
                    + New Deal
                  </button>
                  {enabledFeatures.includes(FEATURES.SITE_VISITS) && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ width: '100%', justifyContent: 'flex-start' }}
                      onClick={() => {
                        setIsNewMenuOpen(false);
                        onOpenQuickCreate('visit');
                      }}
                    >
                      + Schedule Site Visit
                    </button>
                  )}
                  {enabledFeatures.includes(FEATURES.CONSULTATIONS) && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ width: '100%', justifyContent: 'flex-start' }}
                      onClick={() => {
                        setIsNewMenuOpen(false);
                        onOpenQuickCreate('consultation');
                      }}
                    >
                      + Schedule Consultation
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Notifications Bell */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            style={{
              position: 'relative',
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '1.5px solid transparent',
              backgroundImage: 'linear-gradient(var(--bg-surface), var(--bg-surface)), linear-gradient(135deg, #ef4444, #991b1b)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              boxShadow: '0 2px 6px rgba(220,38,38,0.15)',
            }}
            onClick={() => setIsNotifOpen(!isNotifOpen)}
          >
            <Bell size={18} stroke="url(#redGradient)" />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  background: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
                  color: '#ffffff',
                  fontSize: 10,
                  fontWeight: 700,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 100 }}
                onClick={() => setIsNotifOpen(false)}
              />
              <div
                className="card animate-slide-down"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 8,
                  zIndex: 110,
                  width: 340,
                  padding: 0,
                  boxShadow: 'var(--shadow-xl)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-base)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 13 }}>Notifications</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 11, padding: 0, color: 'var(--primary-600)' }}
                    onClick={() => storageService.markAllNotificationsRead()}
                  >
                    Mark all read
                  </button>
                </div>

                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: n.read ? 'transparent' : 'rgba(59, 130, 246, 0.04)',
                        cursor: 'pointer',
                      }}
                      className="btn-ghost"
                      onClick={() => {
                        storageService.markNotificationRead(n.id);
                        if (n.link) onNavigate(n.link.replace('/', ''));
                        setIsNotifOpen(false);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, fontSize: 12 }}>{n.title}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{n.timestamp}</span>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
                        {n.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Avatar / Menu */}
        <div style={{ position: 'relative' }}>
          <button
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              boxShadow: 'none',
              padding: '4px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: isSuperAdmin
                  ? 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)'
                  : `linear-gradient(135deg, ${tenant?.brandColor || '#ef4444'} 0%, #991b1b 100%)`,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 13,
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              }}
            >
              {user?.name.charAt(0)}
            </div>
          </button>

          {isUserMenuOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 100 }}
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div
                className="card animate-slide-down"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 8,
                  zIndex: 110,
                  width: 220,
                  padding: 8,
                  boxShadow: 'var(--shadow-xl)',
                }}
              >
                <div style={{ padding: '8px 10px 10px', borderBottom: '1px solid var(--border-base)' }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{user?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.email}</div>
                  <div style={{ fontSize: 11, color: 'var(--primary-600)', fontWeight: 600, marginTop: 2 }}>
                    {user?.role.name}
                  </div>
                </div>

                <div style={{ marginTop: 6 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger)' }}
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};