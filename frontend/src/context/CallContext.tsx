import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { CallDisposition, CallRecord } from '../types';
import { storageService } from '../services/storageService';
import { useAuth } from './AuthContext';

export type AgentAvailability = 'Available' | 'Busy' | 'Offline';
export type CallStatus = 'idle' | 'ringing' | 'connected' | 'ended';

interface MatchedRecord {
  type: 'lead' | 'customer' | 'unknown';
  id?: string;
  name?: string;
  meta?: string;
}

interface ActiveCall {
  id: string;
  contactName: string;
  contactPhone: string;
  direction: 'inbound' | 'outbound';
  status: CallStatus;
  duration: number;
  isMuted: boolean;
  isOnHold: boolean;
  quickNotes: string;
  matchedRecord?: MatchedRecord;
  // view-mode fields
  isExpanded: boolean;
  isVideoMode: boolean;
  // Google Meet integration
  meetingLink: string | null;
}

interface CallContextType {
  availability: AgentAvailability;
  setAvailability: (status: AgentAvailability) => void;
  activeCall: ActiveCall | null;
  showDispositionModal: boolean;
  lastCallRecord: ActiveCall | null;
  initiateCall: (name: string, phone: string, recordType?: 'lead' | 'customer', recordId?: string) => void;
  simulateIncomingCall: (name?: string, phone?: string) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleHold: () => void;
  toggleExpanded: () => void;
  toggleVideoMode: () => void;
  setMeetingLink: (link: string | null) => void;
  setQuickNotes: (notes: string) => void;
  saveDisposition: (
    disposition: CallDisposition,
    notes: string,
    scheduleFollowup?: { scheduledAt: string; priority: 'Low' | 'Medium' | 'High'; notes: string },
    reason?: string
  ) => void;
  closeDispositionModal: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, tenant } = useAuth();
  const [availability, setAvailability] = useState<AgentAvailability>('Available');
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [lastCallRecord, setLastCallRecord] = useState<ActiveCall | null>(null);
  const [showDispositionModal, setShowDispositionModal] = useState(false);

  const timerRef = useRef<any>(null);

  // Timer for connected calls
  useEffect(() => {
    if (activeCall?.status === 'connected') {
      timerRef.current = setInterval(() => {
        setActiveCall(prev => (prev ? { ...prev, duration: prev.duration + 1 } : null));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeCall?.status]);

  const initiateCall = (name: string, phone: string, recordType: 'lead' | 'customer' = 'lead', recordId?: string) => {
    const newCall: ActiveCall = {
      id: `call-${Date.now()}`,
      contactName: name,
      contactPhone: phone,
      direction: 'outbound',
      status: 'connected', // instantly connected for dialer simulation
      duration: 0,
      isMuted: false,
      isOnHold: false,
      quickNotes: '',
      matchedRecord: {
        type: recordType,
        id: recordId,
        name: name,
        meta: recordType === 'lead' ? 'Active Inbound Lead' : 'Customer Account',
      },
      isExpanded: true,
      isVideoMode: false,
      meetingLink: null,
    };
    setActiveCall(newCall);
    const prefs = storageService.getCallPreferences();
    if (prefs.autoBusyEnabled && availability === 'Available') {
      setAvailability('Busy');
    }
  };

  const simulateIncomingCall = (name = 'Kishore Varma', phone = '+91 98860 77112') => {
    if (availability === 'Offline' || availability === 'Busy') {
      return;
    }

    // Check if phone matches any existing lead or customer
    const leads = storageService.getLeads(tenant?.id);
    const matchedLead = leads.find(l => l.phone.includes(phone.slice(-5)) || l.name.toLowerCase().includes(name.toLowerCase()));

    const newCall: ActiveCall = {
      id: `call-${Date.now()}`,
      contactName: matchedLead ? matchedLead.name : name,
      contactPhone: matchedLead ? matchedLead.phone : phone,
      direction: 'inbound',
      status: 'ringing',
      duration: 0,
      isMuted: false,
      isOnHold: false,
      quickNotes: '',
      matchedRecord: matchedLead
        ? { type: 'lead', id: matchedLead.id, name: matchedLead.name, meta: `Lead • Priority: ${matchedLead.priority}` }
        : { type: 'unknown', name: 'Unknown Caller', meta: 'Unregistered Number' },
      isExpanded: true,
      isVideoMode: false,
      meetingLink: null,
    };
    setActiveCall(newCall);
    const prefs = storageService.getCallPreferences();
    // Play ringtone via Web Audio API if sound is enabled
    if (prefs.soundEnabled) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          osc.frequency.value = 880;
          osc.type = 'sine';
          osc.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        }
      } catch { /* audio not available */ }
    }
    // Desktop notification if enabled and permission granted
    if (prefs.desktopNotifEnabled && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification('Incoming Call', { body: `${newCall.contactName} — ${newCall.contactPhone}` });
      } catch { /* notifications not available */ }
    }
    if (prefs.autoBusyEnabled) {
      setAvailability('Busy');
    }
  };

  const acceptCall = () => {
    if (activeCall) {
      setActiveCall({ ...activeCall, status: 'connected', duration: 0, isExpanded: true, isVideoMode: false, meetingLink: null });
    }
  };

  const rejectCall = () => {
    if (activeCall) {
      setActiveCall(null);
      setAvailability(prev => prev === 'Busy' ? 'Available' : prev);
    }
  };

  const endCall = () => {
    if (activeCall) {
      const finishedCall = { ...activeCall, status: 'ended' as CallStatus };
      setLastCallRecord(finishedCall);
      setActiveCall(null);
      setShowDispositionModal(true);
    }
  };

  const toggleMute = () => {
    if (activeCall) {
      setActiveCall({ ...activeCall, isMuted: !activeCall.isMuted });
    }
  };

  const toggleHold = () => {
    if (activeCall) {
      setActiveCall({ ...activeCall, isOnHold: !activeCall.isOnHold });
    }
  };

  const toggleExpanded = () => {
    if (activeCall) {
      setActiveCall({ ...activeCall, isExpanded: !activeCall.isExpanded });
    }
  };

  const toggleVideoMode = () => {
    if (activeCall) {
      setActiveCall({ ...activeCall, isVideoMode: !activeCall.isVideoMode });
    }
  };

  const setMeetingLink = (link: string | null) => {
    if (activeCall) {
      setActiveCall({ ...activeCall, meetingLink: link });
    }
  };

  const setQuickNotes = (notes: string) => {
    if (activeCall) {
      setActiveCall({ ...activeCall, quickNotes: notes });
    }
  };

  const saveDisposition = (
    disposition: CallDisposition,
    notes: string,
    scheduleFollowup?: { scheduledAt: string; priority: 'Low' | 'Medium' | 'High'; notes: string },
    reason?: string
  ) => {
    if (lastCallRecord && tenant && user) {
      const callRecord: CallRecord = {
        id: lastCallRecord.id,
        companyId: tenant.id,
        contactName: lastCallRecord.contactName,
        contactPhone: lastCallRecord.contactPhone,
        direction: lastCallRecord.direction,
        duration: lastCallRecord.duration,
        agentId: user.id,
        agentName: user.name,
        disposition,
        timestamp: new Date().toISOString(),
        recordingUrl: 'https://cdn.nexusplatform.io/recordings/sample.mp3',
        transcription: `Automated Call Transcript: Agent ${user.name} connected with ${lastCallRecord.contactName}. Call disposition marked as ${disposition}.`,
        notes: reason ? `${notes}\n\nReason: ${reason}` : (notes || lastCallRecord.quickNotes),
      };

      storageService.addCall(callRecord);

      storageService.addAuditLog({
        id: `aud-${Date.now()}`,
        timestamp: 'Just now',
        actorName: user.name,
        actorEmail: user.email,
        action: 'CALL_DISPOSITION_SAVED',
        entityType: 'CallRecord',
        entityId: callRecord.id,
        companyId: tenant.id,
        companyName: tenant.name,
        details: `Saved disposition "${disposition}" for call with ${lastCallRecord.contactName} (${lastCallRecord.duration}s).`,
      });

      // If scheduled followup requested
      const isGhlSalesExec = tenant?.slug === 'ghl' && user?.role?.code === 'sales_executive';

      if (scheduleFollowup) {
        if (isGhlSalesExec) {
          const existingFollowups = storageService.getFollowups(tenant.id) || [];
          const targetContactId = lastCallRecord.matchedRecord?.id;
          const targetPhoneDigits = (lastCallRecord.contactPhone || '').replace(/\D/g, '').slice(-10);

          const existingPending = existingFollowups.find(f => {
            if (f.status !== 'Pending') return false;
            if (targetContactId && targetContactId !== 'contact-new' && f.contactId === targetContactId) {
              return true;
            }
            const fPhoneDigits = (f.contactPhone || '').replace(/\D/g, '').slice(-10);
            return fPhoneDigits && targetPhoneDigits && fPhoneDigits === targetPhoneDigits;
          });

          if (existingPending) {
            storageService.saveFollowup({
              ...existingPending,
              scheduledAt: scheduleFollowup.scheduledAt,
              priority: scheduleFollowup.priority,
              notes: scheduleFollowup.notes,
              relatedCallId: lastCallRecord.id,
              assignedAgentId: user.id,
              assignedAgentName: user.name,
            });
          } else {
            storageService.saveFollowup({
              id: `flw-${Date.now()}`,
              companyId: tenant.id,
              contactId: lastCallRecord.matchedRecord?.id || 'contact-new',
              contactName: lastCallRecord.contactName,
              contactPhone: lastCallRecord.contactPhone,
              contactType: (lastCallRecord.matchedRecord?.type as any) || 'lead',
              scheduledAt: scheduleFollowup.scheduledAt,
              priority: scheduleFollowup.priority,
              status: 'Pending',
              notes: scheduleFollowup.notes,
              assignedAgentId: user.id,
              assignedAgentName: user.name,
              relatedCallId: lastCallRecord.id,
            });
          }
        } else {
          // Untouched original behavior for all other roles and tenants
          storageService.saveFollowup({
            id: `flw-${Date.now()}`,
            companyId: tenant.id,
            contactId: lastCallRecord.matchedRecord?.id || 'contact-new',
            contactName: lastCallRecord.contactName,
            contactPhone: lastCallRecord.contactPhone,
            contactType: (lastCallRecord.matchedRecord?.type as any) || 'lead',
            scheduledAt: scheduleFollowup.scheduledAt,
            priority: scheduleFollowup.priority,
            status: 'Pending',
            notes: scheduleFollowup.notes,
            assignedAgentId: user.id,
            assignedAgentName: user.name,
          });
        }
      }
      
      // ── GHL Sales Exec: bidirectional lead routing ───────────────────────────
      if (isGhlSalesExec) {
        const leadId = lastCallRecord.matchedRecord?.type === 'lead' ? lastCallRecord.matchedRecord.id : null;
        const targetPhoneDigits = (lastCallRecord.contactPhone || '').replace(/\D/g, '').slice(-10);

        // Helper: find matched lead by id or phone
        const findMatchedLead = () => {
          const leads = storageService.getLeads(tenant.id);
          if (leadId) {
            const byId = leads.find(l => l.id === leadId);
            if (byId) return byId;
          }
          // Fallback: phone-match
          return leads.find(l => {
            const lPhone = (l.phone || '').replace(/\D/g, '').slice(-10);
            return lPhone && targetPhoneDigits && lPhone === targetPhoneDigits;
          }) || null;
        };

        // Helper: hard-delete ALL pending follow-up records for this contact so
        // they are completely removed from the Follow-up queue (not just Completed).
        // This enforces mutual exclusivity: a lead in NI/Junk must have zero
        // Pending followup records.
        const purgeFollowupsForContact = () => {
          storageService.purgeFollowupsForContact(
            tenant.id,
            leadId,
            lastCallRecord.contactPhone
          );
        };

        // Helper: ensure a pending follow-up exists (creates one if absent and
        // no explicit scheduleFollowup block was already processed above)
        const ensurePendingFollowup = (matchedLeadId?: string) => {
          if (scheduleFollowup) return; // already handled above
          const followups = storageService.getFollowups(tenant.id) || [];
          const hasPending = followups.some(f => {
            if (f.status !== 'Pending') return false;
            if (matchedLeadId && matchedLeadId !== 'contact-new' && f.contactId === matchedLeadId) return true;
            const fPhone = (f.contactPhone || '').replace(/\D/g, '').slice(-10);
            return fPhone && targetPhoneDigits && fPhone === targetPhoneDigits;
          });

          if (!hasPending) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            storageService.saveFollowup({
              id: `flw-${Date.now()}`,
              companyId: tenant.id,
              contactId: matchedLeadId || lastCallRecord.matchedRecord?.id || 'contact-new',
              contactName: lastCallRecord.contactName,
              contactPhone: lastCallRecord.contactPhone,
              contactType: (lastCallRecord.matchedRecord?.type as any) || 'lead',
              scheduledAt: tomorrow.toISOString(),
              priority: 'High',
              status: 'Pending',
              notes: `Follow-up required from call with ${lastCallRecord.contactName}: ${notes}`,
              assignedAgentId: user.id,
              assignedAgentName: user.name,
              relatedCallId: lastCallRecord.id,
            });
          }
        };

        // ── FORWARD ROUTING: active lead → Not Interested or Junk ──────────────
        if (disposition === 'Not Interested' || disposition === 'Wrong Number') {
          const matchedLead = findMatchedLead();
          if (matchedLead) {
            const newStatus = disposition === 'Not Interested' ? 'Not Interested' : 'Junk';
            const updatedLead = { ...matchedLead, status: newStatus as any };
            if (reason) {
              updatedLead.notes = `${matchedLead.notes}\n\n[${new Date().toLocaleDateString()}] ${disposition} Reason: ${reason}`;
              updatedLead.customFields = { ...updatedLead.customFields, dispositionReason: reason };
            }
            storageService.saveLead(updatedLead);
            // Hard-delete pending follow-ups — lead is no longer active in queue
            purgeFollowupsForContact();
          }
        }

        // ── REVERSE ROUTING: Not Interested / Junk → active Follow-up ──────────
        // Triggered when a re-engagement disposition is chosen after calling a
        // lead that currently sits in Junk or Not Interested.
        const reEngagementDispositions: CallDisposition[] = [
          'Interested',
          'Follow-up Required',
          'Call Back',
          'Converted',
        ];

        if (reEngagementDispositions.includes(disposition)) {
          const matchedLead = findMatchedLead();
          if (matchedLead && (matchedLead.status === 'Not Interested' || matchedLead.status === 'Junk')) {
            // Restore to active status
            storageService.saveLead({ ...matchedLead, status: 'Contacted' });
            // Ensure at least one pending follow-up exists
            ensurePendingFollowup(matchedLead.id);
          }
        }

      } else {
        // ── Non-GHL: preserve original forward routing only ──────────────────
        if (disposition === 'Not Interested' || disposition === 'Wrong Number') {
          const leadId = lastCallRecord.matchedRecord?.type === 'lead' ? lastCallRecord.matchedRecord.id : null;
          if (leadId) {
            const leads = storageService.getLeads(tenant.id);
            const matchedLead = leads.find(l => l.id === leadId);
            if (matchedLead) {
              matchedLead.status = disposition === 'Not Interested' ? 'Not Interested' : 'Junk';
              if (reason) {
                matchedLead.notes = `${matchedLead.notes}\n\n[${new Date().toLocaleDateString()}] ${disposition} Reason: ${reason}`;
                matchedLead.customFields = { ...matchedLead.customFields, dispositionReason: reason };
              }
              storageService.saveLead(matchedLead);
            }
          }
        }
      }
    }

    setShowDispositionModal(false);
    setLastCallRecord(null);
    setAvailability(prev => prev === 'Busy' ? 'Available' : prev);
  };

  const closeDispositionModal = () => {
    setShowDispositionModal(false);
    setLastCallRecord(null);
    setAvailability(prev => prev === 'Busy' ? 'Available' : prev);
  };

  return (
    <CallContext.Provider
      value={{
        availability,
        setAvailability,
        activeCall,
        showDispositionModal,
        lastCallRecord,
        initiateCall,
        simulateIncomingCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleHold,
        toggleExpanded,
        toggleVideoMode,
        setMeetingLink,
        setQuickNotes,
        saveDisposition,
        closeDispositionModal,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
