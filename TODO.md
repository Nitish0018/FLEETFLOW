# 🚛 FLEETFLOW — Modular Build Todo List

> **Source docs:** FEETFLOW_PRD.pdf · FEETFLOW_Design_Doc.pdf · FEETFLOW_TECH STACK.pdf · FleetFlow 8-Hour Plan.pdf  
> **Goal:** Replace manual logbooks with a centralized, rule-based digital hub that optimizes fleet lifecycle, monitors driver safety, and tracks financial performance.  
> **Mockup:** https://link.excalidraw.com/l/65VNwvy7c4X/9gLrP9aS4YZ

---

## 👥 User Roles
| Role | Responsibilities |
|---|---|
| Fleet Manager | Vehicle health, asset lifecycle, scheduling |
| Dispatcher | Create trips, assign drivers, validate cargo loads |
| Safety Officer | Driver compliance, license expirations, safety scores |
| Financial Analyst | Fuel spend, maintenance ROI, operational costs |

---

## ⚙️ PHASE 0 — Project Setup & Infrastructure

### 0.1 Repo & Tooling
- [ ] Initialize project (monorepo or separate `frontend/` + `backend/` folders)
- [ ] Set up `.gitignore`, `README.md`, `.env.example`
- [ ] Configure ESLint + Prettier for frontend and backend

### 0.2 Frontend (Next.js + Tailwind)
- [ ] Bootstrap Next.js app with TypeScript (`npx create-next-app@latest --typescript`)
- [ ] Install and configure Tailwind CSS
- [ ] Install Framer Motion (micro-animations)
- [ ] Install Recharts (charts & KPI dashboards)
- [ ] Install Lucide React (icons) + Shadcn UI (reusable components)
- [ ] Define color palette, typography, and spacing tokens
- [ ] Set up responsive breakpoints (320px → 1920px+)

### 0.3 Backend (Node.js / Express)
- [ ] Initialize Node.js + Express with TypeScript
- [ ] Set up folder structure: `routes/`, `controllers/`, `middlewares/`, `services/`
- [ ] Install: `helmet`, `cors`, `express-rate-limit`, `bcrypt`, `jsonwebtoken`
- [ ] Configure CORS to allow frontend origin

### 0.4 Database (PostgreSQL + Prisma + Redis)
- [ ] Set up PostgreSQL instance (Supabase recommended)
- [ ] Install and initialize Prisma ORM (`npx prisma init`)
- [ ] Define full Prisma schema (see Phase 1)
- [ ] Run initial migration (`npx prisma migrate dev`)
- [ ] Set up Redis for caching KPIs and session management (`ioredis`)

### 0.5 DevOps & Hosting
- [ ] Deploy frontend to **Vercel** (connect GitHub for CI/CD)
- [ ] Deploy backend to **Render / Railway**
- [ ] Set up **AWS S3** bucket for document/file uploads (licenses, insurance, RC)
- [ ] Set up **Sentry** for error tracking (frontend + backend)
- [ ] Set up **Socket.io** server on backend + client on frontend

---

## 🗄️ PHASE 1 — Database Schema

### Core Entities (Prisma Models)

- [ ] **Users** — `id`, `name`, `email`, `password_hash`, `role` (fleet_manager / dispatcher / safety_officer / financial_analyst), `company_id`, `created_at`
- [ ] **Vehicles** — `id`, `name`, `model`, `license_plate` (unique), `type` (Truck/Van/Bike), `max_capacity_kg`, `odometer_km`, `status` (Available / On Trip / In Shop / Retired), `company_id`, `created_at`
- [ ] **Drivers** — `id`, `name`, `license_number`, `license_expiry`, `license_category` (Truck/Van/Bike), `status` (On Duty / Off Duty / Suspended), `safety_score`, `trip_completion_rate`, `company_id`, `created_at`
- [ ] **Trips** — `id`, `vehicle_id`, `driver_id`, `cargo_weight_kg`, `origin`, `destination`, `status` (Draft / Dispatched / Completed / Cancelled), `odometer_start`, `odometer_end`, `distance_km`, `created_at`, `completed_at`
- [ ] **Fuel Logs** — `id`, `vehicle_id`, `trip_id` (optional), `litres`, `cost`, `date`, `created_at`
- [ ] **Maintenance Logs** — `id`, `vehicle_id`, `type` (Scheduled / Urgent), `description`, `cost`, `date`, `status` (Open / Resolved), `created_at`
- [ ] **Expenses** — `id`, `vehicle_id`, `category` (Fuel / Maintenance / Insurance / Other), `amount`, `description`, `date`, `created_at`
- [ ] **Rules** — `id`, `company_id`, `trigger_type`, `condition_value`, `action_type`, `is_active`
- [ ] **Alerts** — `id`, `rule_id`, `vehicle_id`, `driver_id`, `message`, `severity`, `is_read`, `created_at`
- [ ] Add foreign key relationships and indexes on all join fields

---

## 🔐 PHASE 2 — Authentication & RBAC (Page 1)

**Page Purpose:** Secure access portal for all user roles.

### Backend
- [ ] `POST /api/auth/register` — Create user, hash password with bcrypt, assign role
- [ ] `POST /api/auth/login` — Validate credentials, return JWT access token + refresh token
- [ ] `POST /api/auth/refresh` — Reissue access token via refresh token
- [ ] `POST /api/auth/logout` — Blacklist refresh token in Redis
- [ ] Build `authMiddleware` (validate JWT on all protected routes)
- [ ] Build `roleGuard(roles[])` middleware (block unauthorized roles per route)
- [ ] Apply rate limiting to `/api/auth/*` routes

### Frontend
- [ ] Login page: email + password fields, "Forgot Password" link
- [ ] Auth context / Zustand store for global session state
- [ ] Store access token securely (httpOnly cookie or memory)
- [ ] Protected route wrapper — redirect to `/login` if unauthenticated
- [ ] Role-based sidebar: hide pages not accessible to current role
- [ ] Logout button — clear tokens, redirect to login

---

## 🏠 PHASE 3 — Command Center Dashboard (Page 2)

**Page Purpose:** High-level "at-a-glance" fleet oversight for Fleet Managers.

### Backend
- [ ] `GET /api/dashboard/summary` — Return KPIs:
  - `active_fleet_count` (vehicles with status "On Trip")
  - `maintenance_alerts_count` (vehicles "In Shop")
  - `utilization_rate` (% fleet assigned vs. idle)
  - `pending_cargo_count` (trips with status "Draft")
- [ ] Cache KPI results in Redis (TTL: 60s), invalidate on status changes

### Frontend
- [ ] KPI Card component (value, label, icon, trend indicator)
- [ ] KPI Grid: Active Fleet · Maintenance Alerts · Utilization Rate · Pending Cargo
- [ ] Filter bar: Vehicle Type (Truck / Van / Bike), Status, Region
- [ ] Recharts bar chart: Monthly fuel expenses
- [ ] Recharts line chart: Fleet utilization over time
- [ ] Recharts pie chart: Expense breakdown by category
- [ ] Real-time KPI refresh via Socket.io (live dashboard update)
- [ ] Performance target: dashboard loads in < 2 seconds

---

## 🚗 PHASE 4 — Vehicle Registry & Asset Management (Page 3)

**Page Purpose:** CRUD for all physical fleet assets.

### Backend
- [ ] `GET /api/vehicles` — List all vehicles (filter: type, status, region; paginated)
- [ ] `GET /api/vehicles/:id` — Vehicle detail + maintenance history + odometer log
- [ ] `POST /api/vehicles` — Add vehicle (name/model, license plate, type, max capacity kg, odometer)
- [ ] `PUT /api/vehicles/:id` — Update vehicle info
- [ ] `PUT /api/vehicles/:id/status` — Toggle status: Available / Retired (Out of Service)
- [ ] `DELETE /api/vehicles/:id` — Soft-delete vehicle

### Frontend
- [ ] Vehicles list page — scannable data table with status pills (Available / On Trip / In Shop / Retired)
- [ ] Filter bar: type, status
- [ ] Add Vehicle modal/form (name, license plate, type, max load kg, odometer)
- [ ] Vehicle detail page (specs, current status, linked maintenance history, fuel logs)
- [ ] Edit Vehicle inline or modal
- [ ] "Out of Service" toggle button with confirmation dialog

---

## 🗺️ PHASE 5 — Trip Dispatcher & Management (Page 4)

**Page Purpose:** Workflow to move cargo from Point A to Point B.

### Backend
- [ ] `GET /api/trips` — List trips (filter: status, vehicle, driver, date range; paginated)
- [ ] `GET /api/trips/:id` — Trip detail
- [ ] `POST /api/trips` — Create trip:
  - **Validation Rule 1:** CargoWeight > Vehicle.MaxCapacity → reject with error "Cargo exceeds vehicle capacity"
  - **Validation Rule 2:** Driver.license_expiry < today → reject with error "Driver license expired"
  - **Validation Rule 3:** Vehicle.status ≠ "Available" → reject
  - **Validation Rule 4:** Driver.status ≠ "Off Duty" → reject
  - On success: set Vehicle + Driver status → **"On Trip"**
- [ ] `PUT /api/trips/:id/complete` — Mark trip done, record final odometer:
  - Set Vehicle + Driver status → **"Available"**
  - Trigger cost-per-km recalculation
- [ ] `PUT /api/trips/:id/cancel` — Cancel trip, restore Vehicle + Driver status → "Available"
- [ ] Trip lifecycle: **Draft → Dispatched → Completed → Cancelled**

### Frontend
- [ ] Trips list page — data table with status pills (Draft / Dispatched / Completed / Cancelled)
- [ ] Create Trip form:
  - Vehicle selector (only shows "Available" vehicles)
  - Driver selector (only shows "Off Duty" + valid-license drivers)
  - Cargo weight input with live capacity validation indicator
  - Origin + Destination fields
- [ ] Inline validation: show warning if cargo weight > vehicle capacity
- [ ] Trip detail page (vehicle, driver, cargo, route, timeline)
- [ ] "Mark Complete" button — opens odometer entry dialog
- [ ] "Cancel Trip" button with confirmation

---

## 🔧 PHASE 6 — Maintenance & Service Logs (Page 5)

**Page Purpose:** Preventative and reactive vehicle health tracking.

### Backend
- [ ] `GET /api/maintenance` — List maintenance logs (filter: vehicle, status: Open/Resolved)
- [ ] `GET /api/maintenance/:id` — Log detail
- [ ] `POST /api/maintenance` — Add service log entry:
  - **Auto-Logic:** Set Vehicle.status → **"In Shop"** (vehicle disappears from Dispatcher pool)
- [ ] `PUT /api/maintenance/:id/resolve` — Mark resolved:
  - Set Vehicle.status → **"Available"**
- [ ] `DELETE /api/maintenance/:id` — Delete log
- [ ] Rule: If maintenance scheduled date overdue by > 7 days → create Alert

### Frontend
- [ ] Maintenance list page — data table (vehicle, type, description, date, status pill)
- [ ] Add Maintenance form (vehicle selector, type: Scheduled/Urgent, description, cost, date)
- [ ] Resolve maintenance button (updates vehicle status to Available)
- [ ] Maintenance history timeline per vehicle (on vehicle detail page)
- [ ] Visual indicator on vehicle cards: "In Shop" badge

---

## ⛽ PHASE 7 — Expense & Fuel Logging (Page 6)

**Page Purpose:** Per-asset financial tracking after trip completion.

### Backend
- [ ] `GET /api/fuel` — List fuel logs (filter: vehicle, date range)
- [ ] `POST /api/fuel` — Add fuel log (vehicle_id, trip_id, litres, cost, date)
- [ ] `PUT /api/fuel/:id` — Edit fuel log
- [ ] `DELETE /api/fuel/:id` — Delete fuel log
- [ ] `GET /api/expenses` — List expenses (filter: vehicle, category, date)
- [ ] `POST /api/expenses` — Add expense (vehicle_id, category, amount, description)
- [ ] `PUT /api/expenses/:id` / `DELETE /api/expenses/:id`
- [ ] **Calculated field per vehicle:** `total_operational_cost = SUM(fuel costs) + SUM(maintenance costs)`
- [ ] Rule: Fuel cost for trip > X threshold → create Alert

### Frontend
- [ ] Fuel log list page + add fuel log form (vehicle, litres, cost, date)
- [ ] Expenses list page + add expense form (vehicle, category, amount, description, date)
- [ ] Per-vehicle total operational cost card
- [ ] Monthly fuel trend chart (Recharts line/bar)
- [ ] Expense category breakdown pie chart

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
