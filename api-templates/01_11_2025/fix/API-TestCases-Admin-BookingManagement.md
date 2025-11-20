# API Test Cases - Admin Booking Management

## Overview
This document describes comprehensive test cases for the **Admin Booking Management** endpoints using realistic data from the housekeeping service database.  
**Base URL**: `/api/v1/admin`  
**Test Date Context**: November 1, 2025

---

## Test Case Structure
Each test case includes:
- **Test Case ID**: Unique identifier for the test case.
- **Description**: Purpose of the test.
- **Preconditions**: Requirements before executing the test.
- **Input**: Request data or headers.
- **Expected Output**: Expected response based on the API specification.
- **Status Code**: HTTP status code expected.

---

## Authentication Requirements
- **All Admin Endpoints**: ADMIN role required
- **Authorization Header**: `Bearer <valid_admin_token>`
- **Content-Type**: `application/json`

---

## API Endpoints Covered
1. **GET /bookings** - Get All Bookings Sorted by Booking Time
2. **GET /bookings/unverified** - Get Unverified Bookings
3. **PUT /bookings/{bookingId}/verify** - Verify or Reject Booking

---

## GET /bookings - Get All Bookings

### Test Case 1: Successful Retrieval of All Bookings
- **Test Case ID**: TC_ADMIN_ALL_BOOKINGS_001
- **Description**: Verify that admin can successfully retrieve all bookings sorted by booking time in descending order
- **Preconditions**:
  - Admin user exists with valid JWT token
  - Multiple bookings exist in the database with different booking times
  - Admin has ROLE_ADMIN authority
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    Content-Type: application/json
    ```
  - **Query Parameters**: 
    ```
    page = 1 (optional)
    size = 6 (optional)
    ```
- **Expected Output**:
  ```json
  {
    "totalItems": 17,
    "totalPages": 3,
    "data": [
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
                "createdAt": "2025-11-01T06:03:00"
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
                "createdAt": "2025-11-01T06:03:00"
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
                "createdAt": "2025-11-01T06:03:00"
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
                "createdAt": "2025-11-01T06:03:00"
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
                "createdAt": "2025-11-01T06:03:00"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "book0007-0000-0000-0000-000000000001",
                "bookingCode": "HKS000007",
                "customerId": "c1000001-0000-0000-0000-000000000001",
                "customerName": "John Doe",
                "address": {
                    "addressId": "adrs0001-0000-0000-0000-000000000007",
                    "fullAddress": "432 Võ Văn Tần, Phường Bàn Cờ, TP. Hồ Chí Minh",
                    "ward": "Phường Bàn Cờ",
                    "city": "TP. Hồ Chí Minh",
                    "latitude": 10.7756,
                    "longitude": 106.6914,
                    "isDefault": false
                },
                "bookingTime": "2025-10-06T16:00:00",
                "note": "Dọn dẹp sau tiệc, nhiều rác cần dọn",
                "totalAmount": 500000.00,
                "formattedTotalAmount": "500,000đ",
                "status": "CONFIRMED",
                "title": null,
                "imageUrl": null,
                "isVerified": true,
                "adminComment": null,
                "promotion": null,
                "bookingDetails": [
                    {
                        "bookingDetailId": "bd000007-0000-0000-0000-000000000001",
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
                        "pricePerUnit": 500000.00,
                        "formattedPricePerUnit": "500,000đ",
                        "subTotal": 500000.00,
                        "formattedSubTotal": "500,000đ",
                        "selectedChoices": [],
                        "assignments": [
                            {
                                "assignmentId": "assgn004-0000-0000-0000-000000000001",
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
                    "paymentId": "pay00004-0000-0000-0000-000000000001",
                    "amount": 500000.00,
                    "paymentMethod": null,
                    "paymentStatus": "PAID",
                    "transactionCode": "TXN20240926001",
                    "createdAt": "2025-11-01 06:03:00",
                    "paidAt": "2024-09-26 15:30:00"
                },
                "createdAt": "2025-11-01T06:03:00"
            }
        }
    ],
    "success": true,
    "currentPage": 1
  }
  ```
- **Status Code**: 200 OK

### Test Case 2: Unauthorized Access - Customer Role
- **Test Case ID**: TC_ADMIN_ALL_BOOKINGS_003
- **Description**: Verify that customer users cannot access admin-only endpoint
- **Preconditions**:
  - Customer user exists with valid JWT token
  - User has ROLE_CUSTOMER authority only
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    Content-Type: application/json
    ```
  - **Query Parameters**: 
    ```
    page = 0
    size = 10
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Access denied"
  }
  ```
- **Status Code**: 403 Forbidden

---

## GET /bookings/unverified - Get Unverified Bookings

### Test Case 5: Successful Retrieval of Unverified Bookings
- **Test Case ID**: TC_ADMIN_UNVERIFIED_001
- **Description**: Verify that admin can successfully retrieve unverified bookings for review
- **Preconditions**:
  - Admin user exists with valid JWT token
  - Multiple unverified bookings exist (booking posts)
  - Admin has ROLE_ADMIN authority
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    Content-Type: application/json
    ```
  - **Query Parameters**: 
    ```
    page = 0
    size = 2
    ```
- **Expected Output**:
  ```json
  {
    "totalItems": 5,
    "totalPages": 3,
    "data": [
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "b0000001-0000-0000-0000-000000000003",
                "bookingCode": "BK000003",
                "customerId": "c1000001-0000-0000-0000-000000000004",
                "customerName": "Nguyễn Văn An",
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
                "status": "PENDING",
                "title": null,
                "imageUrl": null,
                "isVerified": false,
                "adminComment": null,
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
                "createdAt": "2025-11-01T06:02:59"
            }
        },
        {
            "success": true,
            "message": "Đặt lịch thành công",
            "data": {
                "bookingId": "b0000001-0000-0000-0000-000000000004",
                "bookingCode": "BK000004",
                "customerId": "c1000001-0000-0000-0000-000000000005",
                "customerName": "Trần Thị Bích",
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
                "status": "PENDING",
                "title": null,
                "imageUrl": null,
                "isVerified": false,
                "adminComment": null,
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
                "createdAt": "2025-11-01T06:02:59"
            }
        }
    ],
    "success": true,
    "currentPage": 0
  }
  ```
- **Status Code**: 200 OK

### Test Case 6: Empty Unverified Bookings List
- **Test Case ID**: TC_ADMIN_UNVERIFIED_002
- **Description**: Verify proper handling when no unverified bookings exist
- **Preconditions**:
  - Admin user exists with valid JWT token
  - No unverified bookings in the database
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    Content-Type: application/json
    ```
  - **Query Parameters**: 
    ```
    page = 0
    size = 10
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "data": [],
    "currentPage": 0,
    "totalItems": 0,
    "totalPages": 0
  }
  ```
- **Status Code**: 200 OK

### Test Case 8: Unauthorized Access - Employee Role
- **Test Case ID**: TC_ADMIN_UNVERIFIED_004
- **Description**: Verify that employee users cannot access admin-only endpoint
- **Preconditions**:
  - Employee user exists with valid JWT token
  - User has ROLE_EMPLOYEE authority only
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <valid_employee_token>
    Content-Type: application/json
    ```
  - **Query Parameters**: 
    ```
    page = 0
    size = 10
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Access denied"
  }
  ```
- **Status Code**: 403 Forbidden

---

## PUT /bookings/{bookingId}/verify - Verify or Reject Booking

### Test Case 9: Successful Booking Approval
- **Test Case ID**: TC_ADMIN_VERIFY_001
- **Description**: Verify that admin can successfully approve an unverified booking post
- **Preconditions**:
  - Admin user exists with valid JWT token
  - Unverified booking exists with ID 'BK000010'
  - Booking has isVerified = false
  - Admin has ROLE_ADMIN authority
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    Content-Type: application/json
    ```
  - **Path Parameter**: bookingId = "b0000001-0000-0000-0000-000000000004"
  - **Request Body**:
    ```json
    {
      "approve": true,
      "rejectionReason": null
    }
    ```
- **Expected Output**:
  ```json
  {
    "message": "Chấp nhận bài post thành công",
    "data": {
        "success": true,
        "message": "Đặt lịch thành công",
        "data": {
            "bookingId": "b0000001-0000-0000-0000-000000000004",
            "bookingCode": "BK000004",
            "customerId": "c1000001-0000-0000-0000-000000000005",
            "customerName": "Trần Thị Bích",
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
            "status": "PENDING",
            "title": null,
            "imageUrl": null,
            "isVerified": true,
            "adminComment": null,
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
            "createdAt": "2025-11-01T06:02:59"
        }
    },
    "success": true
  }
  ```
- **Status Code**: 200 OK

### Test Case 10: Successful Booking Rejection
- **Test Case ID**: TC_ADMIN_VERIFY_002
- **Description**: Verify that admin can successfully reject an unverified booking post
- **Preconditions**:
  - Admin user exists with valid JWT token
  - Unverified booking exists with ID 'BK000011'
  - Booking has isVerified = false
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    Content-Type: application/json
    ```
  - **Path Parameter**: bookingId = "b0000001-0000-0000-0000-000000000003"
  - **Request Body**:
    ```json
    {
      "approve": false,
      "rejectionReason": "Thông tin dịch vụ không rõ ràng"
    }
    ```
- **Expected Output**:
  ```json
  {
    "message": "Từ chối bài post thành công",
    "data": {
        "success": true,
        "message": "Đặt lịch thành công",
        "data": {
            "bookingId": "b0000001-0000-0000-0000-000000000003",
            "bookingCode": "BK000003",
            "customerId": "c1000001-0000-0000-0000-000000000004",
            "customerName": "Nguyễn Văn An",
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
            "status": "CANCELLED",
            "title": null,
            "imageUrl": null,
            "isVerified": false,
            "adminComment": "Thông tin dịch vụ không rõ ràng",
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
            "createdAt": "2025-11-01T06:02:59"
        }
    },
    "success": true
  }
  ```
- **Status Code**: 200 OK

### Test Case 11: Verify Already Verified Booking
- **Test Case ID**: TC_ADMIN_VERIFY_003
- **Description**: Verify proper error handling when attempting to verify an already verified booking
- **Preconditions**:
  - Admin user exists with valid JWT token
  - Booking exists with ID 'BK000005'
  - Booking has isVerified = true
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    Content-Type: application/json
    ```
  - **Path Parameter**: bookingId = "b0000001-0000-0000-0000-000000000004"
  - **Request Body**:
    ```json
    {
      "approve": true
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Booking đã được xác minh trước đó"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 12: Verify Non-existent Booking
- **Test Case ID**: TC_ADMIN_VERIFY_004
- **Description**: Verify proper error handling when booking ID doesn't exist
- **Preconditions**:
  - Admin user exists with valid JWT token
  - Booking ID "NONEXISTENT" does not exist
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    Content-Type: application/json
    ```
  - **Path Parameter**: bookingId = "NONEXISTENT"
  - **Request Body**:
    ```json
    {
      "approve": true
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Booking not found with ID: NONEXISTENT"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 13: Rejection Without Reason
- **Test Case ID**: TC_ADMIN_VERIFY_005
- **Description**: Verify that rejection requires a rejection reason
- **Preconditions**:
  - Admin user exists with valid JWT token
  - Unverified booking exists
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    Content-Type: application/json
    ```
  - **Path Parameter**: bookingId = "b0000001-0000-0000-0000-000000000003"
  - **Request Body**:
    ```json
    {
      "approve": false,
      "rejectionReason": null
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Rejection reason is required when rejecting a booking"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 14: Missing Approve Field
- **Test Case ID**: TC_ADMIN_VERIFY_006
- **Description**: Verify that approve field is required
- **Preconditions**:
  - Admin user exists with valid JWT token
  - Unverified booking exists
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    Content-Type: application/json
    ```
  - **Path Parameter**: bookingId = "b0000001-0000-0000-0000-000000000003"
  - **Request Body**:
    ```json
    {
      "rejectionReason": "Some reason"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Approve field is required"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 15: Unauthorized Access - Customer Role
- **Test Case ID**: TC_ADMIN_VERIFY_007
- **Description**: Verify that customer users cannot verify bookings
- **Preconditions**:
  - Customer user exists with valid JWT token
  - Unverified booking exists
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    Content-Type: application/json
    ```
  - **Path Parameter**: bookingId = "b0000001-0000-0000-0000-000000000003"
  - **Request Body**:
    ```json
    {
      "approve": true
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Access denied"
  }
  ```
- **Status Code**: 403 Forbidden

### Test Case 20: Server Error Handling
- **Test Case ID**: TC_ADMIN_VERIFY_012
- **Description**: Verify proper error handling when an unexpected server error occurs
- **Preconditions**:
  - Admin user exists with valid JWT token
  - Database connection issue or internal error simulated
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    Content-Type: application/json
    ```
  - **Path Parameter**: bookingId = "BK000018"
  - **Request Body**:
    ```json
    {
      "approve": true
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Đã xảy ra lỗi khi xác minh booking"
  }
  ```
- **Status Code**: 500 Internal Server Error

---

## Database Integration Test Scenarios

### Test Case 21: Real Database Integration - All Admin Endpoints
- **Test Case ID**: TC_ADMIN_INTEGRATION_001
- **Description**: Verify integration with actual database data from housekeeping_service_v8.sql
- **Covered Data**:
  - **Admin Users**: Admin account with ROLE_ADMIN
  - **Bookings**: All bookings across all statuses and verification states
  - **Customers**: John Doe, Mary Jones, Jane Smith Customer, etc.
  - **Addresses**: Various addresses across different districts
  - **Services**: Active and inactive services
  - **Statuses**: PENDING, CONFIRMED, AWAITING_EMPLOYEE, IN_PROGRESS, COMPLETED, CANCELLED
- **Validation Points**:
  - All bookings retrieved regardless of status
  - Unverified bookings filtered correctly
  - Verification process updates database correctly
  - Booking status changes properly after verification
  - Customer, address, and promotion data properly joined
  - No N+1 query problems (uses LEFT JOIN FETCH)
  - Authorization correctly restricts access to admin users only
  - Notifications sent to customers after verification
  - Transaction rollback on errors

---

## Performance Considerations

### Resource Limits
- **Maximum Page Size**: 100 items (validated and capped)
- **Default Page Size**: 10 items
- **Minimum Page**: 0 (negative values automatically converted)

---

## Business Logic Validation

### Access Control
- **Admin Only**: All endpoints restricted to users with `ROLE_ADMIN` authority
- **Token Required**: Valid JWT token must be provided in Authorization header
- **Role Enforcement**: Spring Security's `@PreAuthorize` ensures proper authorization

### Verification Process
- **Approval Flow**:
  1. Admin approves booking
  2. `isVerified` set to `true`
  3. Status changes to `AWAITING_EMPLOYEE` (if no assignments) or `CONFIRMED` (if has assignments)
  4. Notification sent to customer
  5. Booking becomes visible for employee assignment

- **Rejection Flow**:
  1. Admin rejects booking with reason
  2. `isVerified` remains `false`
  3. Status changes to `CANCELLED`
  4. Rejection reason stored
  5. Notification sent to customer with reason
  6. Booking no longer available for assignment

### Data Completeness
- **All Bookings Endpoint**: Returns all bookings regardless of:
  - Status (PENDING, CONFIRMED, AWAITING_EMPLOYEE, IN_PROGRESS, COMPLETED, CANCELLED)
  - Verification state (verified or unverified)
  - Customer
  - Date range

- **Unverified Bookings Endpoint**: Returns only:
  - Bookings with `isVerified = false`
  - Sorted by `createdAt` descending (newest first)
  - Includes all necessary customer and booking details

### Sorting Logic
- **All Bookings**: `bookingTime` in descending order (newest booking times first)
- **Unverified Bookings**: `createdAt` in descending order (newest posts first)
- **Consistent Ordering**: Results are deterministic and reproducible

---

## Notes
- **Test Date Context**: All test cases assume current date is November 1, 2025
- **Real Data Integration**: Uses actual IDs, accounts, and service data from housekeeping_service_v8.sql
- **Authorization Pattern**: Follows same security pattern as other admin endpoints in the application
- **Response Format**: Consistent with other admin endpoints (success flag, data array/object, pagination info)
- **Error Handling**: Comprehensive error handling for authentication, authorization, validation, and server errors
- **Logging**: Detailed logging for monitoring and debugging purposes
- **Booking Post System**: 
  - Customers can create booking posts when they can't find suitable employees
  - Posts must be verified by admin before becoming active bookings
  - Admin can approve or reject posts
  - Rejection requires a reason
  - Customers receive notifications about verification results
- **Transaction Management**: 
  - Verification operations are atomic
  - Database rollback on errors
  - Status changes and notifications are consistent
