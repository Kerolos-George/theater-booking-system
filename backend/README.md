# Theater Booking Backend

Backend API for theater booking system built with NestJS, Prisma, and Supabase.

## Features

- User management (name, email, phone)
- Booking system with date/time uniqueness
- Localization support (Arabic/English)
- Receipt upload to Supabase storage
- RESTful API endpoints

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database (Supabase or local)
- Supabase account with storage bucket configured

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file in the backend directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/theater_booking?schema=public"
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   PORT=3000
   NODE_ENV=development
   ```

3. **Set up Supabase:**
   - Create a Supabase project
   - Create a storage bucket named `booking`
   - Make the bucket public or configure proper access policies for receipt files
   - Get your Supabase URL and Service Role Key from the project settings (Settings > API)
   - The Service Role Key is required for server-side file uploads

4. **Run Prisma migrations:**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **Start the development server:**
   ```bash
   npm run start:dev
   ```

The API will be available at `http://localhost:3000`

## API Endpoints

### Bookings

- `POST /bookings` - Create a new booking
  - Body: FormData with fields: name, email, phone, bookingType, price, date, time, reason (optional), receipt (file, optional)
  
- `GET /bookings` - Get all bookings
  - Query params: `locale` (optional, 'ar' or 'en')
  
- `GET /bookings/:id` - Get booking by ID
  - Query params: `locale` (optional, 'ar' or 'en')
  
- `GET /bookings/user/:email` - Get bookings by user email
  - Query params: `locale` (optional, 'ar' or 'en')
  
- `GET /bookings/available-times` - Get available time slots for a date
  - Query params: `date` (ISO date string)

## Database Schema

### User
- id (UUID)
- name (String)
- email (String, unique)
- phone (String)
- createdAt, updatedAt

### Booking
- id (UUID)
- userId (UUID, foreign key to User)
- typeAr, typeEn (String) - Localized booking type
- price (Decimal)
- reasonAr, reasonEn (String?, optional) - Localized reason
- date (Date)
- time (String) - Time as string (e.g., "10:00 AM")
- receiptUrl (String?, optional) - URL to receipt in Supabase storage
- createdAt, updatedAt
- Unique constraint on (date, time)

## Booking Types

- `premium` - Premium Theater Experience
- `standard` - Standard Theater Show
- `matinee` - Matinee Performance
- `group` - Group Booking (5+ people)
- `vip` - VIP Theater Package

## Development

- Run in development mode: `npm run start:dev`
- Build for production: `npm run build`
- Run production build: `npm run start:prod`
- Open Prisma Studio: `npm run prisma:studio`

## Notes

- Date and time combination must be unique (enforced at database level)
- Receipt uploads are stored in Supabase storage bucket named `booking`
- File uploads include:
  - Automatic retry logic (up to 3 attempts)
  - 25-second timeout per attempt
  - File size validation (max 10MB)
  - File type validation (JPG, PNG, GIF, PDF only)
  - Automatic filename generation with unique timestamps
- All booking types are automatically translated to Arabic and English
- Time slots are: 10:00 AM, 12:00 PM, 2:00 PM, 4:00 PM, 6:00 PM, 8:00 PM, 10:00 PM

