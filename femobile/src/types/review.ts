// Review and Rating types

export interface Review {
  reviewId: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar?: string;
  rating: number;
  comment?: string;
  serviceId: number;
  serviceName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewRequest {
  bookingId: string;
  employeeId: string;
  rating: number;
  comment?: string;
}

export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
}

export interface ReviewList {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  page: number;
  totalPages: number;
}

export interface ReviewSummary {
  employeeId: string;
  averageRating: number;
  totalReviews: number;
  recentReviews: Review[];
}
