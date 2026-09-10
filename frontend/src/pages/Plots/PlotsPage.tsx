import React, { useState, useEffect } from 'react';
import { Grid, MapPin, CheckCircle, Clock, ShieldCheck, UserCheck, Phone, Plus } from 'lucide-react';
import { Plot, PropertyProject } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { StatusChip } from '../../components/common/StatusChip';
import { Modal } from '../../components/common/Modal';

export const PlotsPage: React.FC = () => {
  const { tenant, user } = useAuth();
  const [plots, setPlots] = useState<Plot[]>([]);
  const [projects, setProjects] = useState<PropertyProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('proj-01');
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);

  // Hold action state
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [holdCustomer, setHoldCustomer] = useState('');
  const [holdDays, setHoldDays] = useState('7');

  const loadData = () => {
    setPlots(storageService.getPlots());
    setProjects(storageService.getProjects());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('nexus_storage_updated', handleUpdate);
    return () => window.removeEventListener('nexus_storage_updated', handleUpdate);
  }, []);

  const projectPlots = plots.filter(p => !selectedProject || p.projectId === selectedProject);

  const availableCount = projectPlots.filter(p => p.status === 'Available').length;
  const holdCount = projectPlots.filter(p => p.status === 'Hold').length;
  const soldCount = projectPlots.filter(p => p.status === 'Sold').length;

  const handleOpenHold = (plot: Plot) => {
    setSelectedPlot(plot);
    setHoldCustomer('');
    setIsHoldModalOpen(true);
  };

  const handleConfirmHold = () => {
    if (selectedPlot && holdCustomer) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(holdDays, 10));

      const updatedPlot: Plot = {
        ...selectedPlot,
        status: 'Hold',
        holdByCustomer: holdCustomer,
        holdByAgent: user?.name || 'Pooja Hegde',
        holdExpiry: expiryDate.toISOString().split('T')[0],
      };

      storageService.savePlot(updatedPlot);

      storageService.addAuditLog({
        id: `aud-${Date.now()}`,
        timestamp: 'Just now',
        actorName: user?.name || 'Agent',
        actorEmail: user?.email || 'agent@jamin.com',
        action: 'PLOT_HOLD_CREATED',
        entityType: 'Plot',
        entityId: selectedPlot.id,
        companyId: tenant?.id,
        companyName: tenant?.name,
        details: `Placed ${selectedPlot.plotNumber} on ${holdDays}-day hold for ${holdCustomer}.`,
      });

      setIsHoldModalOpen(false);
      setSelectedPlot(null);
    }
  };

  const handleReleaseHold = (plot: Plot) => {
    if (confirm(`Release hold on ${plot.plotNumber} back to Available status?`)) {
      const updatedPlot: Plot = {
        ...plot,
        status: 'Available',
        holdByCustomer: undefined,
        holdByAgent: undefined,
        holdExpiry: undefined,
      };
      storageService.savePlot(updatedPlot);
    }
  };

  const formatCurrency = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Grid size={24} color="#059669" /> Interactive Plot Inventory
          </h1>
          <p className="page-subtitle">
            Visual plot layout grid, availability statuses, and plot reservation management for {tenant?.name}.
          </p>
        </div>

        {/* Project Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Project:</span>
          <select
            className="form-select"
            style={{ width: 260 }}
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Legend & Telemetry Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Available: </span>
            <strong style={{ color: '#059669' }}>{availableCount}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>On Hold: </span>
            <strong style={{ color: '#d97706' }}>{holdCount}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ef4444' }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Sold: </span>
            <strong style={{ color: '#dc2626' }}>{soldCount}</strong>
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          Click any plot below to inspect specifications or initiate a client hold
        </div>
      </div>

      {/* Visual Plot Layout Grid (Blueprint Section 7.19) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        {projectPlots.map(plot => {
          const isAvailable = plot.status === 'Available';
          const isHold = plot.status === 'Hold';
          const isSold = plot.status === 'Sold';

          const statusBorderColor = isAvailable
            ? 'rgba(16, 185, 129, 0.4)'
            : isHold
            ? 'rgba(245, 158, 11, 0.4)'
            : 'rgba(239, 68, 68, 0.4)';

          const statusBgColor = isAvailable
            ? 'rgba(16, 185, 129, 0.05)'
            : isHold
            ? 'rgba(245, 158, 11, 0.05)'
            : 'rgba(239, 68, 68, 0.05)';

          return (
            <div
              key={plot.id}
              className="card card-hover"
              style={{
                padding: 16,
                backgroundColor: statusBgColor,
                borderColor: statusBorderColor,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                cursor: 'pointer',
              }}
              onClick={() => setSelectedPlot(plot)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>
                  {plot.plotNumber}
                </span>
                <StatusChip status={plot.status} size="sm" />
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {plot.dimension && <span>{plot.dimension} ft • </span>}
                <strong>{plot.sizeSqft} sq.ft</strong>
              </div>

              {plot.facing && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Facing: {plot.facing}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-base)', paddingTop: 10, marginTop: 4 }}>
                <span style={{ fontWeight: 800, fontSize: 15, color: '#059669' }}>
                  {formatCurrency(plot.totalPrice)}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  @ ₹{plot.pricePerSqft}/sqft
                </span>
              </div>

              {isHold && (
                <div
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 11,
                    color: '#b45309',
                    marginTop: 4,
                  }}
                >
                  🔒 Held for <strong>{plot.holdByCustomer}</strong>
                  {plot.holdExpiry && <div>Expiry: {plot.holdExpiry}</div>}
                </div>
              )}

              {isSold && (
                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 11,
                    color: '#b91c1c',
                    marginTop: 4,
                  }}
                >
                  ✓ Registered to <strong>{plot.holdByCustomer || 'Client'}</strong>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Plot Detail Modal */}
      <Modal
        isOpen={!!selectedPlot && !isHoldModalOpen}
        onClose={() => setSelectedPlot(null)}
        title={`${selectedPlot?.plotNumber} Specifications`}
        subtitle={`${selectedPlot?.projectName}`}
        footer={
          <>
            {selectedPlot?.status === 'Available' && (
              <button
                className="btn btn-primary"
                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
                onClick={() => handleOpenHold(selectedPlot)}
              >
                Put Plot on 7-Day Hold
              </button>
            )}

            {selectedPlot?.status === 'Hold' && (
              <button
                className="btn btn-secondary"
                style={{ color: '#dc2626' }}
                onClick={() => handleReleaseHold(selectedPlot)}
              >
                Release Hold to Available
              </button>
            )}

            <button className="btn btn-secondary" onClick={() => setSelectedPlot(null)}>
              Close
            </button>
          </>
        }
      >
        {selectedPlot && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Current Status:</span>
              <StatusChip status={selectedPlot.status} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Plot Dimension:</span>
                <div style={{ fontWeight: 700 }}>{selectedPlot.dimension || 'Standard'}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Total Area:</span>
                <div style={{ fontWeight: 700 }}>{selectedPlot.sizeSqft} sq.ft</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Rate per sq.ft:</span>
                <div style={{ fontWeight: 700 }}>₹{selectedPlot.pricePerSqft}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Total Plot Price:</span>
                <div style={{ fontWeight: 800, color: '#059669', fontSize: 16 }}>
                  {formatCurrency(selectedPlot.totalPrice)}
                </div>
              </div>
            </div>

            {selectedPlot.status === 'Hold' && (
              <div
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  padding: 14,
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  fontSize: 12,
                }}
              >
                <div style={{ fontWeight: 700, color: '#b45309', marginBottom: 4 }}>
                  Active Hold Reservation Details
                </div>
                <div>Customer: <strong>{selectedPlot.holdByCustomer}</strong></div>
                <div>Agent: <strong>{selectedPlot.holdByAgent}</strong></div>
                <div>Expiry Date: <strong>{selectedPlot.holdExpiry}</strong></div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Place on Hold Form Modal */}
      <Modal
        isOpen={isHoldModalOpen && !!selectedPlot}
        onClose={() => setIsHoldModalOpen(false)}
        title={`Place ${selectedPlot?.plotNumber} on Client Hold`}
        subtitle="Temporarily reserve plot to prevent duplicate bookings during diligence"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsHoldModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleConfirmHold}>
              Confirm Hold Reservation
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Client / Prospect Name *</label>
            <input
              type="text"
              className="form-input"
              required
              value={holdCustomer}
              onChange={e => setHoldCustomer(e.target.value)}
              placeholder="e.g. Brigadier H.S. Rathore"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Hold Validity Duration</label>
            <select
              className="form-select"
              value={holdDays}
              onChange={e => setHoldDays(e.target.value)}
            >
              <option value="3">3 Days (Express Hold)</option>
              <option value="7">7 Days (Standard Diligence)</option>
              <option value="14">14 Days (Executive Approval)</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};
