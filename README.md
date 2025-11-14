# Theater Booking System

A full-stack theater booking system with React frontend and NestJS backend, using Prisma and Supabase.

## Project Structure

```
msr7/
├── frontend/          # React + TypeScript + Vite
├── backend/           # NestJS + Prisma + Supabase
└── README.md
```

## Features

- 🎭 Theater booking system
- 👤 User management (name, email, phone)
- 📅 Date and time slot booking with uniqueness validation
- 🌐 Localization support (Arabic/English)
- 📄 Receipt upload to Supabase storage
- ⚡ Real-time availability checking

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database (Supabase or local)
- Supabase account

## Quick Start

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/theater_booking?schema=public"
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   PORT=3000
   NODE_ENV=development
   ```

4. Set up the database:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. Start the backend server:
   ```bash
   npm run start:dev
   ```

The backend API will be available at `http://localhost:3000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (optional, defaults to `http://localhost:3000`):
   ```env
   VITE_API_URL=http://localhost:3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

## Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Create a storage bucket named `booking`
3. Configure the bucket permissions (public read access for receipt files)
4. Get your Supabase URL and Service Role Key from project settings (Settings > API)
5. Add them to the backend `.env` file

## API Endpoints

### Bookings

- `POST /bookings` - Create a new booking
- `GET /bookings` - Get all bookings
- `GET /bookings/:id` - Get booking by ID
- `GET /bookings/user/:email` - Get bookings by user email
- `GET /bookings/available-times?date=YYYY-MM-DD` - Get available time slots

## Database Schema

### User
- id (UUID)
- name, email, phone
- createdAt, updatedAt

### Booking
- id (UUID)
- userId (UUID, foreign key)
- typeAr, typeEn (localized booking type)
- price (Decimal)
- reasonAr, reasonEn (optional, localized)
- date (Date)
- time (String, e.g., "10:00 AM")
- receiptUrl (optional)
- createdAt, updatedAt
- Unique constraint on (date, time)

## Booking Types

- `premium` - Premium Theater Experience
- `standard` - Standard Theater Show
- `matinee` - Matinee Performance
- `group` - Group Booking (5+ people)
- `vip` - VIP Theater Package

## Development

### Backend
- Development: `npm run start:dev`
- Build: `npm run build`
- Production: `npm run start:prod`
- Prisma Studio: `npm run prisma:studio`

### Frontend
- Development: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`

## Notes

- Date and time combination must be unique (enforced at database level)
- Receipt uploads are stored in Supabase storage
- All booking types are automatically translated to Arabic and English
- Time slots: 10:00 AM, 12:00 PM, 2:00 PM, 4:00 PM, 6:00 PM, 8:00 PM, 10:00 PM

## License

MIT

