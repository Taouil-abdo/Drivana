# Drivana - Car Rental Platform with Driver Option

A full-stack web platform for renting cars with optional driver service.

## Tech Stack

### Backend
- **NestJS** - Node.js framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Swagger** - API Documentation

### Frontend
- **Next.js 14** - React framework
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety
- **Axios** - HTTP client

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB (v6+)
- npm or yarn

### 1. Database Setup
Start MongoDB locally (default: `mongodb://localhost:27017`).

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
npm run start:dev
```

Backend: http://localhost:3001
API Docs: http://localhost:3001/api

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:3000

## Environment Variables

### Backend (.env)
```env
DATABASE_URL="mongodb://localhost:27017/drivana"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Available Scripts

### Backend
- `npm run start:dev` - Development mode
- `npm run build` - Build for production
- `npm run start:prod` - Production mode
- `mongosh` - Database shell

### Frontend
- `npm run dev` - Development mode
- `npm run build` - Build for production
- `npm run start` - Production mode
