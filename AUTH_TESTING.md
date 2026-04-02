# Authentication Module - Testing Guide

## ✅ Completed Features

### Backend (NestJS)
- ✅ JWT Authentication Strategy
- ✅ User Registration (POST /auth/register)
- ✅ User Login (POST /auth/login)
- ✅ Get Profile (GET /auth/profile)
- ✅ Role-based Guards (CLIENT, DRIVER, ADMIN)
- ✅ Password Encryption (bcrypt)
- ✅ JWT Token Generation
- ✅ Swagger Documentation

### Frontend (Next.js)
- ✅ Login Page (/login)
- ✅ Register Page (/register)
- ✅ Dashboard Page (/dashboard)
- ✅ Navbar Component with Auth State
- ✅ Auth Store (Zustand + LocalStorage)
- ✅ API Client with JWT Interceptor
- ✅ Protected Routes

## 🧪 Testing Steps

### 1. Start Backend
```bash
cd backend
npm install
npm run start:dev
```

Backend: http://localhost:3001
API Docs: http://localhost:3001/api

### 2. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:3000

### 3. Test Registration
1. Go to http://localhost:3000/register
2. Fill in the form:
   - First Name: John
   - Last Name: Doe
   - Email: john@example.com
   - Phone: +212600000000
   - Password: password123
   - Role: Client
3. Click "Register"
4. Should redirect to /dashboard

### 4. Test Login
1. Logout from dashboard
2. Go to http://localhost:3000/login
3. Enter credentials:
   - Email: john@example.com
   - Password: password123
4. Click "Login"
5. Should redirect to /dashboard

### 5. Test Protected Routes
1. Open browser in incognito mode
2. Try to access http://localhost:3000/dashboard
3. Should redirect to /login

### 6. Test API Endpoints (Swagger)
1. Go to http://localhost:3001/api
2. Test POST /auth/register
3. Test POST /auth/login
4. Copy the token from response
5. Click "Authorize" button
6. Paste token as: Bearer YOUR_TOKEN
7. Test GET /auth/profile

### 7. Test Different Roles
Register users with different roles:
- CLIENT: Regular user
- DRIVER: Driver user
- ADMIN: Administrator (manually change in database)

## 📊 Database Check

```bash
cd backend
mongosh
```

Check the User table for created accounts.

## 🔐 Security Features

✅ Password hashing with bcrypt
✅ JWT token authentication
✅ Protected routes
✅ Role-based access control
✅ CORS protection
✅ Input validation

## 🎯 Next Steps

Ready to implement:
- Vehicle Management Module
- Driver Management Module
- Reservation System
- Payment Integration
