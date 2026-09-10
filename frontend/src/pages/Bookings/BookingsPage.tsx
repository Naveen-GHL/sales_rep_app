import React, { useState, useEffect } from 'react';
import { CheckCircle, Plus, FileText, DollarSign, UserCheck, ShieldCheck } from 'lucide-react';
import { Booking } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { DataTable, Column, RowAction } from '../../components/common/DataTable';
import { StatusChip } from '../../components/common/StatusChip';
import { Modal } from '../../components/common/Modal';

export const BookingsPage: React.FC = () => {
  const { tenant, user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);

  // Form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+91 ');
  const [plotNumber, setPlotNumber] = useState('Plot #08');
  const [bookingAmount, setBookingAmount] = useState<number>(500000);
  const [totalAmount, setTotalAmount] = useState<number>(5760000);
  const [paymentTerms, setPaymentTerms] = useState('Token ₹5L paid via RTGS. 20% on agreement signing, 80% on registration.');

  const loadData = () => {
    setBookings(storageService.getBookings(tenant?.id));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('nexus_storage_updated', handleUpdate);
    return () => window.removeEventListener('nexus_storage_updated', handleUpdate);
  }, [tenant?.id]);

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName) return;

    const newBooking: Booking = {
      id: `bkg-${Date.now()}`,
      companyId: tenant?.id || 't-jamin-02',
      customerId: `cust-${Date.now()}`,
      customerName,
      customerPhone,
      projectId: 'proj-01',
      projectName: 'Greenfield Meadows Phase 2',
      plotId: `plot-${Date.now()}`,
      plotNumber,
      bookingDate: new Date().toISOString().split('T')[0],
      bookingAmount,
      totalAmount,
      status: 'Confirmed',
      agentId: user?.id || 'usr-exec',
      agentName: user?.name || 'Agent',
      paymentTerms,
    };

    storageService.saveBooking(newBooking);

    // Update matching plot to Sold
    const plots = storageService.getPlots();
    const targetPlot = plots.find(p => p.plotNumber.toLowerCase() === plotNumber.toLowerCase());
    if (targetPlot) {
      storageService.savePlot({
        ...targetPlot,
        status: 'Sold',
        holdByCustomer: customerName,
      });
    }

    storageService.addAuditLog({
      id: `aud-${Date.now()}`,
      timestamp: 'Just now',
      actorName: user?.name || 'Agent',
      actorEmail: user?.email || 'agent@jamin.com',
      action: 'BOOKING_CREATED',
      entityType: 'Booking',
      entityId: newBooking.id,
      companyId: tenant?.id,
      companyName: tenant?.name,
      details: `Created booking for ${plotNumber} (${customerName}) with ₹${bookingAmount} token.`,
    });

    setIsNewBookingModalOpen(false);
  };

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const columns: Column<Booking>[] = [
    {
      key: 'plotNumber',
      header: 'Plot & Community',
      sortable: true,
      render: b => (
        <div>
          <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{b.plotNumber}</div>
          <div style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>{b.projectName}</div>
        </div>
      ),
    },
    {
      key: 'customerName',
      header: 'Buyer Information',
      sortable: true,
      render: b => (
        <div>
          <div style={{ fontWeight: 700 }}>{b.customerName}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b.customerPhone}</div>
        </div>
      ),
    },
    {
      key: 'bookingAmount',
      header: 'Token Paid',
      sortable: true,
      render: b => <span style={{ fontWeight: 800, color: '#059669' }}>{formatCurrency(b.bookingAmount)}</span>,
    },
    {
      key: 'totalAmount',
      header: 'Total Sale Value',
      sortable: true,
      render: b => <span style={{ fontWeight: 700 }}>{formatCurrency(b.totalAmount)}</span>,
    },
    {
      key: 'bookingDate',
      header: 'Date',
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: b => <StatusChip status={b.status} size="sm" />,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <CheckCircle size={24} color="#059669" /> Plot Bookings & Contracts
          </h1>
          <p className="page-subtitle">
            Formal reservation contracts, token receipts, and payment schedules for {tenant?.name}.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsNewBookingModalOpen(true)}>
          <Plus size={15} /> Formalize New Booking
        </button>
      </div>

      <DataTable
        columns={columns}
        data={bookings}
        keyExtractor={b => b.id}
        searchPlaceholder="Search bookings by customer, plot, or date..."
      />

      {/* New Booking Modal */}
      <Modal
        isOpen={isNewBookingModalOpen}
        onClose={() => setIsNewBookingModalOpen(false)}
        title="Formalize Plot Booking Agreement"
        subtitle="Confirm token payment and bind plot inventory"
      >
        <form onSubmit={handleCreateBooking} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Buyer Full Name *</label>
            <input
              type="text"
              className="form-input"
              required
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="e.g. Brigadier H.S. Rathore"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Buyer Phone *</label>
              <input
                type="text"
                className="form-input"
                required
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="+91 94140 11223"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Plot Number *</label>
              <input
                type="text"
                className="form-input"
                required
                value={plotNumber}
                onChange={e => setPlotNumber(e.target.value)}
                placeholder="e.g. Plot #08"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Token Advance (₹) *</label>
              <input
                type="number"
                className="form-input"
                required
                value={bookingAmount}
                onChange={e => setBookingAmount(Number(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Total Agreement Value (₹) *</label>
              <input
                type="number"
                className="form-input"
                required
                value={totalAmount}
                onChange={e => setTotalAmount(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Payment Terms & Milestones</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={paymentTerms}
              onChange={e => setPaymentTerms(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsNewBookingModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm & Mark Plot Sold
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
