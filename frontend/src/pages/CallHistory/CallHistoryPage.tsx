import React, { useState, useEffect } from 'react';
import { History, Play, Phone, FileText, Download, User } from 'lucide-react';
import { CallRecord } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { DataTable, Column, RowAction } from '../../components/common/DataTable';
import { StatusChip } from '../../components/common/StatusChip';
import { Drawer } from '../../components/common/Drawer';
import { FilterBar } from '../../components/common/FilterBar';
import './CallHistoryPage.css';

export const CallHistoryPage: React.FC = () => {
  const { tenant } = useAuth();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [dispositionFilter, setDispositionFilter] = useState('All');
  const [directionFilter, setDirectionFilter] = useState('All');

  const loadData = () => {
    setCalls(storageService.getCalls(tenant?.id));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('nexus_storage_updated', handleUpdate);
    return () => window.removeEventListener('nexus_storage_updated', handleUpdate);
  }, [tenant?.id]);

  const filteredCalls = calls.filter(c => {
    if (dispositionFilter !== 'All' && c.disposition !== dispositionFilter) return false;
    if (directionFilter !== 'All' && c.direction !== directionFilter) return false;
    return true;
  });

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
      render: c => <span className="call-cell-timestamp">{c.timestamp}</span>,
    },
    {
      key: 'contactName',
      header: 'Contact',
      sortable: true,
      render: c => (
        <div>
          <div className="call-contact-primary">{c.contactName}</div>
          <div className="call-contact-sub">{c.contactPhone}</div>
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
      render: c => <span className="call-cell-text">{formatDuration(c.duration)}</span>,
    },
    {
      key: 'agentName',
      header: 'Agent',
      sortable: true,
      render: c => <span className="call-cell-text">{c.agentName}</span>,
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
          className="btn btn-ghost btn-sm call-listen-btn"
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
      icon: <FileText size={14} className="call-action-icon" />,
      onClick: c => {
        setSelectedCall(c);
        setIsPlayingAudio(false);
      },
    },
  ];

  return (
    <div className="call-history-page">
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
        data={filteredCalls}
        keyExtractor={c => c.id}
        rowActions={rowActions}
        onRowClick={c => {
          setSelectedCall(c);
          setIsPlayingAudio(false);
        }}
        searchPlaceholder="Search calls by contact name, phone, or agent..."
        filtersNode={
          <FilterBar
            filters={[
              {
                key: 'disposition',
                label: 'Disposition',
                value: dispositionFilter,
                onChange: setDispositionFilter,
                options: [
                  { value: 'Interested', label: 'Interested' },
                  { value: 'Not Interested', label: 'Not Interested' },
                  { value: 'Follow-up Required', label: 'Follow-up Required' },
                  { value: 'Call Back', label: 'Call Back' },
                  { value: 'Wrong Number', label: 'Wrong Number' },
                  { value: 'Converted', label: 'Converted' },
                  { value: 'No Response', label: 'No Response' },
                ],
              },
              {
                key: 'direction',
                label: 'Direction',
                value: directionFilter,
                onChange: setDirectionFilter,
                options: [
                  { value: 'inbound', label: 'Inbound' },
                  { value: 'outbound', label: 'Outbound' },
                ],
              },
            ]}
            onClearAll={() => {
              setDispositionFilter('All');
              setDirectionFilter('All');
            }}
          />
        }
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
          <div className="call-drawer-stack">
            {/* Outcome Overview */}
            <div className="call-drawer-overview-banner">
              <div>
                <div className="call-drawer-chips-row">
                  <StatusChip status={selectedCall.direction} />
                  <StatusChip status={selectedCall.disposition} />
                </div>
                <div className="call-drawer-meta-note">
                  Agent: <strong>{selectedCall.agentName}</strong> • Duration:{' '}
                  <strong>{formatDuration(selectedCall.duration)}</strong>
                </div>
              </div>
            </div>

            {/* Audio Player Card */}
            <div className="card call-drawer-player-card">
              <div className="call-drawer-player-header">
                <span className="call-drawer-player-title">Call Voice Recording</span>
                <span className="call-drawer-player-quality">Quality: 64kbps Opus</span>
              </div>

              <div className="call-drawer-player-box">
                <button
                  className="btn btn-primary btn-icon btn-sm call-player-btn"
                  onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                >
                  <Play size={14} />
                </button>
                <div className="call-player-track">
                  <div className="call-player-bar">
                    <div
                      className="call-player-progress"
                      style={{ width: isPlayingAudio ? '65%' : '0%' }}
                    />
                  </div>
                  <div className="call-player-times">
                    <span>{isPlayingAudio ? '01:24' : '00:00'}</span>
                    <span>{formatDuration(selectedCall.duration)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Transcription Box */}
            <div className="card call-drawer-card">
              <h4 className="call-drawer-heading">
                Automated Call Transcript
              </h4>
              <p className="call-drawer-transcript">
                {selectedCall.transcription || 'Transcription processing completed.'}
              </p>
            </div>

            {/* Agent Discussion Notes */}
            <div className="card call-drawer-card">
              <h4 className="call-drawer-heading">
                Agent Post-Call Notes
              </h4>
              <p className="call-drawer-notes">
                {selectedCall.notes || 'No custom agent notes entered during disposition.'}
              </p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
