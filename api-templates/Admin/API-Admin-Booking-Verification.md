# Admin Booking Verification API

Tài liệu này mô tả API endpoint cho Admin để duyệt hoặc từ chối các bài đăng booking của khách hàng.

## Base URL
```
/api/v1/customer/bookings
```

## Authentication
Tất cả các endpoints yêu cầu:
- Header: `Authorization: Bearer <token>`
- Role: `ADMIN`

---

## QUẢN LÝ XÁC MINH BOOKING

### Duyệt/Từ chối Booking
```http
PUT /api/v1/customer/bookings/admin/{bookingId}/verify
```

**Path Parameters:**
- `bookingId` (required): String - ID của booking cần xác minh

**Mô tả:**
Admin sử dụng endpoint này để:
- **Duyệt** booking: Set `isVerified = true`, có thể kèm comment
- **Từ chối** booking: Set `isVerified = false`, `status = CANCELLED`, kèm lý do từ chối

**Request Body - Duyệt booking:**
```json
{
  "approve": true,
  "adminComment": "Booking đã được duyệt. Chúc quý khách có trải nghiệm tốt!"
}
```

**Request Body - Từ chối booking:**
```json
{
  "approve": false,
  "rejectionReason": "Thông tin địa chỉ không rõ ràng, vui lòng cập nhật lại địa chỉ chính xác."
}
```

**Request Body - Từ chối với admin comment:**
```json
{
  "approve": false,
  "rejectionReason": "Dịch vụ không khả dụng tại khu vực này",
  "adminComment": "Hiện tại chúng tôi chưa cung cấp dịch vụ tại quận này. Vui lòng chọn địa chỉ khác."
}
```

**Validation:**
- `approve`: Bắt buộc, phải là boolean (`true` hoặc `false`)
- `rejectionReason`: Tùy chọn, nên có khi `approve = false`
- `adminComment`: Tùy chọn, có thể dùng cho cả duyệt và từ chối

**Lưu ý:**
- Khi `approve = false`: Nên có `rejectionReason` để khách hàng biết lý do
- `rejectionReason` sẽ được lưu vào field `adminComment` của booking
- Nếu cả `rejectionReason` và `adminComment` đều có, `rejectionReason` sẽ được ưu tiên

**Response - Duyệt Booking thành công:

```json
{
  "success": true,
  "message": "Chấp nhận bài post thành công",
  "data": {
    "bookingId": "550e8400-e29b-41d4-a716-446655440000",
    "bookingCode": "BK0001234567",
    "customer": {
      "customerId": "cust-123",
      "fullName": "Nguyễn Văn A",
      "phoneNumber": "0901234567"
    },
    "address": {
      "addressId": "addr-123",
      "street": "123 Đường ABC",
      "ward": "Phường 1",
      "district": "Quận 1",
      "city": "TP. Hồ Chí Minh"
    },
    "bookingTime": "2025-01-15T09:00:00",
    "status": "PENDING",
    "isVerified": true,
    "adminComment": "Booking đã được duyệt. Chúc quý khách có trải nghiệm tốt!",
    "totalAmount": 500000.00,
    "bookingDetails": [
      {
        "service": {
          "serviceId": 1,
          "name": "Dọn dẹp theo giờ"
        },
        "quantity": 2,
        "unitPrice": 60000.00,
        "subtotal": 120000.00
      }
    ],
    "createdAt": "2025-01-10T10:30:00",
    "updatedAt": "2025-01-10T14:20:00"
  }
}
```

**Response - Từ chối Booking thành công:**
```json
{
  "success": true,
  "message": "Từ chối bài post thành công",
  "data": {
    "bookingId": "550e8400-e29b-41d4-a716-446655440000",
    "bookingCode": "BK0001234567",
    "customer": {
      "customerId": "cust-123",
      "fullName": "Nguyễn Văn A",
      "phoneNumber": "0901234567"
    },
    "status": "CANCELLED",
    "isVerified": false,
    "adminComment": "Thông tin địa chỉ không rõ ràng, vui lòng cập nhật lại địa chỉ chính xác.",
    "totalAmount": 500000.00,
    "createdAt": "2025-01-10T10:30:00",
    "updatedAt": "2025-01-10T14:25:00"
  }
}
```

---

## Error Responses

### 400 Bad Request
**Booking đã được verify:**
```json
{
  "success": false,
  "message": "Booking này đã được xác minh trước đó"
}
```

**Validation Error:**
```json
{
  "success": false,
  "message": "Quyết định xác minh không được để trống"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Không tìm thấy booking với ID: 550e8400-e29b-41d4-a716-446655440000"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Admin role required."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Đã xảy ra lỗi khi xác minh booking"
}
```

---

## Use Cases

### 1. Duyệt booking đơn giản
```http
PUT /api/v1/customer/bookings/admin/550e8400-e29b-41d4-a716-446655440000/verify
Content-Type: application/json
Authorization: Bearer YOUR_ADMIN_TOKEN

{
  "approve": true
}
```

### 2. Duyệt booking với comment động viên
```http
PUT /api/v1/customer/bookings/admin/550e8400-e29b-41d4-a716-446655440000/verify
Content-Type: application/json
Authorization: Bearer YOUR_ADMIN_TOKEN

{
  "approve": true,
  "adminComment": "Cảm ơn quý khách đã tin tưởng sử dụng dịch vụ. Chúng tôi sẽ phục vụ tận tình!"
}
```

### 3. Từ chối booking vì địa chỉ không rõ
```http
PUT /api/v1/customer/bookings/admin/550e8400-e29b-41d4-a716-446655440000/verify
Content-Type: application/json
Authorization: Bearer YOUR_ADMIN_TOKEN

{
  "approve": false,
  "rejectionReason": "Địa chỉ cung cấp không đầy đủ. Vui lòng bổ sung số nhà, tên đường cụ thể."
}
```

---

## Notes

1. **Quy trình xác minh:**
   - Chỉ ADMIN mới có quyền duyệt/từ chối booking
   - Booking chỉ được verify một lần - Một khi đã verify (approve hoặc reject), không thể verify lại
   
2. **Logic nghiệp vụ:**
   - **Khi approve:**
     - `isVerified` = `true`
     - `status` không thay đổi (giữ nguyên PENDING)
     - Có thể thêm `adminComment` (tùy chọn)
   - **Khi reject:**
     - `isVerified` = `false`
     - `status` = `CANCELLED`
     - Nên có `rejectionReason` để thông báo cho khách hàng
     - `rejectionReason` được lưu vào `adminComment`

3. **Thông báo cho khách hàng:**
   - Hiện tại có TODO để gửi notification cho khách hàng
   - Cần implement notification service để tự động thông báo kết quả verify

4. **Admin Comment:**
   - Khi reject: `rejectionReason` sẽ được lưu vào `adminComment`
   - Khi approve: `adminComment` (nếu có) sẽ được lưu trực tiếp
   - Field `adminComment` trong database có thể chứa cả lý do từ chối hoặc comment duyệt

5. **Best Practices:**
   - Luôn cung cấp `rejectionReason` khi reject để khách hàng hiểu rõ lý do
   - Sử dụng `adminComment` để thêm thông tin hữu ích cho khách hàng
   - Kiểm tra kỹ thông tin booking trước khi approve/reject

6. **Permissions:**
   - Endpoint yêu cầu role `ADMIN`
   - Token phải hợp lệ và không hết hạn
   - Chỉ có thể verify booking một lần duy nhất
