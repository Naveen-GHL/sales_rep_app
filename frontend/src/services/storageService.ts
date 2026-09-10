import {
  Lead,
  Customer,
  Deal,
  CallRecord,
  Followup,
  PropertyProject,
  Plot,
  SiteVisit,
  Booking,
  Investor,
  Consultation,
  InvestmentOpportunity,
  AuditLog,
  NotificationItem,
} from '../types';
import {
  INITIAL_LEADS,
  INITIAL_CUSTOMERS,
  INITIAL_DEALS,
  INITIAL_CALLS,
  INITIAL_FOLLOWUPS,
  INITIAL_PROJECTS,
  INITIAL_PLOTS,
  INITIAL_SITE_VISITS,
  INITIAL_BOOKINGS,
  INITIAL_INVESTORS,
  INITIAL_CONSULTATIONS,
  INITIAL_OPPORTUNITIES,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
} from './mockData';

class StorageService {
  private get<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(`nexus_${key}`);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`nexus_${key}`, JSON.stringify(value));
      window.dispatchEvent(new Event('nexus_storage_updated'));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  // Leads
  getLeads(companyId?: string): Lead[] {
    const leads = this.get<Lead[]>('leads', INITIAL_LEADS);
    return companyId ? leads.filter(l => l.companyId === companyId) : leads;
  }

  saveLead(lead: Lead): void {
    const leads = this.getLeads();
    const index = leads.findIndex(l => l.id === lead.id);
    if (index >= 0) {
      leads[index] = lead;
    } else {
      leads.unshift(lead);
    }
    this.set('leads', leads);
  }

  deleteLead(id: string): void {
    const leads = this.getLeads().filter(l => l.id !== id);
    this.set('leads', leads);
  }

  // Customers
  getCustomers(companyId?: string): Customer[] {
    const customers = this.get<Customer[]>('customers', INITIAL_CUSTOMERS);
    return companyId ? customers.filter(c => c.companyId === companyId) : customers;
  }

  saveCustomer(customer: Customer): void {
    const customers = this.getCustomers();
    const index = customers.findIndex(c => c.id === customer.id);
    if (index >= 0) {
      customers[index] = customer;
    } else {
      customers.unshift(customer);
    }
    this.set('customers', customers);
  }

  // Deals
  getDeals(companyId?: string): Deal[] {
    const deals = this.get<Deal[]>('deals', INITIAL_DEALS);
    return companyId ? deals.filter(d => d.companyId === companyId) : deals;
  }

  saveDeal(deal: Deal): void {
    const deals = this.getDeals();
    const index = deals.findIndex(d => d.id === deal.id);
    if (index >= 0) {
      deals[index] = deal;
    } else {
      deals.unshift(deal);
    }
    this.set('deals', deals);
  }

  // Calls
  getCalls(companyId?: string): CallRecord[] {
    const calls = this.get<CallRecord[]>('calls', INITIAL_CALLS);
    return companyId ? calls.filter(c => c.companyId === companyId) : calls;
  }

  addCall(call: CallRecord): void {
    const calls = this.getCalls();
    calls.unshift(call);
    this.set('calls', calls);
  }

  // Follow-ups
  getFollowups(companyId?: string): Followup[] {
    const followups = this.get<Followup[]>('followups', INITIAL_FOLLOWUPS);
    return companyId ? followups.filter(f => f.companyId === companyId) : followups;
  }

  saveFollowup(followup: Followup): void {
    const followups = this.getFollowups();
    const index = followups.findIndex(f => f.id === followup.id);
    if (index >= 0) {
      followups[index] = followup;
    } else {
      followups.unshift(followup);
    }
    this.set('followups', followups);
  }

  // Projects & Plots (Jamin)
  getProjects(): PropertyProject[] {
    return this.get<PropertyProject[]>('projects', INITIAL_PROJECTS);
  }

  getPlots(projectId?: string): Plot[] {
    const plots = this.get<Plot[]>('plots', INITIAL_PLOTS);
    return projectId ? plots.filter(p => p.projectId === projectId) : plots;
  }

  savePlot(plot: Plot): void {
    const plots = this.getPlots();
    const index = plots.findIndex(p => p.id === plot.id);
    if (index >= 0) {
      plots[index] = plot;
    } else {
      plots.push(plot);
    }
    this.set('plots', plots);
  }

  // Site Visits (Jamin)
  getSiteVisits(companyId?: string): SiteVisit[] {
    const visits = this.get<SiteVisit[]>('site_visits', INITIAL_SITE_VISITS);
    return companyId ? visits.filter(v => v.companyId === companyId) : visits;
  }

  saveSiteVisit(visit: SiteVisit): void {
    const visits = this.getSiteVisits();
    const index = visits.findIndex(v => v.id === visit.id);
    if (index >= 0) {
      visits[index] = visit;
    } else {
      visits.unshift(visit);
    }
    this.set('site_visits', visits);
  }

  // Bookings (Jamin)
  getBookings(companyId?: string): Booking[] {
    const bookings = this.get<Booking[]>('bookings', INITIAL_BOOKINGS);
    return companyId ? bookings.filter(b => b.companyId === companyId) : bookings;
  }

  saveBooking(booking: Booking): void {
    const bookings = this.getBookings();
    const index = bookings.findIndex(b => b.id === booking.id);
    if (index >= 0) {
      bookings[index] = booking;
    } else {
      bookings.unshift(booking);
    }
    this.set('bookings', bookings);
  }

  // Investors (GHL)
  getInvestors(companyId?: string): Investor[] {
    const investors = this.get<Investor[]>('investors', INITIAL_INVESTORS);
    return companyId ? investors.filter(i => i.companyId === companyId) : investors;
  }

  saveInvestor(investor: Investor): void {
    const investors = this.getInvestors();
    const index = investors.findIndex(i => i.id === investor.id);
    if (index >= 0) {
      investors[index] = investor;
    } else {
      investors.unshift(investor);
    }
    this.set('investors', investors);
  }

  // Consultations (GHL)
  getConsultations(companyId?: string): Consultation[] {
    const consultations = this.get<Consultation[]>('consultations', INITIAL_CONSULTATIONS);
    return companyId ? consultations.filter(c => c.companyId === companyId) : consultations;
  }

  saveConsultation(consultation: Consultation): void {
    const consultations = this.getConsultations();
    const index = consultations.findIndex(c => c.id === consultation.id);
    if (index >= 0) {
      consultations[index] = consultation;
    } else {
      consultations.unshift(consultation);
    }
    this.set('consultations', consultations);
  }

  // Opportunities (GHL)
  getOpportunities(companyId?: string): InvestmentOpportunity[] {
    const opps = this.get<InvestmentOpportunity[]>('opportunities', INITIAL_OPPORTUNITIES);
    return companyId ? opps.filter(o => o.companyId === companyId) : opps;
  }

  saveOpportunity(opportunity: InvestmentOpportunity): void {
    const opps = this.getOpportunities();
    const index = opps.findIndex(o => o.id === opportunity.id);
    if (index >= 0) {
      opps[index] = opportunity;
    } else {
      opps.unshift(opportunity);
    }
    this.set('opportunities', opps);
  }

  // Audit Logs
  getAuditLogs(companyId?: string): AuditLog[] {
    const logs = this.get<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS);
    return companyId ? logs.filter(l => !l.companyId || l.companyId === companyId) : logs;
  }

  addAuditLog(log: AuditLog): void {
    const logs = this.getAuditLogs();
    logs.unshift(log);
    this.set('audit_logs', logs);
  }

  // Notifications
  getNotifications(): NotificationItem[] {
    return this.get<NotificationItem[]>('notifications', INITIAL_NOTIFICATIONS);
  }

  markNotificationRead(id: string): void {
    const notifs = this.getNotifications();
    const found = notifs.find(n => n.id === id);
    if (found) {
      found.read = true;
      this.set('notifications', notifs);
    }
  }

  markAllNotificationsRead(): void {
    const notifs = this.getNotifications().map(n => ({ ...n, read: true }));
    this.set('notifications', notifs);
  }

  // Reset to default
  resetData(): void {
    localStorage.clear();
    window.dispatchEvent(new Event('nexus_storage_updated'));
  }
}

export const storageService = new StorageService();
