# API Test Cases - Revenue Statistics

## Endpoint: GET /api/v1/admin/statistics/revenue

### Authentication
- **Role Required**: ADMIN
- **Header**: `Authorization: Bearer {admin_token}`

### Query Parameters
| Parameter | Type | Required | Description | Values |
|-----------|------|----------|-------------|--------|
| period | String | No | Đơn vị thời gian | DAY, WEEK, MONTH, QUARTER, YEAR |
| startDate | Date | No* | Ngày bắt đầu (yyyy-MM-dd) | *Required nếu có endDate |
| endDate | Date | No* | Ngày kết thúc (yyyy-MM-dd) | *Required nếu có startDate |

### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| period | String | Đơn vị thời gian |
| startDate | String | Ngày bắt đầu (yyyy-MM-dd) |
| endDate | String | Ngày kết thúc (yyyy-MM-dd) |
| totalRevenue | BigDecimal | Tổng doanh thu (VND) |
| totalBookings | Long | Số lượng booking COMPLETED |
| averageRevenuePerBooking | BigDecimal | Doanh thu trung bình |
| maxBookingAmount | BigDecimal | Giá trị booking cao nhất |
| minBookingAmount | BigDecimal | Giá trị booking thấp nhất |

**Lưu ý**: Chỉ tính booking có status = **COMPLETED** và dựa trên **bookingTime**

---

## Test Cases

### TC-1: Get Daily Revenue Statistics
```http
GET /api/v1/admin/statistics/revenue?period=DAY&startDate=2025-08-20&endDate=2025-08-20
Authorization: Bearer {admin_token}
```

**Expected (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": "CUSTOM",
    "startDate": "2025-08-20",
    "endDate": "2025-08-20",
    "totalRevenue": 80000.00,
    "totalBookings": 1,
    "averageRevenuePerBooking": 80000.00,
    "maxBookingAmount": 80000.00,
    "minBookingAmount": 80000.00
  }
}
```

---

### TC-2: Get Weekly Revenue Statistics
```http
GET /api/v1/admin/statistics/revenue?period=WEEK
Authorization: Bearer {admin_token}
```

**Expected (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": "WEEK",
    "startDate": "2025-11-03",
    "endDate": "2025-11-09",
    "totalRevenue": 0.00,
    "totalBookings": 0,
    "averageRevenuePerBooking": 0.00,
    "maxBookingAmount": 0.00,
    "minBookingAmount": 0.00
  }
}
```

---

### TC-3: Get Monthly Revenue Statistics
```http
GET /api/v1/admin/statistics/revenue?startDate=2025-08-01&endDate=2025-08-31
Authorization: Bearer {admin_token}
```

**Expected (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": "CUSTOM",
    "startDate": "2025-08-01",
    "endDate": "2025-08-31",
    "totalRevenue": 80000.00,
    "totalBookings": 1,
    "averageRevenuePerBooking": 80000.00,
    "maxBookingAmount": 80000.00,
    "minBookingAmount": 80000.00
  }
}
```

---

### TC-4: Get Current Month Revenue (Default)
```http
GET /api/v1/admin/statistics/revenue?period=MONTH
Authorization: Bearer {admin_token}
```

**Expected (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": "MONTH",
    "startDate": "2025-11-01",
    "endDate": "2025-11-30",
    "totalRevenue": 0.00,
    "totalBookings": 0,
    "averageRevenuePerBooking": 0.00,
    "maxBookingAmount": 0.00,
    "minBookingAmount": 0.00
  }
}
```

---

### TC-5: Get Quarterly Revenue Statistics
```http
GET /api/v1/admin/statistics/revenue?period=QUARTER
Authorization: Bearer {admin_token}
```

**Expected (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": "QUARTER",
    "startDate": "2025-10-01",
    "endDate": "2025-12-31",
    "totalRevenue": 0.00,
    "totalBookings": 0,
    "averageRevenuePerBooking": 0.00,
    "maxBookingAmount": 0.00,
    "minBookingAmount": 0.00
  }
}
```

---

### TC-6: Get Yearly Revenue Statistics
```http
GET /api/v1/admin/statistics/revenue?period=YEAR
Authorization: Bearer {admin_token}
```

**Expected (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": "YEAR",
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "totalRevenue": 80000.00,
    "totalBookings": 1,
    "averageRevenuePerBooking": 80000.00,
    "maxBookingAmount": 80000.00,
    "minBookingAmount": 80000.00
  }
}
```

---

### TC-7: No Bookings in Date Range
```http
GET /api/v1/admin/statistics/revenue?startDate=2025-12-01&endDate=2025-12-31
Authorization: Bearer {admin_token}
```

**Expected (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": "CUSTOM",
    "startDate": "2025-12-01",
    "endDate": "2025-12-31",
    "totalRevenue": 0.00,
    "totalBookings": 0,
    "averageRevenuePerBooking": 0.00,
    "maxBookingAmount": 0.00,
    "minBookingAmount": 0.00
  }
}
```

---

## Error Test Cases

### TC-8: Invalid Period Value
```http
GET /api/v1/admin/statistics/revenue?period=INVALID
Authorization: Bearer {admin_token}
```

**Expected (400 Bad Request):**
```json
{
  "success": false,
  "message": "Period phải là DAY, WEEK, MONTH, QUARTER, hoặc YEAR"
}
```

---

### TC-9: Missing endDate
```http
GET /api/v1/admin/statistics/revenue?startDate=2025-10-01
Authorization: Bearer {admin_token}
```

**Expected (400 Bad Request):**
```json
{
  "success": false,
  "message": "Phải cung cấp cả startDate và endDate cho khoảng thời gian tùy chỉnh"
}
```

---

### TC-10: Missing startDate
```http
GET /api/v1/admin/statistics/revenue?endDate=2025-10-31
Authorization: Bearer {admin_token}
```

**Expected (400 Bad Request):**
```json
{
  "success": false,
  "message": "Phải cung cấp cả startDate và endDate cho khoảng thời gian tùy chỉnh"
}
```

---

### TC-11: startDate After endDate
```http
GET /api/v1/admin/statistics/revenue?startDate=2025-10-31&endDate=2025-10-01
Authorization: Bearer {admin_token}
```

**Expected (400 Bad Request):**
```json
{
  "success": false,
  "message": "startDate không thể sau endDate"
}
```

---

### TC-12: Invalid Date Format
```http
GET /api/v1/admin/statistics/revenue?startDate=2025/10/01&endDate=2025/10/31
Authorization: Bearer {admin_token}
```

**Expected (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid date format. Use ISO format: yyyy-MM-dd"
}
```

---

### TC-13: Unauthorized (No Token)
```http
GET /api/v1/admin/statistics/revenue?period=MONTH
```

**Expected (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Access token required"
}
```

---

### TC-14: Forbidden (Non-Admin)
```http
GET /api/v1/admin/statistics/revenue?period=MONTH
Authorization: Bearer {customer_token}
```

**Expected (403 Forbidden):**
```json
{
  "success": false,
  "message": "Access denied. Admin role required."
}
```


