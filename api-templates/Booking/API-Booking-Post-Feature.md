# Booking Post Feature API Documentation

## Tổng quan
Feature này cho phép customer tạo booking với hoặc không có nhân viên. Nếu không có nhân viên (assignments rỗng), booking tự động trở thành bài post cần admin xác minh.

## Luồng nghiệp vụ

### 1. Customer tạo booking

#### 1a. Tạo booking với nhân viên (booking thông thường)
- Customer tạo booking và chọn nhân viên (gọi `findSuitableEmployee`)
- Truyền `assignments` không rỗng trong request
- **Tự động**: `isVerified = true`, `status = PENDING/CONFIRMED`
- Không cần admin duyệt

**Request Body:**
```json
{
  "addressId": "...",
  "bookingTime": "2025-01-15T14:00:00",
  "note": "Cần dọn dẹp kỹ lưỡng",
  "bookingDetails": [...],
  "assignments": [
    {
      "employeeId": "emp001",
      "bookingDetailId": "detail001"
    }
  ],
  "paymentMethodId": 1
}
```

**Response (201 Created):**
```json
{
  "bookingId": "...",
  "bookingCode": "BK12345678",
  "status": "CONFIRMED",
  "totalAmount": 500000,
  "formattedTotalAmount": "500.000 ₫",
  "bookingTime": "2025-01-15T14:00:00",
  "createdAt": "2025-01-10T10:30:00",
  "title": null,
  "imageUrl": null,
  "isVerified": true,
  "adminComment": null,
  "customerInfo": {...},
  "serviceDetails": [...],
  "paymentInfo": {...},
  "assignedEmployees": [...],
  "totalServices": 2,
  "totalEmployees": 1
}
```

**Result:**
- `isVerified = true` ✅
- `status = CONFIRMED` (hoặc PENDING tùy logic)
- Booking được xử lý ngay lập tức

#### 1b. Tạo booking không có nhân viên (bài post)
- Customer tạo booking nhưng KHÔNG chọn nhân viên
- Truyền `assignments = []` (list rỗng) hoặc không truyền
- Có thể thêm `title` và `imageUrl` ngay khi tạo
- **Tự động**: `isVerified = false`, `status = AWAITING_EMPLOYEE`
- Cần admin duyệt

**Request Body:**
```json
{
  "addressId": "...",
  "bookingTime": "2025-01-15T14:00:00",
  "note": "Cần dọn dẹp kỹ lưỡng",
  "title": "Cần nhân viên dọn dẹp nhà cấp tốc",
  "imageUrl": "https://example.com/image.jpg",
  "bookingDetails": [...],
  "assignments": [],
  "paymentMethodId": 1
}
```

**Response (201 Created):**
```json
{
  "bookingId": "...",
  "bookingCode": "BK12345678",
  "status": "AWAITING_EMPLOYEE",
  "totalAmount": 500000,
  "formattedTotalAmount": "500.000 ₫",
  "bookingTime": "2025-01-15T14:00:00",
  "createdAt": "2025-01-10T10:30:00",
  "title": "Cần nhân viên dọn dẹp nhà cấp tốc",
  "imageUrl": "https://example.com/image.jpg",
  "isVerified": false,
  "adminComment": null,
  "customerInfo": {...},
  "serviceDetails": [...],
  "paymentInfo": {...},
  "assignedEmployees": [],
  "totalServices": 2,
  "totalEmployees": 0
}
```

**Result:**
- `isVerified = false` ❌ (cần admin duyệt)
- `status = AWAITING_EMPLOYEE`
- `title` và `imageUrl` được lưu
- Booking trở thành bài post chờ admin xác minh

### 2. Customer cập nhật title/image cho booking (tùy chọn)
Nếu customer tạo booking không có nhân viên nhưng chưa điền title/image, có thể cập nhật sau.

**Endpoint:** `PUT /api/v1/customer/bookings/{bookingId}/convert-to-post`

**Quyền:** `ROLE_CUSTOMER`

**Request Body:**
```json
{
  "title": "Cần nhân viên dọn dẹp nhà cấp tốc",
  "imageUrl": "https://example.com/image.jpg"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Chuyển booking thành bài post thành công",
  "data": {
    "bookingId": "...",
    "bookingCode": "BK12345678",
    "title": "Cần nhân viên dọn dẹp nhà cấp tốc",
    "imageUrl": "https://example.com/image.jpg",
    "isVerified": false,
    "status": "AWAITING_EMPLOYEE",
    ...
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Chỉ có thể chuyển booking có trạng thái AWAITING_EMPLOYEE thành bài post"
}
```

**Điều kiện:**
- Booking phải có status = `AWAITING_EMPLOYEE`
- Booking chưa có assignment nào

**Sau khi chuyển:**
- `title` và `imageUrl` được cập nhật
- `isVerified = false`
- Booking trở thành bài post chờ admin duyệt

### 3. Admin xem danh sách booking chưa được xác minh
**Endpoint:** `GET /api/v1/customer/bookings/admin/unverified`

**Quyền:** `ROLE_ADMIN`

**Query Parameters:**
- `page` (default: 0)
- `size` (default: 10, max: 100)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "bookingId": "...",
      "bookingCode": "BK12345678",
      "customerId": "...",
      "customerName": "Nguyễn Văn A",
      "title": "Cần nhân viên dọn dẹp nhà cấp tốc",
      "imageUrl": "https://example.com/image.jpg",
      "isVerified": false,
      "status": "AWAITING_EMPLOYEE",
      "bookingTime": "2025-01-15T14:00:00",
      "totalAmount": 500000,
      "createdAt": "2025-01-10T10:30:00",
      ...
    }
  ],
  "currentPage": 0,
  "totalItems": 25,
  "totalPages": 3
}
```

**Sắp xếp:**
- Theo `createdAt` giảm dần (mới nhất lên trước)

### 4. Admin phê duyệt hoặc từ chối booking post
**Endpoint:** `PUT /api/v1/customer/bookings/admin/{bookingId}/verify`

**Quyền:** `ROLE_ADMIN`

**Request Body (Approve):**
```json
{
  "approve": true,
  "adminComment": "Bài post hợp lệ, đã được duyệt"
}
```

**Request Body (Approve - without comment):**
```json
{
  "approve": true
}
```

**Request Body (Reject):**
```json
{
  "approve": false,
  "rejectionReason": "Thông tin không đầy đủ hoặc không phù hợp"
}
```

**Response Success - Approve (200):**
```json
{
  "success": true,
  "message": "Chấp nhận bài post thành công",
  "data": {
    "bookingId": "...",
    "isVerified": true,
    "status": "AWAITING_EMPLOYEE",
    "adminComment": "Bài post hợp lệ, đã được duyệt",
    ...
  }
}
```

**Response Success - Reject (200):**
```json
{
  "success": true,
  "message": "Từ chối bài post thành công",
  "data": {
    "bookingId": "...",
    "isVerified": false,
    "status": "CANCELLED",
    "adminComment": "Thông tin không đầy đủ hoặc không phù hợp",
    ...
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Booking này đã được xác minh trước đó"
}
```

**Xử lý:**
- **Approve (`approve: true`):**
  - `isVerified = true`
  - Status không đổi (`AWAITING_EMPLOYEE`)
  - Lưu `adminComment` nếu được cung cấp (tùy chọn)
  - TODO: Gửi thông báo cho customer về việc bài post được chấp nhận
  
- **Reject (`approve: false`):**
  - `status = CANCELLED`
  - Lưu `rejectionReason` vào `adminComment`
  - TODO: Gửi thông báo cho customer kèm `rejectionReason`

## Database Schema Changes

### Bảng `bookings`
Thêm 4 cột mới:
```sql
title VARCHAR(255),
image_url VARCHAR(500),
is_verified BOOLEAN NOT NULL DEFAULT TRUE,
admin_comment TEXT
```

### Indexes
```sql
CREATE INDEX idx_bookings_is_verified ON bookings(is_verified);
CREATE INDEX idx_bookings_is_verified_created_at ON bookings(is_verified, created_at DESC);
```

## Model Changes

### Booking.java
```java
@Column(name = "title", length = 255)
private String title;

@Column(name = "image_url", length = 500)
private String imageUrl;

@Column(name = "is_verified", nullable = false)
private Boolean isVerified = true;

@Column(name = "admin_comment", columnDefinition = "TEXT")
private String adminComment;
```

## DTO Changes

### ConvertBookingToPostRequest
```java
public record ConvertBookingToPostRequest(
    @NotBlank(message = "Tiêu đề không được để trống")
    String title,
    
    @NotBlank(message = "URL hình ảnh không được để trống")
    String imageUrl
) {}
```

### BookingVerificationRequest
```java
public record BookingVerificationRequest(
    @NotNull(message = "Quyết định xác minh không được để trống")
    Boolean approve,
    
    String rejectionReason,
    
    String adminComment
) {}
```

### BookingData
Thêm các field:
```java
private String title;
private String imageUrl;
private Boolean isVerified;
private String adminComment;
```

## Repository Changes

### BookingRepository
```java
// Find unverified bookings ordered by created date descending
@Query("SELECT b FROM Booking b " +
       "LEFT JOIN FETCH b.customer c " +
       "LEFT JOIN FETCH b.address a " +
       "WHERE b.isVerified = false " +
       "ORDER BY b.createdAt DESC")
Page<Booking> findUnverifiedBookingsOrderByCreatedAtDesc(Pageable pageable);

@Query("SELECT b FROM Booking b WHERE b.isVerified = false ORDER BY b.createdAt DESC")
List<Booking> findUnverifiedBookings();
```

### BookingDetailRepository
```java
List<BookingDetail> findByBooking_BookingId(String bookingId);
```

## Service Changes

### BookingService
```java
// Convert booking to post (when no employee is selected)
BookingResponse convertBookingToPost(String bookingId, ConvertBookingToPostRequest request);

// Get unverified bookings for admin review
Page<BookingResponse> getUnverifiedBookings(Pageable pageable);

// Admin verify/reject booking post
BookingResponse verifyBooking(String bookingId, BookingVerificationRequest request);
```

## TODO - Future Enhancements

1. **Notification System:**
   - Gửi thông báo cho customer khi bài post được approve
   - Gửi thông báo cho customer khi bài post bị reject (kèm lý do)

2. **Image Upload:**
   - Thêm endpoint để upload ảnh lên Cloudinary
   - Validate image format và size

3. **Search & Filter:**
   - Admin có thể search booking posts theo keyword
   - Filter theo ngày tạo, customer, status

4. **Analytics:**
   - Thống kê số lượng booking posts theo thời gian
   - Tỷ lệ approve/reject

5. **Auto-matching:**
   - Tự động match nhân viên phù hợp cho booking posts đã được approve
   - Gửi thông báo cho nhân viên về công việc mới

## Testing

### Test Cases

1. **Convert Booking to Post:**
   - ✅ Convert AWAITING_EMPLOYEE booking without assignments
   - ❌ Try to convert booking with assignments
   - ❌ Try to convert non-AWAITING_EMPLOYEE booking
   - ❌ Try to convert already verified booking

2. **Get Unverified Bookings:**
   - ✅ Admin fetches unverified bookings with pagination
   - ✅ Empty result when no unverified bookings
   - ❌ Non-admin tries to access

3. **Verify Booking:**
   - ✅ Admin approves booking post
   - ✅ Admin rejects booking post with reason
   - ❌ Try to verify already verified booking
   - ❌ Non-admin tries to verify

### Sample Data

Để test, có thể tạo một booking AWAITING_EMPLOYEE không có assignment rồi convert thành post.
