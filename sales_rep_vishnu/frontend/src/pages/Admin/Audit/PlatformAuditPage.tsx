import React, { useState, useEffect } from 'react';
import { FileCheck, Shield } from 'lucide-react';
import { AuditLog } from '../../../types';
import { storageService } from '../../../services/storageService';
import { DataTable, Column } from '../../../components/common/DataTable';

export const PlatformAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    setLogs(storageService.getAuditLogs());
    const handleUpdate = () => setLogs(storageService.getAuditLogs());
    window.addEventListener('nexus_storage_updated', handleUpdate);
    return () => window.removeEventListener('nexus_storage_updated', handleUpdate);
  }, []);

  const columns: Column<AuditLog>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      sortable: true,
      render: l => <span style={{ fontSize: 12, color: '#94a3b8' }}>{l.timestamp}</span>,
    },
    {
      key: 'companyName',
      header: 'Tenant Namespace',
      sortable: true,
      render: l => (
        <span style={{ fontWeight: 700, color: '#38bdf8' }}>
          {l.companyName || 'GLOBAL PLATFORM'}
        </span>
      ),
    },
    {
      key: 'actorName',
      header: 'Actor Identity',
      sortable: true,
      render: l => (
        <div>
          <div style={{ fontWeight: 700, color: '#ffffff' }}>{l.actorName}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{l.actorEmail}</div>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action Key',
      sortable: true,
      render: l => (
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 6px',
            backgroundColor: '#1e293b',
            color: '#c084fc',
            borderRadius: 4,
          }}
        >
          {l.action}
        </span>
      ),
    },
    {
      key: 'details',
      header: 'Event Description',
      render: l => <span style={{ fontSize: 12, color: '#cbd5e1' }}>{l.details}</span>,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#ffffff' }}>
            <FileCheck size={24} color="#8b5cf6" /> System-Wide Security Audit Logs
          </h1>
          <p className="page-subtitle" style={{ color: '#94a3b8' }}>
            Cross-tenant immutable audit trail across tenant activations, calling dispositions, and plot reservations.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        keyExtractor={l => l.id}
        searchPlaceholder="Filter cross-tenant audit events..."
      />
    </div>
  );
};
