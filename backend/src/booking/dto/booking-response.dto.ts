export class BookingResponseDto {
  id: string;
  userId: string;
  typeAr: string;
  typeEn: string;
  price: number;
  reasonAr?: string;
  reasonEn?: string;
  date: Date;
  time: string;
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

