import React, { useState, useEffect } from 'react';
import { TrendingUp, Phone, ExternalLink } from 'lucide-react';
import { Investor } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { storageService } from '../../services/storageService';
import { DataTable, Column, RowAction } from '../../components/common/DataTable';
import { StatusChip } from '../../components/common/StatusChip';
import { Drawer } from '../../components/common/Drawer';
import { FilterBar } from '../../components/common/FilterBar';
import { DocumentUploader } from '../../components/common/DocumentUploader';
import { DocumentList } from '../../components/common/DocumentList';
import './InvestorsPage.css';

export const InvestorsPage: React.FC = () => {
  const { tenant } = useAuth();
  const { initiateCall } = useCall();

  const [investors, setInvestors] = useState<Investor[]>([]);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [assetClassFilter, setAssetClassFilter] = useState('All');

  const loadData = () => {
    setInvestors(storageService.getInvestors(tenant?.id));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('nexus_storage_updated', handleUpdate);
    return () => window.removeEventListener('nexus_storage_updated', handleUpdate);
  }, [tenant?.id]);

  const filteredInvestors = investors.filter(inv => {
    if (statusFilter !== 'All' && inv.status !== statusFilter) return false;
    if (assetClassFilter !== 'All' && inv.preferredAssetClass !== assetClassFilter) return false;
    return true;
  });

  const assetClassOptions = Array.from(new Set(investors.map(inv => inv.preferredAssetClass)))
    .filter(Boolean)
    .map(cls => ({ value: cls, label: cls }));

  const columns: Column<Investor>[] = [
    {
      key: 'name',
      header: 'Investor Profile',
      sortable: true,
      render: inv => (
        <div>
          <div className="investor-name-cell">{inv.name}</div>
          <div className="investor-meta-cell">
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
        <span className="investor-capacity-badge">{inv.investmentCapacity}</span>
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
  ];

  return (
    <div className="investors-page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <TrendingUp size={24} color="#0284c7" /> High Net-Worth Investors 360
          </h1>
          <p className="page-subtitle">
            Private wealth client directory, institutional capital allocation, and mandate tracking for {tenant?.name}.
          </p>
        </div>
      </div>

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
            ]}
            onClearAll={() => {
              setStatusFilter('All');
              setAssetClassFilter('All');
            }}
          />
        }
      />

      {/* Investor 360 Drawer */}
      <Drawer
        isOpen={!!selectedInvestor}
        onClose={() => setSelectedInvestor(null)}
        title={selectedInvestor?.name || 'Investor Overview'}
        subtitle={`Mandate: ${selectedInvestor?.preferredAssetClass}`}
        width={560}
      >
        {selectedInvestor && (
          <div className="investor-drawer-body">
            <div className="investor-quick-card">
              <div>
                <StatusChip status={selectedInvestor.status} />
                <div className="investor-partner-label">
                  Lead Wealth Partner: <strong>{selectedInvestor.assignedAgentName}</strong>
                </div>
              </div>

              <button
                className="btn btn-primary btn-sm investor-call-btn-blue"
                onClick={() => initiateCall(selectedInvestor.name, selectedInvestor.phone, 'customer', selectedInvestor.id)}
              >
                <Phone size={13} /> Call Investor
              </button>
            </div>

            <div className="card investor-info-card">
              <h4 className="investor-info-title">
                Investment Allocation & Capacity
              </h4>
              <div className="investor-details-grid">
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Capital Ticket:</span>
                  <div className="investor-ticket-val">
                    {selectedInvestor.investmentCapacity}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Target Assets:</span>
                  <div style={{ fontWeight: 700 }}>{selectedInvestor.preferredAssetClass}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Syndicate / Referral:</span>
                  <div style={{ fontWeight: 600 }}>{selectedInvestor.referralSource || 'Private Network'}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Onboarded:</span>
                  <div style={{ fontWeight: 600 }}>{selectedInvestor.createdAt}</div>
                </div>
              </div>
            </div>

            <div className="card investor-info-card">
              <h4 className="investor-info-title">
                Advisory Portfolio Notes
              </h4>
              <p className="investor-notes-text">
                {selectedInvestor.notes || 'Institutional investor evaluation completed.'}
              </p>
            </div>

            {/* Documents */}
            <div className="card investor-info-card">
              <h4 className="investor-info-title">
                Documents
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <DocumentUploader
                  entityType="investor"
                  entityId={selectedInvestor.id}
                  allowedCategories={['KYC', 'Mandate Agreement', 'Term Sheet', 'PAN / Aadhar', 'Other']}
                />
                <DocumentList
                  entityType="investor"
                  entityId={selectedInvestor.id}
                  canDelete
                />
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
