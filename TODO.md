# 🚛 FLEETFLOW — Modular Build Todo List

> **Source docs:** FEETFLOW_PRD.pdf · FEETFLOW_Design_Doc.pdf · FEETFLOW_TECH STACK.pdf · FleetFlow 8-Hour Plan.pdf  
> **Goal:** Replace manual logbooks with a centralized, rule-based digital hub that optimizes fleet lifecycle, monitors driver safety, and tracks financial performance.  
> **Mockup:** <https://link.excalidraw.com/l/65VNwvy7c4X/9gLrP9aS4YZ>

---

## 👥 User Roles

| Role | Responsibilities |
| --- | --- |
| Fleet Manager | Vehicle health, asset lifecycle, scheduling |
| Dispatcher | Create trips, assign drivers, validate cargo loads |
| Safety Officer | Driver compliance, license expirations, safety scores |
| Financial Analyst | Fuel spend, maintenance ROI, operational costs |

---

## ⚙️ PHASE 0 — Project Setup & Infrastructure ✅

### 0.1 Repo & Tooling

- [x] Initialize project (`frontend/` + `backend/` folders)
- [x] Set up `.gitignore`, `README.md`, `.env.example`
- [x] Git repo initialized + pushed to GitHub (`Nitish0018/FLEETFLOW`)
- [ ] Configure ESLint + Prettier (auto-configured by Next.js; add shared config if needed)

### 0.2 Frontend (Next.js + Tailwind)

- [x] Next.js app scaffolded with TypeScript + Tailwind + ESLint
- [x] Tailwind CSS configured (built into Next.js scaffold)
- [x] Install Framer Motion, Recharts, Lucide React, Socket.io-client
- [x] `frontend/lib/api.ts` — typed API client created
- [ ] Install Shadcn UI (`npx shadcn-ui@latest init`)
- [ ] Define color palette tokens in `globals.css` (Navy `#0A0F1E`, Electric `#00C2FF`)
- [ ] Set up responsive breakpoint utilities

### 0.3 Backend (Node.js / Express)

- [x] Node.js + Express + TypeScript initialized in `backend/`
- [x] Folder structure created: `src/routes/`, `src/controllers/`, `src/middlewares/`, `src/services/`, `src/lib/`
- [x] Installed: `helmet`, `cors`, `express-rate-limit`, `bcrypt`, `jsonwebtoken`, `socket.io`
- [x] `src/index.ts` — main server with CORS, helmet, rate-limit, Socket.io, health check
- [x] `src/middlewares/auth.middleware.ts` — JWT + RBAC roleGuard
- [x] `src/lib/prisma.ts` — singleton Prisma client
- [x] `src/lib/redis.ts` — singleton Redis client

### 0.4 Database (PostgreSQL + Prisma + Redis)

- [ ] Create Supabase project + copy `DATABASE_URL` into `backend/.env`
- [x] Prisma installed + `prisma/schema.prisma` written (all 10 entities, enums, relations)
- [ ] Run `npx prisma migrate dev --name init` (needs `DATABASE_URL` first)
- [ ] Set up Redis instance (local or Upstash); copy `REDIS_URL` into `backend/.env`

### 0.5 DevOps & Hosting

- [x] Socket.io server set up on backend + client package installed on frontend
- [ ] Deploy frontend to **Vercel** (connect `Nitish0018/FLEETFLOW` → `frontend/` folder)
- [ ] Deploy backend to **Render / Railway** (root: `backend/`, build: `npm run build`)
- [ ] Set up **AWS S3** bucket for file uploads
- [ ] Add **Sentry** SDK to frontend + backend

---

## 🗄️ PHASE 1 — Database Schema ✅

### Core Entities (Prisma Models) ✅

- [x] **Users** — `id`, `name`, `email`, `password_hash`, `role`, `company_id`, `created_at`
- [x] **Vehicles** — `id`, `name`, `model`, `license_plate` (unique), `type`, `max_capacity_kg`, `odometer_km`, `status`, `company_id`
- [x] **Drivers** — `id`, `name`, `license_number`, `license_expiry`, `license_category`, `status`, `safety_score`, `trip_completion_rate`, `company_id`
- [x] **Trips** — `id`, `vehicle_id`, `driver_id`, `cargo_weight_kg`, `origin`, `destination`, `status`, `odometer_start/end`, `distance_km`, `completed_at`
- [x] **Fuel Logs** — `id`, `vehicle_id`, `trip_id` (optional), `litres`, `cost`, `date`
- [x] **Maintenance Logs** — `id`, `vehicle_id`, `type`, `description`, `cost`, `date`, `status`
- [x] **Expenses** — `id`, `vehicle_id`, `category`, `amount`, `description`, `date`
- [x] **Rules** — `id`, `company_id`, `trigger_type`, `condition_value`, `action_type`, `is_active`
- [x] **Alerts** — `id`, `rule_id`, `vehicle_id`, `driver_id`, `message`, `severity`, `is_read`
- [x] Foreign key relationships and indexes defined
- [x] Seed data created with comprehensive test data

---

## 🔐 PHASE 2 — Authentication & RBAC (Page 1) ✅

**Page Purpose:** Secure access portal for all user roles.

### Backend (Auth) ✅

- [x] `POST /api/auth/register` — Create user, hash password with bcrypt, assign role
- [x] `POST /api/auth/login` — Validate credentials, return JWT access token + refresh token
- [x] `POST /api/auth/refresh` — Reissue access token via refresh token
- [x] `POST /api/auth/logout` — Blacklist refresh token in Redis
- [x] Build `authMiddleware` (validate JWT on all protected routes)
- [x] Build `roleGuard(roles[])` middleware (block unauthorized roles per route)
- [x] Apply rate limiting to `/api/auth/*` routes

### Frontend (Auth) ✅

- [x] Login page: email + password fields, "Forgot Password" link
- [x] Auth context / Zustand store for global session state
- [x] Store access token securely (localStorage with proper key)
- [x] Protected route wrapper — redirect to `/login` if unauthenticated
- [x] Role-based sidebar: hide pages not accessible to current role
- [x] Logout button — clear tokens, redirect to login
- [x] Register page with company ID and role assignment

---

## 🏠 PHASE 3 — Command Center Dashboard (Page 2) ✅

**Page Purpose:** High-level "at-a-glance" fleet oversight for Fleet Managers.

### Backend (Dashboard) ✅

- [x] `GET /api/dashboard/summary` — Return KPIs:
  - `active_fleet_count` (vehicles with status "On Trip")
  - `maintenance_alerts_count` (vehicles "In Shop")
  - `utilization_rate` (% fleet assigned vs. idle)
  - `pending_cargo_count` (trips with status "Draft")
- [x] Cache KPI results in Redis (TTL: 60s), invalidate on status changes

### Frontend (Dashboard) ✅

- [x] KPI Card component (value, label, icon, trend indicator)
- [x] KPI Grid: Active Fleet · Maintenance Alerts · Utilization Rate · Pending Cargo
- [x] Filter bar: Vehicle Type (Truck / Van / Bike), Status, Region
- [x] Recharts bar chart: Monthly fuel expenses
- [x] Recharts line chart: Fleet utilization over time
- [x] Recharts pie chart: Expense breakdown by category
- [x] Real-time KPI refresh via Socket.io (live dashboard update)
- [x] Performance target: dashboard loads in < 2 seconds

---

## 🚗 PHASE 4 — Vehicle Registry & Asset Management (Page 3) ✅

**Page Purpose:** CRUD for all physical fleet assets.

### Backend (Vehicles) ✅

- [x] `GET /api/vehicles` — List all vehicles (filter: type, status, region; paginated)
- [x] `GET /api/vehicles/:id` — Vehicle detail + maintenance history + odometer log
- [x] `POST /api/vehicles` — Add vehicle (name/model, license plate, type, max capacity kg, odometer)
- [x] `PUT /api/vehicles/:id` — Update vehicle info
- [x] `PUT /api/vehicles/:id/status` — Toggle status: Available / Retired (Out of Service)
- [x] `DELETE /api/vehicles/:id` — Soft-delete vehicle

### Frontend (Vehicles) ✅

- [x] Vehicles list page — scannable data table with status pills (Available / On Trip / In Shop / Retired)
- [x] Filter bar: type, status
- [x] Add Vehicle modal/form (name, license plate, type, max load kg, odometer)
- [x] Vehicle detail page (specs, current status, linked maintenance history, fuel logs)
- [x] Edit Vehicle inline or modal
- [x] "Out of Service" toggle button with confirmation dialog

---

## 🗺️ PHASE 5 — Trip Dispatcher & Management (Page 4) ✅

**Page Purpose:** Workflow to move cargo from Point A to Point B.

### Backend (Trips) ✅

- [x] `GET /api/trips` — List trips (filter: status, vehicle, driver, date range; paginated)
- [x] `GET /api/trips/:id` — Trip detail
- [x] `POST /api/trips` — Create trip:
  - **Validation Rule 1:** CargoWeight > Vehicle.MaxCapacity → reject with error "Cargo exceeds vehicle capacity"
  - **Validation Rule 2:** Driver.license_expiry < today → reject with error "Driver license expired"
  - **Validation Rule 3:** Vehicle.status ≠ "Available" → reject
  - **Validation Rule 4:** Driver.status ≠ "Off Duty" → reject
  - On success: set Vehicle + Driver status → **"On Trip"**
- [x] `PUT /api/trips/:id/complete` — Mark trip done, record final odometer:
  - Set Vehicle + Driver status → **"Available"**
  - Trigger cost-per-km recalculation
- [x] `PUT /api/trips/:id/cancel` — Cancel trip, restore Vehicle + Driver status → "Available"
- [x] `PUT /api/trips/:id/dispatch` — Dispatch trip (Draft → Dispatched, marks vehicle/driver busy)
- [x] Trip lifecycle: **Draft → Dispatched → Completed → Cancelled**

### Backend (Drivers) ✅

- [x] `GET /api/drivers` — List drivers (filter: status, license_category, available; paginated)
- [x] `GET /api/drivers/:id` — Driver detail with recent trips and alerts
- [x] `POST /api/drivers` — Create driver with validation
- [x] `PUT /api/drivers/:id` — Update driver
- [x] `PUT /api/drivers/:id/status` — Update driver status

### Frontend (Trips) ✅

- [x] Trips list page — data table with status pills (Draft / Dispatched / Completed / Cancelled)
- [x] Create Trip form:
  - Vehicle selector (only shows "Available" vehicles)
  - Driver selector (only shows "Off Duty" + valid-license drivers)
  - Cargo weight input with live capacity validation indicator
  - Origin + Destination fields
- [x] Inline validation: show warning if cargo weight > vehicle capacity
- [x] Trip detail page (vehicle, driver, cargo, route, timeline)
- [x] "Dispatch Trip" button for DRAFT trips
- [x] "Complete Trip" button — opens odometer entry dialog
- [x] "Cancel Trip" button with confirmation
- [x] Updated dashboard navigation with Trips link

---

## 🔧 PHASE 6 — Maintenance & Service Logs (Page 5)

**Page Purpose:** Preventative and reactive vehicle health tracking.

### Backend (Maintenance) ✅

- [x] `GET /api/maintenance` — List maintenance logs (filter: vehicle, status: Open/Resolved)
- [x] `GET /api/maintenance/:id` — Log detail
- [x] `POST /api/maintenance` — Add service log entry:
  - **Auto-Logic:** Set Vehicle.status → **"In Shop"** (vehicle disappears from Dispatcher pool)
- [x] `PUT /api/maintenance/:id/resolve` — Mark resolved:
  - Set Vehicle.status → **"Available"**
- [x] `DELETE /api/maintenance/:id` — Delete log
- [x] Rule: If maintenance scheduled date overdue by > 7 days → create Alert

### Frontend (Maintenance) ✅

- [x] Maintenance list page — data table (vehicle, type, description, date, status pill)
- [x] Add Maintenance form (vehicle selector, type: Scheduled/Urgent, description, cost, date)
- [x] Resolve maintenance button (updates vehicle status to Available)
- [x] Maintenance history timeline per vehicle (on vehicle detail page)
- [x] Visual indicator on vehicle cards: "In Shop" badge

---

## ⛽ PHASE 7 — Expense & Fuel Logging (Page 6) ✅

**Page Purpose:** Per-asset financial tracking after trip completion.

### Backend (Expenses) ✅

- [x] `GET /api/fuel` — List fuel logs (filter: vehicle, date range)
- [x] `POST /api/fuel` — Add fuel log (vehicle_id, trip_id, litres, cost, date)
- [x] `PUT /api/fuel/:id` — Edit fuel log
- [x] `DELETE /api/fuel/:id` — Delete fuel log
- [x] `GET /api/fuel/stats/monthly-trend` — Monthly fuel cost/litres for chart
- [x] `GET /api/expenses` — List expenses (filter: vehicle, category, date)
- [x] `POST /api/expenses` — Add expense (vehicle_id, category, amount, description)
- [x] `PUT /api/expenses/:id` / `DELETE /api/expenses/:id`
- [x] `GET /api/expenses/stats/by-category` — Expense breakdown by category
- [x] `GET /api/expenses/stats/vehicle-operational-cost/:vehicleId` — Total operational cost
- [x] **Calculated field per vehicle:** `total_operational_cost = SUM(fuel costs) + SUM(maintenance costs)`
- [ ] Rule: Fuel cost for trip > X threshold → create Alert (deferred to Phase 10)

### Frontend (Expenses) ✅

- [x] Fuel log list page + add fuel log form (vehicle, litres, cost, date)
- [x] Monthly fuel trend chart (Recharts LineChart showing cost and litres over time)
- [x] Expenses list page + add expense form (vehicle, category, amount, description, date)
- [x] Stats cards showing total expenses, category count, average expense
- [x] Expense category breakdown pie chart (Recharts PieChart)
- [x] Navigation links added to all pages (Fuel, Expenses)
- [x] Created reusable MainNav component for consistent navigation
- [ ] Per-vehicle operational cost card on vehicle detail page (deferred)

---

## 👤 PHASE 8 — Driver Safety & Performance Profiles (Page 7)

**Page Purpose:** HR + compliance management for all drivers.

### Backend

- [ ] `GET /api/drivers` — List drivers (filter: status, license_category; paginated)
- [ ] `GET /api/drivers/:id` — Driver profile + trip history + safety score
- [ ] `POST /api/drivers` — Add driver (name, license number, expiry date, license category, status)
- [ ] `PUT /api/drivers/:id` — Update driver info
- [ ] `PUT /api/drivers/:id/status` — Toggle: On Duty / Off Duty / Suspended
- [ ] `DELETE /api/drivers/:id` — Soft-delete
- [ ] `GET /api/drivers/:id/scorecard` — Compute safety score
- [ ] `GET /api/drivers/leaderboard` — Rank all drivers by safety score
- [ ] **Compliance Rule:** If Driver.license_expiry < today → block trip assignment, create Alert
- [ ] **Safety Rule:** Trip completion rate, incident flags tracked per trip

### Frontend

- [ ] Drivers list page — data table with status pills (On Duty / Off Duty / Suspended)
- [ ] Driver profile page:
  - Personal info + license details
  - License expiry date with red warning badge if expired/expiring soon
  - Safety score gauge/meter (Recharts RadialBar or custom)
  - Trip completion rate
  - Trip history list
- [ ] Add/Edit Driver form (name, license #, expiry, category)
- [ ] Status toggle (On Duty → Off Duty → Suspended)
- [ ] Upload documents (license scan, insurance) → AWS S3
- [ ] Driver leaderboard table (sorted by safety score)

---

## 📊 PHASE 9 — Operational Analytics & Financial Reports (Page 8)

**Page Purpose:** Data-driven decision making for Financial Analysts.

### Backend

- [ ] `GET /api/analytics/fuel-efficiency` — km/L per vehicle
- [ ] `GET /api/analytics/roi` — Vehicle ROI: `(Revenue - (Maintenance + Fuel)) / Acquisition Cost`
- [ ] `GET /api/analytics/summary` — Company-wide: total fuel spend, total maintenance cost, fleet utilization %
- [ ] `GET /api/reports` — List generated reports
- [ ] `POST /api/reports/generate` — Generate monthly snapshot (PDF/CSV)
- [ ] Cache heavy aggregation queries in Redis

### Frontend

- [ ] Analytics dashboard page:
  - Fuel efficiency table: vehicle → km/L
  - Vehicle ROI table: vehicle → revenue, costs, ROI%
  - Fleet utilization % bar chart
- [ ] One-click export: **CSV** download and **PDF** export for monthly reports
- [ ] Date range filter for all analytics

---

## 🤖 PHASE 10 — Rule-Based Automation Engine & Alerts

**Core differentiator of FleetFlow.**

### Backend (Rule Engine)

- [ ] Design rule schema: `trigger_type` + `condition_value` + `action_type`
- [ ] `GET /api/rules` — List all rules
- [ ] `POST /api/rules` — Create rule
- [ ] `PUT /api/rules/:id` — Edit rule
- [ ] `DELETE /api/rules/:id` — Delete rule
- [ ] Build rule evaluation service (runs on data mutations + daily cron job)
- [ ] Implement rules:
  - [ ] Fuel cost for trip > threshold → Alert
  - [ ] Vehicle idle > Y hours → Alert
  - [ ] Driver license expired → Block assignment + Alert
  - [ ] Maintenance overdue > 7 days → Alert
  - [ ] Cargo weight > vehicle capacity → Block trip creation

### Backend (Alerts)

- [ ] `GET /api/alerts` — List alerts (filter: severity, unread)
- [ ] `PUT /api/alerts/:id/read` — Mark as read
- [ ] Push alert count to frontend via Socket.io

### Frontend

- [ ] Notification bell in top navbar with unread badge count
- [ ] Alerts dropdown / notification panel (list recent alerts)
- [ ] Rules management page (list rules, toggle active/inactive)
- [ ] Add/Edit rule form (trigger selector, condition value input, action selector)

---

## 🎨 PHASE 11 — UI/UX Polish & Accessibility

### Design System

- [ ] Navy base: `#0A0F1E`, Electric accent: `#00C2FF`
- [ ] Verify WCAG 2.1 AA contrast ratios on all text/background combos
- [ ] 2px focus rings for keyboard navigation (WCAG compliance)
- [ ] Status pill component: color-coded badges (Available=green, On Trip=blue, In Shop=amber, Retired=gray, Suspended=red)

### Reusable Components

- [ ] KPI Card (value, label, icon, delta/trend)
- [ ] Data Table (sortable columns, row filters, pagination)
- [ ] Modal / Dialog (confirm/cancel pattern)
- [ ] Form inputs: text, select, date picker, file upload
- [ ] Sidebar (role-based links, collapsible on tablet)
- [ ] Top Navbar (breadcrumb, alert bell, user avatar + logout)

### Animations (Framer Motion)

- [ ] Page fade-in transition
- [ ] Card hover lift effect
- [ ] Modal slide-in / slide-out
- [ ] Status pill color-transition on update

### Responsive Layout

- [ ] Mobile (320px): single column, stacked layout, hamburger menu
- [ ] Tablet (768px): 2-column KPI grid, collapsible sidebar
- [ ] Desktop (1024px+): 4-column KPI grid, full sidebar
- [ ] Ultra-wide (1920px+): max-width container with center alignment

---

## 🧪 PHASE 12 — Testing

### Backend

- [ ] Set up Jest + Supertest
- [ ] Unit tests: `authMiddleware`, `roleGuard`, rule engine logic
- [ ] Integration tests: all CRUD routes (vehicles, drivers, trips, fuel, maintenance)
- [ ] Validation tests: cargo weight check, license expiry check, vehicle availability check
- [ ] Export Postman collection to repo

### Frontend

- [ ] Set up Jest + React Testing Library
- [ ] Unit tests: KPI Card, Data Table, Trip creation form validations
- [ ] Integration tests: protected route redirects, role-based sidebar visibility

---

## 🚀 PHASE 13 — MVP Launch & Verification

- [ ] All 8 core pages functional and accessible by correct roles
- [ ] End-to-end workflow test:
  - [ ] Add vehicle (Van-05, 500kg) → status: Available
  - [ ] Add driver (Alex, valid Van license)
  - [ ] Create trip (Alex + Van-05, 450kg load) → passes capacity check → status: On Trip
  - [ ] Complete trip → enter final odometer → status: Available
  - [ ] Log maintenance (Oil Change) → status: In Shop → hidden from Dispatcher
  - [ ] Check Analytics: cost-per-km updated from fuel log
- [ ] Verify RBAC: each role blocked from unauthorized pages/actions
- [ ] Verify all auto-logic rules fire correctly (status transitions, alerts)
- [ ] Performance: dashboard < 2s load
- [ ] Export: CSV + PDF report download working
- [ ] Deploy: frontend on Vercel, backend on Render, DB on Supabase

---

## 🔮 PHASE 14 — Future Roadmap (Post-MVP)

### Phase 2

- [ ] AI-powered predictive maintenance engine
- [ ] Route optimization module
- [ ] Driver fatigue detection
- [ ] Insurance integration
- [ ] Mobile app — Driver version (React Native / Expo)
- [ ] Telematics / IoT GPS device integration

### Phase 3

- [ ] Blockchain-based compliance log ledger
- [ ] Carbon footprint tracking per vehicle
- [ ] EV fleet management module

---

*"Moving smarter, one mile at a time." — FleetFlow*
