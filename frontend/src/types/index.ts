export type TenantSlug = 'ghl' | 'jamin';

export interface Tenant {
  id: string;
  name: string;
  slug: TenantSlug;
  brandColor: string;
  logo?: string;
  tagline: string;
  enabledFeatures: string[];
  timezone: string;
  currency: string;
  businessHours: string;
}

export type RoleCode = 'super_admin' | 'company_admin' | 'sales_manager' | 'sales_executive';

export interface Role {
  id: string;
  name: string;
  code: RoleCode;
  permissions: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  companyId?: string;
  companySlug?: TenantSlug;
  companyName?: string;
  status: 'Active' | 'Invited' | 'Disabled';
  lastLogin?: string;
  avatar?: string;
}

export interface Lead {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  source: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Converted' | 'Lost';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assignedAgentId: string;
  assignedAgentName: string;
  nextFollowupDate?: string;
  createdAt: string;
  notes: string;
  customFields: Record<string, any>;
}

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  email: string;
  status: 'Active' | 'VIP' | 'Inactive';
  assignedAgentId: string;
  assignedAgentName: string;
  location: string;
  lastContacted: string;
  openDealsCount: number;
  totalValue: number;
  createdAt: string;
  notes: string;
  customFields: Record<string, any>;
}

export interface Deal {
  id: string;
  companyId: string;
  title: string;
  customerId: string;
  customerName: string;
  stage: string;
  value: number;
  expectedCloseDate: string;
  assignedAgentId: string;
  assignedAgentName: string;
  notes: string;
  lostReason?: string;
  createdAt: string;
  stageEnteredAt?: string;
}

export type CallDisposition =
  | 'Interested'
  | 'Not Interested'
  | 'Follow-up Required'
  | 'Call Back'
  | 'Wrong Number'
  | 'Converted'
  | 'No Response';

export interface CallRecord {
  id: string;
  companyId: string;
  contactName: string;
  contactPhone: string;
  direction: 'inbound' | 'outbound';
  duration: number; // in seconds
  agentId: string;
  agentName: string;
  disposition: CallDisposition;
  timestamp: string;
  recordingUrl?: string;
  transcription?: string;
  notes?: string;
}

export interface Followup {
  id: string;
  companyId: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  contactType: 'lead' | 'customer' | 'investor';
  scheduledAt: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'Completed' | 'Cancelled';
  notes: string;
  assignedAgentId: string;
  assignedAgentName: string;
}

export interface PropertyProject {
  id: string;
  name: string;
  location: string;
  status: 'Upcoming' | 'Active' | 'Sold Out';
  totalPlots: number;
  availablePlots: number;
  holdPlots: number;
  soldPlots: number;
  description: string;
  priceRange: string;
}

export interface Plot {
  id: string;
  projectId: string;
  projectName: string;
  plotNumber: string;
  sizeSqft: number;
  pricePerSqft: number;
  totalPrice: number;
  status: 'Available' | 'Hold' | 'Sold';
  dimension?: string;
  facing?: string;
  holdByCustomer?: string;
  holdByAgent?: string;
  holdExpiry?: string;
}

export interface SiteVisit {
  id: string;
  companyId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  projectId: string;
  projectName: string;
  plotNumber?: string;
  scheduledAt: string;
  assignedAgentId: string;
  assignedAgentName: string;
  status: 'Scheduled' | 'Completed' | 'Rescheduled' | 'Cancelled' | 'No-show';
  outcomeNotes?: string;
}

export interface Booking {
  id: string;
  companyId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  projectId: string;
  projectName: string;
  plotId: string;
  plotNumber: string;
  bookingDate: string;
  bookingAmount: number;
  totalAmount: number;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  agentId: string;
  agentName: string;
  paymentTerms: string;
}

export interface Investor {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  email: string;
  status: 'Lead' | 'Active Investor' | 'HNW Investor' | 'Inactive';
  investmentCapacity: string;
  preferredAssetClass: string;
  assignedAgentId: string;
  assignedAgentName: string;
  referralSource?: string;
  createdAt: string;
  notes: string;
}

export interface Consultation {
  id: string;
  companyId: string;
  investorId: string;
  investorName: string;
  investorPhone: string;
  scheduledAt: string;
  consultantId: string;
  consultantName: string;
  status: 'Scheduled' | 'Completed' | 'Rescheduled' | 'Cancelled' | 'No-show';
  agenda: string;
  outcomeNotes?: string;
}

export interface InvestmentOpportunity {
  id: string;
  companyId: string;
  title: string;
  investorId: string;
  investorName: string;
  stage: 'Enquiry' | 'Contacted' | 'Consultation' | 'Qualified' | 'Opportunity' | 'Committed' | 'Closed Won' | 'Closed Lost';
  targetAmount: number;
  committedAmount: number;
  assignedAgentId: string;
  assignedAgentName: string;
  expectedCloseDate: string;
  notes: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  companyId?: string;
  companyName?: string;
  details: string;
}

export interface NotificationItem {
  id: string;
  type: 'lead' | 'call' | 'followup' | 'visit' | 'booking' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
  category: string;
  entityType?: 'lead' | 'customer' | 'investor' | 'booking' | 'consultation';
  entityId?: string;
}
