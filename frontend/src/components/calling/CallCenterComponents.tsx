
import React, { useState, useEffect, useRef } from 'react';
import { storageService, PopupPosition } from '../../services/storageService';

import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Pause,
  Play,
  FileText,
  Clock,
  User,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Volume2,
  Minimize2,
  Maximize2,
  Video,
  Headphones,
  MessageCircle,
  Inbox,
  ExternalLink,
  Library,
} from 'lucide-react';
import { useCall, AgentAvailability } from '../../context/CallContext';
import { useAuth } from '../../context/AuthContext';
import { CallDisposition } from '../../types';
import { Modal } from '../common/Modal';
import { Drawer } from '../common/Drawer';
import { DocumentUploader } from '../common/DocumentUploader';
import { DocumentList } from '../common/DocumentList';
import { EmptyState } from '../common/EmptyState';

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
  const [popupPosition, setPopupPosition] = useState<PopupPosition>(() => storageService.getPopupPosition());

  useEffect(() => {
    const handleUpdate = () => {
      setPopupPosition(storageService.getPopupPosition());
    };
    window.addEventListener('nexus_storage_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('nexus_storage_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  if (!activeCall || activeCall.status !== 'ringing') return null;

  const getPositionStyles = (): React.CSSProperties => {
    switch (popupPosition) {
      case 'top-left':
        return { top: 24, left: 24 };
      case 'bottom-right':
        return { bottom: 24, right: 24 };
      case 'bottom-left':
        return { bottom: 24, left: 24 };
      case 'top-right':
      default:
        return { top: 24, right: 24 };
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        ...getPositionStyles(),
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

// --- Global In-Call Panel (Expanded + Minimized modes) ---
export const InCallBar: React.FC = () => {
  const {
    activeCall,
    endCall,
    toggleMute,
    toggleHold,
    toggleExpanded,
    toggleVideoMode,
    setQuickNotes,
    setMeetingLink,
  } = useCall();
  const { tenant } = useAuth();

  const [docsOpen, setDocsOpen] = useState(false);
  const [docsTab, setDocsTab] = useState<'customer' | 'company'>('customer');
  const [meetLaunched, setMeetLaunched] = useState(false);
  const [meetInput, setMeetInput] = useState('');

  // Camera preview state
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Start / stop camera based on isVideoMode
  useEffect(() => {
    if (activeCall?.isVideoMode) {
      setCameraError(null);
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          if (err.name === 'NotAllowedError') {
            setCameraError('Camera permission denied. Allow camera access in your browser settings.');
          } else {
            setCameraError('Camera is unavailable on this device.');
          }
        });
    } else {
      // Stop any running stream when toggling back to Audio or call ends
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setCameraError(null);
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, [activeCall?.isVideoMode]);

  // Close camera + reset meet state when call ends
  useEffect(() => {
    if (!activeCall) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setDocsOpen(false);
      setDocsTab('customer');
      setMeetLaunched(false);
      setMeetInput('');
    }
  }, [activeCall]);

  if (!activeCall || activeCall.status !== 'connected') return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Initials avatar
  const initials = activeCall.contactName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // WhatsApp deep-link
  const waNumber = activeCall.contactPhone.replace(/\D/g, '');
  const handleWhatsApp = () => {
    window.open(`https://wa.me/${waNumber}`, '_blank', 'noopener,noreferrer');
  };

  const hasMatchedRecord =
    activeCall.matchedRecord &&
    activeCall.matchedRecord.type !== 'unknown' &&
    activeCall.matchedRecord.id;

  // ── MINIMIZED MODE ──────────────────────────────────────────────────────────
  if (!activeCall.isExpanded) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1500,
        }}
      >
        <div
          style={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            border: '1px solid #334155',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {/* Pulse dot */}
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 8px #10b981',
              animation: 'pulse-ring 1.5s infinite',
              flexShrink: 0,
            }}
          />

          {/* Name + timer */}
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{activeCall.contactName}</div>
            <div style={{ fontSize: 11, color: '#38bdf8', fontWeight: 600 }}>
              {formatDuration(activeCall.duration)}
            </div>
          </div>

          {/* Expand */}
          <button
            className="btn btn-icon btn-sm"
            title="Expand panel"
            style={{
              borderRadius: '50%',
              backgroundColor: '#1e293b',
              borderColor: '#475569',
              color: '#ffffff',
              width: 30,
              height: 30,
            }}
            onClick={toggleExpanded}
          >
            <Maximize2 size={14} />
          </button>

          {/* End Call — always accessible even when minimised */}
          <button
            className="btn btn-danger btn-icon btn-sm"
            title="End Call"
            style={{ borderRadius: '50%', width: 30, height: 30 }}
            onClick={endCall}
          >
            <PhoneOff size={14} />
          </button>
        </div>
      </div>
    );
  }

  // ── EXPANDED MODE ───────────────────────────────────────────────────────────
  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1500,
          width: 420,
        }}
      >
        <div
          className="animate-slide-down"
          style={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            border: '1px solid #334155',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          {/* ── Header row ── */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid #1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: '#1e40af',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 15,
                flexShrink: 0,
                color: '#bfdbfe',
              }}
            >
              {initials}
            </div>

            {/* Name / phone / timer */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>
                {activeCall.contactName}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                {activeCall.contactPhone}
                <span style={{ color: '#334155' }}>•</span>
                {/* Pulse dot + live timer */}
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    boxShadow: '0 0 6px #10b981',
                    animation: 'pulse-ring 1.5s infinite',
                    display: 'inline-block',
                  }}
                />
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                  {formatDuration(activeCall.duration)}
                </span>
              </div>
            </div>

            {/* Minimize button */}
            <button
              className="btn btn-icon btn-sm"
              title="Minimize panel"
              style={{
                borderRadius: '50%',
                backgroundColor: '#1e293b',
                borderColor: '#475569',
                color: '#94a3b8',
                width: 30,
                height: 30,
                flexShrink: 0,
              }}
              onClick={toggleExpanded}
            >
              <Minimize2 size={14} />
            </button>
          </div>

          {/* ── Audio / Video segmented toggle ── */}
          <div style={{ padding: '12px 16px 0' }}>
            <div
              style={{
                display: 'inline-flex',
                backgroundColor: '#1e293b',
                borderRadius: 8,
                padding: 3,
                gap: 2,
              }}
            >
              <button
                onClick={() => activeCall.isVideoMode && toggleVideoMode()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 14px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: !activeCall.isVideoMode ? '#2563eb' : 'transparent',
                  color: !activeCall.isVideoMode ? '#ffffff' : '#94a3b8',
                  transition: 'all 0.15s ease',
                }}
              >
                <Headphones size={13} /> Audio
              </button>
              <button
                onClick={() => !activeCall.isVideoMode && toggleVideoMode()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 14px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: activeCall.isVideoMode ? '#7c3aed' : 'transparent',
                  color: activeCall.isVideoMode ? '#ffffff' : '#94a3b8',
                  transition: 'all 0.15s ease',
                }}
              >
                <Video size={13} /> Video
              </button>
            </div>

            {/* Simulated-call disclaimer */}
            <span
              style={{
                marginLeft: 10,
                fontSize: 10,
                color: '#475569',
                fontStyle: 'italic',
              }}
            >
              Simulated call — no live audio
            </span>
          </div>

          {/* ── Camera preview (Video mode only) ── */}
          {activeCall.isVideoMode && (
            <div style={{ padding: '10px 16px 0' }}>
              {cameraError ? (
                <div
                  style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 10,
                    padding: '12px 14px',
                    fontSize: 12,
                    color: '#f87171',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <AlertCircle size={14} />
                  {cameraError}
                </div>
              ) : (
                <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', backgroundColor: '#000' }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ width: '100%', maxHeight: 180, display: 'block', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '6px 10px',
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                      fontSize: 10,
                      color: '#cbd5e1',
                      fontStyle: 'italic',
                    }}
                  >
                    Your camera preview — the customer isn't receiving live video yet
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Quick notes ── */}
          <div style={{ padding: '12px 16px 0' }}>
            <input
              type="text"
              className="form-input"
              style={{
                width: '100%',
                height: 36,
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                color: '#ffffff',
                fontSize: 12,
                borderRadius: 8,
                padding: '0 12px',
                boxSizing: 'border-box',
              }}
              placeholder="Quick call note..."
              value={activeCall.quickNotes}
              onChange={e => setQuickNotes(e.target.value)}
            />
          </div>

          {/* ── Action row: Documents + WhatsApp + divider + call controls ── */}
          <div
            style={{
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            {/* Documents */}
            <button
              className="btn btn-sm"
              style={{
                backgroundColor: '#1e293b',
                borderColor: '#475569',
                color: '#cbd5e1',
                borderRadius: 8,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                border: '1px solid #475569',
              }}
              onClick={() => setDocsOpen(true)}
            >
              <FileText size={13} /> Documents
            </button>

            {/* WhatsApp (contact number only — no meet link) */}
            <button
              className="btn btn-sm"
              title="Open WhatsApp chat with this number"
              style={{
                backgroundColor: '#14532d',
                borderColor: '#16a34a',
                color: '#bbf7d0',
                borderRadius: 8,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                border: '1px solid #16a34a',
              }}
              onClick={handleWhatsApp}
            >
              <MessageCircle size={13} /> WhatsApp
            </button>

            {/* Google Meet */}
            <button
              className="btn btn-sm"
              title="Start a Google Meet room"
              style={{
                backgroundColor: '#1e3a5f',
                borderColor: '#2563eb',
                color: '#93c5fd',
                borderRadius: 8,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                border: '1px solid #2563eb',
              }}
              onClick={() => {
                window.open('https://meet.google.com/new', '_blank', 'noopener,noreferrer');
                setMeetLaunched(true);
              }}
            >
              <ExternalLink size={13} /> Meet
            </button>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Mute */}
            <button
              className="btn btn-icon btn-sm"
              style={{
                borderRadius: '50%',
                backgroundColor: activeCall.isMuted ? '#dc2626' : '#1e293b',
                borderColor: '#475569',
                color: '#ffffff',
                width: 34,
                height: 34,
                border: '1px solid #475569',
              }}
              title={activeCall.isMuted ? 'Unmute' : 'Mute'}
              onClick={toggleMute}
            >
              {activeCall.isMuted ? <MicOff size={15} /> : <Mic size={15} />}
            </button>

            {/* Hold */}
            <button
              className="btn btn-icon btn-sm"
              style={{
                borderRadius: '50%',
                backgroundColor: activeCall.isOnHold ? '#d97706' : '#1e293b',
                borderColor: '#475569',
                color: '#ffffff',
                width: 34,
                height: 34,
                border: '1px solid #475569',
              }}
              title={activeCall.isOnHold ? 'Resume Call' : 'Hold Call'}
              onClick={toggleHold}
            >
              {activeCall.isOnHold ? <Play size={15} /> : <Pause size={15} />}
            </button>

            {/* End Call */}
            <button
              className="btn btn-danger btn-sm"
              style={{
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
              onClick={endCall}
            >
              <PhoneOff size={14} /> End
            </button>
          </div>

          {/* ── Google Meet paste-link row (appears after Meet is launched) ── */}
          {meetLaunched && (
            <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{
                    flex: 1,
                    height: 32,
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    color: '#ffffff',
                    fontSize: 11,
                    borderRadius: 7,
                    padding: '0 10px',
                    boxSizing: 'border-box',
                  }}
                  placeholder="Paste the Meet link here to share it"
                  value={meetInput}
                  onChange={e => {
                    setMeetInput(e.target.value);
                    setMeetingLink(e.target.value || null);
                  }}
                />
                {meetInput.trim() && (
                  <button
                    className="btn btn-sm"
                    title="Share Meet link via WhatsApp"
                    style={{
                      backgroundColor: '#14532d',
                      borderColor: '#16a34a',
                      color: '#bbf7d0',
                      borderRadius: 7,
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      border: '1px solid #16a34a',
                      whiteSpace: 'nowrap',
                    }}
                    onClick={() =>
                      window.open(
                        `https://wa.me/${waNumber}?text=${encodeURIComponent('Join our call here: ' + meetInput.trim())}`,
                        '_blank',
                        'noopener,noreferrer'
                      )
                    }
                  >
                    <MessageCircle size={11} /> Share via WA
                  </button>
                )}
              </div>
              <span style={{ fontSize: 10, color: '#475569', fontStyle: 'italic' }}>
                Opens a real Google Meet room — screen share and video happen inside Meet itself, not in this app.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Documents Drawer (tabbed) ── */}
      <Drawer
        isOpen={docsOpen}
        onClose={() => setDocsOpen(false)}
        title="Call Documents"
        subtitle={`${activeCall.contactName} ${activeCall.contactPhone}`}
        width={500}
      >
        {/* Tab bar — same active-underline style as CustomersPage */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-base)',
            marginBottom: 4,
            marginTop: -8,
          }}
        >
          {[
            { id: 'customer' as const, label: 'Customer Documents' },
            { id: 'company' as const, label: 'Company Resources' },
          ].map(tab => (
            <button
              key={tab.id}
              className="btn btn-ghost"
              style={{
                borderRadius: 0,
                borderBottom: docsTab === tab.id ? '2px solid var(--primary-600)' : '2px solid transparent',
                color: docsTab === tab.id ? 'var(--primary-600)' : 'var(--text-secondary)',
                fontWeight: docsTab === tab.id ? 700 : 500,
                fontSize: 13,
                padding: '10px 14px',
              }}
              onClick={() => setDocsTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Customer Documents tab */}
        {docsTab === 'customer' && (
          hasMatchedRecord ? (
            <>
              <DocumentUploader
                entityType={activeCall.matchedRecord!.type as 'lead' | 'customer'}
                entityId={activeCall.matchedRecord!.id!}
                allowedCategories={['KYC', 'Agreement', 'Payment Receipt', 'Identity Proof', 'Other']}
              />
              <DocumentList
                entityType={activeCall.matchedRecord!.type as 'lead' | 'customer'}
                entityId={activeCall.matchedRecord!.id!}
                canDelete
              />
            </>
          ) : (
            <EmptyState
              icon={<Inbox size={24} />}
              title="No Matched Record"
              description="Documents can only be attached when the caller is matched to a lead or customer. Create a lead for this contact first."
            />
          )
        )}

        {/* Company Resources tab — always available regardless of matched record */}
        {docsTab === 'company' && tenant && (
          <>
            <DocumentUploader
              entityType="company"
              entityId={tenant.id}
              allowedCategories={['Brochure', 'Price List', 'Terms & Conditions', 'Policy Document', 'Other']}
            />
            <DocumentList
              entityType="company"
              entityId={tenant.id}
              canDelete={false}
            />
          </>
        )}
      </Drawer>
    </>
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
