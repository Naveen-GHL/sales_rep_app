import React, { useState, useEffect } from 'react';
import { CalendarCheck, Phone, CheckCircle, Clock, AlertTriangle, Filter, Plus } from 'lucide-react';
import { Followup } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { storageService } from '../../services/storageService';
import { StatusChip } from '../../components/common/StatusChip';
import { Modal } from '../../components/common/Modal';

export const FollowupsPage: React.FC = () => {
  const { tenant, user } = useAuth();
  const { initiateCall } = useCall();

  const [followups, setFollowups] = useState<Followup[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'due' | 'overdue' | 'completed'>('all');
  const [rescheduleItem, setRescheduleItem] = useState<Followup | null>(null);
  const [newDate, setNewDate] = useState('Tomorrow, 11:30 AM');

  const loadData = () => {
    setFollowups(storageService.getFollowups(tenant?.id));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('nexus_storage_updated', handleUpdate);
    return () => window.removeEventListener('nexus_storage_updated', handleUpdate);
  }, [tenant?.id]);

  const filteredFollowups = followups.filter(f => {
    if (activeTab === 'completed') return f.status === 'Completed';
    if (activeTab === 'overdue') return f.status === 'Pending' && f.scheduledAt.toLowerCase().includes('yesterday');
    if (activeTab === 'due') return f.status === 'Pending' && f.scheduledAt.toLowerCase().includes('today');
    return true;
  });

  const handleComplete = (f: Followup) => {
    storageService.saveFollowup({ ...f, status: 'Completed' });
  };

  const handleSaveReschedule = () => {
    if (rescheduleItem) {
      storageService.saveFollowup({
        ...rescheduleItem,
        scheduledAt: newDate,
        status: 'Pending',
      });
      setRescheduleItem(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <CalendarCheck size={24} color="var(--primary-600)" /> Follow-ups & Reminders
          </h1>
          <p className="page-subtitle">
            Time-sensitive client touchpoints, follow-up calls, and task scheduling for {tenant?.name}.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { id: 'all', label: `All Follow-ups (${followups.length})` },
          { id: 'due', label: `Due Today (${followups.filter(f => f.status === 'Pending' && f.scheduledAt.toLowerCase().includes('today')).length})` },
          { id: 'overdue', label: `Overdue (${followups.filter(f => f.status === 'Pending' && f.scheduledAt.toLowerCase().includes('yesterday')).length})`, danger: true },
          { id: 'completed', label: `Completed (${followups.filter(f => f.status === 'Completed').length})` },
        ].map(tab => (
          <button
            key={tab.id}
            className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              backgroundColor: tab.danger && activeTab === tab.id ? '#dc2626' : undefined,
              borderColor: tab.danger && activeTab !== tab.id ? 'rgba(239,68,68,0.4)' : undefined,
            }}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.danger && <AlertTriangle size={13} color={activeTab === tab.id ? '#ffffff' : '#dc2626'} />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Follow-ups List Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredFollowups.length === 0 ? (
          <div className="card text-center" style={{ padding: 48, color: 'var(--text-secondary)' }}>
            No tasks in this category. You're all caught up!
          </div>
        ) : (
          filteredFollowups.map(f => {
            const isOverdue = f.status === 'Pending' && f.scheduledAt.toLowerCase().includes('yesterday');

            return (
              <div
                key={f.id}
                className="card card-hover"
                style={{
                  padding: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderLeft: isOverdue ? '4px solid #dc2626' : '1px solid var(--border-base)',
                  backgroundColor: f.status === 'Completed' ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
                  opacity: f.status === 'Completed' ? 0.75 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      border: '1px solid var(--border-strong)',
                      marginTop: 2,
                    }}
                    title={f.status === 'Completed' ? 'Completed' : 'Mark Completed'}
                    onClick={() => handleComplete(f)}
                  >
                    {f.status === 'Completed' ? (
                      <CheckCircle size={16} color="#059669" />
                    ) : (
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'transparent' }} />
                    )}
                  </button>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          textDecoration: f.status === 'Completed' ? 'line-through' : 'none',
                        }}
                      >
                        {f.contactName}
                      </span>
                      <StatusChip status={f.priority} size="sm" />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Phone: {f.contactPhone}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                      {f.notes}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, fontSize: 12 }}>
                      <span style={{ fontWeight: 600, color: isOverdue ? '#dc2626' : 'var(--primary-600)' }}>
                        ⏰ {f.scheduledAt}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>• Assignee: {f.assignedAgentName}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setRescheduleItem(f)}
                  >
                    Reschedule
                  </button>
                  <button
                    className="btn btn-call btn-sm"
                    onClick={() => initiateCall(f.contactName, f.contactPhone, f.contactType as any, f.contactId)}
                  >
                    <Phone size={13} /> Call
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reschedule Modal */}
      <Modal
        isOpen={!!rescheduleItem}
        onClose={() => setRescheduleItem(null)}
        title="Reschedule Follow-up"
        subtitle={`Adjust scheduled reminder date for ${rescheduleItem?.contactName}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setRescheduleItem(null)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSaveReschedule}>
              Save New Slot
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">New Date & Time</label>
          <input
            type="text"
            className="form-input"
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
            placeholder="e.g. Next Monday, 10:00 AM"
          />
        </div>
      </Modal>
    </div>
  );
};