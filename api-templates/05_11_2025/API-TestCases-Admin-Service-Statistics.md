# API Test Examples - Admin Service Booking Statistics

## Endpoint
```
GET /api/v1/admin/statistics/service-bookings
```

## Description
API để admin lấy thống kê tỷ suất (tỷ lệ) các dịch vụ được đặt theo các khoảng thời gian: ngày, tuần, tháng, quý, năm hoặc khoảng thời gian tùy chỉnh.

## Authorization
- **Required:** Yes
- **Role:** ROLE_ADMIN
- **Header:** `Authorization: Bearer {token}`

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| period | String | No | MONTH | Khoảng thời gian: `DAY`, `WEEK`, `MONTH`, `QUARTER`, `YEAR` |
| startDate | Date (YYYY-MM-DD) | No | - | Ngày bắt đầu (cho khoảng thời gian tùy chỉnh) |
| endDate | Date (YYYY-MM-DD) | No | - | Ngày kết thúc (cho khoảng thời gian tùy chỉnh) |

## Business Logic

### Period Calculation:
- **DAY:** Từ 00:00:00 đến 23:59:59 của ngày hiện tại
- **WEEK:** Từ thứ 2 đến Chủ nhật của tuần hiện tại
- **MONTH:** Từ ngày 1 đến ngày cuối tháng hiện tại
- **QUARTER:** 
  - Q1: Tháng 1-3
  - Q2: Tháng 4-6
  - Q3: Tháng 7-9
  - Q4: Tháng 10-12
- **YEAR:** Từ ngày 1/1 đến 31/12 của năm hiện tại
- **CUSTOM:** Nếu cung cấp startDate và endDate

### Statistics Calculation:
- Đếm số lượng booking cho mỗi dịch vụ trong khoảng thời gian
- Tính phần trăm (%) của từng dịch vụ so với tổng số bookings
- Xếp hạng các dịch vụ theo số lượng booking (từ cao đến thấp)

## Test Cases

### Test Case 1: Thống kê theo ngày hiện tại
**Request:**
```http
GET /api/v1/admin/statistics/service-bookings?period=DAY
Authorization: Bearer {admin_token}
```

**Expected Response:**
```json
{
    "success": true,
    "data": {
        "period": "DAY",
        "startDate": "2025-11-05",
        "endDate": "2025-11-05",
        "totalBookings": 15,
        "serviceStatistics": [
            {
                "serviceId": "1",
                "serviceName": "Tổng vệ sinh nhà cửa",
                "bookingCount": 8,
                "percentage": 53.33,
                "rank": 1
            },
            {
                "serviceId": "2",
                "serviceName": "Vệ sinh văn phòng",
                "bookingCount": 4,
                "percentage": 26.67,
                "rank": 2
            },
            {
                "serviceId": "3",
                "serviceName": "Vệ sinh sofa, thảm",
                "bookingCount": 3,
                "percentage": 20.0,
                "rank": 3
            }
        ]
    }
}
```

### Test Case 2: Thống kê theo tuần hiện tại
**Request:**
```http
GET /api/v1/admin/statistics/service-bookings?period=WEEK
Authorization: Bearer {admin_token}
```

**Expected Response:**
```json
{
    "success": true,
    "data": {
        "period": "WEEK",
        "startDate": "2025-11-03",
        "endDate": "2025-11-09",
        "totalBookings": 45,
        "serviceStatistics": [
            {
                "serviceId": "1",
                "serviceName": "Tổng vệ sinh nhà cửa",
                "bookingCount": 18,
                "percentage": 40.0,
                "rank": 1
            },
            {
                "serviceId": "4",
                "serviceName": "Vệ sinh máy lạnh",
                "bookingCount": 12,
                "percentage": 26.67,
                "rank": 2
            },
            {
                "serviceId": "2",
                "serviceName": "Vệ sinh văn phòng",
                "bookingCount": 10,
                "percentage": 22.22,
                "rank": 3
            },
            {
                "serviceId": "3",
                "serviceName": "Vệ sinh sofa, thảm",
                "bookingCount": 5,
                "percentage": 11.11,
                "rank": 4
            }
        ]
    }
}
```

### Test Case 3: Thống kê theo tháng hiện tại (default)
**Request:**
```http
GET /api/v1/admin/statistics/service-bookings
Authorization: Bearer {admin_token}
```

**Expected Response:**
```json
{
    "success": true,
    "data": {
        "period": "MONTH",
        "startDate": "2025-11-01",
        "endDate": "2025-11-30",
        "totalBookings": 120,
        "serviceStatistics": [
            {
                "serviceId": "1",
                "serviceName": "Tổng vệ sinh nhà cửa",
                "bookingCount": 45,
                "percentage": 37.5,
                "rank": 1
            },
            {
                "serviceId": "2",
                "serviceName": "Vệ sinh văn phòng",
                "bookingCount": 32,
                "percentage": 26.67,
                "rank": 2
            },
            {
                "serviceId": "4",
                "serviceName": "Vệ sinh máy lạnh",
                "bookingCount": 25,
                "percentage": 20.83,
                "rank": 3
            },
            {
                "serviceId": "3",
                "serviceName": "Vệ sinh sofa, thảm",
                "bookingCount": 18,
                "percentage": 15.0,
                "rank": 4
            }
        ]
    }
}
```

### Test Case 4: Thống kê theo quý hiện tại
**Request:**
```http
GET /api/v1/admin/statistics/service-bookings?period=QUARTER
Authorization: Bearer {admin_token}
```

**Expected Response:**
```json
{
    "success": true,
    "data": {
        "period": "QUARTER",
        "startDate": "2025-10-01",
        "endDate": "2025-12-31",
        "totalBookings": 350,
        "serviceStatistics": [
            {
                "serviceId": "1",
                "serviceName": "Tổng vệ sinh nhà cửa",
                "bookingCount": 125,
                "percentage": 35.71,
                "rank": 1
            },
            {
                "serviceId": "2",
                "serviceName": "Vệ sinh văn phòng",
                "bookingCount": 98,
                "percentage": 28.0,
                "rank": 2
            },
            {
                "serviceId": "4",
                "serviceName": "Vệ sinh máy lạnh",
                "bookingCount": 72,
                "percentage": 20.57,
                "rank": 3
            },
            {
                "serviceId": "3",
                "serviceName": "Vệ sinh sofa, thảm",
                "bookingCount": 55,
                "percentage": 15.71,
                "rank": 4
            }
        ]
    }
}
```

### Test Case 5: Thống kê theo năm hiện tại
**Request:**
```http
GET /api/v1/admin/statistics/service-bookings?period=YEAR
Authorization: Bearer {admin_token}
```

**Expected Response:**
```json
{
    "success": true,
    "data": {
        "period": "YEAR",
        "startDate": "2025-01-01",
        "endDate": "2025-12-31",
        "totalBookings": 1200,
        "serviceStatistics": [
            {
                "serviceId": "1",
                "serviceName": "Tổng vệ sinh nhà cửa",
                "bookingCount": 420,
                "percentage": 35.0,
                "rank": 1
            },
            {
                "serviceId": "2",
                "serviceName": "Vệ sinh văn phòng",
                "bookingCount": 360,
                "percentage": 30.0,
                "rank": 2
            },
            {
                "serviceId": "4",
                "serviceName": "Vệ sinh máy lạnh",
                "bookingCount": 240,
                "percentage": 20.0,
                "rank": 3
            },
            {
                "serviceId": "3",
                "serviceName": "Vệ sinh sofa, thảm",
                "bookingCount": 180,
                "percentage": 15.0,
                "rank": 4
            }
        ]
    }
}
```

### Test Case 6: Thống kê theo khoảng thời gian tùy chỉnh
**Request:**
```http
GET /api/v1/admin/statistics/service-bookings?startDate=2025-10-01&endDate=2025-10-31
Authorization: Bearer {admin_token}
```

**Expected Response:**
```json
{
    "success": true,
    "data": {
        "period": "CUSTOM",
        "startDate": "2025-10-01",
        "endDate": "2025-10-31",
        "totalBookings": 95,
        "serviceStatistics": [
            {
                "serviceId": "1",
                "serviceName": "Tổng vệ sinh nhà cửa",
                "bookingCount": 38,
                "percentage": 40.0,
                "rank": 1
            },
            {
                "serviceId": "2",
                "serviceName": "Vệ sinh văn phòng",
                "bookingCount": 28,
                "percentage": 29.47,
                "rank": 2
            },
            {
                "serviceId": "4",
                "serviceName": "Vệ sinh máy lạnh",
                "bookingCount": 18,
                "percentage": 18.95,
                "rank": 3
            },
            {
                "serviceId": "3",
                "serviceName": "Vệ sinh sofa, thảm",
                "bookingCount": 11,
                "percentage": 11.58,
                "rank": 4
            }
        ]
    }
}
```

### Test Case 7: Không có dữ liệu trong khoảng thời gian
**Request:**
```http
GET /api/v1/admin/statistics/service-bookings?startDate=2025-12-01&endDate=2025-12-31
Authorization: Bearer {admin_token}
```

**Expected Response:**
```json
{
    "success": true,
    "data": {
        "period": "CUSTOM",
        "startDate": "2025-12-01",
        "endDate": "2025-12-31",
        "totalBookings": 0,
        "serviceStatistics": []
    }
}
```

## Error Cases

### Error Case 1: Period không hợp lệ
**Request:**
```http
GET /api/v1/admin/statistics/service-bookings?period=INVALID
Authorization: Bearer {admin_token}
```

**Expected Response:**
```json
{
    "success": false,
    "message": "Period phải là DAY, WEEK, MONTH, QUARTER, hoặc YEAR"
}
```

### Error Case 2: Thiếu endDate khi có startDate
**Request:**
```http
GET /api/v1/admin/statistics/service-bookings?startDate=2025-10-01
Authorization: Bearer {admin_token}
```

**Expected Response:**
```json
{
    "success": false,
    "message": "Phải cung cấp cả startDate và endDate cho khoảng thời gian tùy chỉnh"
}
```

### Error Case 3: startDate sau endDate
**Request:**
```http
GET /api/v1/admin/statistics/service-bookings?startDate=2025-10-31&endDate=2025-10-01
Authorization: Bearer {admin_token}
```

**Expected Response:**
```json
{
    "success": false,
    "message": "startDate không thể sau endDate"
}
```

### Error Case 4: Không có quyền truy cập (không phải admin)
**Request:**
```http
GET /api/v1/admin/statistics/service-bookings?period=MONTH
Authorization: Bearer {customer_token}
```

**Expected Response:**
```json
{
    "success": false,
    "message": "Access denied"
}
```
**Status Code:** 403 Forbidden

### Error Case 5: Không có token
**Request:**
```http
GET /api/v1/admin/statistics/service-bookings?period=MONTH
```

**Expected Response:**
```json
{
    "success": false,
    "message": "Unauthorized"
}
```
**Status Code:** 401 Unauthorized

## Use Cases

### Use Case 1: Dashboard Admin - Hiển thị Top Services
Admin xem dashboard và muốn biết top 5 dịch vụ được đặt nhiều nhất trong tháng để phân bổ nhân sự hợp lý.

### Use Case 2: Báo cáo Quarterly
Cuối mỗi quý, admin cần báo cáo tỷ suất các dịch vụ để đánh giá hiệu quả kinh doanh và lập kế hoạch marketing.

### Use Case 3: So sánh Year-over-Year
Admin muốn so sánh tỷ suất dịch vụ của năm nay với năm trước để đánh giá xu hướng phát triển.

### Use Case 4: Phân tích Custom Period
Admin muốn phân tích hiệu quả của chiến dịch marketing diễn ra từ ngày 15/10 đến 15/11.

## Notes

- Thống kê dựa trên `createdAt` của booking, không phải `bookingTime`
- Một booking có thể có nhiều booking details (nhiều services), mỗi service được đếm riêng
- Percentage được làm tròn đến 2 chữ số thập phân
- Services được sắp xếp theo số lượng booking giảm dần
- Rank được gán tự động từ 1 đến n theo thứ tự số lượng booking
