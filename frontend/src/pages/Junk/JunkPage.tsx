import React, { useState, useEffect } from 'react';
import { Phone, ExternalLink, Trash2 } from 'lucide-react';
import { Lead } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useCall } from '../../context/CallContext';
import { storageService } from '../../services/storageService';
import { DataTable, Column, RowAction } from '../../components/common/DataTable';
import { Drawer } from '../../components/common/Drawer';
import { Timeline, TimelineEvent } from '../../components/common/Timeline';
import './JunkPage.css';

export const JunkPage: React.FC = () => {
  const { tenant, user } = useAuth();
  const { initiateCall } = useCall();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  const roleCode = user?.role?.code;
  const isExec = roleCode === 'sales_executive';

  const loadData = () => {
    const allLeads = storageService.getLeads(tenant?.id);
    const junkLeads = allLeads.filter(l => l.status === 'Junk');
    
    const scopedLeads = isExec
      ? junkLeads.filter(l =>
          (l.assignedAgentId && l.assignedAgentId === user?.id) ||
          (l.assignedAgentName && l.assignedAgentName === user?.name)
        )
      : junkLeads;
    
    setLeads(scopedLeads);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('nexus_storage_updated', handleUpdate);
    return () => window.removeEventListener('nexus_storage_updated', handleUpdate);
  }, [tenant?.id, user?.id, isExec]);

  const columns: Column<Lead>[] = [
    {
      key: 'name',
      header: 'Name & Contact',
      render: (r: Lead) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            {r.phone} • {r.location || 'Unknown'}
          </div>
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      render: (r: Lead) => (
        <span
          style={{
            display: "inline-flex",
            padding: "3px 10px",
            borderRadius: 100,
            fontSize: 11,
            fontWeight: 600,
            background: "rgba(100, 116, 139, 0.12)",
            color: "#94a3b8",
            border: "1px solid rgba(100, 116, 139, 0.2)",
          }}
        >
          {r.source}
        </span>
      ),
    },
  ];

  const actions: RowAction<Lead>[] = [
    {
      label: 'View',
      icon: <ExternalLink size={14} />,
      onClick: (row) => {
        setSelectedLead(row);
        setIsDetailDrawerOpen(true);
      },
    },
  ];

  const getTimelineEvents = (lead: Lead): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    
    events.push({
      id: `ev-create-${lead.id}`,
      type: 'note',
      title: 'Lead Created',
      description: `Sourced from ${lead.source}`,
      timestamp: lead.createdAt,
      actorName: lead.assignedAgentName,
    });

    const calls = storageService.getCalls(tenant?.id).filter(c => c.contactPhone === lead.phone || c.contactName === lead.name);
    
    calls.forEach(c => {
      events.push({
        id: `ev-call-${c.id}`,
        type: 'call',
        title: `Call Logged - ${c.disposition}`,
        description: `Duration: ${Math.floor(c.duration / 60)}m ${c.duration % 60}s. ${c.notes || ''}`,
        timestamp: c.timestamp,
        actorName: c.agentName,
      });
    });

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const timelineEvents = selectedLead ? getTimelineEvents(selectedLead) : [];
  const callsCount = selectedLead ? storageService.getCalls(tenant?.id).filter(c => c.contactPhone === selectedLead.phone || c.contactName === selectedLead.name).length : 0;

  return (
    <div className="junk-page">
      <div>
        <h1 className="junk-title">
          <Trash2 size={22} color="#64748b" />
          Junk
        </h1>
        <p className="junk-subtitle">Wrong numbers and invalid inquiries</p>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <DataTable
          columns={columns}
          data={leads}
          keyExtractor={(r) => r.id}
          rowActions={actions}
          emptyTitle="No junk leads found."
        />
      </div>

      {/* Details Drawer */}
      <Drawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={selectedLead?.name || 'Lead Details'}
        subtitle={`Junk Lead • Added on ${selectedLead?.createdAt}`}
        width={500}
      >
        {selectedLead && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '16px 0' }}>
            {/* Core Details */}
            <div className="card">
              <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12, fontWeight: 700 }}>
                Contact Details
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Phone:</span>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedLead.phone}</div>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Email:</span>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedLead.email || '—'}</div>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Location:</span>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{selectedLead.location || '—'}</div>
                </div>
                <div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total Calls:</span>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{callsCount}</div>
                </div>
              </div>
            </div>

            {/* Reason Details */}
            <div className="card">
              <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12, fontWeight: 700 }}>
                Junk Reason Details
              </h4>
              <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {selectedLead.customFields?.dispositionReason || 'No specific reason provided.'}
              </p>
            </div>

            {/* Activity History Timeline */}
            <div>
              <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16, fontWeight: 700 }}>
                Call Records / History
              </h4>
              <Timeline events={timelineEvents} />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
