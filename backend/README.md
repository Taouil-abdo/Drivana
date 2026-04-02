# Drivana Backend API

NestJS backend for Drivana car rental platform.

## Setup

```bash
npm install
npm run start:dev
```

## API Endpoints (To be implemented)

### Authentication
- POST `/auth/register` - Register user
- POST `/auth/login` - Login user
- GET `/auth/profile` - Get current user

### Users
- GET `/users` - List users (Admin)
- GET `/users/:id` - Get user
- PATCH `/users/:id` - Update user
- DELETE `/users/:id` - Delete user (Admin)

### Vehicles
- GET `/vehicles` - List vehicles
- GET `/vehicles/:id` - Get vehicle
- POST `/vehicles` - Create vehicle (Admin)
- PATCH `/vehicles/:id` - Update vehicle (Admin)
- DELETE `/vehicles/:id` - Delete vehicle (Admin)

### Drivers
- POST `/drivers` - Register as driver
- GET `/drivers` - List drivers
- GET `/drivers/:id` - Get driver
- PATCH `/drivers/:id/approve` - Approve driver (Admin)
- PATCH `/drivers/:id/availability` - Update availability

### Reservations
- POST `/reservations` - Create reservation
- GET `/reservations` - List reservations
- GET `/reservations/:id` - Get reservation
- PATCH `/reservations/:id/status` - Update status
- DELETE `/reservations/:id` - Cancel reservation

### Payments
- POST `/payments` - Process payment
- GET `/payments/:id` - Get payment

### Reviews
- POST `/reviews` - Create review
- GET `/reviews` - List reviews
- GET `/reviews/vehicle/:id` - Vehicle reviews
- GET `/reviews/driver/:id` - Driver reviews

## Database Commands

```bash
# Open Mongo shell
mongosh

# Drop database (example)
use drivana
db.dropDatabase()
```

## Environment Variables

See `.env.example` for required variables.
