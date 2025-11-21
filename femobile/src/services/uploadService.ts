/**
 * Upload Service - Handle file uploads
 */

import { httpClient } from './httpClient';

export interface UploadImageResponse {
  imageUrl: string;
  fileName: string;
  fileSize: number;
}

class UploadService {
  /**
   * Upload booking image
   * @param imageUri - Local URI of the image
   * @returns Upload response with image URL
   */
  async uploadBookingImage(imageUri: string): Promise<UploadImageResponse> {
    try {
      // Create FormData
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || `booking-image-${Date.now()}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      // Upload to backend
      const response = await httpClient.post<UploadImageResponse>(
        '/upload/booking-image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Upload failed');
    } catch (error: any) {
      console.error('[UploadService] Error uploading booking image:', error);
      throw new Error(error.message || 'Không thể upload ảnh');
    }
  }

  /**
   * Upload general image
   * @param imageUri - Local URI of the image
   * @returns Upload response with image URL
   */
  async uploadImage(imageUri: string): Promise<UploadImageResponse> {
    try {
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || `image-${Date.now()}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      const response = await httpClient.post<UploadImageResponse>(
        '/upload/image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.message || 'Upload failed');
    } catch (error: any) {
      console.error('[UploadService] Error uploading image:', error);
      throw new Error(error.message || 'Không thể upload ảnh');
    }
  }
}

export const uploadService = new UploadService();
