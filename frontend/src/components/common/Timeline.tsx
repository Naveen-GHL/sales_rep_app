import React from 'react';
import { PhoneCall, Calendar, FileText, CheckCircle2, MessageSquare, Tag } from 'lucide-react';

export interface TimelineEvent {
  id: string;
  type: 'call' | 'status_change' | 'note' | 'followup' | 'visit' | 'booking';
  title: string;
  description?: string;
  timestamp: string;
  actorName?: string;
  badge?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
}

export const Timeline: React.FC<TimelineProps> = ({ events }) => {
  const getIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'call':
        return <PhoneCall size={14} color="#2563eb" />;
      case 'followup':
        return <Calendar size={14} color="#d97706" />;
      case 'visit':
        return <Calendar size={14} color="#7c3aed" />;
      case 'booking':
        return <CheckCircle2 size={14} color="#059669" />;
      case 'status_change':
        return <Tag size={14} color="#ec4899" />;
      case 'note':
      default:
        return <MessageSquare size={14} color="#64748b" />;
    }
  };

  if (events.length === 0) {
    return (
      <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
        No activity history recorded yet.
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', paddingLeft: 28 }}>
      {/* Vertical Connecting Line */}
      <div
        style={{
          position: 'absolute',
          left: 11,
          top: 8,
          bottom: 12,
          width: 2,
          backgroundColor: 'var(--border-base)',
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {events.map(ev => (
          <div key={ev.id} style={{ position: 'relative' }}>
            {/* Dot / Icon */}
            <div
              style={{
                position: 'absolute',
                left: -28,
                top: 0,
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-strong)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              {getIcon(ev.type)}
            </div>

            {/* Event Content */}
            <div
              style={{
                backgroundColor: 'var(--bg-surface-hover)',
                border: '1px solid var(--border-base)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                  {ev.title}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ev.timestamp}</span>
              </div>
              {ev.description && (
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0' }}>
                  {ev.description}
                </p>
              )}
              {ev.actorName && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  by <span style={{ fontWeight: 500 }}>{ev.actorName}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
