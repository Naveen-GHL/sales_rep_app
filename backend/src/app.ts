import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

import { ENV } from './config/env';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './modules/auth/authRoutes';
import companyRoutes from './modules/companies/companyRoutes';
import userRoutes from './modules/users/userRoutes';
import roleRoutes from './modules/roles/roleRoutes';
import leadRoutes from './modules/leads/leadRoutes';
import customerRoutes from './modules/customers/customerRoutes';
import dealRoutes from './modules/deals/dealRoutes';
import followupRoutes from './modules/followups/followupRoutes';
import callRoutes from './modules/calls/callRoutes';
import propertyRoutes from './modules/properties/propertyRoutes';
import siteVisitRoutes from './modules/siteVisits/siteVisitRoutes';
import bookingRoutes from './modules/bookings/bookingRoutes';
import investorRoutes from './modules/investors/investorRoutes';
import consultationRoutes from './modules/consultations/consultationRoutes';
import opportunityRoutes from './modules/opportunities/opportunityRoutes';
import reportRoutes from './modules/reports/reportRoutes';
import notificationRoutes from './modules/notifications/notificationRoutes';
import documentRoutes from './modules/documents/documentRoutes';
import auditLogRoutes from './modules/auditLogs/auditLogRoutes';
import jobRoutes from './modules/jobs/jobRoutes';

export const app = express();

// Security and utility middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (ENV.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve uploaded files statically
app.use('/uploads', express.static(ENV.UPLOAD_DIR));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Mount domain routes under /api
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/users', userRoutes);
app.use('/api', roleRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/followups', followupRoutes);
app.use('/api', callRoutes);
app.use('/api', propertyRoutes);
app.use('/api/site-visits', siteVisitRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/investors', investorRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/jobs', jobRoutes);

// Catch-all 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Central error handler
app.use(errorHandler);
