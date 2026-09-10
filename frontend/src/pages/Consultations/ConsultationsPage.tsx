import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Phone, CheckCircle, Clock } from 'lucide-react';
import { Consultation } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { storageService } from '../../services/storageService';
import { DataTable, Column, RowAction } from '../../components/common/DataTable';
import { StatusChip } from '../../components/common/StatusChip';
import { Modal } from '../../components/common/Modal';

export const ConsultationsPage: React.FC = () => {
  const { tenant, user } = useAuth();
  const { initiateCall } = useCall();

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Form
  const [investorName, setInvestorName] = useState('');
  const [investorPhone, setInvestorPhone] = useState('+91 ');
  const [scheduledAt, setScheduledAt] = useState('This Friday, 03:00 PM');
  const [agenda, setAgenda] = useState('Commercial REIT yield analysis & pass-through taxation discussion.');

  const loadData = () => {
    setConsultations(storageService.getConsultations(tenant?.id));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('nexus_storage_updated', handleUpdate);
    return () => window.removeEventListener('nexus_storage_updated', handleUpdate);
  }, [tenant?.id]);

  const handleCreateConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!investorName) return;

    const newCons: Consultation = {
      id: `cns-${Date.now()}`,
      companyId: tenant?.id || 't-ghl-01',
      investorId: `inv-${Date.now()}`,
      investorName,
      investorPhone,
      scheduledAt,
      consultantId: user?.id || 'usr-admin',
      consultantName: user?.name || 'Vikram Malhotra',
      status: 'Scheduled',
      agenda,
    };

    storageService.saveConsultation(newCons);

    storageService.addAuditLog({
      id: `aud-${Date.now()}`,
      timestamp: 'Just now',
      actorName: user?.name || 'Advisor',
      actorEmail: user?.email || 'advisor@ghl.com',
      action: 'CONSULTATION_SCHEDULED',
      entityType: 'Consultation',
      entityId: newCons.id,
      companyId: tenant?.id,
      companyName: tenant?.name,
      details: `Scheduled wealth advisory consultation with ${investorName}.`,
    });

    setIsScheduleModalOpen(false);
  };

  const columns: Column<Consultation>[] = [
    {
      key: 'scheduledAt',
      header: 'Session Slot',
      sortable: true,
      render: c => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.scheduledAt}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID: {c.id}</div>
        </div>
      ),
    },
    {
      key: 'investorName',
      header: 'Investor Profile',
      sortable: true,
      render: c => (
        <div>
          <div style={{ fontWeight: 600 }}>{c.investorName}</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{c.investorPhone}</div>
        </div>
      ),
    },
    {
      key: 'agenda',
      header: 'Advisory Agenda & Scope',
      render: c => <span style={{ fontSize: 12 }}>{c.agenda}</span>,
    },
    {
      key: 'consultantName',
      header: 'Private Wealth Advisor',
      render: c => <span style={{ fontSize: 12, fontWeight: 500 }}>{c.consultantName}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: c => <StatusChip status={c.status} size="sm" />,
    },
  ];

  const rowActions: RowAction<Consultation>[] = [
    {
      label: 'Call Investor',
      icon: <Phone size={14} color="#059669" style={{ marginRight: 6 }} />,
      onClick: c => initiateCall(c.investorName, c.investorPhone),
    },
    {
      label: 'Mark Completed',
      icon: <CheckCircle size={14} color="#2563eb" style={{ marginRight: 6 }} />,
      hidden: c => c.status === 'Completed',
      onClick: c => storageService.saveConsultation({ ...c, status: 'Completed' }),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Calendar size={24} color="#0284c7" /> Wealth Advisory Consultations
          </h1>
          <p className="page-subtitle">
            1-on-1 private advisory sessions, term sheet reviews, and mandate agreements for {tenant?.name}.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsScheduleModalOpen(true)}>
          <Plus size={15} /> Schedule Consultation
        </button>
      </div>

      <DataTable
        columns={columns}
        data={consultations}
        keyExtractor={c => c.id}
        rowActions={rowActions}
        searchPlaceholder="Search consultations by investor or agenda..."
      />

      {/* Schedule Consultation Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule Private Wealth Advisory Consultation"
        subtitle="Book advisory slot with high net-worth client"
      >
        <form onSubmit={handleCreateConsultation} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Investor Full Name *</label>
            <input
              type="text"
              className="form-input"
              required
              value={investorName}
              onChange={e => setInvestorName(e.target.value)}
              placeholder="e.g. Dr. Rajesh Nambiar"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="text"
                className="form-input"
                required
                value={investorPhone}
                onChange={e => setInvestorPhone(e.target.value)}
                placeholder="+91 98800 00000"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Consultation Slot *</label>
              <input
                type="text"
                className="form-input"
                required
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                placeholder="e.g. Thursday, 04:00 PM"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Discussion Agenda & Objectives</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={agenda}
              onChange={e => setAgenda(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsScheduleModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm Advisory Slot
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
