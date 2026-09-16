import React, { useState, useEffect } from 'react';
import { Bell, Check, Phone, Users, Calendar, AlertCircle } from 'lucide-react';
import { NotificationItem } from '../../types';
import { storageService } from '../../services/storageService';

interface NotificationsPageProps {
  onNavigate: (route: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const loadData = () => {
    setNotifications(storageService.getNotifications());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('nexus_storage_updated', handleUpdate);
    return () => window.removeEventListener('nexus_storage_updated', handleUpdate);
  }, []);

  const handleMarkAll = () => {
    storageService.markAllNotificationsRead();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Bell size={24} color="var(--primary-600)" /> Notification Center
          </h1>
          <p className="page-subtitle">
            Real-time activity alerts, incoming call recordings, follow-up deadlines, and system events.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={handleMarkAll}>
          <Check size={15} /> Mark All as Read
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {notifications.map(n => (
          <div
            key={n.id}
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-base)',
              backgroundColor: n.read ? 'var(--bg-surface)' : 'rgba(59, 130, 246, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
            onClick={() => {
              storageService.markNotificationRead(n.id);
              if (n.link) onNavigate(n.link.replace('/', ''));
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  backgroundColor: n.read ? 'var(--bg-surface-hover)' : 'var(--primary-50)',
                  color: n.read ? 'var(--text-muted)' : 'var(--primary-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {n.type === 'call' ? (
                  <Phone size={18} />
                ) : n.type === 'followup' ? (
                  <Calendar size={18} />
                ) : (
                  <Users size={18} />
                )}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                    {n.title}
                  </span>
                  {!n.read && (
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-600)',
                      }}
                    />
                  )}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {n.message}
                </p>
              </div>
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{n.timestamp}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
