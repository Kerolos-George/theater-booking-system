import { IsString, IsEmail, IsNotEmpty, IsOptional, IsNumber, IsDateString, Min } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  bookingType: string; // This will be mapped to typeAr and typeEn

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsOptional()
  reason?: string; // This will be mapped to reasonAr and reasonEn

  @IsDateString()
  @IsNotEmpty()
  date: string; // ISO date string

  @IsString()
  @IsNotEmpty()
  time: string; // Time as string (e.g., "10:00 AM")
}

