import React, { useState, useEffect } from 'react';
import { FileCheck, Download, Filter, Shield } from 'lucide-react';
import { AuditLog } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { DataTable, Column } from '../../components/common/DataTable';

export const CompanyAuditPage: React.FC = () => {
  const { tenant } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    setLogs(storageService.getAuditLogs(tenant?.id));
    const handleUpdate = () => setLogs(storageService.getAuditLogs(tenant?.id));
    window.addEventListener('nexus_storage_updated', handleUpdate);
    return () => window.removeEventListener('nexus_storage_updated', handleUpdate);
  }, [tenant?.id]);

  const columns: Column<AuditLog>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      sortable: true,
      render: l => <span style={{ fontSize: 12, fontWeight: 500 }}>{l.timestamp}</span>,
    },
    {
      key: 'actorName',
      header: 'Actor',
      sortable: true,
      render: l => (
        <div>
          <div style={{ fontWeight: 700 }}>{l.actorName}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.actorEmail}</div>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Event Action',
      sortable: true,
      render: l => (
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 6px',
            backgroundColor: 'var(--bg-surface-hover)',
            borderRadius: 4,
          }}
        >
          {l.action}
        </span>
      ),
    },
    {
      key: 'entityType',
      header: 'Target Entity',
      render: l => (
        <span style={{ fontSize: 12 }}>
          {l.entityType} ({l.entityId})
        </span>
      ),
    },
    {
      key: 'details',
      header: 'Audit Trail Details',
      render: l => <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{l.details}</span>,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FileCheck size={24} color="var(--primary-600)" /> Security & Audit Log
          </h1>
          <p className="page-subtitle">
            Immutable traceability ledger for data mutations, call dispositions, and plot reservations for {tenant?.name}.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        keyExtractor={l => l.id}
        searchPlaceholder="Search audit events by actor or action..."
      />
    </div>
  );
};
