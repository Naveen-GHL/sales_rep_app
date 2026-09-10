import React from 'react';
import { Users, Shield } from 'lucide-react';
import { USERS } from '../../../services/mockData';
import { DataTable, Column } from '../../../components/common/DataTable';
import { StatusChip } from '../../../components/common/StatusChip';
import { User } from '../../../types';

export const PlatformUsersPage: React.FC = () => {
  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'User Name',
      sortable: true,
      render: u => (
        <div>
          <div style={{ fontWeight: 700, color: '#ffffff' }}>{u.name}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{u.email}</div>
        </div>
      ),
    },
    {
      key: 'companyName',
      header: 'Tenant Organization',
      sortable: true,
      render: u => (
        <span style={{ fontWeight: 600, color: '#38bdf8' }}>
          {u.companyName || 'Platform Console (Global)'}
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Role Code',
      render: u => (
        <span style={{ color: '#c084fc', fontWeight: 600 }}>{u.role.name}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: u => <StatusChip status={u.status} size="sm" />,
    },
    {
      key: 'lastLogin',
      header: 'Last Active',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#ffffff' }}>
            <Users size={24} color="#8b5cf6" /> Cross-Tenant Users & Agents
          </h1>
          <p className="page-subtitle" style={{ color: '#94a3b8' }}>
            Platform-wide identity directory covering all tenant company organizations.
          </p>
        </div>
      </div>

      <div style={{ color: '#cbd5e1' }}>
        <DataTable
          columns={columns}
          data={USERS}
          keyExtractor={u => u.id}
          searchPlaceholder="Search all platform users..."
        />
      </div>
    </div>
  );
};
