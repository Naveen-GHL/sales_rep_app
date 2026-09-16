import React, { useState, useEffect } from 'react';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  Play,
  FileText,
  Plus,
  Clock,
  ArrowRight,
  ExternalLink,
  Volume2,
  Filter,
} from 'lucide-react';
import { Customer, CallRecord, Followup, Deal } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { storageService } from '../../services/storageService';
import { DataTable, Column, RowAction } from '../../components/common/DataTable';
import { StatusChip } from '../../components/common/StatusChip';
import { Timeline, TimelineEvent } from '../../components/common/Timeline';
import { DocumentUploader } from '../../components/common/DocumentUploader';
import { DocumentList } from '../../components/common/DocumentList';
import { Modal } from '../../components/common/Modal';

export const CustomersPage: React.FC = () => {
  const { tenant, user } = useAuth();
  const { initiateCall } = useCall();

  const [customers, setCustomers] = useState<Customer[]>([]);

  // Role-based scoping: Sales Executives see only their own customers.
  // Managers / Admins / Super Admins see the full company customer list (no filter).
  const roleCode = user?.role?.code;
  const isExec = roleCode === 'sales_executive';
  const scopedCustomers = isExec
    ? customers.filter(c =>
      (c.assignedAgentId && c.assignedAgentId === user?.id) ||
      (c.assignedAgentName && c.assignedAgentName === user?.name)
    )
    : customers;
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'calls' | 'followups' | 'deals' | 'timeline' | 'documents'>('overview');
  const [statusFilter, setStatusFilter] = useState('All');
  const [agentFilter, setAgentFilter] = useState('All');

  // New Customer modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newStatus, setNewStatus] = useState<'Active' | 'VIP' | 'Inactive'>('Active');
  const [addErrors, setAddErrors] = useState<{ name?: string; phone?: string }>({});

  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);

  const loadData = () => {
    const custs = storageService.getCustomers(tenant?.id);
    setCustomers(custs);
    // Auto-select from the scoped list so an exec doesn't land on a customer
    // that is invisible in their own filtered left-panel list.
    const firstVisible = isExec
      ? custs.filter(c =>
        (c.assignedAgentId && c.assignedAgentId === user?.id) ||
        (c.assignedAgentName && c.assignedAgentName === user?.name)
      )[0]
      : custs[0];
    if (firstVisible && !selectedCustomer) {
      setSelectedCustomer(firstVisible);
    }
    setCalls(storageService.getCalls(tenant?.id));
    setFollowups(storageService.getFollowups(tenant?.id));
    setDeals(storageService.getDeals(tenant?.id));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('nexus_storage_updated', handleUpdate);
    return () => window.removeEventListener('nexus_storage_updated', handleUpdate);
  }, [tenant?.id]);

  const agentOptions = Array.from(new Set(scopedCustomers.map(c => c.assignedAgentName)))
    .filter(Boolean)
    .map(name => ({ value: name, label: name }));

  const filteredCustomers = scopedCustomers.filter(c => {
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (agentFilter !== 'All' && c.assignedAgentName !== agentFilter) return false;
    return true;
  });

  // Filter linked records for selected customer
  const customerCalls = calls.filter(
    c => selectedCustomer && (c.contactPhone === selectedCustomer.phone || c.contactName === selectedCustomer.name)
  );

  const customerFollowups = followups.filter(
    f => selectedCustomer && (f.contactPhone === selectedCustomer.phone || f.contactName === selectedCustomer.name)
  );

  const customerDeals = deals.filter(
    d => selectedCustomer && (d.customerId === selectedCustomer.id || d.customerName === selectedCustomer.name)
  );

  const resetAddForm = () => {
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewLocation('');
    setNewStatus('Active');
    setAddErrors({});
  };

  const handleAddCustomer = () => {
    const errors: { name?: string; phone?: string } = {};
    if (!newName.trim()) errors.name = 'Name is required.';
    if (!newPhone.trim()) errors.phone = 'Phone is required.';
    if (Object.keys(errors).length > 0) {
      setAddErrors(errors);
      return;
    }
    const newCustomer: import('../../types').Customer = {
      id: `cust-${Date.now()}`,
      companyId: tenant?.id || '',
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim(),
      status: newStatus,
      assignedAgentId: user?.id || '',
      assignedAgentName: user?.name || '',
      location: newLocation.trim(),
      lastContacted: new Date().toISOString().split('T')[0],
      openDealsCount: 0,
      totalValue: 0,
      createdAt: new Date().toISOString().split('T')[0],
      notes: '',
      customFields: {},
    };
    storageService.saveCustomer(newCustomer);
    setIsAddModalOpen(false);
    resetAddForm();
    setSelectedCustomer(newCustomer);
  };

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'Customer Name',
      sortable: true,
      render: c => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {c.phone} {c.location && `• ${c.location}`}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: c => <StatusChip status={c.status} size="sm" />,
    },
    {
      key: 'openDealsCount',
      header: 'Deals',
      sortable: true,
      render: c => (
        <span style={{ fontWeight: 600, color: 'var(--primary-600)' }}>
          {c.openDealsCount} Deal(s)
        </span>
      ),
    },
    {
      key: 'totalValue',
      header: 'Account Value',
      sortable: true,
      render: c => (
        <span style={{ fontWeight: 700, color: '#059669' }}>
          {formatCurrency(c.totalValue || 0)}
        </span>
      ),
    },
    {
      key: 'assignedAgentName',
      header: 'Account Manager',
      render: c => <span style={{ fontSize: 12 }}>{c.assignedAgentName}</span>,
    },
  ];

  const rowActions: RowAction<Customer>[] = [
    {
      label: 'Call Customer',
      icon: <Phone size={14} color="#059669" style={{ marginRight: 6 }} />,
      onClick: c => initiateCall(c.name, c.phone, 'customer', c.id),
    },
    {
      label: 'Select 360 View',
      icon: <ExternalLink size={14} style={{ marginRight: 6 }} />,
      onClick: c => setSelectedCustomer(c),
    },
  ];

  const rawEvents: TimelineEvent[] = [];

  if (selectedCustomer) {
    customerCalls.forEach(c => {
      rawEvents.push({
        id: c.id,
        type: 'call',
        title: `${c.direction === 'outbound' ? 'Outbound' : 'Inbound'} Call — ${c.disposition}`,
        description: c.transcription || undefined,
        timestamp: c.timestamp,
        actorName: c.agentName,
      });
    });

    customerFollowups.forEach(f => {
      rawEvents.push({
        id: f.id,
        type: 'followup',
        title: f.status === 'Completed' ? 'Follow-up Completed' : 'Follow-up Scheduled',
        description: f.notes,
        timestamp: f.scheduledAt,
        actorName: f.assignedAgentName,
      });
    });

    customerDeals.forEach(d => {
      rawEvents.push({
        id: d.id,
        type: 'status_change',
        title: `Deal Created — ${d.title}`,
        description: `Stage: ${d.stage} • Value: ${formatCurrency(d.value)}`,
        timestamp: d.createdAt,
        actorName: d.assignedAgentName,
      });
    });

    rawEvents.push({
      id: `ev-create-${selectedCustomer.id}`,
      type: 'note',
      title: 'Customer Account Created',
      timestamp: selectedCustomer.createdAt,
      actorName: selectedCustomer.assignedAgentName,
    });
  }

  const timelineEvents = rawEvents.sort((a, b) => {
    const parseTime = (ts: string) => {
      const parsed = Date.parse(ts);
      return isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
    };
    return parseTime(b.timestamp) - parseTime(a.timestamp);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Building2 size={24} color="var(--primary-600)" /> Customer 360 Profile
          </h1>
          <p className="page-subtitle">
            Unified contact view across calls, deals, timeline, and documents for {tenant?.name}.
          </p>
        </div>
      </div>

      {/* Customer 360 Split View: List on left, Full 360 on right */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20, alignItems: 'flex-start' }}>
        {/* Left: Customer Directory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Customer Accounts</h3>
              <button
                className="btn btn-primary btn-sm"
                style={{ fontSize: 12, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
                onClick={() => { resetAddForm(); setIsAddModalOpen(true); }}
              >
                <Plus size={13} /> New Customer
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                flexWrap: 'nowrap',
                boxSizing: 'border-box',
                marginTop: 4,
                marginBottom: 14,
              }}
            >
              {/* Filters Label */}
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                  flexShrink: 0,
                }}
              >
                <Filter size={13} />
                Filters:
              </span>

              {/* Status Filter */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  flex: '1 1 0',
                  minWidth: 0,
                  boxSizing: 'border-box',
                }}
              >
                <label
                  htmlFor="filter-customer-status"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  Status:
                </label>
                <select
                  id="filter-customer-status"
                  className="form-select"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  style={{
                    height: 30,
                    fontSize: 12,
                    paddingTop: 0,
                    paddingBottom: 0,
                    paddingLeft: 8,
                    paddingRight: 22,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-base)',
                    backgroundColor:
                      statusFilter !== 'All' && statusFilter !== ''
                        ? 'var(--primary-50)'
                        : 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    width: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="All">All</option>
                  <option value="Active">Active</option>
                  <option value="VIP">VIP</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Agent Filter */}
              {!isExec && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    flex: '1 1 0',
                    minWidth: 0,
                    boxSizing: 'border-box',
                  }}
                >
                  <label
                    htmlFor="filter-customer-agent"
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    Agent:
                  </label>
                  <select
                    id="filter-customer-agent"
                    className="form-select"
                    value={agentFilter}
                    onChange={e => setAgentFilter(e.target.value)}
                    style={{
                      height: 30,
                      fontSize: 12,
                      paddingTop: 0,
                      paddingBottom: 0,
                      paddingLeft: 8,
                      paddingRight: 22,
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-base)',
                      backgroundColor:
                        agentFilter !== 'All' && agentFilter !== ''
                          ? 'var(--primary-50)'
                          : 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      width: '100%',
                      minWidth: 0,
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="All">All</option>
                    {agentOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredCustomers.map(c => {
                const isSelected = selectedCustomer?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? 'var(--primary-50)' : 'var(--bg-surface-hover)',
                      border: isSelected ? '1px solid var(--primary-500)' : '1px solid var(--border-base)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                        {c.name}
                      </div>
                      <StatusChip status={c.status} size="sm" />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                      {c.phone} • {c.location}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>
                        {formatCurrency(c.totalValue || 0)}
                      </span>
                      <button
                        className="btn btn-call btn-sm btn-icon"
                        style={{ width: 26, height: 26, borderRadius: 6 }}
                        onClick={e => {
                          e.stopPropagation();
                          initiateCall(c.name, c.phone, 'customer', c.id);
                        }}
                      >
                        <Phone size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Full 360 Cockpit */}
        {selectedCustomer ? (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* 360 Header */}
            <div
              style={{
                padding: '24px 28px',
                borderBottom: '1px solid var(--border-base)',
                background: 'linear-gradient(to right, var(--bg-surface), var(--bg-surface-hover))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800 }}>{selectedCustomer.name}</h2>
                  <StatusChip status={selectedCustomer.status} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span>📞 {selectedCustomer.phone}</span>
                  {selectedCustomer.email && <span>✉️ {selectedCustomer.email}</span>}
                  <span>📍 {selectedCustomer.location}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                  onClick={() => initiateCall(selectedCustomer.name, selectedCustomer.phone, 'customer', selectedCustomer.id)}
                >
                  <Phone size={15} /> Click to Call
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--border-base)',
                backgroundColor: 'var(--bg-surface)',
                padding: '0 20px',
              }}
            >
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'calls', label: `Calls (${customerCalls.length})` },
                { id: 'followups', label: `Follow-ups (${customerFollowups.length})` },
                { id: 'deals', label: `Deals (${customerDeals.length})` },
                { id: 'timeline', label: 'Activity Timeline' },
                { id: 'documents', label: 'Documents' },
              ].map(tab => (
                <button
                  key={tab.id}
                  className="btn btn-ghost"
                  style={{
                    borderRadius: 0,
                    borderBottom: activeTab === tab.id ? '2px solid var(--primary-600)' : '2px solid transparent',
                    color: activeTab === tab.id ? 'var(--primary-600)' : 'var(--text-secondary)',
                    fontWeight: activeTab === tab.id ? 700 : 500,
                    padding: '12px 16px',
                  }}
                  onClick={() => setActiveTab(tab.id as any)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div style={{ padding: 24 }}>
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="card" style={{ padding: 18 }}>
                    <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
                      Account & Commercial Profile
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13 }}>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Assigned Account Manager:</span>
                        <div style={{ fontWeight: 600 }}>{selectedCustomer.assignedAgentName}</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Total Committed Value:</span>
                        <div style={{ fontWeight: 700, color: '#059669', fontSize: 15 }}>
                          {formatCurrency(selectedCustomer.totalValue || 0)}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Customer Since:</span>
                        <div style={{ fontWeight: 600 }}>{selectedCustomer.createdAt}</div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Last Contacted:</span>
                        <div style={{ fontWeight: 600, color: 'var(--primary-600)' }}>
                          {selectedCustomer.lastContacted}
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedCustomer.customFields && (
                    <div className="card" style={{ padding: 18, background: 'var(--primary-50)', border: '1px solid var(--primary-100)' }}>
                      <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--primary-700)', marginBottom: 12 }}>
                        Tenant Specific Relationship Attributes
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                        {Object.entries(selectedCustomer.customFields).map(([k, v]) => (
                          <div key={k}>
                            <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                              {k.replace(/([A-Z])/g, ' $1')}:
                            </span>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{String(v)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'calls' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {customerCalls.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}>
                      No calls logged yet with this customer. Click "Click to Call" to initiate a call.
                    </div>
                  ) : (
                    customerCalls.map(c => (
                      <div
                        key={c.id}
                        className="card"
                        style={{
                          padding: 16,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          border: '1px solid var(--border-base)',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <StatusChip status={c.direction} size="sm" />
                            <StatusChip status={c.disposition} size="sm" />
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              Duration: {Math.floor(c.duration / 60)}m {c.duration % 60}s • {c.timestamp}
                            </span>
                          </div>
                          {c.transcription && (
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, fontStyle: 'italic' }}>
                              "{c.transcription}"
                            </p>
                          )}
                        </div>

                        {c.recordingUrl && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => alert(`Simulated Playback: Playing audio for call with ${c.contactName}`)}
                          >
                            <Play size={13} color="var(--primary-600)" /> Play Recording
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'followups' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {customerFollowups.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}>
                      No open follow-ups for this customer.
                    </div>
                  ) : (
                    customerFollowups.map(f => (
                      <div
                        key={f.id}
                        style={{
                          padding: 14,
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--bg-surface-hover)',
                          border: '1px solid var(--border-base)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 600, fontSize: 13 }}>{f.notes}</span>
                            <StatusChip status={f.priority} size="sm" />
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--primary-600)', marginTop: 4 }}>
                            ⏰ Due: {f.scheduledAt} • Assignee: {f.assignedAgentName}
                          </div>
                        </div>

                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            storageService.saveFollowup({ ...f, status: 'Completed' });
                          }}
                        >
                          Mark Done
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'deals' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {customerDeals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}>
                      No active deals linked yet.
                    </div>
                  ) : (
                    customerDeals.map(d => (
                      <div
                        key={d.id}
                        className="card"
                        style={{
                          padding: 16,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{d.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                            Stage: <StatusChip status={d.stage} size="sm" /> • Expected Close: {d.expectedCloseDate}
                          </div>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#059669' }}>
                          {formatCurrency(d.value)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'timeline' && <Timeline events={timelineEvents} />}

              {activeTab === 'documents' && selectedCustomer && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <DocumentUploader
                    entityType="customer"
                    entityId={selectedCustomer.id}
                    allowedCategories={['KYC', 'Agreement', 'Payment Receipt', 'Identity Proof', 'Other']}
                  />
                  <DocumentList
                    entityType="customer"
                    entityId={selectedCustomer.id}
                    canDelete
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            Select a customer from the list to view their 360 profile.
          </div>
        )}
      </div>
      {/* New Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); resetAddForm(); }}
        title="New Customer"
        subtitle="Create a fresh customer account and assign it to yourself."
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setIsAddModalOpen(false); resetAddForm(); }}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleAddCustomer}>
              Create Customer
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Name */}
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input
              className={`form-input${addErrors.name ? ' is-invalid' : ''}`}
              placeholder="e.g. Priya Sharma"
              value={newName}
              onChange={e => { setNewName(e.target.value); if (addErrors.name) setAddErrors(p => ({ ...p, name: undefined })); }}
            />
            {addErrors.name && <div className="form-error">{addErrors.name}</div>}
          </div>
          {/* Phone */}
          <div className="form-group">
            <label className="form-label">Phone *</label>
            <input
              className={`form-input${addErrors.phone ? ' is-invalid' : ''}`}
              placeholder="e.g. +91 98765 43210"
              value={newPhone}
              onChange={e => { setNewPhone(e.target.value); if (addErrors.phone) setAddErrors(p => ({ ...p, phone: undefined })); }}
            />
            {addErrors.phone && <div className="form-error">{addErrors.phone}</div>}
          </div>
          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="e.g. priya@example.com"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
            />
          </div>
          {/* Location */}
          <div className="form-group">
            <label className="form-label">Location</label>
            <input
              className="form-input"
              placeholder="e.g. Bengaluru"
              value={newLocation}
              onChange={e => setNewLocation(e.target.value)}
            />
          </div>
          {/* Status */}
          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={newStatus}
              onChange={e => setNewStatus(e.target.value as 'Active' | 'VIP' | 'Inactive')}
            >
              <option value="Active">Active</option>
              <option value="VIP">VIP</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};