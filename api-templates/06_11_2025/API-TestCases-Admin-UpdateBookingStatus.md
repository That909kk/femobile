# API Test Cases - Admin Update Booking Status

## Endpoint Information
- **URL**: `PUT /api/v1/admin/bookings/{bookingId}/status`
- **Authentication**: Required (ROLE_ADMIN)
- **Authorization**: Admin only

---

## Test Cases

### Test Case 1: Update PENDING Booking to CONFIRMED
**Request**:
```http
PUT /api/v1/admin/bookings/b0000001-0000-0000-0000-000000000003/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
    "status": "CONFIRMED",
    "adminComment": "Đã xác nhận booking cho khách hàng Nguyễn Văn An"
}
```

**Expected Response (200 OK)**:
```json
{
    "data": {
        "success": true,
        "message": "Đặt lịch thành công",
        "data": {
            "bookingId": "b0000001-0000-0000-0000-000000000003",
            "bookingCode": "BK000003",
            "customerId": "c1000001-0000-0000-0000-000000000004",
            "customerName": "Nguyễn Văn An",
            "customer": {
                "customerId": "c1000001-0000-0000-0000-000000000004",
                "fullName": "Nguyễn Văn An",
                "avatar": "https://i.pravatar.cc/150?img=11",
                "email": "nguyenvanan@gmail.com",
                "phoneNumber": "0987654321",
                "isMale": true,
                "birthdate": "1995-03-15",
                "rating": null,
                "vipLevel": null
            },
            "address": {
                "addressId": "adrs0001-0000-0000-0000-000000000009",
                "fullAddress": "45 Nguyễn Huệ, Phường Bến Nghé, Thành phố Hồ Chí Minh",
                "ward": "Phường Bến Nghé",
                "city": "Thành phố Hồ Chí Minh",
                "latitude": 10.7743,
                "longitude": 106.7043,
                "isDefault": true
            },
            "bookingTime": "2025-11-01T08:00:00",
            "note": "Cần vệ sinh tổng quát căn hộ 2 phòng ngủ.",
            "totalAmount": 200000.00,
            "formattedTotalAmount": "200,000đ",
            "status": "CONFIRMED",
            "title": null,
            "imageUrls": [],
            "isVerified": true,
            "adminComment": "Đã xác nhận booking cho khách hàng Nguyễn Văn An",
            "promotion": null,
            "bookingDetails": [
                {
                    "bookingDetailId": "bd000001-0000-0000-0000-000000000003",
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
                    "pricePerUnit": 200000.00,
                    "formattedPricePerUnit": "200,000đ",
                    "subTotal": 200000.00,
                    "formattedSubTotal": "200,000đ",
                    "selectedChoices": [],
                    "assignments": [],
                    "duration": "2 giờ",
                    "formattedDuration": "2 giờ"
                }
            ],
            "payment": null,
            "createdAt": "2025-11-05T19:33:26"
        }
    },
    "success": true,
    "message": "Cập nhật trạng thái booking thành công"
}
```

---

### Test Case 2: Update PENDING Booking to IN_PROGRESS
**Request**:
```http
PUT /api/v1/admin/bookings/b0000001-0000-0000-0000-000000000004/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
    "status": "IN_PROGRESS",
    "adminComment": "Nhân viên đang thực hiện dịch vụ giặt ủi"
}
```

**Expected Response (200 OK)**:
```json
{
    "data": {
        "success": true,
        "message": "Đặt lịch thành công",
        "data": {
            "bookingId": "b0000001-0000-0000-0000-000000000004",
            "bookingCode": "BK000004",
            "customerId": "c1000001-0000-0000-0000-000000000005",
            "customerName": "Trần Thị Bích",
            "customer": {
                "customerId": "c1000001-0000-0000-0000-000000000005",
                "fullName": "Trần Thị Bích",
                "avatar": "https://i.pravatar.cc/150?img=5",
                "email": "tranthibich@gmail.com",
                "phoneNumber": "0976543210",
                "isMale": false,
                "birthdate": "1998-07-22",
                "rating": null,
                "vipLevel": null
            },
            "address": {
                "addressId": "adrs0001-0000-0000-0000-000000000010",
                "fullAddress": "128 Trần Hưng Đạo, Phường Cầu Kho, Thành phố Hồ Chí Minh",
                "ward": "Phường Cầu Kho",
                "city": "Thành phố Hồ Chí Minh",
                "latitude": 10.7657,
                "longitude": 106.6921,
                "isDefault": true
            },
            "bookingTime": "2025-11-02T10:00:00",
            "note": "Giặt ủi 10kg quần áo gia đình.",
            "totalAmount": 150000.00,
            "formattedTotalAmount": "150,000đ",
            "status": "IN_PROGRESS",
            "title": null,
            "imageUrls": [],
            "isVerified": true,
            "adminComment": "Nhân viên đang thực hiện dịch vụ giặt ủi",
            "promotion": null,
            "bookingDetails": [
                {
                    "bookingDetailId": "bd000001-0000-0000-0000-000000000004",
                    "service": {
                        "serviceId": 5,
                        "name": "Giặt sấy theo kg",
                        "description": "Giặt và sấy khô quần áo thông thường, giao nhận tận nơi.",
                        "basePrice": 30000.00,
                        "unit": "Kg",
                        "estimatedDurationHours": 24.0,
                        "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757601210/shirt_nmee0d.png",
                        "categoryName": "Giặt ủi",
                        "isActive": true
                    },
                    "quantity": 10,
                    "pricePerUnit": 150000.00,
                    "formattedPricePerUnit": "150,000đ",
                    "subTotal": 150000.00,
                    "formattedSubTotal": "150,000đ",
                    "selectedChoices": [],
                    "assignments": [],
                    "duration": "24 giờ",
                    "formattedDuration": "24 giờ"
                }
            ],
            "payment": null,
            "createdAt": "2025-11-05T19:33:26"
        }
    },
    "success": true,
    "message": "Cập nhật trạng thái booking thành công"
}
```

---

### Test Case 3: Update PENDING Booking to COMPLETED
**Request**:
```http
PUT /api/v1/admin/bookings/b0000001-0000-0000-0000-000000000005/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
    "status": "COMPLETED",
    "adminComment": "Dịch vụ vệ sinh sofa đã hoàn thành xuất sắc"
}
```

**Expected Response (200 OK)**:
```json
{
    "data": {
        "success": true,
        "message": "Đặt lịch thành công",
        "data": {
            "bookingId": "b0000001-0000-0000-0000-000000000005",
            "bookingCode": "BK000005",
            "customerId": "c1000001-0000-0000-0000-000000000006",
            "customerName": "Lê Văn Cường",
            "customer": {
                "customerId": "c1000001-0000-0000-0000-000000000006",
                "fullName": "Lê Văn Cường",
                "avatar": "https://i.pravatar.cc/150?img=12",
                "email": "levancuong@gmail.com",
                "phoneNumber": "0965432109",
                "isMale": true,
                "birthdate": "1992-11-08",
                "rating": null,
                "vipLevel": null
            },
            "address": {
                "addressId": "adrs0001-0000-0000-0000-000000000011",
                "fullAddress": "234 Võ Văn Tần, Phường Võ Thị Sáu, Thành phố Hồ Chí Minh",
                "ward": "Phường Võ Thị Sáu",
                "city": "Thành phố Hồ Chí Minh",
                "latitude": 10.7788,
                "longitude": 106.6897,
                "isDefault": true
            },
            "bookingTime": "2025-11-03T14:00:00",
            "note": "Vệ sinh sofa 3 chỗ và 2 ghế đơn.",
            "totalAmount": 200000.00,
            "formattedTotalAmount": "200,000đ",
            "status": "COMPLETED",
            "title": null,
            "imageUrls": [],
            "isVerified": true,
            "adminComment": "Dịch vụ vệ sinh sofa đã hoàn thành xuất sắc",
            "promotion": null,
            "bookingDetails": [
                {
                    "bookingDetailId": "bd000001-0000-0000-0000-000000000005",
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
                    "pricePerUnit": 80000.00,
                    "formattedPricePerUnit": "80,000đ",
                    "subTotal": 160000.00,
                    "formattedSubTotal": "160,000đ",
                    "selectedChoices": [],
                    "assignments": [],
                    "duration": "3 giờ",
                    "formattedDuration": "3 giờ"
                }
            ],
            "payment": null,
            "createdAt": "2025-11-05T19:33:26"
        }
    },
    "success": true,
    "message": "Cập nhật trạng thái booking thành công"
}
```

---

### Test Case 4: Update PENDING Booking to CANCELLED
**Request**:
```http
PUT /api/v1/admin/bookings/b0000001-0000-0000-0000-000000000006/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
    "status": "CANCELLED",
    "adminComment": "Khách hàng yêu cầu hủy do thay đổi lịch trình"
}
```

**Expected Response (200 OK)**:
```json
{
    "data": {
        "success": true,
        "message": "Đặt lịch thành công",
        "data": {
            "bookingId": "b0000001-0000-0000-0000-000000000006",
            "bookingCode": "BK000006",
            "customerId": "c1000001-0000-0000-0000-000000000007",
            "customerName": "Phạm Thị Dung",
            "customer": {
                "customerId": "c1000001-0000-0000-0000-000000000007",
                "fullName": "Phạm Thị Dung",
                "avatar": "https://i.pravatar.cc/150?img=9",
                "email": "phamthidung@gmail.com",
                "phoneNumber": "0954321098",
                "isMale": false,
                "birthdate": "1996-05-30",
                "rating": null,
                "vipLevel": null
            },
            "address": {
                "addressId": "adrs0001-0000-0000-0000-000000000012",
                "fullAddress": "567 Cách Mạng Tháng 8, Phường Phạm Ngũ Lão, Thành phố Hồ Chí Minh",
                "ward": "Phường Phạm Ngũ Lão",
                "city": "Thành phố Hồ Chí Minh",
                "latitude": 10.7843,
                "longitude": 106.6801,
                "isDefault": true
            },
            "bookingTime": "2025-11-04T09:30:00",
            "note": "Vệ sinh 2 máy lạnh trong phòng.",
            "totalAmount": 50000.00,
            "formattedTotalAmount": "50,000đ",
            "status": "CANCELLED",
            "title": null,
            "imageUrls": [],
            "isVerified": true,
            "adminComment": "Khách hàng yêu cầu hủy do thay đổi lịch trình",
            "promotion": null,
            "bookingDetails": [
                {
                    "bookingDetailId": "bd000001-0000-0000-0000-000000000006",
                    "service": {
                        "serviceId": 4,
                        "name": "Vệ sinh máy lạnh",
                        "description": "Bảo trì, làm sạch dàn nóng và dàn lạnh, bơm gas nếu cần.",
                        "basePrice": 150000.00,
                        "unit": "Máy",
                        "estimatedDurationHours": 1.0,
                        "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757600733/cooler_rnyppn.png",
                        "categoryName": "Dọn dẹp nhà",
                        "isActive": true
                    },
                    "quantity": 2,
                    "pricePerUnit": 25000.00,
                    "formattedPricePerUnit": "25,000đ",
                    "subTotal": 50000.00,
                    "formattedSubTotal": "50,000đ",
                    "selectedChoices": [],
                    "assignments": [],
                    "duration": "1 giờ",
                    "formattedDuration": "1 giờ"
                }
            ],
            "payment": null,
            "createdAt": "2025-11-05T19:33:26"
        }
    },
    "success": true,
    "message": "Cập nhật trạng thái booking thành công"
}
```

---

### Test Case 5: Update Status Without Admin Comment
**Request**:
```http
PUT /api/v1/admin/bookings/b0000001-0000-0000-0000-000000000007/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
    "status": "CONFIRMED"
}
```

**Expected Response (200 OK)**:
```json
{
    "data": {
        "success": true,
        "message": "Đặt lịch thành công",
        "data": {
            "bookingId": "b0000001-0000-0000-0000-000000000007",
            "bookingCode": "BK000007",
            "customerId": "c1000001-0000-0000-0000-000000000008",
            "customerName": "Hoàng Văn Em",
            "customer": {
                "customerId": "c1000001-0000-0000-0000-000000000008",
                "fullName": "Hoàng Văn Em",
                "avatar": "https://i.pravatar.cc/150?img=13",
                "email": "hoangvanem@gmail.com",
                "phoneNumber": "0943210987",
                "isMale": true,
                "birthdate": "1994-09-12",
                "rating": null,
                "vipLevel": null
            },
            "address": {
                "addressId": "adrs0001-0000-0000-0000-000000000013",
                "fullAddress": "89 Lý Thường Kiệt, Phường Nguyễn Cư Trinh, Thành phố Hồ Chí Minh",
                "ward": "Phường Nguyễn Cư Trinh",
                "city": "Thành phố Hồ Chí Minh",
                "latitude": 10.7993,
                "longitude": 106.6554,
                "isDefault": true
            },
            "bookingTime": "2025-11-05T11:00:00",
            "note": "Nấu ăn cho gia đình 6 người, 2 bữa.",
            "totalAmount": 330000.00,
            "formattedTotalAmount": "330,000đ",
            "status": "CONFIRMED",
            "title": null,
            "imageUrls": [],
            "isVerified": true,
            "adminComment": null,
            "promotion": null,
            "bookingDetails": [
                {
                    "bookingDetailId": "bd000001-0000-0000-0000-000000000007",
                    "service": {
                        "serviceId": 7,
                        "name": "Nấu ăn gia đình",
                        "description": "Đi chợ (chi phí thực phẩm tính riêng) và chuẩn bị bữa ăn cho gia đình theo thực đơn yêu cầu.",
                        "basePrice": 60000.00,
                        "unit": "Giờ",
                        "estimatedDurationHours": 2.5,
                        "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757601546/pan_ysmoql.png",
                        "categoryName": "Việc nhà khác",
                        "isActive": true
                    },
                    "quantity": 4,
                    "pricePerUnit": 350000.00,
                    "formattedPricePerUnit": "350,000đ",
                    "subTotal": 350000.00,
                    "formattedSubTotal": "350,000đ",
                    "selectedChoices": [],
                    "assignments": [],
                    "duration": "2 giờ 30 phút",
                    "formattedDuration": "2 giờ 30 phút"
                }
            ],
            "payment": null,
            "createdAt": "2025-11-05T19:33:26"
        }
    },
    "success": true,
    "message": "Cập nhật trạng thái booking thành công"
}
```

---

### Test Case 6: Update CONFIRMED Booking to AWAITING_EMPLOYEE
**Request**:
```http
PUT /api/v1/admin/bookings/b0000001-0000-0000-0000-000000000002/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
    "status": "AWAITING_EMPLOYEE",
    "adminComment": "Chuyển về trạng thái chờ nhân viên do nhân viên ban đầu không khả dụng"
}
```

**Expected Response (200 OK)**:
```json
{
    "data": {
        "success": true,
        "message": "Đặt lịch thành công",
        "data": {
            "bookingId": "b0000001-0000-0000-0000-000000000002",
            "bookingCode": "BK000002",
            "customerId": "c1000001-0000-0000-0000-000000000003",
            "customerName": "Jane Smith Customer",
            "customer": {
                "customerId": "c1000001-0000-0000-0000-000000000003",
                "fullName": "Jane Smith Customer",
                "avatar": "https://picsum.photos/200",
                "email": "jane.smith.customer@example.com",
                "phoneNumber": "0912345678",
                "isMale": false,
                "birthdate": "2003-04-14",
                "rating": null,
                "vipLevel": null
            },
            "address": {
                "addressId": "adrs0001-0000-0000-0000-000000000003",
                "fullAddress": "104 Lê Lợi, Phường Bến Nghé, Thành phố Hồ Chí Minh",
                "ward": "Phường Bến Nghé",
                "city": "Thành phố Hồ Chí Minh",
                "latitude": 10.8142,
                "longitude": 106.6938,
                "isDefault": true
            },
            "bookingTime": "2025-08-28T14:00:00",
            "note": "Vui lòng đến đúng giờ.",
            "totalAmount": 108000.00,
            "formattedTotalAmount": "108,000đ",
            "status": "AWAITING_EMPLOYEE",
            "title": null,
            "imageUrls": [],
            "isVerified": true,
            "adminComment": "Chuyển về trạng thái chờ nhân viên do nhân viên ban đầu không khả dụng",
            "promotion": {
                "promotionId": 2,
                "promoCode": "KHAITRUONG10",
                "description": "Giảm 10% mừng khai trương",
                "discountType": "PERCENTAGE",
                "discountValue": 10.00,
                "maxDiscountAmount": 50000.00
            },
            "bookingDetails": [
                {
                    "bookingDetailId": "bd000001-0000-0000-0000-000000000002",
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
                    "quantity": 2,
                    "pricePerUnit": 60000.00,
                    "formattedPricePerUnit": "60,000đ",
                    "subTotal": 120000.00,
                    "formattedSubTotal": "120,000đ",
                    "selectedChoices": [],
                    "assignments": [
                        {
                            "assignmentId": "as000001-0000-0000-0000-000000000002",
                            "employee": {
                                "employeeId": "e1000001-0000-0000-0000-000000000001",
                                "fullName": "Jane Smith",
                                "email": "jane.smith@example.com",
                                "phoneNumber": "0912345678",
                                "avatar": "https://picsum.photos/200",
                                "rating": null,
                                "employeeStatus": "AVAILABLE",
                                "skills": [
                                    "Cleaning",
                                    "Organizing"
                                ],
                                "bio": "Có kinh nghiệm dọn dẹp nhà cửa và sắp xếp đồ đạc."
                            },
                            "status": "ASSIGNED",
                            "checkInTime": null,
                            "checkOutTime": null,
                            "createdAt": null,
                            "updatedAt": null
                        }
                    ],
                    "duration": "2 giờ",
                    "formattedDuration": "2 giờ"
                }
            ],
            "payment": {
                "paymentId": "pay00001-0000-0000-0000-000000000002",
                "amount": 108000.00,
                "paymentMethod": "Ví điện tử Momo",
                "paymentStatus": "PENDING",
                "transactionCode": null,
                "createdAt": "2025-11-05 19:33:27",
                "paidAt": null
            },
            "createdAt": "2025-11-05T19:33:26"
        }
    },
    "success": true,
    "message": "Cập nhật trạng thái booking thành công"
}
```

---

### Test Case 7: Missing Required Field - Status
**Request**:
```http
PUT /api/v1/admin/bookings/b0000001-0000-0000-0000-000000000003/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
    "adminComment": "Test comment"
}
```

**Expected Response (400 Bad Request)**:
```json
{
    "success": false,
    "message": "Request validation failed",
    "errorCode": "VALIDATION_ERROR",
    "validationErrors": [
        "Status không được để trống"
    ],
    "conflicts": [],
    "timestamp": "2025-11-06T08:39:39.85380762"
}
```

---

### Test Case 8: Invalid Booking ID
**Request**:
```http
PUT /api/v1/admin/bookings/invalid-booking-id/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
    "status": "CONFIRMED",
    "adminComment": "Test comment"
}
```

**Expected Response (400 Bad Request)**:
```json
{
    "success": false,
    "message": "Không tìm thấy booking với ID: invalid-booking-id"
}
```

---

### Test Case 9: Unauthorized - No Token
**Request**:
```http
PUT /api/v1/admin/bookings/b0000001-0000-0000-0000-000000000003/status
Content-Type: application/json

{
    "status": "CONFIRMED",
    "adminComment": "Test comment"
}
```

**Expected Response (403 Forbidden)**:
```json
{
    "success": false,
    "message": "Access denied"
}
```

---

### Test Case 10: Forbidden - Non-Admin User (Customer Token)
**Request**:
```http
PUT /api/v1/admin/bookings/b0000001-0000-0000-0000-000000000003/status
Authorization: Bearer {customer_token}
Content-Type: application/json

{
    "status": "CONFIRMED",
    "adminComment": "Test comment"
}
```

**Expected Response (403 Forbidden)**:
```json
{
    "success": false,
    "message": "Access denied. Admin role required."
}
```

---

### Test Case 11: Get Booking Details by ID (Admin)
**Request**:
```http
GET /api/v1/admin/bookings/b0000001-0000-0000-0000-000000000003
Authorization: Bearer {admin_token}
```

**Expected Response (200 OK)**:
```json
{
    "success": true,
    "message": "Đặt lịch thành công",
    "data": {
        "bookingId": "b0000001-0000-0000-0000-000000000003",
        "bookingCode": "BK000003",
        "customerId": "c1000001-0000-0000-0000-000000000004",
        "customerName": "Nguyễn Văn An",
        "customer": {
            "customerId": "c1000001-0000-0000-0000-000000000004",
            "fullName": "Nguyễn Văn An",
            "avatar": "https://i.pravatar.cc/150?img=11",
            "email": "nguyenvanan@gmail.com",
            "phoneNumber": "0987654321",
            "isMale": true,
            "birthdate": "1995-03-15",
            "rating": null,
            "vipLevel": null
        },
        "address": {
            "addressId": "adrs0001-0000-0000-0000-000000000009",
            "fullAddress": "123 Đường Lê Văn Việt, Phường Tăng Nhơn Phú A",
            "ward": "Phường Tăng Nhơn Phú A",
            "city": "Thành phố Thủ Đức",
            "latitude": 10.8506,
            "longitude": 106.7629,
            "isDefault": true
        },
        "bookingTime": "2025-11-01T08:00:00",
        "note": "Cần vệ sinh tổng quát căn hộ 2 phòng ngủ.",
        "totalAmount": 500000.00,
        "formattedTotalAmount": "500.000 ₫",
        "status": "PENDING",
        "title": null,
        "imageUrls": [],
        "isVerified": false,
        "adminComment": null,
        "promotion": null,
        "bookingDetails": [
            {
                "id": "bd000001-0000-0000-0000-000000000003",
                "service": {
                    "serviceId": 2,
                    "name": "Tổng vệ sinh",
                    "description": "Dịch vụ vệ sinh tổng thể toàn bộ ngôi nhà",
                    "basePrice": 500000.00,
                    "unit": "lần",
                    "estimatedDurationHours": 4.0,
                    "iconUrl": "https://example.com/icons/deep-cleaning.png",
                    "categoryName": "Vệ sinh",
                    "isActive": true
                },
                "quantity": 1,
                "pricePerUnit": 500000.00,
                "formattedPricePerUnit": "500.000 ₫",
                "subTotal": 500000.00,
                "formattedSubTotal": "500.000 ₫",
                "selectedChoices": [],
                "assignments": [],
                "estimatedDuration": "4.0 giờ",
                "formattedEstimatedDuration": "4.0 giờ"
            }
        ],
        "payment": null,
        "createdAt": "2025-11-01T07:00:00"
    }
}
```

---

## Available Bookings in Seed Data

### PENDING Bookings (isVerified = false):
- **BK000003** (b0000001-0000-0000-0000-000000000003) - Customer: Nguyễn Văn An - 500,000 VND - Vệ sinh tổng quát
- **BK000004** (b0000001-0000-0000-0000-000000000004) - Customer: Trần Thị Bích - 300,000 VND - Giặt ủi 10kg
- **BK000005** (b0000001-0000-0000-0000-000000000005) - Customer: Lê Văn Cường - 350,000 VND - Vệ sinh sofa
- **BK000006** (b0000001-0000-0000-0000-000000000006) - Customer: Phạm Thị Dung - 400,000 VND - Vệ sinh máy lạnh
- **BK000007** (b0000001-0000-0000-0000-000000000007) - Customer: Hoàng Văn Em - 320,000 VND - Nấu ăn

### Other Bookings:
- **BK000001** (b0000001-0000-0000-0000-000000000001) - Status: COMPLETED, isVerified: true - 80,000 VND
- **BK000002** (b0000001-0000-0000-0000-000000000002) - Status: CONFIRMED, isVerified: true - 90,000 VND

---

## Notes

- **When admin updates booking status, `isVerified` is automatically set to `true`**
- The `adminComment` field is optional and provides audit trail for status changes
- **Customer information is now included in the response** with the following fields:
  - `customerId` - UUID của khách hàng
  - `fullName` - Tên đầy đủ của khách hàng
  - `avatar` - URL ảnh đại diện
  - `email` - Email của khách hàng
  - `phoneNumber` - Số điện thoại từ account
  - `isMale` - Giới tính (true: nam, false: nữ)
  - `birthdate` - Ngày sinh (format: yyyy-MM-dd)
  - `rating` - Đánh giá của khách hàng (nếu có)
  - `vipLevel` - Cấp độ VIP (nếu có)
- All valid BookingStatus enum values can be used: 
  - `PENDING` - Booking đang chờ xử lý
  - `AWAITING_EMPLOYEE` - Chờ nhân viên nhận việc
  - `CONFIRMED` - Đã xác nhận
  - `IN_PROGRESS` - Đang thực hiện
  - `COMPLETED` - Đã hoàn thành
  - `CANCELLED` - Đã hủy
- The endpoint requires `ROLE_ADMIN` authentication
- Use actual booking IDs (UUID format) in the URL path, not booking codes
- Status changes are persisted in the database and reflected in BookingResponse
