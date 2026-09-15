import React, { useState, useEffect } from 'react';
import { Briefcase, Kanban } from 'lucide-react';
import { Deal } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { DataTable, Column, RowAction } from '../../components/common/DataTable';
import { StatusChip } from '../../components/common/StatusChip';
import { FilterBar } from '../../components/common/FilterBar';
import { PIPELINE_STAGES } from '../../constants/pipelineStages';

interface DealsPageProps {
  onNavigate: (route: string) => void;
}

export const DealsPage: React.FC<DealsPageProps> = ({ onNavigate }) => {
  const { tenant, user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stageFilter, setStageFilter] = useState('All');
  const [agentFilter, setAgentFilter] = useState('All');

  // Role-based scoping: Sales Executives see only their own deals.
  // Managers / Admins / Super Admins see the full company deal list (no filter).
  const roleCode = user?.role?.code;
  const isExec = roleCode === 'sales_executive';
  const scopedDeals = isExec
    ? deals.filter(d =>
        (d.assignedAgentId && d.assignedAgentId === user?.id) ||
        (d.assignedAgentName && d.assignedAgentName === user?.name)
      )
    : deals;

  useEffect(() => {
    setDeals(storageService.getDeals(tenant?.id));
    const handleUpdate = () => setDeals(storageService.getDeals(tenant?.id));
    window.addEventListener('nexus_storage_updated', handleUpdate);
    return () => window.removeEventListener('nexus_storage_updated', handleUpdate);
  }, [tenant?.id]);

  const filteredDeals = scopedDeals.filter(d => {
    if (stageFilter !== 'All' && d.stage !== stageFilter) return false;
    if (agentFilter !== 'All' && d.assignedAgentName !== agentFilter) return false;
    return true;
  });

  const agentOptions = Array.from(new Set(scopedDeals.map(d => d.assignedAgentName)))
    .filter(Boolean)
    .map(name => ({ value: name, label: name }));

  const stages =
    tenant?.slug === 'ghl'
      ? PIPELINE_STAGES.ghl
      : tenant?.slug === 'jamin'
      ? PIPELINE_STAGES.jamin
      : PIPELINE_STAGES.default;

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
        data={filteredDeals}
        keyExtractor={d => d.id}
        searchPlaceholder="Search deals by title or contact..."
        filtersNode={
          <FilterBar
            filters={[
              {
                key: 'stage',
                label: 'Stage',
                value: stageFilter,
                onChange: setStageFilter,
                options: stages.map(s => ({ value: s.id, label: s.name })),
              },
              ...(!isExec ? [{
                key: 'agent',
                label: 'Agent',
                value: agentFilter,
                onChange: setAgentFilter,
                options: agentOptions,
              }] : []),
            ]}
            onClearAll={() => {
              setStageFilter('All');
              setAgentFilter('All');
            }}
          />
        }
      />
    </div>
  );
};
