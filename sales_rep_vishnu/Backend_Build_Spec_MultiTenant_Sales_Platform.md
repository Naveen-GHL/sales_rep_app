# Multi-Tenant Sales & Calling Platform — Backend Build Specification

**Status:** Frontend (React 19 + TypeScript + Vite) is built and running on mock/localStorage data. This document defines everything needed to build the real backend that the existing frontend will plug into, with zero frontend contract changes.
**Audience:** Antigravity (AI coding agent) and the backend engineer on the team.
**Grounding:** Every entity, enum, permission key, feature key, and role in this document is copied directly from the already-built frontend (`types/index.ts`, `constants/permissions.ts`, `constants/features.ts`, `constants/roles.ts`, `constants/pipelineStages.ts`, `constants/defaultTenants.ts`, `services/apiClient.ts`). This is not a re-derivation — it is the frontend's actual contract, written down so the backend matches it exactly instead of drifting from it.

---

# PART A — Business Requirements Document (BRD)

## A.1 Business Background

Two initial companies need a shared sales-and-calling system instead of two separate applications:

- **GHL India Ventures** — institutional wealth & real estate investment advisory. Sells to investors through enquiry → consultation → investment opportunity workflows.
- **Jamin Bazaar** — premium plotted enclaves & farmland communities. Sells to buyers through enquiry → site visit → plot booking workflows.

Both run the same core sales/calling engine (leads, customers, deals, follow-ups, calling) but need their own specialized modules. The business case for one platform instead of two: shared engineering cost, faster onboarding of a third/fourth future tenant, and centralized reporting for the operating team.

## A.2 Stakeholders

| Stakeholder | Interest |
|---|---|
| Platform Owner / Super Admin (operations team) | Onboard companies, control feature packages, monitor platform health, audit everything |
| Company Admin (per tenant) | Run their own company's users, settings, and see everything their team does |
| Sales Manager | Run their team's pipeline, calls, and performance |
| Sales Executive | Work assigned leads/customers/calls/follow-ups day to day |
| Development team (3-person) | Vishnu (frontend, delivered), 1 backend engineer, 1 additional member — needs a backend that matches the frontend contract exactly so no rework is needed on either side |

## A.3 Business Objectives & Success Metrics

- Single codebase serving N tenants, each fully data-isolated. *Success metric: onboarding a 3rd tenant requires zero new code, only configuration.*
- Reduce agent response time to leads. *Success metric: time from lead creation to first contact, visible in Reports.*
- Increase conversion visibility. *Success metric: conversion rate reportable per agent, per source, per tenant.*
- Reliable calling with full history. *Success metric: 100% of calls logged with disposition; recordings retrievable when enabled.*

## A.4 Scope

**In scope (V1 / MVP):** Auth, Companies/Tenants, Users, Roles/Permissions, Features, Leads, Customers, Deals/Pipeline, Follow-ups, Calling (Call Center + Call History + routing), Reports, Notifications, Documents (as embedded attachments), Audit Logs, Jamin-specific (Properties/Projects, Plots, Site Visits, Bookings), GHL-specific (Investors, Consultations, Investment Opportunities), Import/Export for Leads.

**Out of scope (future, per the original blueprint and frontend's own placeholders):** WhatsApp/SMS/Email/Facebook/Instagram messaging channels, AI lead scoring/call summary/recommendations/forecasting, live telephony provider integration (V1 can stub call initiation and focus on logging/routing data model — confirm with team whether a real Twilio/Exotel/Plivo integration is in V1 or a later phase before Antigravity builds it).

## A.5 Assumptions & Constraints

- One user belongs to exactly one company (tenant) except Super Admin, who sits above all tenants. No multi-tenant user membership in V1.
- Shared database with tenant-scoped rows (every business table carries a `companyId`), not separate schemas per tenant — matches the frontend's `companyId` field present on nearly every entity.
- The frontend already assumes a Bearer-token auth scheme and a `/api` base path (see `apiClient.ts`) — the backend must serve exactly that, not a different auth scheme, or the frontend will need rework.
- Frontend enums (statuses, dispositions, stages) are treated as fixed for V1 — the backend should validate against these exact string sets rather than an open-ended value.

---

# PART B — Product Requirements Document (PRD)

## B.1 Product Overview

One multi-tenant web application. A user logs in, lands in either the **Super Admin console** (platform operator) or their **company workspace** (Company Admin / Sales Manager / Sales Executive), scoped entirely to their tenant's data and enabled features.

## B.2 Personas

| Persona | Tenant scope | Typical goals |
|---|---|---|
| Super Admin | All tenants | Onboard companies, assign feature packages, manage platform-wide users/roles, configure call routing, review audit logs |
| Company Admin | One tenant | Manage own company's users, settings, view all data, run reports |
| Sales Manager | One tenant | Manage team pipeline, reassign leads, view team performance |
| Sales Executive | One tenant | Work own assigned leads/customers/calls/follow-ups |

## B.3 Feature List (canonical — from `constants/features.ts`)

| Feature key | Module | GHL | Jamin |
|---|---|---|---|
| `leads` | Leads | ✅ | ✅ |
| `customers` | Customers | ✅ | ✅ |
| `deals` | Deals / Pipeline | ✅ | ✅ |
| `followups` | Follow-ups | ✅ | ✅ |
| `calls` | Calling | ✅ | ✅ |
| `call-recording` | Call recording | ✅ | ✅ |
| `call-transcription` | Call transcription | ✅ | ✅ |
| `properties` | Properties/Projects | — | ✅ |
| `site-visits` | Site Visits | — | ✅ |
| `bookings` | Bookings | — | ✅ |
| `investors` | Investors | ✅ | — |
| `consultations` | Consultations | ✅ | — |
| `investment-opportunities` | Investment Opportunities | ✅ | — |
| `reports` | Reports | ✅ | ✅ |
| `users` | User management | ✅ | ✅ |
| `roles` | Role viewing | ✅ | ✅ |
| `company-settings` | Company settings | ✅ | ✅ |
| `audit-logs` | Audit logs | ✅ | ✅ |

This table (feature key × tenant) is exactly the `enabledFeatures` array the frontend expects back from the backend per tenant — the backend's Feature/Company model must be able to reproduce it, not just hardcode it, since Super Admin can change a company's package.

## B.4 Roles & Permissions Matrix (canonical — from `constants/roles.ts` / `permissions.ts`)

Permission keys, by module:

```
Leads:          leads.view, leads.create, leads.update, leads.delete, leads.assign, leads.export, leads.import, leads.convert
Customers:      customers.view, customers.create, customers.update, customers.delete
Deals:          deals.view, deals.create, deals.update, deals.delete
Calls:          calls.make, calls.receive, calls.view, calls.recordings.play
Follow-ups:     followups.view, followups.create, followups.update
Properties:     properties.view, properties.update
Site Visits:    site_visits.view, site_visits.create
Bookings:       bookings.view, bookings.create
Investors:      investors.view, investors.create
Consultations:  consultations.view, consultations.create
Opportunities:  opportunities.view, opportunities.create
Reports:        reports.view, reports.export
Admin/Settings: users.view, users.manage, roles.view, roles.manage, settings.view, settings.update, audit.view
Platform:       platform.companies.manage, platform.packages.manage, platform.call_config.manage
```

Role → permission grants (exact, from the frontend's `SYSTEM_ROLES`):

| Role | Grants |
|---|---|
| **super_admin** | Every permission listed above (full set) |
| **company_admin** | All Leads, Customers, Deals perms; Calls (make/receive/view/recordings.play); Follow-ups (view/create/update); Properties/Site Visits/Bookings (view/update/create per above); Investors/Consultations/Opportunities (view/create); Reports (view/export); Users (view/manage); Roles (view only); Settings (view/update); Audit (view). **No** platform.* permissions. |
| **sales_manager** | Leads (view/create/update/assign/export/convert — **no delete**); Customers (view/create/update — no delete); Deals (view/create/update — no delete); Calls (full); Follow-ups (full); Properties/Site Visits/Bookings (same as company_admin); Investors/Consultations/Opportunities (view/create); Reports (view/export); Users (view only). |
| **sales_executive** | Leads (view/create/update/convert — no delete/assign/export/import); Customers (view/create/update — no delete); Deals (view/create/update — no delete); Calls (make/receive/view — **no** recordings.play); Follow-ups (full); Properties (view only, no update); Site Visits/Bookings (view/create); Investors/Consultations/Opportunities (view/create); Reports (**view only**, no export). |

This matrix must be seed data (or enforced server-side logic), not something the backend reinvents — the frontend already renders/hides UI based on exactly this table, so a mismatch breaks the UI silently.

## B.5 Tenant Configuration (from `constants/defaultTenants.ts`)

| Field | GHL India Ventures | Jamin Bazaar |
|---|---|---|
| slug | `ghl` | `jamin` |
| brandColor | `#0284c7` | `#059669` |
| tagline | "Institutional Wealth & Real Estate Investment Advisory" | "Premium Plotted Enclaves & Farmland Communities" |
| timezone | Asia/Kolkata (IST) | Asia/Kolkata (IST) |
| currency | ₹ INR | ₹ INR |
| businessHours | 09:30 AM–07:00 PM IST | 09:00 AM–06:30 PM IST |

Company/Tenant must be a real editable entity (Super Admin's Companies module edits these fields) — not hardcoded constants in the backend, even though the frontend currently ships them as fallback defaults.

## B.6 Non-Goals for V1

Messaging channel integrations (WhatsApp/SMS/Email/social), AI features, and (pending team confirmation) live telephony provider wiring are explicitly deferred — build the data model to accommodate them later (e.g. a `channel` field, an `aiScore` nullable column) without building the feature itself now.

---

# PART C — Software Requirements Specification (SRS)

## C.1 Functional Requirements by Module

Each module below states what the backend must support, matching the page that already exists in the frontend.

**Auth** — Login (email+password → JWT access token + user + tenant), session validation, logout, 401 on expired/invalid token must be returned so the frontend's existing interceptor (which clears storage and redirects) works unmodified.

**Companies (Super Admin)** — CRUD, feature-package assignment, activate/deactivate, list users per company.

**Users** — CRUD scoped to company (or platform-wide for Super Admin), invite flow (status: Invited → Active), disable/enable, role assignment, password reset trigger.

**Roles & Permissions** — Serve the canonical role→permission map (Section B.4) for the frontend to render `RequirePermission`/`Guards`; platform-level editing restricted to Super Admin; company-level view is read-only in V1.

**Leads** — CRUD, filter/search (status, priority, source, assigned agent, date range), assign/reassign, convert (to Customer, optionally seeding a Deal/Site Visit/Consultation per tenant), CSV/Excel import with validation preview, export.

**Customers** — CRUD, 360 view aggregating linked calls/followups/deals/notes/documents, filter/search.

**Deals / Pipeline** — CRUD, stage transitions (validated against the tenant's configured stage list — default/ghl/jamin per Section C.3), Kanban-friendly list-by-stage endpoint, Won/Lost with reason.

**Follow-ups** — CRUD, status transitions (Pending/Completed/Cancelled), linked to lead/customer/investor (`contactType`), due/overdue computation.

**Calling (Call Center + Call History)** — Agent availability state, call record CRUD (logged after each call with disposition), recording URL storage (if `call-recording` enabled), transcription storage (if `call-transcription` enabled), tenant-isolated call routing/queue data.

**Properties/Projects, Plots (Jamin)** — Project CRUD with computed plot counts (total/available/hold/sold), Plot CRUD with status transitions (Available→Hold→Sold, with hold expiry and hold-by tracking).

**Site Visits (Jamin)** — CRUD, status transitions including outcome notes.

**Bookings (Jamin)** — CRUD; creating/confirming a booking must transition the linked Plot to Sold and should be able to mark a linked Deal Won.

**Investors, Consultations, Investment Opportunities (GHL)** — CRUD mirroring Customers/Site Visits/Deals patterns respectively, with GHL-specific fields (investment capacity, preferred asset class, target/committed amount).

**Reports** — Aggregation endpoints per report type (lead, call, follow-up, conversion, agent performance, lead-source, sales/deal, plus tenant-specific project/site-visit/booking and investor/consultation/opportunity reports), with date-range and common filters, and CSV/Excel export.

**Notifications** — Per-user notification feed, read/unread state, generated server-side on relevant events (new lead assigned, missed call, follow-up due/overdue, site visit scheduled/rescheduled, booking update, conversion, admin changes).

**Documents** — Upload/list/delete attached to a parent entity (lead/customer/deal/project/investor/etc.), category tagging, permission-gated access, secure storage (not publicly world-readable URLs).

**Audit Logs** — Append-only log of privileged actions (login/logout, create/update/delete on business entities, assignment changes, role/permission/feature/company-setting changes), queryable by actor/action/entity/date/tenant (tenant filter Super-Admin-only).

**Import/Export** — Job record (type, initiated-by, status, result summary, downloadable report) for bulk operations, starting with Leads import.

## C.2 Non-Functional Requirements

| Category | Requirement |
|---|---|
| Multi-tenancy | Every tenant-owned table carries `company_id`; every query path must filter by the authenticated user's company — enforced in a shared data-access layer/middleware, never left to individual controllers to remember |
| Security | Bearer JWT (access + refresh), password hashing (bcrypt/argon2), rate limiting on auth endpoints, input validation/sanitization on all writes, least-privilege permission checks on every protected route, secure document storage with signed/expiring URLs if using object storage |
| Authorization boundary | Frontend feature/permission checks are UX only — the backend must independently re-check tenant + feature-enabled + permission on every request per the blueprint's core principle: `Access = Tenant Access + Feature Enabled + Role Permission` |
| Performance | List endpoints must support pagination, sorting, and server-side filtering (frontend's `DataTable` pattern expects this, not "fetch everything and filter client-side") |
| Availability | Standard web-app SLA; no special HA requirement identified yet for V1 |
| Auditability | All privileged writes produce an audit-log entry (Section C.1) |
| Compliance | Call recording requires consent-handling review before production telephony is wired up (flagged, not solved, in V1) |
| Consistency with frontend | Response field names/casing must match the TypeScript interfaces in Section C.3 exactly (camelCase, same field names) — this is what lets the existing frontend consume the API with zero changes |

## C.3 Data Requirements — Canonical Entities

These are copied verbatim (field-for-field) from the frontend's `types/index.ts`. The backend's API responses for each resource must serialize to exactly this shape. Fields not listed here should not be invented; fields listed here should not be renamed.

```ts
Tenant { id, name, slug: 'ghl'|'jamin', brandColor, logo?, tagline, enabledFeatures: string[], timezone, currency, businessHours }

Role { id, name, code: 'super_admin'|'company_admin'|'sales_manager'|'sales_executive', permissions: string[] }

User { id, name, email, phone, role: Role, companyId?, companySlug?, companyName?, status: 'Active'|'Invited'|'Disabled', lastLogin?, avatar? }

Lead { id, companyId, name, phone, email, location, source, status: 'New'|'Contacted'|'Qualified'|'Proposal'|'Negotiation'|'Converted'|'Lost', priority: 'Low'|'Medium'|'High'|'Urgent', assignedAgentId, assignedAgentName, nextFollowupDate?, createdAt, notes, customFields: Record<string,any> }

Customer { id, companyId, name, phone, email, status: 'Active'|'VIP'|'Inactive', assignedAgentId, assignedAgentName, location, lastContacted, openDealsCount, totalValue, createdAt, notes, customFields: Record<string,any> }

Deal { id, companyId, title, customerId, customerName, stage: string, value, expectedCloseDate, assignedAgentId, assignedAgentName, notes, lostReason?, createdAt }

CallRecord { id, companyId, contactName, contactPhone, direction: 'inbound'|'outbound', duration: number(seconds), agentId, agentName, disposition: CallDisposition, timestamp, recordingUrl?, transcription?, notes? }
CallDisposition = 'Interested'|'Not Interested'|'Follow-up Required'|'Call Back'|'Wrong Number'|'Converted'|'No Response'

Followup { id, companyId, contactId, contactName, contactPhone, contactType: 'lead'|'customer'|'investor', scheduledAt, priority: 'Low'|'Medium'|'High', status: 'Pending'|'Completed'|'Cancelled', notes, assignedAgentId, assignedAgentName }

PropertyProject { id, name, location, status: 'Upcoming'|'Active'|'Sold Out', totalPlots, availablePlots, holdPlots, soldPlots, description, priceRange }

Plot { id, projectId, projectName, plotNumber, sizeSqft, pricePerSqft, totalPrice, status: 'Available'|'Hold'|'Sold', dimension?, facing?, holdByCustomer?, holdByAgent?, holdExpiry? }

SiteVisit { id, companyId, customerId, customerName, customerPhone, projectId, projectName, plotNumber?, scheduledAt, assignedAgentId, assignedAgentName, status: 'Scheduled'|'Completed'|'Rescheduled'|'Cancelled'|'No-show', outcomeNotes? }

Booking { id, companyId, customerId, customerName, customerPhone, projectId, projectName, plotId, plotNumber, bookingDate, bookingAmount, totalAmount, status: 'Pending'|'Confirmed'|'Cancelled', agentId, agentName, paymentTerms }

Investor { id, companyId, name, phone, email, status: 'Lead'|'Active Investor'|'HNW Investor'|'Inactive', investmentCapacity, preferredAssetClass, assignedAgentId, assignedAgentName, referralSource?, createdAt, notes }

Consultation { id, companyId, investorId, investorName, investorPhone, scheduledAt, consultantId, consultantName, status: 'Scheduled'|'Completed'|'Rescheduled'|'Cancelled'|'No-show', agenda, outcomeNotes? }

InvestmentOpportunity { id, companyId, title, investorId, investorName, stage: 'Enquiry'|'Contacted'|'Consultation'|'Qualified'|'Opportunity'|'Committed'|'Closed Won'|'Closed Lost', targetAmount, committedAmount, assignedAgentId, assignedAgentName, expectedCloseDate, notes }

AuditLog { id, timestamp, actorName, actorEmail, action, entityType, entityId, companyId?, companyName?, details }

NotificationItem { id, type: 'lead'|'call'|'followup'|'visit'|'booking'|'system', title, message, timestamp, read, link? }

DocumentItem { id, name, size, type, uploadedBy, uploadedAt, category }
```

**Pipeline stages** (must be served as tenant-configurable lists, not hardcoded per deal — default/ghl/jamin sets from `constants/pipelineStages.ts`):
- default: New → Qualified → Proposal → Negotiation → Won / Lost
- ghl: Enquiry → Contacted → Consultation → Qualified Investor → Investment Opportunity → Converted
- jamin: Enquiry → Contacted → Interested → Site Visit → Plot Selected → Booking → Converted

---

# PART D — System Architecture

## D.1 High-Level Architecture

```
                        CLIENT (existing React/TS/Vite frontend)
                                    |
                          Bearer JWT over HTTPS, base path /api
                                    |
                        API GATEWAY / APP SERVER
                                    |
        Auth Middleware -> Tenant Resolution -> Feature Entitlement Check -> Permission Check
                                    |
                          Module Controllers/Services
    (auth, companies, users, roles, features, leads, customers, deals, followups,
     calls, reports, notifications, documents, audit, projects, plots, siteVisits,
     bookings, investors, consultations, opportunities, importExport)
                                    |
                          Repository / Data Access Layer (tenant-aware)
                                    |
                                Database
                                    |
                  (Future) Telephony Provider Webhooks/Integration
```

This mirrors the original blueprint's request flow exactly: **Frontend → API Client → Auth Middleware → Tenant Resolution → Feature Entitlement Check → Permission Check → Controller → Service → Repository → Database → Response.**

## D.2 Recommended Tech Stack

Given the frontend is Node-ecosystem (Vite/TS), the natural pairing is a **Node.js + TypeScript** backend (e.g. Express or NestJS — NestJS's module system maps cleanly onto the "one module per domain" structure the blueprint already recommends) with **PostgreSQL** as the primary database (matches the blueprint's `company_id`-scoped relational model well) and an ORM with strong TypeScript support (e.g. Prisma or TypeORM) so the entity types can be shared/mirrored against the frontend's `types/index.ts` instead of drifting. Confirm this stack choice with the team before Antigravity scaffolds it — it's a recommendation consistent with the existing frontend, not a hard requirement from the blueprint.

## D.3 Multi-Tenancy Strategy

Shared database, tenant-scoped rows: every business table has `company_id`. A tenant-resolution middleware derives `company_id` from the authenticated JWT (never from a client-supplied field) and every repository method requires it as a mandatory filter — structurally, not just by convention (e.g. a base repository class that always injects the `WHERE company_id = ?` clause). Super Admin requests bypass this filter deliberately (platform-wide queries) via a distinct, explicitly-checked code path — never by a client being able to omit or spoof the tenant.

## D.4 AuthN/AuthZ Flow

1. `POST /api/auth/login` — validate credentials → issue access token (JWT, short-lived) + refresh token → return `{ user, tenant, token }`.
2. Frontend stores token as `nexus_auth_token` in localStorage (already implemented) and sends `Authorization: Bearer <token>` on every request (already implemented in `apiClient.ts`).
3. Backend middleware: verify JWT → resolve `userId`, `companyId`, `roleCode` from token claims (never trust a client-sent `companyId`) → attach to request context.
4. Feature check middleware: given the resolved tenant, confirm the requested module's feature key is in that tenant's `enabledFeatures` → 403 if not.
5. Permission check middleware/decorator: confirm the resolved role's permission set includes the required key for this route → 403 if not.
6. On any 401 (expired/invalid token), return HTTP 401 with a JSON error body — the frontend's `apiClient.handleResponse` already clears local storage and dispatches `nexus_auth_unauthorized` on exactly this status code, so **do not** use a different status for auth failures.

## D.5 Module/Service Breakdown

One backend module per domain (matches the blueprint's recommended backend structure and the frontend's page structure 1:1): `auth`, `companies`, `users`, `roles`, `permissions`, `features`, `leads`, `customers`, `deals`, `followups`, `calls`, `reports`, `notifications`, `documents`, `auditLogs`, `projects`, `plots`, `siteVisits`, `bookings`, `investors`, `consultations`, `opportunities`, `importExport`. Each owns its controller/service/repository/validation, and each protected route composes the three middleware layers from D.4.

## D.6 Database Schema Outline

Core tables mirror Section C.3's entities almost directly (one table per entity, `company_id` foreign key on every tenant-owned table). Notable relational points:
- `plots.project_id → projects.id`; `bookings.plot_id → plots.id`, `bookings.customer_id → customers.id`; confirming a booking should be a transaction that also updates `plots.status`.
- `deals.customer_id → customers.id`; `deals.stage` should validate against the tenant's configured stage list (a `pipeline_stages` table keyed by `company_id` or tenant type, seeded from Section C.3's three stage sets).
- `followups.contact_id` is polymorphic (`contact_type`: lead/customer/investor) — model as a nullable FK per type or a single polymorphic reference table, whichever the ORM handles more safely; avoid a bare untyped ID with no referential integrity.
- `roles` and `role_permissions` as the seed data from Section B.4 — company-level role editing is out of scope for V1 per Section C.1, so this can start as fixed seed data rather than a fully dynamic RBAC editor.
- `audit_logs` is append-only (no update/delete route should ever be exposed for it).

## D.7 Calling / Telephony Architecture

V1 must support the **data model and routing logic** (agent availability, tenant-isolated queues, call record CRUD with disposition, recording/transcription storage) regardless of whether a real telephony provider (Twilio/Exotel/Plivo) is wired up in this phase. **Confirm with the team before building:** is V1 expected to place/receive real phone calls, or just log call activity that a human enters manually (click-to-call opens the device dialer, agent logs the outcome after)? This materially changes scope and should be frozen before Antigravity starts on the Calls module.

## D.8 Environments & Deployment

Standard three-environment setup (dev/staging/production) with environment-variable-based secrets (DB credentials, JWT signing secret, storage credentials) — no hardcoded config, matching the blueprint's security requirements.

---

# PART E — User Stories

Organized by module. Each includes acceptance criteria. Role scoping matches Section B.4.

### Leads
- **As a Sales Executive**, I want to see only leads assigned to me by default, so I can focus on my own workload.
  - AC: list endpoint defaults to `assignedAgentId = current user` unless a "team/all" filter is applied and the role permits it.
- **As a Sales Manager**, I want to reassign a lead to another agent, so I can balance team workload.
  - AC: requires `leads.assign`; reassignment writes an audit log entry and triggers a "new lead assigned" notification to the new agent.
- **As a Company Admin**, I want to import a CSV of leads with a preview before committing, so I can catch errors before they pollute the database.
  - AC: upload → column-mapping → validation preview (flags duplicates/invalid rows) → confirm → import job record with success/error counts and a downloadable error report.
- **As a Sales Executive**, I want to convert a qualified lead into a Customer (and optionally a Deal/Site Visit/Consultation), so I don't have to re-enter their details.
  - AC: conversion is transactional — Customer is created from Lead fields, Lead status becomes `Converted`, and any optional linked record (Deal for shared flow, Site Visit for Jamin, Consultation for GHL) is created in one atomic operation.

### Customers
- **As a Sales Executive**, I want a single 360° view of a customer showing their calls, follow-ups, deals and documents, so I have full context before contacting them.
  - AC: customer detail endpoint aggregates (or the frontend composes from) linked calls/followups/deals/documents filtered to that `customerId` and the caller's tenant.

### Deals / Pipeline
- **As a Sales Manager**, I want to see all open deals grouped by stage, so I can spot where deals are stuck.
  - AC: endpoint returns deals grouped/filterable by `stage`; stage values are validated against the tenant's configured stage set (Section C.3).
- **As a Sales Executive**, I want to move a deal to a new stage, so the pipeline reflects reality.
  - AC: requires `deals.update`; stage transitions are logged; marking `Won`/`Lost` requires a reason when Lost.

### Follow-ups
- **As a Sales Executive**, I want to see my overdue follow-ups highlighted separately from upcoming ones, so nothing slips.
  - AC: list endpoint supports status/date-based filtering sufficient to derive Upcoming/Due Today/Overdue tabs without client-side guesswork (i.e. return `scheduledAt` reliably and let the frontend bucket it, or provide a `computedState` field — confirm which with the team).

### Calling
- **As a Sales Executive**, I want an incoming call to show me the matched contact's name and history before I answer, so I'm prepared.
  - AC: incoming call event includes caller phone number; backend resolves it against Leads/Customers/Investors in the agent's tenant and returns a match (or "Unknown") before/at ring time.
- **As a Sales Manager**, I want every completed call to require a disposition before the agent can move on, so no call goes unlogged.
  - AC: call record creation requires `disposition` as a required field; API rejects a call-completion request missing it.
- **As a Company Admin**, I want to play back a call recording only if I have permission, so sensitive recordings aren't exposed broadly.
  - AC: recording URL/stream endpoint checks `calls.recordings.play` permission independently of general `calls.view`.

### Properties / Plots / Site Visits / Bookings (Jamin)
- **As a Sales Executive**, I want to put a plot on Hold when a customer is interested, so it isn't sold to someone else while we finalize.
  - AC: Hold transition requires `holdByCustomer`, `holdByAgent`, and sets `holdExpiry`; plot cannot be Hold-transitioned if already Sold.
- **As a Sales Manager**, I want confirming a Booking to automatically mark the linked plot Sold, so inventory stays accurate without manual double-entry.
  - AC: booking confirmation is transactional with the plot status update; attempting to book an already-Sold plot is rejected.

### Investors / Consultations / Investment Opportunities (GHL)
- **As a Sales Executive**, I want to schedule a Consultation for an Investor and later record its outcome, so the investor's journey is tracked.
  - AC: Consultation CRUD mirrors Site Visit's status lifecycle; outcome notes are captured on completion and can seed an Investment Opportunity.

### Reports
- **As a Company Admin**, I want to export the Agent Performance report to Excel for a chosen date range, so I can review it outside the app.
  - AC: requires `reports.export`; export respects the same filters as the on-screen report.

### Platform / Super Admin
- **As a Super Admin**, I want to onboard a new company by selecting its feature package, so it goes live with only the modules it needs.
  - AC: creating a company writes its `enabledFeatures`; a default Company Admin invite is generated; the company is inactive until this flow completes.
- **As a Super Admin**, I want to view every privileged action across all tenants in one Audit Log, so I can investigate incidents.
  - AC: audit log query supports a tenant filter, defaulting to "all tenants" only for Super Admin (Company Admin's equivalent view is auto-scoped to their own tenant and cannot see others').

---

# PART F — API Specification

## F.1 Conventions

- **Base URL:** `/api` (matches `apiClient.ts`'s default; overridable via `VITE_API_URL` on the frontend side — backend just needs to be reachable at whatever that resolves to).
- **Auth:** `Authorization: Bearer <token>` on every request except `POST /api/auth/login` and `POST /api/auth/forgot-password`.
- **Content type:** `application/json` for all request/response bodies except file upload endpoints (multipart/form-data) and document download (binary/stream).
- **Errors:** `{ "message": string }` minimum shape (matches `apiClient.ts`'s error parsing: `err.message || statusText`) — 400 for validation, 401 for auth failure (see D.4 §6), 403 for feature/permission denial, 404 for not found, 409 for conflicting state transitions (e.g. booking an already-sold plot).
- **Pagination:** list endpoints accept `?page=&pageSize=` and return `{ data: T[], total: number, page: number, pageSize: number }`.
- **Filtering/sorting:** list endpoints accept relevant query params per resource (documented per module below) plus a generic `?sort=field:asc|desc`.
- **IDs:** string IDs throughout, matching the frontend's `id: string` fields (UUIDs recommended).

## F.2 Auth

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/api/auth/login` | `{ email, password }` | `{ token, refreshToken, user: User, tenant: Tenant }` |
| POST | `/api/auth/refresh` | `{ refreshToken }` | `{ token }` |
| POST | `/api/auth/logout` | — | `204` |
| POST | `/api/auth/forgot-password` | `{ email }` | `204` (always, no enumeration) |
| POST | `/api/auth/reset-password` | `{ token, newPassword }` | `204` |
| GET | `/api/auth/me` | — | `{ user: User, tenant: Tenant, enabledFeatures: string[], permissions: string[] }` |

## F.3 Companies (Super Admin)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/companies` | list all tenants; Super Admin only |
| POST | `/api/companies` | create company + `enabledFeatures` + kicks off Company Admin invite |
| GET | `/api/companies/:id` | detail |
| PUT | `/api/companies/:id` | update Tenant fields (Section B.5) |
| PUT | `/api/companies/:id/features` | update `enabledFeatures` |
| POST | `/api/companies/:id/activate` / `/deactivate` | lifecycle |

## F.4 Users

| Method | Path | Notes |
|---|---|---|
| GET | `/api/users` | Super Admin: all, filterable by `companyId`; Company Admin/Manager: own company only |
| POST | `/api/users` | create/invite; requires `users.manage` |
| GET | `/api/users/:id` | detail |
| PUT | `/api/users/:id` | update (role, status, profile) |
| POST | `/api/users/:id/disable` / `/enable` | lifecycle |
| POST | `/api/users/:id/resend-invite` | |

## F.5 Roles & Permissions

| Method | Path | Notes |
|---|---|---|
| GET | `/api/roles` | canonical role→permission map (Section B.4) |
| PUT | `/api/roles/:code` | Super Admin only, platform-wide edit |
| GET | `/api/permissions` | reference list of all permission keys |
| GET | `/api/features` | reference list of all feature keys |

## F.6 Leads

| Method | Path | Query/Body | Notes |
|---|---|---|---|
| GET | `/api/leads` | `?status=&priority=&source=&assignedAgentId=&dateFrom=&dateTo=&scope=mine|team|all` | scoping per Section E |
| POST | `/api/leads` | `Lead` fields minus `id`/`createdAt` | requires `leads.create` |
| GET | `/api/leads/:id` | | |
| PUT | `/api/leads/:id` | | requires `leads.update` |
| DELETE | `/api/leads/:id` | | requires `leads.delete` |
| POST | `/api/leads/:id/assign` | `{ assignedAgentId }` | requires `leads.assign` |
| POST | `/api/leads/:id/convert` | `{ createDeal?, createSiteVisit?, createConsultation? }` | transactional, see E |
| POST | `/api/leads/import` | multipart file | preview/commit two-step (see F.6a) |
| GET | `/api/leads/export` | same filters as list | requires `leads.export`, returns CSV/XLSX |

**F.6a Import sub-flow:** `POST /api/leads/import/preview` (upload + column mapping → validation result, no commit) then `POST /api/leads/import/commit` (`{ importId }` → executes, returns `{ imported, skipped, errors: [] }` plus a downloadable error report link).

## F.7 Customers

| Method | Path | Notes |
|---|---|---|
| GET | `/api/customers` | filters mirror Leads |
| POST | `/api/customers` | |
| GET | `/api/customers/:id` | |
| PUT | `/api/customers/:id` | |
| DELETE | `/api/customers/:id` | requires `customers.delete` |
| GET | `/api/customers/:id/calls` | linked calls |
| GET | `/api/customers/:id/followups` | linked follow-ups |
| GET | `/api/customers/:id/deals` | linked deals |

## F.8 Deals

| Method | Path | Notes |
|---|---|---|
| GET | `/api/deals` | `?stage=&assignedAgentId=&customerId=` |
| GET | `/api/deals/pipeline` | grouped by stage, for Kanban view |
| POST | `/api/deals` | |
| GET | `/api/deals/:id` | |
| PUT | `/api/deals/:id` | |
| DELETE | `/api/deals/:id` | requires `deals.delete` |
| POST | `/api/deals/:id/stage` | `{ stage }` — validated against tenant's stage list |
| POST | `/api/deals/:id/won` / `/lost` | `{ lostReason? }` |

## F.9 Follow-ups

| Method | Path | Notes |
|---|---|---|
| GET | `/api/followups` | `?status=&contactType=&assignedAgentId=&dateFrom=&dateTo=` |
| POST | `/api/followups` | |
| PUT | `/api/followups/:id` | |
| POST | `/api/followups/:id/complete` | |
| POST | `/api/followups/:id/cancel` | |
| POST | `/api/followups/:id/reschedule` | `{ scheduledAt }` |

## F.10 Calling

| Method | Path | Notes |
|---|---|---|
| POST | `/api/agent/availability` | `{ status: 'available'|'busy'|'offline' }` |
| GET | `/api/agent/availability` | current status |
| POST | `/api/calls/incoming` | telephony-provider-facing webhook (or manual-trigger stub, per D.7) — resolves contact match, returns routing target |
| POST | `/api/calls` | create `CallRecord` — used both for outbound-initiated logging and post-call disposition capture |
| GET | `/api/calls` | Call History list — `?direction=&agentId=&disposition=&dateFrom=&dateTo=` |
| GET | `/api/calls/:id` | detail incl. recording/transcription |
| GET | `/api/calls/:id/recording` | requires `calls.recordings.play`; streams/signed-URL redirect |

## F.11 Properties / Projects / Plots (Jamin)

| Method | Path | Notes |
|---|---|---|
| GET/POST | `/api/projects` | |
| GET/PUT | `/api/projects/:id` | |
| GET | `/api/projects/:id/plots` | |
| GET/POST | `/api/plots` | `?projectId=&status=` |
| GET/PUT | `/api/plots/:id` | |
| POST | `/api/plots/:id/hold` | `{ holdByCustomer, holdByAgent, holdExpiry }` |
| POST | `/api/plots/:id/release` | back to Available |

## F.12 Site Visits (Jamin)

| Method | Path | Notes |
|---|---|---|
| GET/POST | `/api/site-visits` | `?status=&assignedAgentId=&dateFrom=&dateTo=` |
| GET/PUT | `/api/site-visits/:id` | |
| POST | `/api/site-visits/:id/complete` | `{ outcomeNotes }` |
| POST | `/api/site-visits/:id/reschedule` | `{ scheduledAt }` |

## F.13 Bookings (Jamin)

| Method | Path | Notes |
|---|---|---|
| GET/POST | `/api/bookings` | |
| GET/PUT | `/api/bookings/:id` | |
| POST | `/api/bookings/:id/confirm` | transactional — sets linked plot to Sold |
| POST | `/api/bookings/:id/cancel` | reverts plot to Available |

## F.14 Investors, Consultations, Investment Opportunities (GHL)

| Method | Path | Notes |
|---|---|---|
| GET/POST | `/api/investors` | |
| GET/PUT | `/api/investors/:id` | |
| GET/POST | `/api/consultations` | `?investorId=&status=&dateFrom=&dateTo=` |
| GET/PUT | `/api/consultations/:id` | |
| POST | `/api/consultations/:id/complete` | `{ outcomeNotes }` |
| GET/POST | `/api/opportunities` | `?stage=&investorId=` |
| GET/PUT | `/api/opportunities/:id` | |
| POST | `/api/opportunities/:id/stage` | `{ stage }` |

## F.15 Reports

| Method | Path | Notes |
|---|---|---|
| GET | `/api/reports/leads` | |
| GET | `/api/reports/calls` | |
| GET | `/api/reports/followups` | |
| GET | `/api/reports/conversion` | |
| GET | `/api/reports/agent-performance` | Manager/Admin/Super Admin only |
| GET | `/api/reports/lead-sources` | |
| GET | `/api/reports/deals` | |
| GET | `/api/reports/projects` \| `/site-visits` \| `/bookings` | Jamin only |
| GET | `/api/reports/investors` \| `/consultations` \| `/opportunities` | GHL only |
| GET | `/api/reports/:type/export` | requires `reports.export`, same filters + `?format=csv|xlsx` |

All report endpoints accept `?dateFrom=&dateTo=` plus report-specific filters (agent, source, stage).

## F.16 Notifications

| Method | Path | Notes |
|---|---|---|
| GET | `/api/notifications` | `?read=&type=`, current user only |
| POST | `/api/notifications/:id/read` | |
| POST | `/api/notifications/read-all` | |

## F.17 Documents

| Method | Path | Notes |
|---|---|---|
| GET | `/api/documents?entityType=&entityId=` | list attached to a parent record |
| POST | `/api/documents` | multipart upload, `{ entityType, entityId, category }` |
| GET | `/api/documents/:id` | metadata + download/signed URL |
| DELETE | `/api/documents/:id` | permission-gated per parent entity |

## F.18 Audit Logs

| Method | Path | Notes |
|---|---|---|
| GET | `/api/audit-logs` | `?actor=&action=&entityType=&dateFrom=&dateTo=&companyId=` — `companyId` filter Super-Admin-only; Company Admin auto-scoped to own tenant |

## F.19 Import/Export Jobs

| Method | Path | Notes |
|---|---|---|
| GET | `/api/jobs` | `?type=import|export&status=` — history list per Section 7.12 of the frontend spec |
| GET | `/api/jobs/:id` | status + result summary + report download link |

---

## Open Decisions to Confirm With the Team Before Antigravity Builds This

1. **Telephony:** is V1 wiring a real provider (Twilio/Exotel/Plivo) or just logging manually-entered call outcomes (Section D.7)? This changes the Calls module's scope significantly.
2. **Company-level role editing:** confirmed read-only in V1 (Section C.1) per the earlier frontend spec's assumption — verify this still holds now that the frontend is built, since `PlatformRolesPage` exists but a company-level equivalent editor does not appear to be scaffolded.
3. **Backend stack:** Node/TypeScript + PostgreSQL + Prisma/TypeORM is recommended (Section D.2) for consistency with the existing frontend, but is not mandated by the original blueprint — confirm before scaffolding.
4. **Follow-up bucketing** (Upcoming/Due Today/Overdue): confirmed as frontend-computed from `scheduledAt`, or should the API return a precomputed `computedState`? (Section E, Follow-ups)

---

**End of Backend Build Specification.**
