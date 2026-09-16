import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Plus,
  Phone,
  FileText,
  ExternalLink,
  Edit2,
  Trash2,
  Download,
  Play,
} from 'lucide-react';
import Papa from 'papaparse';
import { Investor, CallRecord, Consultation, InvestmentOpportunity, Followup } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { storageService } from '../../services/storageService';
import { DataTable, Column, RowAction } from '../../components/common/DataTable';
import { StatusChip } from '../../components/common/StatusChip';
import { Drawer } from '../../components/common/Drawer';
import { FilterBar } from '../../components/common/FilterBar';
import { Modal } from '../../components/common/Modal';
import { DocumentUploader } from '../../components/common/DocumentUploader';
import { DocumentList } from '../../components/common/DocumentList';

// ─── Form state shape ────────────────────────────────────────────────────────
interface InvestorForm {
  name: string;
  phone: string;
  email: string;
  status: 'Lead' | 'Active Investor' | 'HNW Investor' | 'Inactive';
  investmentCapacity: string;
  preferredAssetClass: string;
  assignedAgentId: string;
  assignedAgentName: string;
  referralSource: string;
  notes: string;
  committedAUM: string;
  investmentMandate: string;
  riskTolerance: 'Conservative' | 'Moderate' | 'Aggressive' | '';
}

const BLANK_FORM: InvestorForm = {
  name: '',
  phone: '',
  email: '',
  status: 'Lead',
  investmentCapacity: '',
  preferredAssetClass: '',
  assignedAgentId: '',
  assignedAgentName: '',
  referralSource: '',
  notes: '',
  committedAUM: '',
  investmentMandate: '',
  riskTolerance: '',
};

// ─── Component ───────────────────────────────────────────────────────────────
export const InvestorsPage: React.FC = () => {
  const { tenant, user } = useAuth();
  const { initiateCall } = useCall();

  // ── Role scoping ───────────────────────────────────────────────────────────
  const roleCode = user?.role?.code;
  const isExec = roleCode === 'sales_executive';

  // ── Core data ─────────────────────────────────────────────────────────────
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [allCalls, setAllCalls] = useState<CallRecord[]>([]);
  const [allConsultations, setAllConsultations] = useState<Consultation[]>([]);
  const [allOpportunities, setAllOpportunities] = useState<InvestmentOpportunity[]>([]);
  const [allFollowups, setAllFollowups] = useState<Followup[]>([]);

  // ── Drawer / 360 view ─────────────────────────────────────────────────────
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [drawerTab, setDrawerTab] = useState<
    'overview' | 'calls' | 'consultations' | 'opportunities' | 'followups' | 'documents'
  >('overview');

  // ── Filters ───────────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState('All');
  const [assetClassFilter, setAssetClassFilter] = useState('All');
  const [consultantFilter, setConsultantFilter] = useState('All');

  // ── Create / Edit modal ───────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState<Investor | null>(null);
  const [form, setForm] = useState<InvestorForm>(BLANK_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof InvestorForm, string>>>({});

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadData = () => {
    setInvestors(storageService.getInvestors(tenant?.id));
    setAllCalls(storageService.getCalls(tenant?.id));
    setAllConsultations(storageService.getConsultations(tenant?.id));
    setAllOpportunities(storageService.getOpportunities(tenant?.id));
    setAllFollowups(storageService.getFollowups(tenant?.id));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('nexus_storage_updated', handleUpdate);
    return () => window.removeEventListener('nexus_storage_updated', handleUpdate);
  }, [tenant?.id]);

  // Reset drawer tab whenever a different investor is selected
  useEffect(() => {
    setDrawerTab('overview');
  }, [selectedInvestor?.id]);

  // ── Role-based scoping ────────────────────────────────────────────────────
  // sales_executive sees only their own investors; managers/admins see all
  const scopedInvestors = isExec
    ? investors.filter(
        inv =>
          (inv.assignedAgentId && inv.assignedAgentId === user?.id) ||
          (inv.assignedAgentName && inv.assignedAgentName === user?.name),
      )
    : investors;

  // ── Filter options ────────────────────────────────────────────────────────
  const assetClassOptions = Array.from(new Set(scopedInvestors.map(inv => inv.preferredAssetClass)))
    .filter(Boolean)
    .map(cls => ({ value: cls, label: cls }));

  const consultantOptions = Array.from(new Set(scopedInvestors.map(inv => inv.assignedAgentName)))
    .filter(Boolean)
    .map(name => ({ value: name, label: name }));

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filteredInvestors = scopedInvestors.filter(inv => {
    if (statusFilter !== 'All' && inv.status !== statusFilter) return false;
    if (assetClassFilter !== 'All' && inv.preferredAssetClass !== assetClassFilter) return false;
    if (consultantFilter !== 'All' && inv.assignedAgentName !== consultantFilter) return false;
    return true;
  });

  // ── Linked records for selected investor ──────────────────────────────────
  const investorCalls = allCalls.filter(
    c =>
      selectedInvestor &&
      (c.investorId === selectedInvestor.id || c.contactName === selectedInvestor.name),
  );

  const investorConsultations = allConsultations.filter(
    c =>
      selectedInvestor &&
      (c.investorId === selectedInvestor.id || c.investorName === selectedInvestor.name),
  );

  const investorOpportunities = allOpportunities.filter(
    o =>
      selectedInvestor &&
      (o.investorId === selectedInvestor.id || o.investorName === selectedInvestor.name),
  );

  const investorFollowups = allFollowups.filter(
    f =>
      selectedInvestor &&
      (f.contactId === selectedInvestor.id || f.contactName === selectedInvestor.name),
  );

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openNewModal = () => {
    setEditingInvestor(null);
    setForm({
      ...BLANK_FORM,
      // Lock exec to themselves
      assignedAgentId: isExec ? (user?.id ?? '') : '',
      assignedAgentName: isExec ? (user?.name ?? '') : '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (inv: Investor) => {
    setEditingInvestor(inv);
    setForm({
      name: inv.name,
      phone: inv.phone,
      email: inv.email,
      status: inv.status,
      investmentCapacity: inv.investmentCapacity,
      preferredAssetClass: inv.preferredAssetClass,
      assignedAgentId: inv.assignedAgentId,
      assignedAgentName: inv.assignedAgentName,
      referralSource: inv.referralSource ?? '',
      notes: inv.notes,
      committedAUM: inv.committedAUM ?? '',
      investmentMandate: inv.investmentMandate ?? '',
      riskTolerance: inv.riskTolerance ?? '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingInvestor(null);
    setForm(BLANK_FORM);
    setFormErrors({});
  };

  const setField = <K extends keyof InvestorForm>(key: K, value: InvestorForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (formErrors[key]) setFormErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const handleSaveInvestor = () => {
    const errors: Partial<Record<keyof InvestorForm, string>> = {};
    if (!form.name.trim()) errors.name = 'Name is required.';
    if (!form.phone.trim()) errors.phone = 'Phone is required.';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const now = new Date().toISOString().split('T')[0];
    const investor: Investor = {
      id: editingInvestor ? editingInvestor.id : `inv-${Date.now()}`,
      companyId: tenant?.id ?? '',
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      status: form.status,
      investmentCapacity: form.investmentCapacity.trim(),
      preferredAssetClass: form.preferredAssetClass.trim(),
      assignedAgentId: form.assignedAgentId.trim() || (user?.id ?? ''),
      assignedAgentName: form.assignedAgentName.trim() || (user?.name ?? ''),
      referralSource: form.referralSource.trim() || undefined,
      createdAt: editingInvestor ? editingInvestor.createdAt : now,
      notes: form.notes.trim(),
      ...(form.committedAUM.trim() ? { committedAUM: form.committedAUM.trim() } : {}),
      ...(form.investmentMandate.trim() ? { investmentMandate: form.investmentMandate.trim() } : {}),
      ...(form.riskTolerance ? { riskTolerance: form.riskTolerance as Investor['riskTolerance'] } : {}),
    };

    storageService.saveInvestor(investor);
    closeModal();
    setSelectedInvestor(investor);
  };

  // ── CSV Export ────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const rows = filteredInvestors.map(inv => ({
      Name: inv.name,
      Phone: inv.phone,
      Email: inv.email,
      Status: inv.status,
      'Investment Capacity': inv.investmentCapacity,
      'Preferred Asset Class': inv.preferredAssetClass,
      'Committed AUM': inv.committedAUM ?? '',
      'Investment Mandate': inv.investmentMandate ?? '',
      'Risk Tolerance': inv.riskTolerance ?? '',
      'Assigned Consultant': inv.assignedAgentName,
      'Referral Source': inv.referralSource ?? '',
      'Created At': inv.createdAt,
      Notes: inv.notes,
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `investors_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ── Delete handler ────────────────────────────────────────────────────────
  const handleDeleteInvestor = (inv: Investor) => {
    if (!window.confirm(`Delete investor "${inv.name}"? This cannot be undone.`)) return;
    storageService.deleteInvestor(inv.id);
    if (selectedInvestor?.id === inv.id) setSelectedInvestor(null);
  };

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns: Column<Investor>[] = [
    {
      key: 'name',
      header: 'Investor Profile',
      sortable: true,
      render: inv => (
        <div>
          <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{inv.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            {inv.phone} {inv.email && `• ${inv.email}`}
          </div>
        </div>
      ),
    },
    {
      key: 'investmentCapacity',
      header: 'Capital Capacity',
      sortable: true,
      render: inv => (
        <span style={{ fontWeight: 800, color: '#0284c7' }}>{inv.investmentCapacity}</span>
      ),
    },
    {
      key: 'preferredAssetClass',
      header: 'Preferred Asset Class',
      sortable: true,
      render: inv => <span style={{ fontSize: 12 }}>{inv.preferredAssetClass}</span>,
    },
    {
      key: 'status',
      header: 'KYC / Investor Status',
      sortable: true,
      render: inv => <StatusChip status={inv.status} size="sm" />,
    },
    {
      key: 'assignedAgentName',
      header: 'Wealth Consultant',
      render: inv => <span style={{ fontSize: 12 }}>{inv.assignedAgentName}</span>,
    },
  ];

  const rowActions: RowAction<Investor>[] = [
    {
      label: 'Call Investor',
      icon: <Phone size={14} color="#059669" style={{ marginRight: 6 }} />,
      onClick: inv => initiateCall(inv.name, inv.phone, 'customer', inv.id),
    },
    {
      label: 'View Investor 360',
      icon: <ExternalLink size={14} style={{ marginRight: 6 }} />,
      onClick: inv => setSelectedInvestor(inv),
    },
    {
      label: 'Edit Investor',
      icon: <Edit2 size={14} color="var(--primary-600)" style={{ marginRight: 6 }} />,
      onClick: inv => openEditModal(inv),
    },
    {
      label: 'Delete Investor',
      icon: <Trash2 size={14} color="#dc2626" style={{ marginRight: 6 }} />,
      onClick: inv => handleDeleteInvestor(inv),
    },
  ];

  // ── Shared tab button style helper ────────────────────────────────────────
  const tabBtnStyle = (active: boolean): React.CSSProperties => ({
    borderRadius: 0,
    borderBottom: active ? '2px solid var(--primary-600)' : '2px solid transparent',
    color: active ? 'var(--primary-600)' : 'var(--text-secondary)',
    fontWeight: active ? 700 : 500,
    padding: '10px 14px',
    fontSize: 13,
    background: 'none',
    border: 'none',
    borderBottomStyle: 'solid',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <TrendingUp size={24} color="#0284c7" /> High Net-Worth Investors 360
          </h1>
          <p className="page-subtitle">
            Private wealth client directory, institutional capital allocation, and mandate
            tracking for {tenant?.name}.
          </p>
        </div>

        {/* Header actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            id="investors-export-csv"
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
            onClick={handleExportCSV}
          >
            <Download size={15} /> Export CSV
          </button>
          <button
            id="investors-new-investor"
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
            }}
            onClick={openNewModal}
          >
            <Plus size={15} /> New Investor
          </button>
        </div>
      </div>

      {/* ── Data table ───────────────────────────────────────────────────── */}
      <DataTable
        columns={columns}
        data={filteredInvestors}
        keyExtractor={inv => inv.id}
        rowActions={rowActions}
        onRowClick={inv => setSelectedInvestor(inv)}
        searchPlaceholder="Search investors by name, asset class, or capacity..."
        filtersNode={
          <FilterBar
            filters={[
              {
                key: 'status',
                label: 'Status',
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { value: 'Lead', label: 'Lead' },
                  { value: 'Active Investor', label: 'Active Investor' },
                  { value: 'HNW Investor', label: 'HNW Investor' },
                  { value: 'Inactive', label: 'Inactive' },
                ],
              },
              {
                key: 'assetClass',
                label: 'Asset Class',
                value: assetClassFilter,
                onChange: setAssetClassFilter,
                options: assetClassOptions,
              },
              {
                key: 'consultant',
                label: 'Consultant',
                value: consultantFilter,
                onChange: setConsultantFilter,
                options: consultantOptions,
              },
            ]}
            onClearAll={() => {
              setStatusFilter('All');
              setAssetClassFilter('All');
              setConsultantFilter('All');
            }}
          />
        }
      />

      {/* ── Investor 360 Drawer ──────────────────────────────────────────── */}
      <Drawer
        isOpen={!!selectedInvestor}
        onClose={() => setSelectedInvestor(null)}
        title={selectedInvestor?.name || 'Investor Overview'}
        subtitle={`Mandate: ${selectedInvestor?.preferredAssetClass ?? ''}`}
        width={720}
      >
        {selectedInvestor && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Quick-action bar */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface-hover)',
                borderRadius: 'var(--radius-lg)',
                padding: 14,
                border: '1px solid var(--border-base)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <div>
                <StatusChip status={selectedInvestor.status} />
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  Lead Wealth Partner:{' '}
                  <strong>{selectedInvestor.assignedAgentName}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                  onClick={() => openEditModal(selectedInvestor)}
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                  onClick={() =>
                    initiateCall(
                      selectedInvestor.name,
                      selectedInvestor.phone,
                      'customer',
                      selectedInvestor.id,
                    )
                  }
                >
                  <Phone size={13} /> Call Investor
                </button>
              </div>
            </div>

            {/* Tab strip */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--border-base)',
                backgroundColor: 'var(--bg-surface)',
                overflowX: 'auto',
                marginBottom: 20,
              }}
            >
              {(
                [
                  { id: 'overview', label: 'Overview' },
                  { id: 'calls', label: `Calls (${investorCalls.length})` },
                  {
                    id: 'consultations',
                    label: `Consultations (${investorConsultations.length})`,
                  },
                  {
                    id: 'opportunities',
                    label: `Opportunities (${investorOpportunities.length})`,
                  },
                  { id: 'followups', label: `Follow-ups (${investorFollowups.length})` },
                  { id: 'documents', label: 'Documents' },
                ] as const
              ).map(tab => (
                <button
                  key={tab.id}
                  className="btn btn-ghost"
                  style={tabBtnStyle(drawerTab === tab.id)}
                  onClick={() => setDrawerTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Tab: Overview ─────────────────────────────────────────── */}
            {drawerTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="card" style={{ padding: 18 }}>
                  <h4
                    style={{
                      fontSize: 13,
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      marginBottom: 12,
                    }}
                  >
                    Investment Allocation &amp; Capacity
                  </h4>
                  <div
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: 13 }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Capital Ticket:</span>
                      <div style={{ fontWeight: 800, color: '#0284c7', fontSize: 16 }}>
                        {selectedInvestor.investmentCapacity || '—'}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Target Assets:</span>
                      <div style={{ fontWeight: 700 }}>
                        {selectedInvestor.preferredAssetClass || '—'}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Syndicate / Referral:</span>
                      <div style={{ fontWeight: 600 }}>
                        {selectedInvestor.referralSource || 'Private Network'}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Onboarded:</span>
                      <div style={{ fontWeight: 600 }}>{selectedInvestor.createdAt}</div>
                    </div>
                    {selectedInvestor.committedAUM && (
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Committed AUM:</span>
                        <div style={{ fontWeight: 700, color: '#059669' }}>
                          {selectedInvestor.committedAUM}
                        </div>
                      </div>
                    )}
                    {selectedInvestor.investmentMandate && (
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Mandate:</span>
                        <div style={{ fontWeight: 600 }}>{selectedInvestor.investmentMandate}</div>
                      </div>
                    )}
                    {selectedInvestor.riskTolerance && (
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Risk Tolerance:</span>
                        <div style={{ fontWeight: 600 }}>{selectedInvestor.riskTolerance}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card" style={{ padding: 18 }}>
                  <h4
                    style={{
                      fontSize: 13,
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      marginBottom: 10,
                    }}
                  >
                    Advisory Portfolio Notes
                  </h4>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {selectedInvestor.notes || 'Institutional investor evaluation completed.'}
                  </p>
                </div>
              </div>
            )}

            {/* ── Tab: Calls ────────────────────────────────────────────── */}
            {drawerTab === 'calls' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {investorCalls.length === 0 ? (
                  <div
                    style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}
                  >
                    No calls logged yet with this investor.
                  </div>
                ) : (
                  investorCalls.map(c => (
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
                            {Math.floor(c.duration / 60)}m {c.duration % 60}s • {c.timestamp}
                          </span>
                        </div>
                        {c.transcription && (
                          <p
                            style={{
                              fontSize: 12,
                              color: 'var(--text-secondary)',
                              marginTop: 6,
                              fontStyle: 'italic',
                            }}
                          >
                            "{c.transcription}"
                          </p>
                        )}
                      </div>
                      {c.recordingUrl && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() =>
                            alert(
                              `Simulated Playback: Playing audio for call with ${c.contactName}`,
                            )
                          }
                        >
                          <Play size={13} color="var(--primary-600)" /> Play Recording
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── Tab: Consultations ────────────────────────────────────── */}
            {drawerTab === 'consultations' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {investorConsultations.length === 0 ? (
                  <div
                    style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}
                  >
                    No consultations scheduled for this investor.
                  </div>
                ) : (
                  investorConsultations.map(c => (
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
                          <StatusChip status={c.status} size="sm" />
                          <span style={{ fontWeight: 600, fontSize: 13 }}>
                            {c.agenda || 'Consultation'}
                          </span>
                        </div>
                        <div
                          style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 5 }}
                        >
                          📅 {c.scheduledAt} • Consultant:{' '}
                          <strong>{c.consultantName}</strong>
                        </div>
                        {c.outcomeNotes && (
                          <p
                            style={{
                              fontSize: 12,
                              color: 'var(--text-muted)',
                              fontStyle: 'italic',
                              marginTop: 4,
                            }}
                          >
                            {c.outcomeNotes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── Tab: Opportunities ───────────────────────────────────── */}
            {drawerTab === 'opportunities' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {investorOpportunities.length === 0 ? (
                  <div
                    style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}
                  >
                    No investment opportunities linked yet.
                  </div>
                ) : (
                  investorOpportunities.map(o => (
                    <div
                      key={o.id}
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
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{o.title}</div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginTop: 6,
                          }}
                        >
                          <StatusChip status={o.stage} size="sm" />
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            Close: {o.expectedCloseDate}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#059669' }}>
                          ₹{(o.committedAmount ?? 0).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          of ₹{(o.targetAmount ?? 0).toLocaleString('en-IN')} target
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── Tab: Follow-ups ──────────────────────────────────────── */}
            {drawerTab === 'followups' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {investorFollowups.length === 0 ? (
                  <div
                    style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}
                  >
                    No open follow-ups for this investor.
                  </div>
                ) : (
                  investorFollowups.map(f => (
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
                        <div
                          style={{ fontSize: 12, color: 'var(--primary-600)', marginTop: 4 }}
                        >
                          ⏰ Due: {f.scheduledAt} • {f.assignedAgentName}
                        </div>
                      </div>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => storageService.saveFollowup({ ...f, status: 'Completed' })}
                      >
                        Mark Done
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── Tab: Documents ──────────────────────────────────────── */}
            {drawerTab === 'documents' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <DocumentUploader
                  entityType="investor"
                  entityId={selectedInvestor.id}
                  allowedCategories={[
                    'KYC',
                    'Mandate Agreement',
                    'Term Sheet',
                    'PAN / Aadhar',
                    'Other',
                  ]}
                />
                <DocumentList
                  entityType="investor"
                  entityId={selectedInvestor.id}
                  canDelete
                />
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* ── Create / Edit Investor Modal ─────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingInvestor ? 'Edit Investor' : 'New Investor'}
        subtitle={
          editingInvestor
            ? `Editing profile for ${editingInvestor.name}.`
            : 'Create a new HNW investor profile for your firm.'
        }
        maxWidth={620}
        footer={
          <>
            <button className="btn btn-secondary" onClick={closeModal}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSaveInvestor}
            >
              {editingInvestor ? 'Update Investor' : 'Save Investor'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Row: Name + Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input
                id="inv-form-name"
                className={`form-input${formErrors.name ? ' is-invalid' : ''}`}
                placeholder="e.g. Rajiv Mehta"
                value={form.name}
                onChange={e => setField('name', e.target.value)}
              />
              {formErrors.name && <div className="form-error">{formErrors.name}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Phone *</label>
              <input
                id="inv-form-phone"
                className={`form-input${formErrors.phone ? ' is-invalid' : ''}`}
                placeholder="e.g. +91 98765 43210"
                value={form.phone}
                onChange={e => setField('phone', e.target.value)}
              />
              {formErrors.phone && <div className="form-error">{formErrors.phone}</div>}
            </div>
          </div>

          {/* Row: Email + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                id="inv-form-email"
                className="form-input"
                placeholder="e.g. rajiv@example.com"
                value={form.email}
                onChange={e => setField('email', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                id="inv-form-status"
                className="form-select"
                value={form.status}
                onChange={e => setField('status', e.target.value as InvestorForm['status'])}
              >
                <option value="Lead">Lead</option>
                <option value="Active Investor">Active Investor</option>
                <option value="HNW Investor">HNW Investor</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Row: Capital Capacity + Preferred Asset Class */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Investment Capacity</label>
              <input
                id="inv-form-capacity"
                className="form-input"
                placeholder="e.g. ₹5 Cr"
                value={form.investmentCapacity}
                onChange={e => setField('investmentCapacity', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Preferred Asset Class</label>
              <input
                id="inv-form-asset-class"
                className="form-input"
                placeholder="e.g. Residential, Commercial"
                value={form.preferredAssetClass}
                onChange={e => setField('preferredAssetClass', e.target.value)}
              />
            </div>
          </div>

          {/* Row: Committed AUM + Risk Tolerance */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Committed AUM</label>
              <input
                id="inv-form-aum"
                className="form-input"
                placeholder="e.g. ₹2.5 Cr"
                value={form.committedAUM}
                onChange={e => setField('committedAUM', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Risk Tolerance</label>
              <select
                id="inv-form-risk"
                className="form-select"
                value={form.riskTolerance}
                onChange={e =>
                  setField(
                    'riskTolerance',
                    e.target.value as InvestorForm['riskTolerance'],
                  )
                }
              >
                <option value="">— Not specified —</option>
                <option value="Conservative">Conservative</option>
                <option value="Moderate">Moderate</option>
                <option value="Aggressive">Aggressive</option>
              </select>
            </div>
          </div>

          {/* Investment Mandate */}
          <div className="form-group">
            <label className="form-label">Investment Mandate</label>
            <input
              id="inv-form-mandate"
              className="form-input"
              placeholder="e.g. Long-term capital appreciation in Tier-1 commercial assets"
              value={form.investmentMandate}
              onChange={e => setField('investmentMandate', e.target.value)}
            />
          </div>

          {/* Row: Referral Source + Assigned Consultant */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Referral Source</label>
              <input
                id="inv-form-referral"
                className="form-input"
                placeholder="e.g. Private Network, Bank"
                value={form.referralSource}
                onChange={e => setField('referralSource', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Assigned Consultant
                {isExec && (
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      fontWeight: 400,
                    }}
                  >
                    (auto-assigned to you)
                  </span>
                )}
              </label>
              {isExec ? (
                <input
                  className="form-input"
                  value={form.assignedAgentName}
                  readOnly
                  style={{
                    backgroundColor: 'var(--bg-surface-hover)',
                    cursor: 'not-allowed',
                    color: 'var(--text-secondary)',
                  }}
                />
              ) : (
                <input
                  id="inv-form-consultant"
                  className="form-input"
                  placeholder="e.g. Ananya Iyer"
                  value={form.assignedAgentName}
                  onChange={e => {
                    setField('assignedAgentName', e.target.value);
                    setField('assignedAgentId', '');
                  }}
                />
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              id="inv-form-notes"
              className="form-input"
              rows={3}
              placeholder="Advisory notes, risk profile summary, key investment preferences…"
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
