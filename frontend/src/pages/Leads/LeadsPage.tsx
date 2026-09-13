import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import {
  Users,
  Phone,
  Plus,
  Upload,
  Download,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  UserCheck,
  FileText,
  Trash2,
  Edit,
  ExternalLink,
} from 'lucide-react';
import { Lead, Customer, Deal } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { storageService } from '../../services/storageService';
import { DataTable, Column, RowAction } from '../../components/common/DataTable';
import { FilterBar } from '../../components/common/FilterBar';
import { StatusChip } from '../../components/common/StatusChip';
import { Drawer } from '../../components/common/Drawer';
import { Modal } from '../../components/common/Modal';
import { Timeline, TimelineEvent } from '../../components/common/Timeline';
import { FEATURES } from '../../constants/features';

export const LeadsPage: React.FC = () => {
  const { tenant, user, isSuperAdmin, enabledFeatures } = useAuth();
  const { initiateCall } = useCall();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

  // CSV Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [importResults, setImportResults] = useState<{ success: number; skipped: number } | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Form state
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [convertDealTitle, setConvertDealTitle] = useState('');
  const [convertDealValue, setConvertDealValue] = useState<number>(5000000);

  const loadData = () => {
    setLeads(storageService.getLeads(tenant?.id));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('nexus_storage_updated', handleUpdate);
    return () => window.removeEventListener('nexus_storage_updated', handleUpdate);
  }, [tenant?.id]);

  const filteredLeads = leads.filter(lead => {
    if (statusFilter !== 'All' && lead.status !== statusFilter) return false;
    if (priorityFilter !== 'All' && lead.priority !== priorityFilter) return false;
    return true;
  });

  const handleOpenCreate = () => {
    setFormData({
      id: `lead-${Date.now()}`,
      companyId: tenant?.id || 't-ghl-01',
      name: '',
      phone: '+91 ',
      email: '',
      location: '',
      source: 'Website Inbound',
      status: 'New',
      priority: 'Medium',
      assignedAgentId: user?.id || 'usr-exec',
      assignedAgentName: user?.name || 'Agent',
      createdAt: new Date().toISOString().split('T')[0],
      notes: '',
      customFields: tenant?.slug === 'jamin'
        ? { budgetRange: '₹45L - ₹65L', preferredLocation: 'Devanahalli North', readyToRegister: 'Immediate' }
        : { investmentCapacity: '₹1 Cr - ₹3 Cr', preferredAssetClass: 'Commercial Pre-Leased', horizon: '3-5 Years' },
    });
    setIsEditDrawerOpen(true);
  };

  const handleOpenEdit = (lead: Lead) => {
    setFormData({ ...lead });
    setIsEditDrawerOpen(true);
  };

  const handleSaveLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    const leadToSave = formData as Lead;
    storageService.saveLead(leadToSave);

    storageService.addAuditLog({
      id: `aud-${Date.now()}`,
      timestamp: 'Just now',
      actorName: user?.name || 'Agent',
      actorEmail: user?.email || 'agent@nexus.io',
      action: leads.some(l => l.id === leadToSave.id) ? 'LEAD_UPDATED' : 'LEAD_CREATED',
      entityType: 'Lead',
      entityId: leadToSave.id,
      companyId: tenant?.id,
      companyName: tenant?.name,
      details: `Lead record ${leadToSave.name} (${leadToSave.phone}) saved.`,
    });

    setIsEditDrawerOpen(false);
  };

  const handleDeleteLead = (lead: Lead) => {
    if (confirm(`Delete lead ${lead.name}?`)) {
      storageService.deleteLead(lead.id);
    }
  };

  const handleStartConvert = (lead: Lead) => {
    setSelectedLead(lead);
    setConvertDealTitle(
      tenant?.slug === 'jamin'
        ? `${lead.name} - Villa Plot Booking`
        : `${lead.name} - High Yield Asset Investment`
    );
    setIsConvertModalOpen(true);
  };

  const handleConfirmConvert = () => {
    if (!selectedLead || !tenant) return;

    // 1. Create Customer
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      companyId: tenant.id,
      name: selectedLead.name,
      phone: selectedLead.phone,
      email: selectedLead.email,
      status: 'Active',
      assignedAgentId: selectedLead.assignedAgentId,
      assignedAgentName: selectedLead.assignedAgentName,
      location: selectedLead.location,
      lastContacted: 'Today',
      openDealsCount: 1,
      totalValue: convertDealValue,
      createdAt: new Date().toISOString().split('T')[0],
      notes: `Converted from lead. Original notes: ${selectedLead.notes}`,
      customFields: selectedLead.customFields,
    };
    storageService.saveCustomer(newCustomer);

    // 2. Create Deal
    const newDeal: Deal = {
      id: `deal-${Date.now()}`,
      companyId: tenant.id,
      title: convertDealTitle,
      customerId: newCustomer.id,
      customerName: newCustomer.name,
      stage: tenant.slug === 'jamin' ? 'site_visit' : 'consultation',
      value: convertDealValue,
      expectedCloseDate: 'Within 30 Days',
      assignedAgentId: selectedLead.assignedAgentId,
      assignedAgentName: selectedLead.assignedAgentName,
      notes: `Deal initiated upon converting lead ${selectedLead.name}.`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    storageService.saveDeal(newDeal);

    // 3. Mark Lead as Converted
    storageService.saveLead({ ...selectedLead, status: 'Converted' });

    setIsConvertModalOpen(false);
    setIsDetailDrawerOpen(false);
  };

  const handleFileSelect = (file: File) => {
    setImportError('');
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportError('Only .csv files are supported right now');
      return;
    }
    setImportFile(file);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        setCsvHeaders(headers);
        setParsedRows(results.data);
        
        // Auto-map
        const newMap: Record<string, string> = {};
        const targetFields = ['name', 'phone', 'email', 'location', 'source', 'priority'];
        targetFields.forEach(tf => {
          const match = headers.find(h => h.toLowerCase().includes(tf.toLowerCase()));
          if (match) newMap[tf] = match;
        });
        setColumnMap(newMap);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleImportLeads = () => {
    let successCount = 0;
    let skipCount = 0;

    parsedRows.forEach((row, index) => {
      const nameVal = row[columnMap['name']];
      const phoneVal = row[columnMap['phone']];
      
      if (!nameVal || !phoneVal) {
        skipCount++;
        return;
      }
      
      const emailVal = row[columnMap['email']] || '';
      const locationVal = row[columnMap['location']] || '';
      const sourceVal = row[columnMap['source']] || 'CSV Import';
      const rawPriority = row[columnMap['priority']];
      let priorityVal = 'Medium';
      if (['Low', 'Medium', 'High', 'Urgent'].includes(String(rawPriority))) {
        priorityVal = rawPriority;
      }

      const newLead: Lead = {
        id: `lead-${Date.now()}-${index}`,
        companyId: tenant?.id || 't-ghl-01',
        name: nameVal,
        phone: phoneVal,
        email: emailVal,
        location: locationVal,
        source: sourceVal,
        priority: priorityVal as any,
        status: 'New',
        assignedAgentId: user?.id || 'usr-exec',
        assignedAgentName: user?.name || 'Agent',
        createdAt: new Date().toISOString().split('T')[0],
        notes: '',
        customFields: {}
      };

      storageService.saveLead(newLead);
      successCount++;
    });

    storageService.addAuditLog({
      id: `aud-${Date.now()}`,
      timestamp: 'Just now',
      actorName: user?.name || 'Agent',
      actorEmail: user?.email || 'agent@nexus.io',
      action: 'LEADS_BULK_IMPORTED',
      entityType: 'Lead',
      entityId: `batch-${Date.now()}`,
      companyId: tenant?.id,
      companyName: tenant?.name,
      details: `Bulk imported ${successCount} leads, skipped ${skipCount}.`,
    });

    setImportResults({ success: successCount, skipped: skipCount });
    loadData();
  };

  const resetImportState = () => {
    setImportFile(null);
    setImportError('');
    setParsedRows([]);
    setCsvHeaders([]);
    setColumnMap({});
    setImportResults(null);
  };

  // Columns for DataTable
  const columns: Column<Lead>[] = [
    {
      key: 'name',
      header: 'Lead Name & Contact',
      sortable: true,
      render: l => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{l.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {l.phone} {l.location && `• ${l.location}`}
          </div>
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      sortable: true,
      render: l => <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{l.source}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: l => <StatusChip status={l.status} size="sm" />,
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      render: l => <StatusChip status={l.priority} size="sm" />,
    },
    {
      key: 'assignedAgentName',
      header: 'Assigned Agent',
      sortable: true,
      render: l => (
        <span style={{ fontSize: 12, fontWeight: 500 }}>{l.assignedAgentName}</span>
      ),
    },
    {
      key: 'nextFollowupDate',
      header: 'Follow-up',
      render: l => (
        <span style={{ fontSize: 12, color: l.nextFollowupDate ? 'var(--primary-600)' : 'var(--text-muted)', fontWeight: 500 }}>
          {l.nextFollowupDate || 'None scheduled'}
        </span>
      ),
    },
  ];

  const rowActions: RowAction<Lead>[] = [
    {
      label: 'Call Lead',
      icon: <Phone size={14} color="#059669" style={{ marginRight: 6 }} />,
      onClick: l => initiateCall(l.name, l.phone, 'lead', l.id),
    },
    {
      label: 'View 360 Drawer',
      icon: <ExternalLink size={14} style={{ marginRight: 6 }} />,
      onClick: l => {
        setSelectedLead(l);
        setIsDetailDrawerOpen(true);
      },
    },
    {
      label: 'Edit Lead',
      icon: <Edit size={14} style={{ marginRight: 6 }} />,
      onClick: l => handleOpenEdit(l),
    },
    {
      label: 'Convert to Customer',
      icon: <UserCheck size={14} color="#2563eb" style={{ marginRight: 6 }} />,
      hidden: l => l.status === 'Converted',
      onClick: l => handleStartConvert(l),
    },
    {
      label: 'Delete Lead',
      icon: <Trash2 size={14} color="#ef4444" style={{ marginRight: 6 }} />,
      danger: true,
      onClick: l => handleDeleteLead(l),
    },
  ];

  const timelineEvents: TimelineEvent[] = selectedLead
    ? [
        {
          id: 'ev-1',
          type: 'status_change',
          title: `Status set to ${selectedLead.status}`,
          description: `Current priority: ${selectedLead.priority}. Location: ${selectedLead.location}.`,
          timestamp: selectedLead.createdAt,
          actorName: selectedLead.assignedAgentName,
        },
        {
          id: 'ev-2',
          type: 'note',
          title: 'Inquiry Recorded',
          description: selectedLead.notes || 'Inbound registration captured.',
          timestamp: selectedLead.createdAt,
          actorName: 'System Bot',
        },
      ]
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Users size={24} color="var(--primary-600)" /> Leads Management
          </h1>
          <p className="page-subtitle">
            Capture, qualify, call, and convert inbound prospects for {tenant?.name}.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="btn btn-secondary"
            onClick={() => setIsImportModalOpen(true)}
          >
            <Upload size={15} /> Import CSV
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <Plus size={15} /> Add New Lead
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <DataTable
        columns={columns}
        data={filteredLeads}
        keyExtractor={l => l.id}
        rowActions={rowActions}
        onRowClick={l => {
          setSelectedLead(l);
          setIsDetailDrawerOpen(true);
        }}
        searchPlaceholder="Search leads by name, phone, or location..."
        emptyTitle="No leads matching criteria"
        emptyDescription="Create a new lead or clear your filters to display inbound leads."
        emptyActionLabel="+ Add First Lead"
        onEmptyAction={handleOpenCreate}
        filtersNode={
          <FilterBar
            filters={[
              {
                key: 'status',
                label: 'Status',
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { value: 'New', label: 'New' },
                  { value: 'Contacted', label: 'Contacted' },
                  { value: 'Qualified', label: 'Qualified' },
                  { value: 'Proposal', label: 'Proposal' },
                  { value: 'Negotiation', label: 'Negotiation' },
                  { value: 'Converted', label: 'Converted' },
                ],
              },
              {
                key: 'priority',
                label: 'Priority',
                value: priorityFilter,
                onChange: setPriorityFilter,
                options: [
                  { value: 'Urgent', label: 'Urgent' },
                  { value: 'High', label: 'High' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'Low', label: 'Low' },
                ],
              },
            ]}
            onClearAll={() => {
              setStatusFilter('All');
              setPriorityFilter('All');
            }}
          />
        }
      />

      {/* 360 Detail Drawer */}
      <Drawer
        isOpen={isDetailDrawerOpen && !!selectedLead}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={selectedLead?.name || 'Lead Overview'}
        subtitle={`${selectedLead?.phone} • Created on ${selectedLead?.createdAt}`}
        width={580}
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setIsDetailDrawerOpen(false);
                if (selectedLead) handleOpenEdit(selectedLead);
              }}
            >
              <Edit size={14} /> Edit Record
            </button>
            <button
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
              onClick={() => {
                if (selectedLead) initiateCall(selectedLead.name, selectedLead.phone, 'lead', selectedLead.id);
              }}
            >
              <Phone size={14} /> Call Lead
            </button>
          </>
        }
      >
        {selectedLead && (
          <>
            {/* Quick Action Banner */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface-hover)',
                borderRadius: 'var(--radius-lg)',
                padding: 16,
                border: '1px solid var(--border-base)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StatusChip status={selectedLead.status} />
                  <StatusChip status={selectedLead.priority} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  Assigned to <strong>{selectedLead.assignedAgentName}</strong>
                </div>
              </div>

              {selectedLead.status !== 'Converted' && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleStartConvert(selectedLead)}
                >
                  <UserCheck size={14} /> Convert to Customer
                </button>
              )}
            </div>

            {/* Core Details */}
            <div className="card" style={{ padding: 18 }}>
              <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
                Contact & Profile Details
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Email:</span>
                  <div style={{ fontWeight: 600 }}>{selectedLead.email || '—'}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Location:</span>
                  <div style={{ fontWeight: 600 }}>{selectedLead.location || '—'}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Lead Source:</span>
                  <div style={{ fontWeight: 600 }}>{selectedLead.source}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Follow-up:</span>
                  <div style={{ fontWeight: 600, color: 'var(--primary-600)' }}>
                    {selectedLead.nextFollowupDate || 'Not scheduled'}
                  </div>
                </div>
              </div>
            </div>

            {/* Tenant-Specific Dynamic Custom Fields */}
            <div className="card" style={{ padding: 18, border: '1px solid var(--primary-100)', background: 'var(--primary-50)' }}>
              <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--primary-700)', marginBottom: 12 }}>
                {tenant?.name} Custom Attributes
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                {Object.entries(selectedLead.customFields || {}).map(([key, val]) => (
                  <div key={key}>
                    <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {key.replace(/([A-Z])/g, ' $1')}:
                    </span>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{String(val)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity History Timeline */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
                Activity & Engagement History
              </h4>
              <Timeline events={timelineEvents} />
            </div>
          </>
        )}
      </Drawer>

      {/* Create / Edit Drawer */}
      <Drawer
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        title={formData.id && leads.some(l => l.id === formData.id) ? 'Edit Lead Record' : 'Add New Prospect Lead'}
        subtitle={`Organization: ${tenant?.name}`}
        width={560}
      >
        <form onSubmit={handleSaveLead} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-input"
              required
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Ramesh Chandra"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.phone || ''}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98800 00000"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={formData.email || ''}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="ramesh@example.com"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Location / City</label>
              <input
                type="text"
                className="form-input"
                value={formData.location || ''}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Bengaluru, Indiranagar"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Source</label>
              <select
                className="form-select"
                value={formData.source || 'Website Inbound'}
                onChange={e => setFormData({ ...formData, source: e.target.value })}
              >
                <option value="Website Inbound">Website Inbound</option>
                <option value="Google Search">Google Search</option>
                <option value="Facebook / Instagram">Facebook / Instagram</option>
                <option value="Referral - HNW">Referral - HNW</option>
                <option value="Walk-in Site Office">Walk-in Site Office</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={formData.status || 'New'}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Proposal">Proposal</option>
                <option value="Negotiation">Negotiation</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-select"
                value={formData.priority || 'Medium'}
                onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* DYNAMIC TENANT CUSTOM FIELDS (Blueprint Section 7.3) */}
          <div
            style={{
              padding: 16,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface-hover)',
              border: '1px solid var(--border-base)',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-600)', marginBottom: 12 }}>
              {tenant?.name} Custom Form Schema
            </div>

            {tenant?.slug === 'jamin' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Plot Budget Range</label>
                  <select
                    className="form-select"
                    value={formData.customFields?.budgetRange || '₹45L - ₹65L'}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        customFields: { ...formData.customFields, budgetRange: e.target.value },
                      })
                    }
                  >
                    <option value="₹25L - ₹45L">₹25L - ₹45L</option>
                    <option value="₹45L - ₹65L">₹45L - ₹65L</option>
                    <option value="₹65L - ₹90L">₹65L - ₹90L</option>
                    <option value="₹90L+">₹90L+</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Preferred Micro-Market</label>
                  <select
                    className="form-select"
                    value={formData.customFields?.preferredLocation || 'Devanahalli North'}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        customFields: { ...formData.customFields, preferredLocation: e.target.value },
                      })
                    }
                  >
                    <option value="Devanahalli North">Devanahalli North (Airport)</option>
                    <option value="Sarjapur East">Sarjapur East</option>
                    <option value="Mysore Highway Corridor">Mysore Highway Corridor</option>
                  </select>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Investment Capacity</label>
                  <select
                    className="form-select"
                    value={formData.customFields?.investmentCapacity || '₹1 Cr - ₹3 Cr'}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        customFields: { ...formData.customFields, investmentCapacity: e.target.value },
                      })
                    }
                  >
                    <option value="₹50L - ₹1 Cr">₹50L - ₹1 Cr</option>
                    <option value="₹1 Cr - ₹3 Cr">₹1 Cr - ₹3 Cr</option>
                    <option value="₹3 Cr - ₹5 Cr">₹3 Cr - ₹5 Cr</option>
                    <option value="₹5 Cr+">₹5 Cr+</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Preferred Asset Class</label>
                  <select
                    className="form-select"
                    value={formData.customFields?.preferredAssetClass || 'Commercial Pre-Leased'}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        customFields: { ...formData.customFields, preferredAssetClass: e.target.value },
                      })
                    }
                  >
                    <option value="Commercial Pre-Leased">Commercial Pre-Leased</option>
                    <option value="Industrial Logistics Park">Industrial Logistics Park</option>
                    <option value="Commercial Yield Funds">Commercial Yield Funds</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Notes & Requirements</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={formData.notes || ''}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Client background, key objections, time horizon..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditDrawerOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Lead Record
            </button>
          </div>
        </form>
      </Drawer>

      {/* Convert to Customer Modal */}
      <Modal
        isOpen={isConvertModalOpen && !!selectedLead}
        onClose={() => setIsConvertModalOpen(false)}
        title="Convert Lead to Customer Record"
        subtitle={`Moving ${selectedLead?.name} into your active Customer 360 database`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsConvertModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleConfirmConvert}>
              Confirm Conversion & Create Deal
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Converting this lead will automatically establish a permanent <strong>Customer 360</strong>{' '}
            profile and launch an active pipeline opportunity.
          </p>

          <div className="form-group">
            <label className="form-label">Initial Deal Title *</label>
            <input
              type="text"
              className="form-input"
              value={convertDealTitle}
              onChange={e => setConvertDealTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Estimated Deal Value (₹)</label>
            <input
              type="number"
              className="form-input"
              value={convertDealValue}
              onChange={e => setConvertDealValue(Number(e.target.value))}
            />
          </div>

          <div
            style={{
              padding: 12,
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: 12,
              color: '#047857',
            }}
          >
            ✓ On {tenant?.name}, this also automatically schedules a{' '}
            <strong>{tenant?.slug === 'jamin' ? 'Site Visit' : 'Wealth Consultation'}</strong> step!
          </div>
        </div>
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          resetImportState();
        }}
        title="Bulk Import Leads (CSV)"
        subtitle="Upload a file and map columns to ingest prospects"
        footer={
          importResults ? (
            <button className="btn btn-primary" onClick={() => {
              setIsImportModalOpen(false);
              resetImportState();
            }}>
              Done
            </button>
          ) : parsedRows.length > 0 ? (
            <div style={{ display: 'flex', gap: 10, width: '100%', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={resetImportState}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleImportLeads}
                disabled={!columnMap['name'] || !columnMap['phone']}
              >
                Import Leads
              </button>
            </div>
          ) : (
            <button className="btn btn-secondary" onClick={() => setIsImportModalOpen(false)}>
              Close Import
            </button>
          )
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {importResults ? (
            <div style={{ textAlign: 'center', padding: '30px 20px' }}>
              <CheckCircle2 size={48} color="var(--primary-600)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Import Complete</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                {importResults.success} leads imported successfully, {importResults.skipped} skipped — missing name or phone.
              </p>
            </div>
          ) : parsedRows.length > 0 ? (
            <>
              {/* Mapping */}
              <div className="card" style={{ padding: 16, backgroundColor: 'var(--bg-surface-hover)' }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Map Columns</h4>
                {(!columnMap['name'] || !columnMap['phone']) && (
                  <div style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 12 }}>
                    ⚠️ Name and Phone columns must be mapped to proceed.
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {['name', 'phone', 'email', 'location', 'source', 'priority'].map(tf => (
                    <div key={tf} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>
                        {tf}{['name', 'phone'].includes(tf) ? ' *' : ''}
                      </span>
                      <select 
                        className="form-select" 
                        style={{ width: 140, padding: '4px 8px', fontSize: 12 }}
                        value={columnMap[tf] || ''}
                        onChange={e => setColumnMap(prev => ({ ...prev, [tf]: e.target.value }))}
                      >
                        <option value="">— Not Mapped —</option>
                        {csvHeaders.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  {parsedRows.length} rows found — showing first 10
                </div>
                <div style={{ overflowX: 'auto', border: '1px solid var(--border-base)', borderRadius: 'var(--radius-md)' }}>
                  <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
                      <tr>
                        {csvHeaders.map(h => (
                          <th key={h} style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-base)', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.slice(0, 10).map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-base)' }}>
                          {csvHeaders.map(h => (
                            <td key={h} style={{ padding: '8px 12px' }}>{row[h]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <>
              <input
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--border-strong)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 32,
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-surface-hover)',
                  cursor: 'pointer',
                }}
              >
                <Upload size={32} color="var(--primary-600)" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontWeight: 600, fontSize: 14 }}>Drag & drop your CSV file here</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Supports .csv only
                </div>
                <button 
                  type="button"
                  className="btn btn-secondary btn-sm" 
                  style={{ marginTop: 12 }}
                  onClick={e => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Browse File
                </button>
              </div>
              
              {importError && (
                <div style={{ fontSize: 13, color: 'var(--danger)', textAlign: 'center', marginTop: 12 }}>
                  {importError}
                </div>
              )}

              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                <strong>Sample Columns Supported:</strong> Name, Phone, Email, Location, Source, Priority, Custom Fields.
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
