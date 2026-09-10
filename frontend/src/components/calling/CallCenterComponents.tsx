import React, { useState } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Pause,
  Play,
  Share2,
  FileText,
  Clock,
  User,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Volume2,
} from 'lucide-react';
import { useCall, AgentAvailability } from '../../context/CallContext';
import { CallDisposition } from '../../types';
import { Modal } from '../common/Modal';

// --- Agent Availability Toggle ---
export const AgentAvailabilityToggle: React.FC = () => {
  const { availability, setAvailability, simulateIncomingCall } = useCall();
  const [isOpen, setIsOpen] = useState(false);

  const getStatusColor = (status: AgentAvailability) => {
    switch (status) {
      case 'Available':
        return '#10b981';
      case 'Busy':
        return '#f59e0b';
      case 'Offline':
        return '#64748b';
    }
  };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        className="btn btn-secondary btn-sm"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          borderColor: 'var(--border-base)',
          padding: '6px 12px',
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: getStatusColor(availability),
            boxShadow: `0 0 6px ${getStatusColor(availability)}`,
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 600 }}>{availability}</span>
      </button>

      {/* Demo helper: button to simulate incoming call */}
      <button
        className="btn btn-ghost btn-sm"
        title="Simulate Inbound Call for Testing"
        style={{
          fontSize: 11,
          color: 'var(--primary-600)',
          background: 'var(--primary-50)',
          border: '1px dashed var(--primary-500)',
        }}
        onClick={() => simulateIncomingCall()}
      >
        <PhoneCall size={13} /> Simulate Ring
      </button>

      {isOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 100 }}
            onClick={() => setIsOpen(false)}
          />
          <div
            className="card animate-slide-down"
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 6,
              zIndex: 110,
              minWidth: 160,
              padding: 6,
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {(['Available', 'Busy', 'Offline'] as AgentAvailability[]).map(status => (
              <button
                key={status}
                className="btn btn-ghost btn-sm"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  fontWeight: availability === status ? 700 : 400,
                  color:
                    availability === status ? getStatusColor(status) : 'var(--text-primary)',
                }}
                onClick={() => {
                  setAvailability(status);
                  setIsOpen(false);
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(status),
                    marginRight: 8,
                  }}
                />
                {status}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// --- Global Incoming Call Popup ---
export const IncomingCallPopup: React.FC = () => {
  const { activeCall, acceptCall, rejectCall } = useCall();

  if (!activeCall || activeCall.status !== 'ringing') return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 2000,
        width: 360,
      }}
    >
      <div
        className="card animate-slide-down"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '2px solid var(--primary-500)',
          boxShadow: '0 20px 30px -10px rgba(37, 99, 235, 0.3)',
          padding: 20,
          borderRadius: 'var(--radius-xl)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: 'var(--primary-50)',
              color: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse-ring 1.5s infinite',
            }}
          >
            <Volume2 size={24} />
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--primary-600)',
              }}
            >
              Incoming Call
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              {activeCall.contactName}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {activeCall.contactPhone}
            </div>
          </div>
        </div>

        {activeCall.matchedRecord && (
          <div
            style={{
              backgroundColor: 'var(--bg-surface-hover)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
              fontSize: 12,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid var(--border-base)',
            }}
          >
            <User size={14} color="var(--primary-600)" />
            <span>{activeCall.matchedRecord.meta || 'Matched Contact Record'}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-danger"
            style={{ flex: 1, height: 42 }}
            onClick={rejectCall}
          >
            <PhoneOff size={16} /> Decline
          </button>
          <button
            className="btn btn-primary"
            style={{
              flex: 1,
              height: 42,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            }}
            onClick={acceptCall}
          >
            <Phone size={16} /> Accept Call
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Global In-Call Persistent Floating Bar ---
export const InCallBar: React.FC = () => {
  const { activeCall, endCall, toggleMute, toggleHold, setQuickNotes } = useCall();

  if (!activeCall || activeCall.status !== 'connected') return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1500,
        width: '90%',
        maxWidth: 760,
      }}
    >
      <div
        className="card animate-slide-down"
        style={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          border: '1px solid #334155',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          padding: '12px 20px',
          borderRadius: 'var(--radius-full)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        {/* Caller Info & Live Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 8px #10b981',
              animation: 'pulse-ring 1.5s infinite',
            }}
          />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{activeCall.contactName}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              {activeCall.contactPhone} •{' '}
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                {formatDuration(activeCall.duration)}
              </span>
            </div>
          </div>
        </div>

        {/* Live Quick Notes Input */}
        <div style={{ flex: 1, maxWidth: 300, display: 'none' /* visible on larger screens */ }}>
          <input
            type="text"
            className="form-input"
            style={{
              height: 34,
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              color: '#ffffff',
              fontSize: 12,
              borderRadius: 'var(--radius-full)',
              padding: '0 14px',
            }}
            placeholder="Type quick call note..."
            value={activeCall.quickNotes}
            onChange={e => setQuickNotes(e.target.value)}
          />
        </div>

        {/* In-Call Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className={`btn btn-icon btn-sm ${activeCall.isMuted ? 'btn-danger' : 'btn-secondary'}`}
            style={{
              borderRadius: '50%',
              backgroundColor: activeCall.isMuted ? '#dc2626' : '#1e293b',
              borderColor: '#475569',
              color: '#ffffff',
            }}
            title={activeCall.isMuted ? 'Unmute' : 'Mute'}
            onClick={toggleMute}
          >
            {activeCall.isMuted ? <MicOff size={15} /> : <Mic size={15} />}
          </button>

          <button
            className={`btn btn-icon btn-sm ${activeCall.isOnHold ? 'btn-danger' : 'btn-secondary'}`}
            style={{
              borderRadius: '50%',
              backgroundColor: activeCall.isOnHold ? '#d97706' : '#1e293b',
              borderColor: '#475569',
              color: '#ffffff',
            }}
            title={activeCall.isOnHold ? 'Resume Call' : 'Hold Call'}
            onClick={toggleHold}
          >
            {activeCall.isOnHold ? <Play size={15} /> : <Pause size={15} />}
          </button>

          <button
            className="btn btn-danger"
            style={{
              borderRadius: 'var(--radius-full)',
              padding: '6px 16px',
              fontSize: 12,
              fontWeight: 700,
            }}
            onClick={endCall}
          >
            <PhoneOff size={15} /> End Call
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Mandatory Post-Call Disposition Modal ---
export const DispositionModal: React.FC = () => {
  const { showDispositionModal, lastCallRecord, saveDisposition, closeDispositionModal } = useCall();

  const [disposition, setDisposition] = useState<CallDisposition>('Interested');
  const [notes, setNotes] = useState('');
  const [scheduleFollowup, setScheduleFollowup] = useState(false);
  const [followupDate, setFollowupDate] = useState('Tomorrow, 11:00 AM');
  const [followupPriority, setFollowupPriority] = useState<'Low' | 'Medium' | 'High'>('High');

  if (!showDispositionModal || !lastCallRecord) return null;

  const dispositions: CallDisposition[] = [
    'Interested',
    'Follow-up Required',
    'Call Back',
    'Converted',
    'Not Interested',
    'Wrong Number',
    'No Response',
  ];

  const handleSave = () => {
    saveDisposition(
      disposition,
      notes,
      scheduleFollowup
        ? {
            scheduledAt: followupDate,
            priority: followupPriority,
            notes: `Follow-up required from call with ${lastCallRecord.contactName}: ${notes}`,
          }
        : undefined
    );
  };

  return (
    <Modal
      isOpen={showDispositionModal}
      onClose={closeDispositionModal}
      title="Call Wrap-up & Disposition"
      subtitle={`Call with ${lastCallRecord.contactName} (${lastCallRecord.contactPhone}) • Duration: ${Math.floor(lastCallRecord.duration / 60)}m ${lastCallRecord.duration % 60}s`}
      maxWidth={580}
      footer={
        <>
          <button className="btn btn-secondary" onClick={closeDispositionModal}>
            Skip for Now
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save Disposition & Wrap Up
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Disposition Selector */}
        <div className="form-group">
          <label className="form-label">Call Outcome / Disposition *</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
            {dispositions.map(d => (
              <button
                key={d}
                type="button"
                className={`btn btn-sm ${disposition === d ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'flex-start', fontSize: 12, padding: '8px 12px' }}
                onClick={() => {
                  setDisposition(d);
                  if (d === 'Follow-up Required' || d === 'Call Back') {
                    setScheduleFollowup(true);
                  }
                }}
              >
                {disposition === d && <CheckCircle2 size={13} style={{ marginRight: 4 }} />}
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Call Notes */}
        <div className="form-group">
          <label className="form-label">Call Discussion Summary & Notes</label>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="Key discussion points, customer objections, next steps..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        {/* Conditional Follow-up Section */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface-hover)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
            border: '1px solid var(--border-base)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: scheduleFollowup ? 12 : 0,
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={scheduleFollowup}
                onChange={e => setScheduleFollowup(e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              Schedule a Next Follow-up Task
            </label>
            <Calendar size={16} color="var(--primary-600)" />
          </div>

          {scheduleFollowup && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
              <div className="form-group">
                <label className="form-label">Follow-up Date / Time</label>
                <input
                  type="text"
                  className="form-input"
                  value={followupDate}
                  onChange={e => setFollowupDate(e.target.value)}
                  placeholder="e.g. Tomorrow, 11:00 AM"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={followupPriority}
                  onChange={e => setFollowupPriority(e.target.value as any)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
