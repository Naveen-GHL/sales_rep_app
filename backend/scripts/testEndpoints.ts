import { app } from '../src/app';
import http from 'http';

async function runTests() {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5099, resolve));
  const baseUrl = 'http://127.0.0.1:5099/api';

  console.log('--- STARTING BACKEND INTEGRATION TESTS ---');

  // 1. Health check
  const healthRes = await fetch(`${baseUrl}/health`);
  const healthData = await healthRes.json();
  console.log('1. Health check:', healthData.status === 'ok' ? 'PASS' : 'FAIL');

  // 2. GHL Admin Login
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@ghlindia.com', password: 'Admin@123' }),
  });
  const ghlAuth = await loginRes.json();
  console.log('2. GHL Admin Login:', loginRes.status === 200 && ghlAuth.token ? 'PASS' : 'FAIL');
  const ghlToken = ghlAuth.token;

  // 3. GET /api/leads
  const leadsRes = await fetch(`${baseUrl}/leads`, {
    headers: { Authorization: `Bearer ${ghlToken}` },
  });
  const leadsData = await leadsRes.json();
  console.log('3. GET /api/leads returns array:', Array.isArray(leadsData) ? 'PASS' : 'FAIL');

  // 4. POST /api/leads
  const createLeadRes = await fetch(`${baseUrl}/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ghlToken}`,
    },
    body: JSON.stringify({
      name: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      email: 'rajesh@example.com',
      location: 'Bangalore',
      source: 'Website Enquiry',
      priority: 'High',
      status: 'Qualified',
    }),
  });
  const newLead = await createLeadRes.json();
  console.log('4. Create Lead:', createLeadRes.status === 201 && newLead.name === 'Rajesh Kumar' ? 'PASS' : 'FAIL');

  // 5. Convert Lead
  const convertRes = await fetch(`${baseUrl}/leads/${newLead.id}/convert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ghlToken}`,
    },
    body: JSON.stringify({
      createDeal: {
        title: 'Rajesh Kumar - Commercial Plot Investment',
        value: 7500000,
        stage: 'Proposal',
      },
    }),
  });
  const convertData = await convertRes.json();
  console.log('5. Convert Lead to Customer & Deal:', convertRes.status === 200 && convertData.customer.name === 'Rajesh Kumar' && convertData.deal.value === 7500000 ? 'PASS' : 'FAIL');

  // 6. Log Call with Disposition
  const callRes = await fetch(`${baseUrl}/calls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ghlToken}`,
    },
    body: JSON.stringify({
      contactName: 'Rajesh Kumar',
      contactPhone: '+91 98765 43210',
      direction: 'outbound',
      duration: 180,
      disposition: 'Interested',
      notes: 'Client reviewed commercial portfolio',
    }),
  });
  const callData = await callRes.json();
  console.log('6. Log Call with disposition:', callRes.status === 201 && callData.disposition === 'Interested' ? 'PASS' : 'FAIL');

  // 7. Jamin Admin Login & Tenant Isolation
  const jaminLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@jaminbazaar.com', password: 'Admin@123' }),
  });
  const jaminAuth = await jaminLoginRes.json();
  const jaminToken = jaminAuth.token;

  // Jamin fetching leads: should NOT see GHL's Rajesh Kumar!
  const jaminLeadsRes = await fetch(`${baseUrl}/leads`, {
    headers: { Authorization: `Bearer ${jaminToken}` },
  });
  const jaminLeads = await jaminLeadsRes.json();
  const canSeeGhlLead = jaminLeads.some((l: any) => l.name === 'Rajesh Kumar');
  console.log('7. Tenant Isolation (Jamin cannot see GHL leads):', !canSeeGhlLead ? 'PASS' : 'FAIL');

  // 8. Jamin Project & Plot lifecycle
  const createProjRes = await fetch(`${baseUrl}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jaminToken}`,
    },
    body: JSON.stringify({
      name: 'Emerald Hills Phase 1',
      location: 'Kanakapura Road, Bangalore',
      description: 'Luxury villa plots',
    }),
  });
  const proj = await createProjRes.json();

  const createPlotRes = await fetch(`${baseUrl}/plots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jaminToken}`,
    },
    body: JSON.stringify({
      projectId: proj.id,
      projectName: proj.name,
      plotNumber: 'EH-42',
      sizeSqft: 2400,
      pricePerSqft: 3500,
    }),
  });
  const plot = await createPlotRes.json();

  // Create booking
  const bookingRes = await fetch(`${baseUrl}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jaminToken}`,
    },
    body: JSON.stringify({
      customerId: 'cust-temp-01',
      customerName: 'Ananya Sharma',
      customerPhone: '+91 99887 76655',
      projectId: proj.id,
      plotId: plot.id,
      plotNumber: plot.plotNumber,
      bookingAmount: 100000,
      totalAmount: 8400000,
    }),
  });
  const booking = await bookingRes.json();

  // Confirm booking -> should mark plot 'Sold'
  const confirmRes = await fetch(`${baseUrl}/bookings/${booking.id}/confirm`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jaminToken}`,
    },
  });
  const confirmData = await confirmRes.json();

  // Check plot status
  const plotCheckRes = await fetch(`${baseUrl}/plots/${plot.id}`, {
    headers: { Authorization: `Bearer ${jaminToken}` },
  });
  const updatedPlot = await plotCheckRes.json();
  console.log('8. Booking Confirmation marks Plot Sold:', confirmData.status === 'Confirmed' && updatedPlot.status === 'Sold' ? 'PASS' : 'FAIL');

  // 9. Super Admin Companies listing
  const superLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@nexus.com', password: 'Admin@123' }),
  });
  const superAuth = await superLoginRes.json();
  const superToken = superAuth.token;

  const companiesRes = await fetch(`${baseUrl}/companies`, {
    headers: { Authorization: `Bearer ${superToken}` },
  });
  const companies = await companiesRes.json();
  console.log('9. Super Admin cross-tenant companies listing:', Array.isArray(companies) && companies.length >= 2 ? 'PASS' : 'FAIL');

  console.log('--- ALL INTEGRATION TESTS COMPLETED ---');

  server.close();
  process.exit(0);
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
