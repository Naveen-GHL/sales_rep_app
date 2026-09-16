import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, DollarSign, TrendingUp, CheckCircle } from 'lucide-react';
import { InvestmentOpportunity } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { DataTable, Column, RowAction } from '../../components/common/DataTable';
import { StatusChip } from '../../components/common/StatusChip';
import { Modal } from '../../components/common/Modal';
import './OpportunitiesPage.css';

export const OpportunitiesPage: React.FC = () => {
  const { tenant } = useAuth();
  const [opps, setOpps] = useState<InvestmentOpportunity[]>([]);

  const loadData = () => {
    setOpps(storageService.getOpportunities(tenant?.id));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('nexus_storage_updated', handleUpdate);
    return () => window.removeEventListener('nexus_storage_updated', handleUpdate);
  }, [tenant?.id]);

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const columns: Column<InvestmentOpportunity>[] = [
    {
      key: 'title',
      header: 'Commercial Asset / Tranche',
      sortable: true,
      render: o => (
        <div>
          <div className="opp-title-primary">{o.title}</div>
          <div className="opp-notes-sub">{o.notes}</div>
        </div>
      ),
    },
    {
      key: 'investorName',
      header: 'Lead Institutional Backer',
      sortable: true,
      render: o => <span className="opp-investor-text">{o.investorName}</span>,
    },
    {
      key: 'targetAmount',
      header: 'Target Tranche',
      sortable: true,
      render: o => <span className="opp-target-text">{formatCurrency(o.targetAmount)}</span>,
    },
    {
      key: 'committedAmount',
      header: 'Committed Capital',
      sortable: true,
      render: o => <span className="opp-committed-text">{formatCurrency(o.committedAmount)}</span>,
    },
    {
      key: 'stage',
      header: 'Syndicate Stage',
      sortable: true,
      render: o => <StatusChip status={o.stage} size="sm" />,
    },
    {
      key: 'expectedCloseDate',
      header: 'Target Execution',
      sortable: true,
    },
  ];

  return (
    <div className="opportunities-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Briefcase size={24} color="#0284c7" /> Investment Opportunities Syndicate
          </h1>
          <p className="page-subtitle">
            Commercial real-estate fractional tranches, warehousing yields, and capital commitments for {tenant?.name}.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={opps}
        keyExtractor={o => o.id}
        searchPlaceholder="Search opportunities by asset title or investor..."
      />
    </div>
  );
};
