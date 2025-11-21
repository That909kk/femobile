import { httpClient } from './httpClient';

export type MediaType = 'CHECK_IN_IMAGE' | 'CHECK_OUT_IMAGE' | 'BOOKING_IMAGE' | 'OTHER';

export interface BookingMedia {
  mediaId: string;
  bookingId: string;
  assignmentId?: string;
  mediaType: MediaType;
  mediaUrl: string;
  description?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface BookingMediaResponse {
  success: boolean;
  message?: string;
  data: BookingMedia[];
}

class BookingMediaService {
  private readonly BASE_PATH = '/booking-media';

  async getMediaByAssignment(assignmentId: string): Promise<BookingMedia[]> {
    const response = await httpClient.get<BookingMediaResponse>(
      `${this.BASE_PATH}/assignment/${assignmentId}`,
    );

    if (!response.success) {
      throw new Error(response.message || 'Khong the lay danh sach media cua assignment');
    }

    return response.data?.data || [];
  }

  async getMediaByBooking(bookingId: string): Promise<BookingMedia[]> {
    const response = await httpClient.get<BookingMediaResponse>(
      `${this.BASE_PATH}/booking/${bookingId}`,
    );

    if (!response.success) {
      throw new Error(response.message || 'Khong the lay danh sach media cua booking');
    }

    return response.data?.data || [];
  }
}

export const bookingMediaService = new BookingMediaService();
