import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingResponseDto } from './dto/booking-response.dto';

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @UseInterceptors(FileInterceptor('receipt'))
  async createBooking(
    @Body() body: any,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|pdf)/ }),
        ],
      }),
    )
    receiptFile?: Express.Multer.File,
  ): Promise<BookingResponseDto> {
    // Parse FormData fields
    const createBookingDto: CreateBookingDto = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      bookingType: body.bookingType,
      price: parseFloat(body.price),
      date: body.date,
      time: body.time,
      reason: body.reason || undefined,
    };

    // Validate required fields
    if (!createBookingDto.name || !createBookingDto.email || !createBookingDto.phone ||
        !createBookingDto.bookingType || !createBookingDto.date || !createBookingDto.time) {
      throw new BadRequestException('Missing required fields');
    }

    if (isNaN(createBookingDto.price) || createBookingDto.price <= 0) {
      throw new BadRequestException('Invalid price');
    }

    return this.bookingService.createBooking(createBookingDto, receiptFile);
  }

  @Get()
  async getAllBookings(@Query('locale') locale?: string): Promise<BookingResponseDto[]> {
    return this.bookingService.getAllBookings(locale);
  }

  @Get('available-times')
  async getAvailableTimeSlots(@Query('date') date: string): Promise<string[]> {
    return this.bookingService.getAvailableTimeSlots(date);
  }

  @Get('user/:email')
  async getBookingsByUser(
    @Param('email') email: string,
    @Query('locale') locale?: string,
  ): Promise<BookingResponseDto[]> {
    return this.bookingService.getBookingsByUser(email, locale);
  }

  @Get(':id')
  async getBookingById(
    @Param('id') id: string,
    @Query('locale') locale?: string,
  ): Promise<BookingResponseDto> {
    return this.bookingService.getBookingById(id, locale);
  }
}

