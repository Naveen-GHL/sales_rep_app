import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SYSTEM_ROLES, FEATURES } from '../src/config/constants';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial database data...');

  // 1. Seed Roles
  for (const [code, role] of Object.entries(SYSTEM_ROLES)) {
    await prisma.role.upsert({
      where: { code },
      update: {
        name: role.name,
        permissions: JSON.stringify(role.permissions),
      },
      create: {
        code,
        name: role.name,
        permissions: JSON.stringify(role.permissions),
      },
    });
  }
  console.log('Roles seeded successfully.');

  // 2. Seed Tenants
  const ghlFeatures = [
    FEATURES.LEADS,
    FEATURES.CUSTOMERS,
    FEATURES.DEALS,
    FEATURES.FOLLOWUPS,
    FEATURES.CALLS,
    FEATURES.CALL_RECORDING,
    FEATURES.CALL_TRANSCRIPTION,
    FEATURES.INVESTORS,
    FEATURES.CONSULTATIONS,
    FEATURES.INVESTMENT_OPPORTUNITIES,
    FEATURES.REPORTS,
    FEATURES.USERS,
    FEATURES.ROLES,
    FEATURES.COMPANY_SETTINGS,
    FEATURES.AUDIT_LOGS,
  ];

  const jaminFeatures = [
    FEATURES.LEADS,
    FEATURES.CUSTOMERS,
    FEATURES.DEALS,
    FEATURES.FOLLOWUPS,
    FEATURES.CALLS,
    FEATURES.CALL_RECORDING,
    FEATURES.CALL_TRANSCRIPTION,
    FEATURES.PROPERTIES,
    FEATURES.SITE_VISITS,
    FEATURES.BOOKINGS,
    FEATURES.REPORTS,
    FEATURES.USERS,
    FEATURES.ROLES,
    FEATURES.COMPANY_SETTINGS,
    FEATURES.AUDIT_LOGS,
  ];

  const ghlTenant = await prisma.tenant.upsert({
    where: { slug: 'ghl' },
    update: {
      name: 'GHL India Ventures',
      brandColor: '#0284c7',
      tagline: 'Institutional Wealth & Real Estate Investment Advisory',
      enabledFeatures: JSON.stringify(ghlFeatures),
      timezone: 'Asia/Kolkata (IST)',
      currency: '₹ INR',
      businessHours: '09:30 AM - 07:00 PM IST',
      isActive: true,
    },
    create: {
      name: 'GHL India Ventures',
      slug: 'ghl',
      brandColor: '#0284c7',
      tagline: 'Institutional Wealth & Real Estate Investment Advisory',
      enabledFeatures: JSON.stringify(ghlFeatures),
      timezone: 'Asia/Kolkata (IST)',
      currency: '₹ INR',
      businessHours: '09:30 AM - 07:00 PM IST',
      isActive: true,
    },
  });

  const jaminTenant = await prisma.tenant.upsert({
    where: { slug: 'jamin' },
    update: {
      name: 'Jamin Bazaar',
      brandColor: '#059669',
      tagline: 'Premium Plotted Enclaves & Farmland Communities',
      enabledFeatures: JSON.stringify(jaminFeatures),
      timezone: 'Asia/Kolkata (IST)',
      currency: '₹ INR',
      businessHours: '09:00 AM - 06:30 PM IST',
      isActive: true,
    },
    create: {
      name: 'Jamin Bazaar',
      slug: 'jamin',
      brandColor: '#059669',
      tagline: 'Premium Plotted Enclaves & Farmland Communities',
      enabledFeatures: JSON.stringify(jaminFeatures),
      timezone: 'Asia/Kolkata (IST)',
      currency: '₹ INR',
      businessHours: '09:00 AM - 06:30 PM IST',
      isActive: true,
    },
  });
  console.log('Tenants seeded successfully.');

  // 3. Seed Default Users
  const defaultPasswordHash = await bcrypt.hash('Admin@123', 10);

  const usersToSeed = [
    {
      name: 'Super Admin',
      email: 'admin@nexus.com',
      phone: '+91 98888 00000',
      passwordHash: defaultPasswordHash,
      roleCode: 'super_admin',
      companyId: null,
      companySlug: null,
      companyName: null,
      status: 'Active',
    },
    {
      name: 'GHL Admin',
      email: 'admin@ghlindia.com',
      phone: '+91 98888 11111',
      passwordHash: defaultPasswordHash,
      roleCode: 'company_admin',
      companyId: ghlTenant.id,
      companySlug: 'ghl',
      companyName: 'GHL India Ventures',
      status: 'Active',
    },
    {
      name: 'Jamin Admin',
      email: 'admin@jaminbazaar.com',
      phone: '+91 98888 22222',
      passwordHash: defaultPasswordHash,
      roleCode: 'company_admin',
      companyId: jaminTenant.id,
      companySlug: 'jamin',
      companyName: 'Jamin Bazaar',
      status: 'Active',
    },
    {
      name: 'GHL Manager',
      email: 'manager@ghlindia.com',
      phone: '+91 98888 33333',
      passwordHash: defaultPasswordHash,
      roleCode: 'sales_manager',
      companyId: ghlTenant.id,
      companySlug: 'ghl',
      companyName: 'GHL India Ventures',
      status: 'Active',
    },
    {
      name: 'Jamin Manager',
      email: 'manager@jaminbazaar.com',
      phone: '+91 98888 44444',
      passwordHash: defaultPasswordHash,
      roleCode: 'sales_manager',
      companyId: jaminTenant.id,
      companySlug: 'jamin',
      companyName: 'Jamin Bazaar',
      status: 'Active',
    },
    {
      name: 'GHL Sales Rep',
      email: 'rep@ghlindia.com',
      phone: '+91 98888 55555',
      passwordHash: defaultPasswordHash,
      roleCode: 'sales_executive',
      companyId: ghlTenant.id,
      companySlug: 'ghl',
      companyName: 'GHL India Ventures',
      status: 'Active',
    },
    {
      name: 'Jamin Sales Rep',
      email: 'rep@jaminbazaar.com',
      phone: '+91 98888 66666',
      passwordHash: defaultPasswordHash,
      roleCode: 'sales_executive',
      companyId: jaminTenant.id,
      companySlug: 'jamin',
      companyName: 'Jamin Bazaar',
      status: 'Active',
    },
  ];

  for (const u of usersToSeed) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        phone: u.phone,
        passwordHash: u.passwordHash,
        roleCode: u.roleCode,
        companyId: u.companyId,
        companySlug: u.companySlug,
        companyName: u.companyName,
        status: u.status,
      },
      create: u,
    });
  }
  console.log('Default users seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
