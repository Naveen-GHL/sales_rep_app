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
} from 'lucide-react';
import { Customer, CallRecord, Followup, Deal } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { storageService } from '../../services/storageService';
import { DataTable, Column, RowAction } from '../../components/common/DataTable';
import { StatusChip } from '../../components/common/StatusChip';
import { Timeline, TimelineEvent } from '../../components/common/Timeline';

export const CustomersPage: React.FC = () => {
  const { tenant, user } = useAuth();
  const { initiateCall } = useCall();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'calls' | 'followups' | 'deals' | 'timeline' | 'documents'>('overview');

  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);

  const loadData = () => {
    const custs = storageService.getCustomers(tenant?.id);
    setCustomers(custs);
    if (custs.length > 0 && !selectedCustomer) {
      setSelectedCustomer(custs[0]);
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

  const timelineEvents: TimelineEvent[] = selectedCustomer
    ? [
        {
          id: 'ev-c1',
          type: 'call',
          title: 'Connected Outbound Call',
          description: 'Discussed investment term sheet and verified KYC requirements.',
          timestamp: selectedCustomer.lastContacted,
          actorName: selectedCustomer.assignedAgentName,
        },
        {
          id: 'ev-c2',
          type: 'booking',
          title: 'Customer Account Created',
          description: `Account verified for ${selectedCustomer.name}.`,
          timestamp: selectedCustomer.createdAt,
          actorName: 'Platform Automation',
        },
      ]
    : [];

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
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Customer Accounts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {customers.map(c => {
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
                        className="btn btn-primary btn-sm btn-icon"
                        style={{ width: 26, height: 26 }}
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

              {activeTab === 'documents' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div
                    style={{
                      border: '1px dashed var(--border-strong)',
                      padding: 24,
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                      backgroundColor: 'var(--bg-surface-hover)',
                    }}
                  >
                    <FileText size={28} color="var(--primary-600)" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontWeight: 600, fontSize: 13 }}>Upload KYC or Agreement Document</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>PDF, JPG, PNG up to 25MB</div>
                    <button className="btn btn-secondary btn-sm" style={{ marginTop: 10 }}>
                      Choose File
                    </button>
                  </div>
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
    </div>
  );
};
