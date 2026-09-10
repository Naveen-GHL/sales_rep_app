import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Filter, Kanban } from 'lucide-react';
import { Deal } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { DataTable, Column, RowAction } from '../../components/common/DataTable';
import { StatusChip } from '../../components/common/StatusChip';

interface DealsPageProps {
  onNavigate: (route: string) => void;
}

export const DealsPage: React.FC<DealsPageProps> = ({ onNavigate }) => {
  const { tenant } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);

  useEffect(() => {
    setDeals(storageService.getDeals(tenant?.id));
    const handleUpdate = () => setDeals(storageService.getDeals(tenant?.id));
    window.addEventListener('nexus_storage_updated', handleUpdate);
    return () => window.removeEventListener('nexus_storage_updated', handleUpdate);
  }, [tenant?.id]);

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const columns: Column<Deal>[] = [
    {
      key: 'title',
      header: 'Deal Title',
      sortable: true,
      render: d => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{d.title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Created on {d.createdAt}</div>
        </div>
      ),
    },
    {
      key: 'customerName',
      header: 'Associated Contact',
      sortable: true,
      render: d => <span style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{d.customerName}</span>,
    },
    {
      key: 'stage',
      header: 'Pipeline Stage',
      sortable: true,
      render: d => <StatusChip status={d.stage} size="sm" />,
    },
    {
      key: 'value',
      header: 'Deal Value',
      sortable: true,
      render: d => <span style={{ fontWeight: 800, color: '#059669' }}>{formatCurrency(d.value)}</span>,
    },
    {
      key: 'expectedCloseDate',
      header: 'Expected Close',
      sortable: true,
    },
    {
      key: 'assignedAgentName',
      header: 'Owner',
      render: d => <span style={{ fontSize: 12 }}>{d.assignedAgentName}</span>,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Briefcase size={24} color="var(--primary-600)" /> Deals Directory
          </h1>
          <p className="page-subtitle">
            Comprehensive list view of all active sales and investment opportunities for {tenant?.name}.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={() => onNavigate('pipeline')}>
          <Kanban size={15} /> Switch to Kanban Board
        </button>
      </div>

      <DataTable
        columns={columns}
        data={deals}
        keyExtractor={d => d.id}
        searchPlaceholder="Search deals by title or contact..."
      />
    </div>
  );
};
