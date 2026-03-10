# Drivana — Task Tracker

## Tech Stack
- **Backend**: NestJS + TypeORM + PostgreSQL + JWT + Swagger
- **Frontend**: Next.js 14 + Tailwind CSS + Redux + TypeScript

---

## ✅ DONE

### Infrastructure
- [x] Project setup — NestJS backend + Next.js 14 frontend
- [x] PostgreSQL + TypeORM connection
- [x] Environment variables (`.env`, `.env.local`)
- [x] CORS configured in `main.ts`
- [x] Swagger API docs at `http://localhost:3002/api`
- [x] Redux store with auth slice + localStorage hydration
- [x] Axios client with JWT interceptor

### Entities / Database
- [x] `User` entity — id, firstName, lastName, email, passwordHash, phone, role (CLIENT/DRIVER/ADMIN)
- [x] `Vehicle` entity — brand, model, year, registration, pricePerDay, status (AVAILABLE/RENTED/MAINTENANCE), imageUrl, description
- [x] `Driver` entity — licenseNumber, experienceYears, status (PENDING/APPROVED/REJECTED/SUSPENDED), isAvailable, photo, rating
- [x] `Reservation` entity — client, vehicle, driver, serviceType (CAR_ONLY/WITH_DRIVER), startDate, endDate, totalPrice, status (PENDING/CONFIRMED/CANCELLED/COMPLETED)
- [x] `Payment` entity (created, not wired)
- [x] `Review` entity (created, not wired)

### Auth Module
- [x] `POST /auth/register` — register new user
- [x] `POST /auth/login` — login + JWT token
- [x] `GET /auth/profile` — get current user
- [x] `POST /auth/become-driver` — submit driver application
- [x] JWT strategy + JwtGuard + RolesGuard (fixed `getAllAndOverride`)
- [x] Role-based access (CLIENT / DRIVER / ADMIN)
- [x] bcrypt password hashing

### Admin Module — Backend
- [x] `GET /admin/statistics` — KPI counts + total revenue
- [x] `GET /admin/revenue/monthly` — real monthly revenue chart data
- [x] `GET /admin/users` — all users with role filter
- [x] `GET /admin/users/:id` — single user
- [x] `PATCH /admin/users/:id/role` — change user role
- [x] `DELETE /admin/users/:id` — delete user
- [x] `GET /admin/drivers` — all drivers
- [x] `GET /admin/drivers/pending` — pending applications
- [x] `GET /admin/drivers/:id` — single driver
- [x] `POST /admin/drivers` — add driver from existing user
- [x] `PATCH /admin/drivers/:id/approve` — approve driver
- [x] `PATCH /admin/drivers/:id/reject` — reject driver
- [x] `PATCH /admin/drivers/:id/suspend` — suspend driver
- [x] `DELETE /admin/drivers/:id` — remove driver, revert role to CLIENT
- [x] `GET /admin/vehicles` — all vehicles
- [x] `POST /admin/vehicles` — create vehicle
- [x] `PATCH /admin/vehicles/:id` — update vehicle
- [x] `DELETE /admin/vehicles/:id` — delete vehicle
- [x] `GET /admin/reservations` — all reservations
- [x] `PATCH /admin/reservations/:id/status` — update reservation status

### Driver Module — Backend
- [x] `GET /driver/me` — own driver profile
- [x] `GET /driver/stats` — total, completed, confirmed, earnings
- [x] `GET /driver/reservations` — assigned reservations
- [x] `PATCH /driver/reservations/:id/complete` — mark trip as completed
- [x] `PATCH /driver/availability` — toggle online/offline

### Admin Panel — Frontend
- [x] Shared admin layout with auth guard + sidebar + mobile topbar
- [x] Toast notification system (success/error/info, auto-dismiss)
- [x] `/admin/dashboard` — KPI cards, real monthly revenue chart with hover tooltips, pending drivers, recent users & reservations
- [x] `/admin/users` — table, search, role filter, inline role change, delete with confirm
- [x] `/admin/drivers` — filter tabs, approve/reject/suspend/restore/remove, add driver modal
- [x] `/admin/vehicles` — stats, search, add/edit/delete with modal form
- [x] `/admin/reservations` — filter tabs, search, inline status change, revenue counter, serviceType badge

### Driver Panel — Frontend
- [x] Shared driver layout with auth guard + DriverSidebar
- [x] `/driver/dashboard` — KPI cards, profile card, availability toggle button, next mission highlight, all missions table with Complete button, status color coding

### Auth Pages
- [x] `/login` — dark themed login form
- [x] `/register` — registration form
- [x] Redirect after login based on role (ADMIN → `/admin/dashboard`, DRIVER → `/driver/dashboard`)

### Landing Page
- [x] `/` — dark blue landing page with car gallery, services, contact form

---

## ❌ TODO

### Client Module — Backend (0% done)
- [ ] `GET /vehicles` — public list of available vehicles (no auth)
- [ ] `GET /vehicles/:id` — single vehicle detail (no auth)
- [ ] `POST /reservations` — create a reservation (pick dates, serviceType, vehicle)
- [ ] `GET /reservations/my` — client's own reservations
- [ ] `PATCH /reservations/:id/cancel` — client cancels their reservation
- [ ] `POST /reviews` — client submits a review after completed trip
- [ ] `GET /reviews/vehicle/:id` — reviews for a vehicle

### Client Panel — Frontend (0% done)
- [ ] `/dashboard` — client home after login (profile summary, recent bookings)
- [ ] `/vehicles` — browse available cars, filter by price/brand/status
- [ ] `/vehicles/:id` — vehicle detail page with booking button
- [ ] `/booking/:vehicleId` — booking form (pick dates, CAR_ONLY or WITH_DRIVER, see calculated total price)
- [ ] `/my-reservations` — client sees all their bookings, can cancel PENDING ones
- [ ] `/become-driver` — form for client to submit driver application (licenseNumber, experienceYears, photo)

### Driver Panel — Frontend (missing pages)
- [ ] `/driver/reservations` — full reservations page (separate from dashboard)
- [ ] `/driver/profile` — view/edit profile info, see rating history

### Payment Module (0% done)
- [ ] `Payment` entity wiring
- [ ] `POST /payments` — create payment for a reservation
- [ ] `GET /payments/my` — client payment history
- [ ] Payment status tracking (PENDING / PAID / REFUNDED)

### Review Module (0% done)
- [ ] `Review` entity wiring
- [ ] `POST /reviews` — submit review after completed trip
- [ ] `GET /reviews/vehicle/:id` — reviews per vehicle
- [ ] Average rating calculation on vehicle

### General Frontend
- [ ] Shared navbar for non-admin/driver pages (landing, vehicles, booking)
- [ ] 404 page
- [ ] Loading skeleton screens instead of spinners
- [ ] Pagination on all admin tables
- [ ] Mobile-friendly nav for client pages

### Auth
- [ ] Password reset flow (forgot password email)
- [ ] Email verification on register

---

## Priority Order (what to build next)

1. **Client backend** — vehicles public endpoint + reservations CRUD
2. **Client frontend** — vehicles browse + booking form + my-reservations
3. **Become-driver page** — client submits application from UI
4. **Driver profile page** — driver can see/edit their info
5. **Payment module** — wire the existing entity
6. **Review module** — wire the existing entity
