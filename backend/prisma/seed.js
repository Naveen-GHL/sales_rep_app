"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const constants_1 = require("../src/config/constants");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding initial database data...');
    // 1. Seed Roles
    for (const [code, role] of Object.entries(constants_1.SYSTEM_ROLES)) {
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
        constants_1.FEATURES.LEADS,
        constants_1.FEATURES.CUSTOMERS,
        constants_1.FEATURES.DEALS,
        constants_1.FEATURES.FOLLOWUPS,
        constants_1.FEATURES.CALLS,
        constants_1.FEATURES.CALL_RECORDING,
        constants_1.FEATURES.CALL_TRANSCRIPTION,
        constants_1.FEATURES.INVESTORS,
        constants_1.FEATURES.CONSULTATIONS,
        constants_1.FEATURES.INVESTMENT_OPPORTUNITIES,
        constants_1.FEATURES.REPORTS,
        constants_1.FEATURES.USERS,
        constants_1.FEATURES.ROLES,
        constants_1.FEATURES.COMPANY_SETTINGS,
        constants_1.FEATURES.AUDIT_LOGS,
    ];
    const jaminFeatures = [
        constants_1.FEATURES.LEADS,
        constants_1.FEATURES.CUSTOMERS,
        constants_1.FEATURES.DEALS,
        constants_1.FEATURES.FOLLOWUPS,
        constants_1.FEATURES.CALLS,
        constants_1.FEATURES.CALL_RECORDING,
        constants_1.FEATURES.CALL_TRANSCRIPTION,
        constants_1.FEATURES.PROPERTIES,
        constants_1.FEATURES.SITE_VISITS,
        constants_1.FEATURES.BOOKINGS,
        constants_1.FEATURES.REPORTS,
        constants_1.FEATURES.USERS,
        constants_1.FEATURES.ROLES,
        constants_1.FEATURES.COMPANY_SETTINGS,
        constants_1.FEATURES.AUDIT_LOGS,
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
    const defaultPasswordHash = await bcryptjs_1.default.hash('Admin@123', 10);
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
//# sourceMappingURL=seed.js.map