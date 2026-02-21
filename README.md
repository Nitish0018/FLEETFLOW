# 🚛 FleetFlow

> **Modular Fleet & Logistics Management System**  
> Replacing manual logbooks with a centralized, rule-based digital hub.

## Overview

FleetFlow optimizes the lifecycle of a delivery fleet — from vehicle health and driver safety to trip dispatching and financial performance analytics.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, Framer Motion, Recharts |
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | PostgreSQL (Supabase), Prisma ORM |
| **Cache** | Redis (ioredis) |
| **Auth** | JWT (access + refresh tokens), bcrypt, RBAC |
| **Real-time** | Socket.io |
| **Storage** | AWS S3 |
| **Hosting** | Vercel (frontend), Render (backend) |

---

## User Roles

| Role | Access |
|---|---|
| **Fleet Manager** | Full vehicle, driver, maintenance, and analytics access |
| **Dispatcher** | Create & manage trips, assign drivers |
| **Safety Officer** | Driver compliance, license expiry, safety scores |
| **Financial Analyst** | Fuel logs, expense reports, ROI analytics |

---

## Core Pages

1. 🔐 Login & Authentication
2. 🏠 Command Center Dashboard
3. 🚗 Vehicle Registry
4. 🗺️ Trip Dispatcher
5. 🔧 Maintenance & Service Logs
6. ⛽ Expense & Fuel Logging
7. 👤 Driver Safety Profiles
8. 📊 Operational Analytics & Reports

---

## Project Structure

```
fleetflow/
├── frontend/        # Next.js app
├── backend/         # Express API
│   ├── prisma/      # Database schema & migrations
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   └── services/
└── TODO.md          # Full feature checklist
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (or Supabase account)
- Redis

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev       # http://localhost:3000
```

### Backend
```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev       # http://localhost:5000
```

---

## Mockup
[View on Excalidraw](https://link.excalidraw.com/l/65VNwvy7c4X/9gLrP9aS4YZ)

---

*"Moving smarter, one mile at a time." — FleetFlow*
