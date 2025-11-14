import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingResponseDto } from './dto/booking-response.dto';

@Injectable()
export class BookingService {
  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
  ) {}

  // Booking type mappings for localization
  private getBookingTypeTranslations(type: string): { typeAr: string; typeEn: string } {
    const types: Record<string, { ar: string; en: string }> = {
      premium: { ar: 'تجربة المسرح المميزة', en: 'Premium Theater Experience' },
      standard: { ar: 'عرض المسرح القياسي', en: 'Standard Theater Show' },
      matinee: { ar: 'عرض ما بعد الظهر', en: 'Matinee Performance' },
      group: { ar: 'حجز جماعي (5+ أشخاص)', en: 'Group Booking (5+ people)' },
      vip: { ar: 'باقة المسرح VIP', en: 'VIP Theater Package' },
    };

    const translation = types[type] || { ar: type, en: type };
    return {
      typeAr: translation.ar,
      typeEn: translation.en,
    };
  }

  async createBooking(
    createBookingDto: CreateBookingDto,
    receiptFile?: Express.Multer.File,
  ): Promise<BookingResponseDto> {
    // Check if date and time combination already exists
    const existingBooking = await this.prisma.booking.findFirst({
      where: {
        date: new Date(createBookingDto.date),
        time: createBookingDto.time,
      },
    });

    if (existingBooking) {
      throw new ConflictException(
        'This date and time slot is already booked. Please choose another time.',
      );
    }

    // Get or create user
    let user = await this.prisma.user.findUnique({
      where: { email: createBookingDto.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          name: createBookingDto.name,
          email: createBookingDto.email,
          phone: createBookingDto.phone,
        },
      });
    } else {
      // Update user info if changed
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          name: createBookingDto.name,
          phone: createBookingDto.phone,
        },
      });
    }

    // Get booking type translations
    const { typeAr, typeEn } = this.getBookingTypeTranslations(
      createBookingDto.bookingType,
    );

    // Handle receipt upload if provided
    let receiptUrl: string | null = null;
    if (receiptFile) {
      receiptUrl = await this.supabase.uploadReceipt(receiptFile, user.id);
    }

    // Create booking
    try {
      const booking = await this.prisma.booking.create({
        data: {
          userId: user.id,
          typeAr,
          typeEn,
          price: createBookingDto.price,
          reasonAr: createBookingDto.reason || null,
          reasonEn: createBookingDto.reason || null,
          date: new Date(createBookingDto.date),
          time: createBookingDto.time,
          receiptUrl,
        },
        include: {
          user: true,
        },
      });

      return this.mapToResponseDto(booking);
    } catch (error: any) {
      // Handle unique constraint violation
      if (error.code === 'P2002') {
        throw new ConflictException(
          'This date and time slot is already booked. Please choose another time.',
        );
      }
      throw error;
    }
  }

  async getAllBookings(locale: string = 'en'): Promise<BookingResponseDto[]> {
    const bookings = await this.prisma.booking.findMany({
      include: {
        user: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return bookings.map((booking) => this.mapToResponseDto(booking, locale));
  }

  async getBookingById(id: string, locale: string = 'en'): Promise<BookingResponseDto> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return this.mapToResponseDto(booking, locale);
  }

  async getBookingsByUser(email: string, locale: string = 'en'): Promise<BookingResponseDto[]> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return [];
    }

    const bookings = await this.prisma.booking.findMany({
      where: { userId: user.id },
      include: {
        user: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return bookings.map((booking) => this.mapToResponseDto(booking, locale));
  }

  async getAvailableTimeSlots(date: string): Promise<string[]> {
    const allTimeSlots = [
      '10:00 AM',
      '12:00 PM',
      '2:00 PM',
      '4:00 PM',
      '6:00 PM',
      '8:00 PM',
      '10:00 PM',
    ];

    const bookings = await this.prisma.booking.findMany({
      where: {
        date: new Date(date),
      },
      select: {
        time: true,
      },
    });

    const bookedTimes = new Set(bookings.map((b) => b.time));
    return allTimeSlots.filter((time) => !bookedTimes.has(time));
  }

  private mapToResponseDto(booking: any, locale: string = 'en'): BookingResponseDto {
    return {
      id: booking.id,
      userId: booking.userId,
      typeAr: booking.typeAr,
      typeEn: booking.typeEn,
      price: Number(booking.price),
      reasonAr: booking.reasonAr,
      reasonEn: booking.reasonEn,
      date: booking.date,
      time: booking.time,
      receiptUrl: booking.receiptUrl,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      user: {
        id: booking.user.id,
        name: booking.user.name,
        email: booking.user.email,
        phone: booking.user.phone,
      },
    };
  }
}

