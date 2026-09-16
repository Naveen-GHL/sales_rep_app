# Mock & Seed Data Directory

This directory contains reference datasets and seed schemas for the Multi-Tenant Real Estate Sales Platform.

## Purpose

1. **Backend Seeding (`seedData.ts`)**:
   - Contains seed records for Tenants (`GHL`, `Jamin`), Users, System Roles, Leads, Deals, Real Estate Projects, Plots, Site Visits, Bookings, Investors, and Call Records.
   - Use this file when setting up database seed scripts (e.g. Prisma `seed.ts`, TypeORM, Sequelize, or direct SQL inserts) in the `backend/` service.

2. **Frontend Isolation**:
   - The active frontend application runs with **clean empty states** by default.
   - All default lists (Leads, Calls, Follow-ups, Projects, Deals, etc.) resolve to `[]` when no records exist, ensuring that real-time API responses and WebSocket updates are directly reflected without hardcoded dummy items.
   - The decoupled mock datasets are placed in `frontend/src/mock_data/mockData.ts` and only dynamically imported if explicitly requested.
