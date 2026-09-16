import React, { useState, useEffect } from 'react';
import { CalendarCheck, Phone, CheckCircle, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Followup } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { storageService } from '../../services/storageService';
import { StatusChip } from '../../components/common/StatusChip';
import { Modal } from '../../components/common/Modal';
import './FollowupsPage.css';

export const FollowupsPage: React.FC = () => {
  const { tenant, user } = useAuth();
  const { initiateCall } = useCall();

  const [followups, setFollowups] = useState<Followup[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'due' | 'overdue' | 'completed'>('all');
  const [rescheduleItem, setRescheduleItem] = useState<Followup | null>(null);
  const [newDate, setNewDate] = useState('');

  // Role-based scoping: Sales Executives see only their own follow-ups.
  // Managers / Admins / Super Admins see the full company follow-up list (no filter).
  const roleCode = user?.role?.code;
  const isExec = roleCode === 'sales_executive';
  const scopedFollowups = isExec
    ? followups.filter(f =>
        (f.assignedAgentId && f.assignedAgentId === user?.id) ||
        (f.assignedAgentName && f.assignedAgentName === user?.name)
      )
    : followups;

  const loadData = () => {
    setFollowups(storageService.getFollowups(tenant?.id));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('nexus_storage_updated', handleUpdate);
    return () => window.removeEventListener('nexus_storage_updated', handleUpdate);
  }, [tenant?.id]);

  const handleComplete = (f: Followup) => {
    storageService.saveFollowup({
      ...f,
      status: f.status === 'Completed' ? 'Pending' : 'Completed',
    });
  };

  const handleSaveReschedule = () => {
    if (rescheduleItem && newDate) {
      storageService.saveFollowup({
        ...rescheduleItem,
        scheduledAt: newDate,
        status: 'Pending',
      });
      setRescheduleItem(null);
      setNewDate('');
    }
  };

  const filteredFollowups = scopedFollowups.filter(f => {
    if (activeTab === 'due') {
      return f.status === 'Pending' && f.scheduledAt.toLowerCase().includes('today');
    }
    if (activeTab === 'overdue') {
      return f.status === 'Pending' && f.scheduledAt.toLowerCase().includes('yesterday');
    }
    if (activeTab === 'completed') {
      return f.status === 'Completed';
    }
    return true;
  });

  return (
    <div className="followups-page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <CalendarCheck size={24} color="var(--primary-600)" /> Follow-ups & Reminders
          </h1>
          <p className="page-subtitle">
            Keep commitments, maintain pipeline velocity, and log outcomes seamlessly.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="followups-tabs-container">
        {[
          { id: 'all', label: `All Tasks (${followups.length})` },
          { id: 'due', label: `Due Today (${followups.filter(f => f.status === 'Pending' && f.scheduledAt.toLowerCase().includes('today')).length})` },
          { id: 'overdue', label: `Overdue (${followups.filter(f => f.status === 'Pending' && f.scheduledAt.toLowerCase().includes('yesterday')).length})`, danger: true },
          { id: 'completed', label: `Completed (${followups.filter(f => f.status === 'Completed').length})` },
        ].map(tab => (
          <button
            key={tab.id}
            className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'} ${tab.danger && activeTab === tab.id ? 'followups-tab-danger-active' : tab.danger ? 'followups-tab-danger-inactive' : ''}`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.danger && <AlertTriangle size={13} color={activeTab === tab.id ? '#ffffff' : '#dc2626'} />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Follow-ups List Cards */}
      <div className="followups-list">
        {filteredFollowups.length === 0 ? (
          <div className="card text-center followups-empty-card">
            No tasks in this category. You're all caught up!
          </div>
        ) : (
          filteredFollowups.map(f => {
            const isOverdue = f.status === 'Pending' && f.scheduledAt.toLowerCase().includes('yesterday');

            return (
              <div
                key={f.id}
                className={`card card-hover followup-item-card ${isOverdue ? 'overdue' : ''} ${f.status === 'Completed' ? 'completed' : ''}`}
              >
                <div className="followup-item-left">
                  <button
                    className="btn btn-ghost btn-icon btn-sm followup-check-btn"
                    title={f.status === 'Completed' ? 'Completed' : 'Mark Completed'}
                    onClick={() => handleComplete(f)}
                  >
                    {f.status === 'Completed' ? (
                      <CheckCircle size={16} color="#059669" />
                    ) : (
                      <span className="followup-check-empty" />
                    )}
                  </button>

                  <div>
                    <div className="followup-contact-header">
                      <span className={`followup-contact-name ${f.status === 'Completed' ? 'completed' : ''}`}>
                        {f.contactName}
                      </span>
                      <StatusChip status={f.priority} size="sm" />
                      <span className="followup-contact-phone">
                        Phone: {f.contactPhone}
                      </span>
                    </div>
                    <p className="followup-notes">
                      {f.notes}
                    </p>
                    <div className="followup-meta-row">
                      <span className={`followup-schedule-time ${isOverdue ? 'overdue' : ''}`}>
                        ⏰ {f.scheduledAt}
                      </span>
                      <span className="followup-assignee">• Assignee: {f.assignedAgentName}</span>
                    </div>
                  </div>
                </div>

                <div className="followup-actions-right">
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