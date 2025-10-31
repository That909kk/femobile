# Booking Verified Awaiting Employee API

Tài liệu này mô tả API endpoint để lấy danh sách các booking đã được xác minh (isVerified = true) nhưng vẫn đang ở trạng thái AWAITING_EMPLOYEE (chờ nhân viên nhận việc).

## Base URL
```
/api/v1/employee/bookings
```

## Authentication
Endpoint này yêu cầu:
- Header: `Authorization: Bearer <token>`
- Role: `EMPLOYEE` hoặc `ADMIN`

---

## 1. LẤY DANH SÁCH BOOKING ĐÃ XÁC MINH ĐANG CHỜ NHÂN VIÊN

### Endpoint
```http
GET /api/v1/employee/bookings/verified-awaiting-employee?page=0&size=10
```

### Query Parameters
- `page` (optional, default: 0): Số trang (bắt đầu từ 0)
- `size` (optional, default: 10): Số lượng items trên mỗi trang (tối đa: 100)

### Headers
```
Authorization: Bearer <JWT_TOKEN>
```

### Permissions
- `ROLE_EMPLOYEE`: Nhân viên có thể xem để nhận việc
- `ROLE_ADMIN`: Admin có thể xem để quản lý

---

## 2. REQUEST EXAMPLES

### 2.1. Request với tham số mặc định
```http
GET /api/v1/employee/bookings/verified-awaiting-employee
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.2. Request với phân trang tùy chỉnh
```http
GET /api/v1/employee/bookings/verified-awaiting-employee?page=0&size=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.3. Request trang thứ 2
```http
GET /api/v1/employee/bookings/verified-awaiting-employee?page=1&size=10
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 3. RESPONSE

### 3.1. Success Response (200 OK)

```json
{
    "data": [
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "book0004-0000-0000-0000-000000000001",
                "bookingCode": "HKS000004",
                "customerId": "c1000001-0000-0000-0000-000000000001",
                "customerName": "John Doe",
                "address": {
                    "addressId": "adrs0001-0000-0000-0000-000000000004",
                    "fullAddress": "789 Nguyễn Văn Cừ, Phường Chợ Quán, TP. Hồ Chí Minh",
                    "ward": "Phường Chợ Quán",
                    "city": "TP. Hồ Chí Minh",
                    "latitude": 10.7594,
                    "longitude": 106.6822,
                    "isDefault": false
                },
                "bookingTime": "2025-10-05T08:00:00",
                "note": "Cần dọn dẹp tổng quát, chú ý khu vực bếp",
                "totalAmount": 450000.00,
                "formattedTotalAmount": "450,000đ",
                "status": "AWAITING_EMPLOYEE",
                "title": null,
                "imageUrl": null,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000004-0000-0000-0000-000000000001",
                        "service": {
                            "serviceId": 1,
                            "name": "Dọn dẹp theo giờ",
                            "description": "Lau dọn, hút bụi, làm sạch các bề mặt cơ bản trong nhà. Phù hợp cho nhu cầu duy trì vệ sinh hàng tuần.",
                            "basePrice": 50000.00,
                            "unit": "Giờ",
                            "estimatedDurationHours": 2.0,
                            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599899/Cleaning_Clock_z29juh.png",
                            "categoryName": "Dọn dẹp nhà",
                            "isActive": true
                        },
                        "quantity": 1,
                        "pricePerUnit": 450000.00,
                        "formattedPricePerUnit": "450,000đ",
                        "subTotal": 450000.00,
                        "formattedSubTotal": "450,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "2 giờ",
                        "formattedDuration": "2 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-10-30T14:37:36"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "book0005-0000-0000-0000-000000000001",
                "bookingCode": "HKS000005",
                "customerId": "c1000001-0000-0000-0000-000000000002",
                "customerName": "Mary Jones",
                "address": {
                    "addressId": "adrs0001-0000-0000-0000-000000000005",
                    "fullAddress": "321 Phan Văn Trị, Phường Bình Lợi Trung, TP. Hồ Chí Minh",
                    "ward": "Phường Bình Lợi Trung",
                    "city": "TP. Hồ Chí Minh",
                    "latitude": 10.8011,
                    "longitude": 106.7067,
                    "isDefault": false
                },
                "bookingTime": "2025-10-05T14:00:00",
                "note": "Ưu tiên dọn phòng khách và phòng ngủ",
                "totalAmount": 350000.00,
                "formattedTotalAmount": "350,000đ",
                "status": "AWAITING_EMPLOYEE",
                "title": null,
                "imageUrl": null,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000005-0000-0000-0000-000000000001",
                        "service": {
                            "serviceId": 1,
                            "name": "Dọn dẹp theo giờ",
                            "description": "Lau dọn, hút bụi, làm sạch các bề mặt cơ bản trong nhà. Phù hợp cho nhu cầu duy trì vệ sinh hàng tuần.",
                            "basePrice": 50000.00,
                            "unit": "Giờ",
                            "estimatedDurationHours": 2.0,
                            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599899/Cleaning_Clock_z29juh.png",
                            "categoryName": "Dọn dẹp nhà",
                            "isActive": true
                        },
                        "quantity": 1,
                        "pricePerUnit": 350000.00,
                        "formattedPricePerUnit": "350,000đ",
                        "subTotal": 350000.00,
                        "formattedSubTotal": "350,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "2 giờ",
                        "formattedDuration": "2 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-10-30T14:37:36"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "book0006-0000-0000-0000-000000000001",
                "bookingCode": "HKS000006",
                "customerId": "c1000001-0000-0000-0000-000000000003",
                "customerName": "Jane Smith Customer",
                "address": {
                    "addressId": "adrs0001-0000-0000-0000-000000000006",
                    "fullAddress": "567 Lý Thường Kiệt, Phường Tân Sơn Nhất, TP. Hồ Chí Minh",
                    "ward": "Phường Tân Sơn Nhất",
                    "city": "TP. Hồ Chí Minh",
                    "latitude": 10.7993,
                    "longitude": 106.6554,
                    "isDefault": false
                },
                "bookingTime": "2025-10-06T09:30:00",
                "note": "Cần giặt rèm cửa và thảm",
                "totalAmount": 600000.00,
                "formattedTotalAmount": "600,000đ",
                "status": "AWAITING_EMPLOYEE",
                "title": null,
                "imageUrl": null,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000006-0000-0000-0000-000000000001",
                        "service": {
                            "serviceId": 2,
                            "name": "Tổng vệ sinh",
                            "description": "Làm sạch sâu toàn diện, bao gồm các khu vực khó tiếp cận, trần nhà, lau cửa kính. Thích hợp cho nhà mới hoặc dọn dẹp theo mùa.",
                            "basePrice": 100000.00,
                            "unit": "Gói",
                            "estimatedDurationHours": 2.0,
                            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599581/house_cleaning_nob_umewqf.png",
                            "categoryName": "Dọn dẹp nhà",
                            "isActive": true
                        },
                        "quantity": 1,
                        "pricePerUnit": 400000.00,
                        "formattedPricePerUnit": "400,000đ",
                        "subTotal": 400000.00,
                        "formattedSubTotal": "400,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "2 giờ",
                        "formattedDuration": "2 giờ"
                    },
                    {
                        "bookingDetailId": "bd000006-0000-0000-0000-000000000002",
                        "service": {
                            "serviceId": 3,
                            "name": "Vệ sinh Sofa - Nệm - Rèm",
                            "description": "Giặt sạch và khử khuẩn Sofa, Nệm, Rèm cửa bằng máy móc chuyên dụng.",
                            "basePrice": 300000.00,
                            "unit": "Gói",
                            "estimatedDurationHours": 3.0,
                            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757600057/sofa_bed_vkkjz8.png",
                            "categoryName": "Dọn dẹp nhà",
                            "isActive": true
                        },
                        "quantity": 1,
                        "pricePerUnit": 200000.00,
                        "formattedPricePerUnit": "200,000đ",
                        "subTotal": 200000.00,
                        "formattedSubTotal": "200,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "3 giờ",
                        "formattedDuration": "3 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-10-30T14:37:36"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "book0008-0000-0000-0000-000000000001",
                "bookingCode": "HKS000008",
                "customerId": "c1000001-0000-0000-0000-000000000002",
                "customerName": "Mary Jones",
                "address": {
                    "addressId": "adrs0001-0000-0000-0000-000000000008",
                    "fullAddress": "876 Cách Mạng Tháng 8, Phường Tân Sơn Nhất, TP. Hồ Chí Minh",
                    "ward": "Phường Tân Sơn Nhất",
                    "city": "TP. Hồ Chí Minh",
                    "latitude": 10.7854,
                    "longitude": 106.6533,
                    "isDefault": false
                },
                "bookingTime": "2025-10-07T10:00:00",
                "note": "Vệ sinh tổng quát hàng tuần",
                "totalAmount": 400000.00,
                "formattedTotalAmount": "400,000đ",
                "status": "AWAITING_EMPLOYEE",
                "title": null,
                "imageUrl": null,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000008-0000-0000-0000-000000000001",
                        "service": {
                            "serviceId": 1,
                            "name": "Dọn dẹp theo giờ",
                            "description": "Lau dọn, hút bụi, làm sạch các bề mặt cơ bản trong nhà. Phù hợp cho nhu cầu duy trì vệ sinh hàng tuần.",
                            "basePrice": 50000.00,
                            "unit": "Giờ",
                            "estimatedDurationHours": 2.0,
                            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599899/Cleaning_Clock_z29juh.png",
                            "categoryName": "Dọn dẹp nhà",
                            "isActive": true
                        },
                        "quantity": 1,
                        "pricePerUnit": 400000.00,
                        "formattedPricePerUnit": "400,000đ",
                        "subTotal": 400000.00,
                        "formattedSubTotal": "400,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "2 giờ",
                        "formattedDuration": "2 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-10-30T14:37:36"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "book0009-0000-0000-0000-000000000001",
                "bookingCode": "HKS000009",
                "customerId": "c1000001-0000-0000-0000-000000000001",
                "customerName": "John Doe",
                "address": {
                    "addressId": "adrs0001-0000-0000-0000-000000000001",
                    "fullAddress": "123 Lê Trọng Tấn, Phường Tây Thạnh, Thành phố Hồ Chí Minh",
                    "ward": "Phường Tây Thạnh",
                    "city": "Thành phố Hồ Chí Minh",
                    "latitude": 10.7943,
                    "longitude": 106.6256,
                    "isDefault": true
                },
                "bookingTime": "2025-10-07T15:30:00",
                "note": "Cần dọn nhà trước khi có khách",
                "totalAmount": 300000.00,
                "formattedTotalAmount": "300,000đ",
                "status": "AWAITING_EMPLOYEE",
                "title": null,
                "imageUrl": null,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000009-0000-0000-0000-000000000001",
                        "service": {
                            "serviceId": 1,
                            "name": "Dọn dẹp theo giờ",
                            "description": "Lau dọn, hút bụi, làm sạch các bề mặt cơ bản trong nhà. Phù hợp cho nhu cầu duy trì vệ sinh hàng tuần.",
                            "basePrice": 50000.00,
                            "unit": "Giờ",
                            "estimatedDurationHours": 2.0,
                            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599899/Cleaning_Clock_z29juh.png",
                            "categoryName": "Dọn dẹp nhà",
                            "isActive": true
                        },
                        "quantity": 1,
                        "pricePerUnit": 300000.00,
                        "formattedPricePerUnit": "300,000đ",
                        "subTotal": 300000.00,
                        "formattedSubTotal": "300,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "2 giờ",
                        "formattedDuration": "2 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-10-30T14:37:36"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "book0010-0000-0000-0000-000000000001",
                "bookingCode": "HKS000010",
                "customerId": "c1000001-0000-0000-0000-000000000003",
                "customerName": "Jane Smith Customer",
                "address": {
                    "addressId": "adrs0001-0000-0000-0000-000000000003",
                    "fullAddress": "104 Lê Lợi, Phường Bến Nghé, Thành phố Hồ Chí Minh",
                    "ward": "Phường Bến Nghé",
                    "city": "Thành phố Hồ Chí Minh",
                    "latitude": 10.8142,
                    "longitude": 106.6938,
                    "isDefault": true
                },
                "bookingTime": "2025-10-08T08:30:00",
                "note": "Lau kính cửa sổ và ban công",
                "totalAmount": 250000.00,
                "formattedTotalAmount": "250,000đ",
                "status": "AWAITING_EMPLOYEE",
                "title": null,
                "imageUrl": null,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000010-0000-0000-0000-000000000001",
                        "service": {
                            "serviceId": 1,
                            "name": "Dọn dẹp theo giờ",
                            "description": "Lau dọn, hút bụi, làm sạch các bề mặt cơ bản trong nhà. Phù hợp cho nhu cầu duy trì vệ sinh hàng tuần.",
                            "basePrice": 50000.00,
                            "unit": "Giờ",
                            "estimatedDurationHours": 2.0,
                            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599899/Cleaning_Clock_z29juh.png",
                            "categoryName": "Dọn dẹp nhà",
                            "isActive": true
                        },
                        "quantity": 1,
                        "pricePerUnit": 250000.00,
                        "formattedPricePerUnit": "250,000đ",
                        "subTotal": 250000.00,
                        "formattedSubTotal": "250,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "2 giờ",
                        "formattedDuration": "2 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-10-30T14:37:36"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "book0011-0000-0000-0000-000000000001",
                "bookingCode": "HKS000011",
                "customerId": "c1000001-0000-0000-0000-000000000002",
                "customerName": "Mary Jones",
                "address": {
                    "addressId": "adrs0001-0000-0000-0000-000000000002",
                    "fullAddress": "456 Lê Lợi, Phường Bến Thành, Thành phố Hồ Chí Minh",
                    "ward": "Phường Bến Thành",
                    "city": "Thành phố Hồ Chí Minh",
                    "latitude": 10.7769,
                    "longitude": 106.7009,
                    "isDefault": true
                },
                "bookingTime": "2025-10-08T13:00:00",
                "note": "Dọn dẹp và sắp xếp tủ quần áo",
                "totalAmount": 350000.00,
                "formattedTotalAmount": "350,000đ",
                "status": "AWAITING_EMPLOYEE",
                "title": null,
                "imageUrl": null,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000011-0000-0000-0000-000000000001",
                        "service": {
                            "serviceId": 1,
                            "name": "Dọn dẹp theo giờ",
                            "description": "Lau dọn, hút bụi, làm sạch các bề mặt cơ bản trong nhà. Phù hợp cho nhu cầu duy trì vệ sinh hàng tuần.",
                            "basePrice": 50000.00,
                            "unit": "Giờ",
                            "estimatedDurationHours": 2.0,
                            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599899/Cleaning_Clock_z29juh.png",
                            "categoryName": "Dọn dẹp nhà",
                            "isActive": true
                        },
                        "quantity": 1,
                        "pricePerUnit": 350000.00,
                        "formattedPricePerUnit": "350,000đ",
                        "subTotal": 350000.00,
                        "formattedSubTotal": "350,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "2 giờ",
                        "formattedDuration": "2 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-10-30T14:37:36"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "book0012-0000-0000-0000-000000000001",
                "bookingCode": "HKS000012",
                "customerId": "c1000001-0000-0000-0000-000000000001",
                "customerName": "John Doe",
                "address": {
                    "addressId": "adrs0001-0000-0000-0000-000000000004",
                    "fullAddress": "789 Nguyễn Văn Cừ, Phường Chợ Quán, TP. Hồ Chí Minh",
                    "ward": "Phường Chợ Quán",
                    "city": "TP. Hồ Chí Minh",
                    "latitude": 10.7594,
                    "longitude": 106.6822,
                    "isDefault": false
                },
                "bookingTime": "2025-10-09T11:00:00",
                "note": "Vệ sinh máy lạnh và quạt trần",
                "totalAmount": 550000.00,
                "formattedTotalAmount": "550,000đ",
                "status": "AWAITING_EMPLOYEE",
                "title": null,
                "imageUrl": null,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000012-0000-0000-0000-000000000001",
                        "service": {
                            "serviceId": 2,
                            "name": "Tổng vệ sinh",
                            "description": "Làm sạch sâu toàn diện, bao gồm các khu vực khó tiếp cận, trần nhà, lau cửa kính. Thích hợp cho nhà mới hoặc dọn dẹp theo mùa.",
                            "basePrice": 100000.00,
                            "unit": "Gói",
                            "estimatedDurationHours": 2.0,
                            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599581/house_cleaning_nob_umewqf.png",
                            "categoryName": "Dọn dẹp nhà",
                            "isActive": true
                        },
                        "quantity": 1,
                        "pricePerUnit": 550000.00,
                        "formattedPricePerUnit": "550,000đ",
                        "subTotal": 550000.00,
                        "formattedSubTotal": "550,000đ",
                        "selectedChoices": [],
                        "assignments": [],
                        "duration": "2 giờ",
                        "formattedDuration": "2 giờ"
                    }
                ],
                "payment": null,
                "createdAt": "2025-10-30T14:37:36"
            }
        }
    ],
    "success": true,
    "currentPage": 0,
    "totalItems": 8,
    "totalPages": 1
}
```

---

## 4. ERROR RESPONSES

### 4.1. Unauthorized (401)
Khi không có token hoặc token không hợp lệ:
```json
{
  "timestamp": "2025-10-30T10:30:00.000+00:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "Full authentication is required to access this resource",
  "path": "/api/v1/employee/bookings/verified-awaiting-employee"
}
```

### 4.2. Forbidden (403)
Khi user không có quyền EMPLOYEE hoặc ADMIN:
```json
{
  "timestamp": "2025-10-30T10:30:00.000+00:00",
  "status": 403,
  "error": "Forbidden",
  "message": "Access Denied",
  "path": "/api/v1/employee/bookings/verified-awaiting-employee"
}
```

### 4.3. Internal Server Error (500)
Khi có lỗi server:
```json
{
  "success": false,
  "message": "Đã xảy ra lỗi khi lấy danh sách booking đã xác minh đang chờ nhân viên"
}
```
