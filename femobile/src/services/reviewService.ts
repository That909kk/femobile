import { httpClient } from './httpClient';

export interface ReviewCriterion {
  criterionId: number;
  criterionName: string;
  description: string;
  maxScore: number;
  displayOrder: number;
}

export interface ReviewRating {
  criterionId: number;
  score: number;
}

export interface CreateReviewRequest {
  bookingId: string;
  employeeId: string;
  ratings: ReviewRating[];
  comment?: string;
}

export interface Review {
  reviewId: string;
  customerName: string;
  customerAvatar?: string;
  ratings: Array<{
    criterionName: string;
    score: number;
  }>;
  comment?: string;
  createdAt: string;
}

export interface EmployeeReviewSummary {
  employeeId: string;
  employeeName: string;
  totalReviews: number;
  averageRating: number;
  criteriaAverages: Array<{
    criterionName: string;
    averageScore: number;
  }>;
}

class ReviewService {
  private readonly BASE_PATH = '/reviews';

  async getReviewCriteria(): Promise<ReviewCriterion[]> {
    const response = await httpClient.get<ReviewCriterion[]>(`${this.BASE_PATH}/criteria`);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the tai tieu chi danh gia');
    }

    return response.data;
  }

  async createReview(reviewData: CreateReviewRequest): Promise<boolean> {
    const response = await httpClient.post<{ success: boolean; message: string }>(
      this.BASE_PATH,
      reviewData,
    );

    if (!response.success) {
      throw new Error(response.message || 'Khong the tao danh gia');
    }

    return response.data?.success ?? response.success;
  }

  async getEmployeeReviews(
    employeeId: string,
    params?: { page?: number; size?: number; sort?: string },
  ): Promise<{ content: Review[]; totalElements: number; totalPages: number }> {
    const query = new URLSearchParams();
    if (typeof params?.page === 'number') query.append('page', params.page.toString());
    if (typeof params?.size === 'number') query.append('size', params.size.toString());
    if (params?.sort) query.append('sort', params.sort);

    const endpoint = `/employees/${employeeId}/reviews${query.toString() ? `?${query.toString()}` : ''}`;

    const response = await httpClient.get<{
      content: Review[];
      totalElements: number;
      totalPages: number;
    }>(endpoint);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the tai danh sach danh gia');
    }

    return response.data;
  }

  async getEmployeeReviewSummary(employeeId: string): Promise<EmployeeReviewSummary> {
    const response = await httpClient.get<EmployeeReviewSummary>(
      `/employees/${employeeId}/reviews/summary`,
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khong the tai thong ke danh gia');
    }

    return response.data;
  }
}

export const reviewService = new ReviewService();
