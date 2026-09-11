import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { logAudit } from '../../middleware/audit';

export function serializeBooking(b: any) {
  return {
    id: b.id,
    companyId: b.companyId,
    customerId: b.customerId,
    customerName: b.customerName,
    customerPhone: b.customerPhone,
    projectId: b.projectId,
    projectName: b.projectName,
    plotId: b.plotId,
    plotNumber: b.plotNumber,
    bookingDate: b.bookingDate,
    bookingAmount: b.bookingAmount,
    totalAmount: b.totalAmount,
    status: b.status,
    agentId: b.agentId,
    agentName: b.agentName,
    paymentTerms: b.paymentTerms || '',
  };
}

export async function getBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const where: any = {};
    if (companyId) where.companyId = companyId;

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(bookings.map(serializeBooking));
  } catch (err) {
    next(err);
  }
}

export async function createBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId || 'jamin';
    const {
      customerId,
      customerName,
      customerPhone,
      projectId,
      projectName,
      plotId,
      plotNumber,
      bookingDate,
      bookingAmount,
      totalAmount,
      status = 'Pending',
      agentId,
      agentName,
      paymentTerms = '',
    } = req.body;

    if (!customerId || !plotId || !bookingAmount) {
      res.status(400).json({ message: 'customerId, plotId, and bookingAmount are required' });
      return;
    }

    // Check plot status
    const plot = await prisma.plot.findUnique({ where: { id: plotId } });
    if (!plot) {
      res.status(404).json({ message: 'Plot not found' });
      return;
    }

    if (plot.status === 'Sold') {
      res.status(409).json({ message: 'Plot is already Sold and cannot be booked' });
      return;
    }

    const booking = await prisma.booking.create({
      data: {
        companyId,
        customerId,
        customerName: customerName || 'Customer',
        customerPhone: customerPhone || '',
        projectId,
        projectName: projectName || plot.projectName,
        plotId,
        plotNumber: plotNumber || plot.plotNumber,
        bookingDate: bookingDate || new Date().toISOString().split('T')[0],
        bookingAmount: typeof bookingAmount === 'string' ? parseFloat(bookingAmount) : bookingAmount,
        totalAmount: typeof totalAmount === 'string' ? parseFloat(totalAmount) : (totalAmount || plot.totalPrice),
        status,
        agentId: agentId || req.user?.id || 'unassigned',
        agentName: agentName || req.user?.name || 'Unassigned',
        paymentTerms,
      },
    });

    if (req.user) {
      await logAudit({
        actorName: req.user.name,
        actorEmail: req.user.email,
        action: 'CREATE_BOOKING',
        entityType: 'Booking',
        entityId: booking.id,
        companyId,
        details: `Created booking for plot ${booking.plotNumber} by ${booking.customerName}`,
      });
    }

    res.status(201).json(serializeBooking(booking));
  } catch (err) {
    next(err);
  }
}

export async function getBookingById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }
    res.json(serializeBooking(booking));
  } catch (err) {
    next(err);
  }
}

export async function updateBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { bookingAmount, totalAmount, paymentTerms, status } = req.body;

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        ...(bookingAmount !== undefined && { bookingAmount: typeof bookingAmount === 'string' ? parseFloat(bookingAmount) : bookingAmount }),
        ...(totalAmount !== undefined && { totalAmount: typeof totalAmount === 'string' ? parseFloat(totalAmount) : totalAmount }),
        ...(paymentTerms !== undefined && { paymentTerms }),
        ...(status !== undefined && { status }),
      },
    });

    res.json(serializeBooking(updated));
  } catch (err) {
    next(err);
  }
}

export async function confirmBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }

    // Transactional confirmation: updates booking to Confirmed and sets plot to Sold
    const result = await prisma.$transaction(async (tx) => {
      const confirmed = await tx.booking.update({
        where: { id },
        data: { status: 'Confirmed' },
      });

      await tx.plot.update({
        where: { id: booking.plotId },
        data: {
          status: 'Sold',
          holdByCustomer: null,
          holdByAgent: null,
          holdExpiry: null,
        },
      });

      await tx.propertyProject.update({
        where: { id: booking.projectId },
        data: {
          availablePlots: { decrement: 1 },
          soldPlots: { increment: 1 },
        },
      }).catch(() => {});

      return confirmed;
    });

    if (req.user) {
      await logAudit({
        actorName: req.user.name,
        actorEmail: req.user.email,
        action: 'CONFIRM_BOOKING',
        entityType: 'Booking',
        entityId: id,
        companyId: booking.companyId,
        details: `Confirmed booking for plot ${booking.plotNumber}. Plot marked Sold.`,
      });
    }

    res.json(serializeBooking(result));
  } catch (err) {
    next(err);
  }
}

export async function cancelBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }

    // Transactional cancellation: updates booking to Cancelled and sets plot back to Available
    const result = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.booking.update({
        where: { id },
        data: { status: 'Cancelled' },
      });

      await tx.plot.update({
        where: { id: booking.plotId },
        data: {
          status: 'Available',
          holdByCustomer: null,
          holdByAgent: null,
          holdExpiry: null,
        },
      });

      await tx.propertyProject.update({
        where: { id: booking.projectId },
        data: {
          availablePlots: { increment: 1 },
          soldPlots: { decrement: 1 },
        },
      }).catch(() => {});

      return cancelled;
    });

    res.json(serializeBooking(result));
  } catch (err) {
    next(err);
  }
}
