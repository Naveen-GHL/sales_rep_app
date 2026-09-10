import React, { useState, useEffect } from 'react';
import { History, Play, Phone, FileText, Download, User } from 'lucide-react';
import { CallRecord } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { DataTable, Column, RowAction } from '../../components/common/DataTable';
import { StatusChip } from '../../components/common/StatusChip';
import { Drawer } from '../../components/common/Drawer';

export const CallHistoryPage: React.FC = () => {
  const { tenant } = useAuth();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const loadData = () => {
    setCalls(storageService.getCalls(tenant?.id));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('nexus_storage_updated', handleUpdate);
    return () => window.removeEventListener('nexus_storage_updated', handleUpdate);
  }, [tenant?.id]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const columns: Column<CallRecord>[] = [
    {
      key: 'timestamp',
      header: 'Date & Time',
      sortable: true,
      render: c => <span style={{ fontSize: 12, fontWeight: 500 }}>{c.timestamp}</span>,
    },
    {
      key: 'contactName',
      header: 'Contact',
      sortable: true,
      render: c => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.contactName}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.contactPhone}</div>
        </div>
      ),
    },
    {
      key: 'direction',
      header: 'Direction',
      sortable: true,
      render: c => <StatusChip status={c.direction} size="sm" />,
    },
    {
      key: 'duration',
      header: 'Duration',
      sortable: true,
      render: c => <span style={{ fontSize: 12 }}>{formatDuration(c.duration)}</span>,
    },
    {
      key: 'agentName',
      header: 'Agent',
      sortable: true,
      render: c => <span style={{ fontSize: 12 }}>{c.agentName}</span>,
    },
    {
      key: 'disposition',
      header: 'Outcome / Disposition',
      sortable: true,
      render: c => <StatusChip status={c.disposition} size="sm" />,
    },
    {
      key: 'recordingUrl',
      header: 'Recording',
      render: c => (
        <button
          className="btn btn-ghost btn-sm"
          style={{ color: 'var(--primary-600)' }}
          onClick={e => {
            e.stopPropagation();
            setSelectedCall(c);
            setIsPlayingAudio(true);
          }}
        >
          <Play size={13} /> Listen
        </button>
      ),
    },
  ];

  const rowActions: RowAction<CallRecord>[] = [
    {
      label: 'View Call Log & Transcript',
      icon: <FileText size={14} style={{ marginRight: 6 }} />,
      onClick: c => {
        setSelectedCall(c);
        setIsPlayingAudio(false);
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <History size={24} color="var(--primary-600)" /> Call Log & History
          </h1>
          <p className="page-subtitle">
            Auditable archive of customer calls, voice recordings, and automated transcripts for {tenant?.name}.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={calls}
        keyExtractor={c => c.id}
        rowActions={rowActions}
        onRowClick={c => {
          setSelectedCall(c);
          setIsPlayingAudio(false);
        }}
        searchPlaceholder="Search calls by contact name, phone, or agent..."
      />

      {/* Call Detail Drawer */}
      <Drawer
        isOpen={!!selectedCall}
        onClose={() => {
          setSelectedCall(null);
          setIsPlayingAudio(false);
        }}
        title="Call Detail & Transcription"
        subtitle={`${selectedCall?.contactName} (${selectedCall?.contactPhone}) • ${selectedCall?.timestamp}`}
        width={560}
      >
        {selectedCall && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Outcome Overview */}
            <div
              style={{
                padding: 16,
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-surface-hover)',
                border: '1px solid var(--border-base)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StatusChip status={selectedCall.direction} />
                  <StatusChip status={selectedCall.disposition} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  Agent: <strong>{selectedCall.agentName}</strong> • Duration:{' '}
                  <strong>{formatDuration(selectedCall.duration)}</strong>
                </div>
              </div>
            </div>

            {/* Audio Player Card */}
            <div className="card" style={{ padding: 18, border: '1px solid var(--border-strong)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Call Voice Recording</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Quality: 64kbps Opus</span>
              </div>

              <div
                style={{
                  backgroundColor: 'var(--bg-surface-hover)',
                  borderRadius: 'var(--radius-md)',
                  padding: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <button
                  className="btn btn-primary btn-icon btn-sm"
                  style={{ width: 34, height: 34, borderRadius: '50%' }}
                  onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                >
                  <Play size={14} />
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 4, backgroundColor: 'var(--border-strong)', borderRadius: 2, position: 'relative' }}>
                    <div
                      style={{
                        width: isPlayingAudio ? '65%' : '0%',
                        height: '100%',
                        backgroundColor: 'var(--primary-600)',
                        borderRadius: 2,
                        transition: 'width 2s ease',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                    <span>{isPlayingAudio ? '01:24' : '00:00'}</span>
                    <span>{formatDuration(selectedCall.duration)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Transcription Box */}
            <div className="card" style={{ padding: 18 }}>
              <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
                Automated Call Transcript
              </h4>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>
                {selectedCall.transcription || 'Transcription processing completed.'}
              </p>
            </div>

            {/* Agent Discussion Notes */}
            <div className="card" style={{ padding: 18 }}>
              <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
                Agent Post-Call Notes
              </h4>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {selectedCall.notes || 'No custom agent notes entered during disposition.'}
              </p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
