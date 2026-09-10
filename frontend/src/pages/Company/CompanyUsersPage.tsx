import React, { useState } from 'react';
import { Users, Plus, Shield, Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { USERS, ROLES } from '../../services/mockData';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusChip } from '../../components/common/StatusChip';
import { Modal } from '../../components/common/Modal';
import { User } from '../../types';

export const CompanyUsersPage: React.FC = () => {
  const { tenant } = useAuth();
  const [usersList, setUsersList] = useState<User[]>(
    USERS.filter(u => u.companySlug === tenant?.slug)
  );
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'sales_manager' | 'sales_executive'>('sales_executive');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: inviteName,
      email: inviteEmail,
      phone: '+91 98000 00000',
      role: ROLES[inviteRole],
      companyId: tenant?.id,
      companySlug: tenant?.slug,
      companyName: tenant?.name,
      status: 'Invited',
      lastLogin: 'Never',
    };

    setUsersList([...usersList, newUser]);
    setIsInviteModalOpen(false);
    setInviteName('');
    setInviteEmail('');
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'User Name & Email',
      sortable: true,
      render: u => (
        <div>
          <div style={{ fontWeight: 700 }}>{u.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Assigned Role',
      sortable: true,
      render: u => (
        <span style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{u.role.name}</span>
      ),
    },
    {
      key: 'phone',
      header: 'Contact',
    },
    {
      key: 'status',
      header: 'Account Status',
      sortable: true,
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
          <h1 className="page-title">
            <Users size={24} color="var(--primary-600)" /> Organization Users & Agents
          </h1>
          <p className="page-subtitle">
            Manage agent accounts, RBAC roles, and invitation states for {tenant?.name}.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsInviteModalOpen(true)}>
          <Plus size={15} /> Invite Team Member
        </button>
      </div>

      <DataTable
        columns={columns}
        data={usersList}
        keyExtractor={u => u.id}
        searchPlaceholder="Search users by name or email..."
      />

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite New Agent / Team Member"
        subtitle={`Send an email invitation link to join ${tenant?.name}`}
      >
        <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-input"
              required
              value={inviteName}
              onChange={e => setInviteName(e.target.value)}
              placeholder="e.g. Sumanth Hegde"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Corporate Email Address *</label>
            <input
              type="email"
              className="form-input"
              required
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="sumanth@organization.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Assign Role Privilege</label>
            <select
              className="form-select"
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as any)}
            >
              <option value="sales_executive">Sales Executive (Own Leads & Calling)</option>
              <option value="sales_manager">Sales Manager (Team Management & Reports)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Send Email Invitation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
