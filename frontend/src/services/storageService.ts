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
  User,
  Tenant,
} from '../types';
import { DEFAULT_TENANTS } from '../constants/defaultTenants';

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

  // Tenants
  getTenants(): Tenant[] {
    return this.get<Tenant[]>('tenants', Object.values(DEFAULT_TENANTS));
  }

  saveTenant(tenant: Tenant): void {
    const tenants = this.getTenants();
    const index = tenants.findIndex(t => t.id === tenant.id);
    if (index >= 0) {
      tenants[index] = tenant;
    } else {
      tenants.push(tenant);
    }
    this.set('tenants', tenants);
  }

  // Users
  getUsers(companySlug?: string): User[] {
    const users = this.get<User[]>('users', []);
    return companySlug ? users.filter(u => u.companySlug === companySlug) : users;
  }

  saveUser(user: User): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    this.set('users', users);
  }

  // Leads (Defaults to empty [] - real-time data only)
  getLeads(companyId?: string): Lead[] {
    const leads = this.get<Lead[]>('leads', []);
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

  // Customers (Defaults to empty [] - real-time data only)
  getCustomers(companyId?: string): Customer[] {
    const customers = this.get<Customer[]>('customers', []);
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

  // Deals (Defaults to empty [] - real-time data only)
  getDeals(companyId?: string): Deal[] {
    const deals = this.get<Deal[]>('deals', []);
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

  // Calls (Defaults to empty [] - real-time data only)
  getCalls(companyId?: string): CallRecord[] {
    const calls = this.get<CallRecord[]>('calls', []);
    return companyId ? calls.filter(c => c.companyId === companyId) : calls;
  }

  addCall(call: CallRecord): void {
    const calls = this.getCalls();
    calls.unshift(call);
    this.set('calls', calls);
  }

  // Follow-ups (Defaults to empty [] - real-time data only)
  getFollowups(companyId?: string): Followup[] {
    const followups = this.get<Followup[]>('followups', []);
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

  // Projects & Plots (Defaults to empty [] - real-time data only)
  getProjects(): PropertyProject[] {
    return this.get<PropertyProject[]>('projects', []);
  }

  saveProject(project: PropertyProject): void {
    const projects = this.getProjects();
    const index = projects.findIndex(p => p.id === project.id);
    if (index >= 0) {
      projects[index] = project;
    } else {
      projects.push(project);
    }
    this.set('projects', projects);
  }

  getPlots(projectId?: string): Plot[] {
    const plots = this.get<Plot[]>('plots', []);
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

  // Site Visits (Defaults to empty [] - real-time data only)
  getSiteVisits(companyId?: string): SiteVisit[] {
    const visits = this.get<SiteVisit[]>('site_visits', []);
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

  // Bookings (Defaults to empty [] - real-time data only)
  getBookings(companyId?: string): Booking[] {
    const bookings = this.get<Booking[]>('bookings', []);
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

  // Investors (Defaults to empty [] - real-time data only)
  getInvestors(companyId?: string): Investor[] {
    const investors = this.get<Investor[]>('investors', []);
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

  // Consultations (Defaults to empty [] - real-time data only)
  getConsultations(companyId?: string): Consultation[] {
    const consultations = this.get<Consultation[]>('consultations', []);
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

  // Opportunities (Defaults to empty [] - real-time data only)
  getOpportunities(companyId?: string): InvestmentOpportunity[] {
    const opps = this.get<InvestmentOpportunity[]>('opportunities', []);
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

  // Audit Logs (Defaults to empty [] - real-time data only)
  getAuditLogs(companyId?: string): AuditLog[] {
    const logs = this.get<AuditLog[]>('audit_logs', []);
    return companyId ? logs.filter(l => !l.companyId || l.companyId === companyId) : logs;
  }

  addAuditLog(log: AuditLog): void {
    const logs = this.getAuditLogs();
    logs.unshift(log);
    this.set('audit_logs', logs);
  }

  // Notifications (Defaults to empty [] - real-time data only)
  getNotifications(): NotificationItem[] {
    return this.get<NotificationItem[]>('notifications', []);
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

  // Optional: Explicitly populate demo mock data from separate mock_data folder
  async loadMockDataFromSeparateFolder(): Promise<void> {
    const mock = await import('../mock_data/mockData');
    this.set('leads', mock.INITIAL_LEADS);
    this.set('customers', mock.INITIAL_CUSTOMERS);
    this.set('deals', mock.INITIAL_DEALS);
    this.set('calls', mock.INITIAL_CALLS);
    this.set('followups', mock.INITIAL_FOLLOWUPS);
    this.set('projects', mock.INITIAL_PROJECTS);
    this.set('plots', mock.INITIAL_PLOTS);
    this.set('site_visits', mock.INITIAL_SITE_VISITS);
    this.set('bookings', mock.INITIAL_BOOKINGS);
    this.set('investors', mock.INITIAL_INVESTORS);
    this.set('consultations', mock.INITIAL_CONSULTATIONS);
    this.set('opportunities', mock.INITIAL_OPPORTUNITIES);
    this.set('audit_logs', mock.INITIAL_AUDIT_LOGS);
    this.set('notifications', mock.INITIAL_NOTIFICATIONS);
    this.set('users', mock.USERS);
    this.set('tenants', Object.values(mock.TENANTS));
    window.dispatchEvent(new Event('nexus_storage_updated'));
  }

  // Reset to clean real-time empty slate
  resetData(): void {
    localStorage.clear();
    window.dispatchEvent(new Event('nexus_storage_updated'));
  }
}

export const storageService = new StorageService();
