import React, { useState, useEffect } from 'react';
import {
  Kanban as KanbanIcon,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
  Plus,
} from 'lucide-react';
import { Deal } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useCan } from '../../components/common/Guards';
import { storageService } from '../../services/storageService';
import { PIPELINE_STAGES } from '../../constants/pipelineStages';
import { Modal } from '../../components/common/Modal';
import { FilterBar } from '../../components/common/FilterBar';

interface PipelinePageProps {
  onOpenQuickCreate: (type: 'lead' | 'followup' | 'deal' | 'visit' | 'consultation') => void;
}

export const PipelinePage: React.FC<PipelinePageProps> = ({ onOpenQuickCreate }) => {
  const { tenant, user } = useAuth();
  const canUpdateDeals = useCan('deals.update');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDealForLoss, setSelectedDealForLoss] = useState<Deal | null>(null);
  const [lossReason, setLossReason] = useState('Competitor Pricing');
  const [agentFilter, setAgentFilter] = useState('All');

  // Role-based scoping: Sales Executives see only their own deals.
  // Managers / Admins / Super Admins see every deal in the company (no filter).
  const roleCode = user?.role?.code;
  const isExec = roleCode === 'sales_executive';
  const scopedDeals = isExec
    ? deals.filter(d =>
        (d.assignedAgentId && d.assignedAgentId === user?.id) ||
        (d.assignedAgentName && d.assignedAgentName === user?.name)
      )
    : deals;

  // Agent filter options — derived from the already-scoped pool so execs never see this.
  const agentOptions = Array.from(new Set(scopedDeals.map(d => d.assignedAgentName)))
    .filter(Boolean)
    .map(name => ({ value: name, label: name }));

  const loadData = () => {
    setDeals(storageService.getDeals(tenant?.id));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('nexus_storage_updated', handleUpdate);
    return () => window.removeEventListener('nexus_storage_updated', handleUpdate);
  }, [tenant?.id]);

  // Stages derived dynamically from current tenant slug!
  const stages = tenant?.slug === 'jamin'
    ? PIPELINE_STAGES.jamin
    : tenant?.slug === 'ghl'
    ? PIPELINE_STAGES.ghl
    : PIPELINE_STAGES.default;

  const wonStage = stages.find(s => s.id === 'won' || s.id === 'converted')
    || (stages[stages.length - 1].id === 'lost' ? stages[stages.length - 2] : stages[stages.length - 1]);
  const wonStageId = wonStage?.id || 'won';

  const handleMoveStage = (deal: Deal, direction: 'forward' | 'backward') => {
    const currentIndex = stages.findIndex(s => s.id === deal.stage);
    const newIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;

    if (newIndex >= 0 && newIndex < stages.length) {
      if (stages[newIndex].id === 'lost') return;
      const updatedDeal: Deal = {
        ...deal,
        stage: stages[newIndex].id,
        stageEnteredAt: new Date().toISOString(),
      };
      storageService.saveDeal(updatedDeal);
    }
  };

  const handleMarkWon = (deal: Deal) => {
    storageService.saveDeal({
      ...deal,
      stage: wonStageId,
      stageEnteredAt: new Date().toISOString(),
    });
  };

  const handleConfirmLost = () => {
    if (selectedDealForLoss) {
      storageService.saveDeal({
        ...selectedDealForLoss,
        stage: 'lost',
        lostReason: lossReason,
        stageEnteredAt: new Date().toISOString(),
      });
      setSelectedDealForLoss(null);
    }
  };

  const getDaysInStage = (deal: Deal) => {
    const timestamp = deal.stageEnteredAt || deal.createdAt;
    if (!timestamp) return 0;
    const time = new Date(timestamp).getTime();
    if (isNaN(time)) return 0;
    const diffMs = new Date().getTime() - time;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <KanbanIcon size={24} color="var(--primary-600)" /> {tenant?.name} Sales Pipeline
          </h1>
          <p className="page-subtitle">
            Visual stage-gate workflow tailored specifically for {tenant?.name}'s deal lifecycle.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {!isExec && (
            <FilterBar
              filters={[
                {
                  key: 'agent',
                  label: 'Agent',
                  value: agentFilter,
                  onChange: setAgentFilter,
                  options: agentOptions,
                },
              ]}
              onClearAll={() => setAgentFilter('All')}
            />
          )}
          <button
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => onOpenQuickCreate('deal')}
          >
            <Plus size={15} /> New Deal
          </button>
        </div>
      </div>

      {/* Kanban Board Horizontal Scrolling Container */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          overflowX: 'auto',
          paddingBottom: 16,
          minHeight: 'calc(100vh - 220px)',
        }}
      >
        {stages.map((stage, sIdx) => {
          const stageDeals = scopedDeals.filter(d =>
            d.stage === stage.id &&
            (agentFilter === 'All' || d.assignedAgentName === agentFilter)
          );
          const stageTotal = stageDeals.reduce((sum, d) => sum + d.value, 0);

          return (
            <div
              key={stage.id}
              style={{
                flex: '0 0 300px',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-surface-hover)',
                border: '1px solid var(--border-base)',
                maxHeight: '100%',
              }}
            >
              {/* Stage Header */}
              <div
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border-base)',
                  backgroundColor: 'var(--bg-surface)',
                  borderTopLeftRadius: 'var(--radius-lg)',
                  borderTopRightRadius: 'var(--radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: stage.color,
                      }}
                    />
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                      {stage.name}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '1px 7px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--bg-surface-hover)',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {stageDeals.length}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Total: <strong style={{ color: '#059669' }}>{formatCurrency(stageTotal)}</strong>
                  </div>
                </div>
              </div>

              {/* Stage Cards Container */}
              <div
                style={{
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  overflowY: 'auto',
                  flex: 1,
                }}
              >
                {stageDeals.length === 0 ? (
                  <div
                    style={{
                      padding: '36px 12px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: 12,
                      border: '1px dashed var(--border-strong)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    No deals in this stage
                  </div>
                ) : (
                  stageDeals.map(deal => {
                    const daysInStage = getDaysInStage(deal);
                    const isStale = daysInStage > 14;
                    const isWon = deal.stage === wonStageId || deal.stage === 'won' || deal.stage === 'converted';
                    const isLost = deal.stage === 'lost';

                    return (
                      <div
                        key={deal.id}
                        className="card card-hover"
                        style={{
                          padding: 14,
                          backgroundColor: 'var(--bg-surface)',
                          boxShadow: 'var(--shadow-xs)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                            {deal.title}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--primary-600)', fontWeight: 600, marginTop: 2 }}>
                            {deal.customerName}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: '#059669' }}>
                            {formatCurrency(deal.value)}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span
                              style={{
                                fontSize: 11,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                color: isStale ? '#d97706' : 'var(--text-muted)',
                                fontWeight: isStale ? 700 : 500,
                                backgroundColor: isStale ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                                padding: isStale ? '1px 6px' : '0',
                                borderRadius: 'var(--radius-sm)',
                                border: isStale ? '1px solid rgba(245, 158, 11, 0.3)' : 'none',
                              }}
                              title={isStale ? `Stale deal: In stage for ${daysInStage} days (>14 days)` : `In stage for ${daysInStage} days`}
                            >
                              <Clock size={11} color={isStale ? '#d97706' : 'currentColor'} />
                              {daysInStage}d
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              📅 {deal.expectedCloseDate}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                            👤 {deal.assignedAgentName}
                          </span>

                          {/* Stage Mover and Action Buttons */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {!isWon && !isLost && sIdx > 0 && (
                              <button
                                className="btn btn-ghost btn-icon btn-sm"
                                style={{ width: 24, height: 24 }}
                                title="Move to Previous Stage"
                                onClick={() => handleMoveStage(deal, 'backward')}
                              >
                                <ChevronLeft size={13} />
                              </button>
                            )}
                            {!isWon && !isLost && sIdx < stages.length - 1 && (
                              <button
                                className="btn btn-primary btn-icon btn-sm"
                                style={{ width: 24, height: 24 }}
                                title="Advance to Next Stage"
                                onClick={() => handleMoveStage(deal, 'forward')}
                              >
                                <ChevronRight size={13} />
                              </button>
                            )}
                            {canUpdateDeals && (
                              <>
                                {!isWon && (
                                  <button
                                    className="btn btn-ghost btn-icon btn-sm"
                                    style={{ width: 24, height: 24, color: '#059669' }}
                                    title="Mark Won"
                                    onClick={() => handleMarkWon(deal)}
                                  >
                                    <CheckCircle size={14} />
                                  </button>
                                )}
                                {!isLost && !isWon && (
                                  <button
                                    className="btn btn-ghost btn-icon btn-sm"
                                    style={{ width: 24, height: 24, color: '#ef4444' }}
                                    title="Mark Lost"
                                    onClick={() => setSelectedDealForLoss(deal)}
                                  >
                                    <XCircle size={14} />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lost Reason Modal */}
      <Modal
        isOpen={!!selectedDealForLoss}
        onClose={() => setSelectedDealForLoss(null)}
        title="Mark Deal as Closed Lost"
        subtitle={`Select root cause for deal: ${selectedDealForLoss?.title}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setSelectedDealForLoss(null)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleConfirmLost}>
              Confirm Closed Lost
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Reason for Loss *</label>
          <select
            className="form-select"
            value={lossReason}
            onChange={e => setLossReason(e.target.value)}
          >
            <option value="Competitor Pricing">Competitor Pricing</option>
            <option value="Client Budget Constraints">Client Budget Constraints</option>
            <option value="Timeline Postponed">Timeline Postponed</option>
            <option value="Title / Legal Hesitation">Title / Legal Hesitation</option>
            <option value="Location Preference Mismatch">Location Preference Mismatch</option>
          </select>
        </div>
      </Modal>
    </div>
  );
};
