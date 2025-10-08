# API Test Cases - Booking Management

## Overview
This document describes the comprehensive test cases for the **Booking Management** endpoints of the Customer API.  
The endpoints allow customers to manage bookings including creation, retrieval, validation, and default address lookup with robust validation and error handling.  
**Base URL**: `/api/v1/customer/bookings`

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
All endpoints require:
- **Authorization Header**: `Bearer <valid_token>`
- **Content-Type**: `application/json` (for POST requests)
- **Role Requirements**: 
  - Booking endpoints: CUSTOMER or ADMIN role required
  - Default address: Token validation required

---

## New Validation Features (Updated Implementation)
- **Comprehensive Price Validation**: Automatic price calculation with tolerance of 1000 VND
- **Employee Conflict Detection**: Real-time availability checking with detailed conflict information
- **Service Choice Validation**: Validates choice IDs belong to the selected service
- **Business Hours Validation**: Booking time must be between 8:00 AM - 8:00 PM
- **Advance Booking Rules**: Minimum 2 hours advance, maximum 30 days ahead
- **Promotion Support**: Automatic promotion code validation and discount application
- **New Address Support**: Allows creating bookings with new addresses (including lat/lng)
- **Automatic Employee Requirement Calculation**: Calculates required employees based on service recommendations
- **Double Validation**: Validates both during validation endpoint and final booking creation

---

## Database Test Data
Based on housekeeping_service_v8.sql:
- **Sample Customer**: john_doe (c1000001-0000-0000-0000-000000000001)
- **Sample Employee**: jane_smith (e1000001-0000-0000-0000-000000000001)
- **Sample Address**: adrs0001-0000-0000-0000-000000000001 (default address)
- **Sample Services**: Service ID 2 "Tổng vệ sinh" with base price 500000 VND, recommended staff: 1
- **Service Choices**: Choice ID 2 "Nhà phố" (+200000), Choice ID 4 "Trên 80m²" (+200000)
- **Payment Methods**: Method ID 1 "MOMO", Method ID 2 "VNPAY"
- **Booking Statuses**: PENDING, AWAITING_EMPLOYEE, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
- **Promotions**: "NEWCUST10" (10% discount, max 50000), "SAVE20K" (20000 fixed discount)

---

## API Endpoints Covered
1. **GET /{customerId}/default-address** - Get Customer Default Address
2. **POST /** - Create Booking (with comprehensive validation)
3. **GET /{bookingId}** - Get Booking Details
4. **POST /validate** - Validate Booking Request (pre-validation)

---

## GET /{customerId}/default-address - Get Customer Default Address

### Test Case 1: Successfully Get Customer Default Address
- **Test Case ID**: TC_BOOKING_ADDRESS_001
- **Description**: Verify that a customer can retrieve their default address for booking.
- **Preconditions**: 
  - Customer is authenticated with valid token.
  - Customer has a default address.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/bookings/c1000001-0000-0000-0000-000000000001/default-address`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_john_doe>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "data": {
      "addressId": "adrs0001-0000-0000-0000-000000000001",
      "customerId": "c1000001-0000-0000-0000-000000000001",
      "fullAddress": "123 Lê Trọng Tấn, Tây Thạnh, Tân Phú, TP. Hồ Chí Minh",
      "ward": "Phường Tây Thạnh",
      "city": "TP. Hồ Chí Minh",
      "latitude": 10.7769,
      "longitude": 106.6601,
      "isDefault": true
    }
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 2: Customer Without Default Address
- **Test Case ID**: TC_BOOKING_ADDRESS_002
- **Description**: Verify error handling when customer has no default address.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/bookings/c1000001-0000-0000-0000-000000000999/default-address`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Khách hàng chưa có địa chỉ mặc định: c1000001-0000-0000-0000-000000000999"
  }
  ```
- **Status Code**: `404 Not Found`

---

### Test Case 3: Invalid Token
- **Test Case ID**: TC_BOOKING_ADDRESS_003
- **Description**: Verify error handling with invalid authentication token.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/bookings/c1000001-0000-0000-0000-000000000001/default-address`
  - **Headers**: 
    ```
    Authorization: Bearer invalid_token
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Token không hợp lệ"
  }
  ```
- **Status Code**: `401 Unauthorized`

---

## POST / - Create Booking (Enhanced with Comprehensive Validation)

### Test Case 4: Successfully Create Booking with Assignments
- **Test Case ID**: TC_BOOKING_004
- **Description**: Verify successful booking creation with employee assignments and comprehensive validation.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Valid address ID exists for customer.
  - Selected employees are available at booking time.
  - Payment method exists and is active.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/bookings`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "addressId": "adrs0001-0000-0000-0000-000000000001",
      "bookingTime": "2025-09-26T10:00:00",
      "note": "Cần dọn dẹp kỹ lưỡng phòng khách và bếp",
      "promoCode": null,
      "bookingDetails": [
        {
          "serviceId": 2,
          "quantity": 1,
          "expectedPrice": 700000,
          "expectedPricePerUnit": 700000,
          "selectedChoiceIds": [2, 4]
        }
      ],
      "assignments": [
        {
          "serviceId": 2,
          "employeeId": "e1000001-0000-0000-0000-000000000001"
        }
      ],
      "paymentMethodId": 1
    }
    ```
- **Expected Output**:
  ```json
  {
    "bookingId": "7a35373e-20c6-43a2-aab2-1486fb6c89e5",
    "bookingCode": "BK62589569",
    "status": "PENDING",
    "totalAmount": 700000.00,
    "formattedTotalAmount": "900,000đ",
    "bookingTime": "2025-09-26T10:00:00",
    "createdAt": "2025-09-24T14:39:22.589451644",
    "customerInfo": {
      "addressId": "adrs0001-0000-0000-0000-000000000001",
      "fullAddress": "123 Lê Trọng Tấn, Tây Thạnh, Tân Phú, TP. Hồ Chí Minh",
      "ward": "Phường Tây Thạnh",
      "city": "TP. Hồ Chí Minh",
      "latitude": 10.7769,
      "longitude": 106.6601,
      "isDefault": true
    },
    "serviceDetails": [
      {
        "bookingDetailId": "5bbc2de4-e9b9-4fc1-8ff1-28d64e6d19c3",
        "service": {
          "serviceId": 2,
          "name": "Tổng vệ sinh",
          "description": "Làm sạch sâu toàn diện, bao gồm các khu vực khó tiếp cận, trần nhà, lau cửa kính. Thích hợp cho nhà mới hoặc dọn dẹp theo mùa.",
          "basePrice": 500000.00,
          "unit": "Gói",
          "estimatedDurationHours": 2.0,
          "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599581/house_cleaning_nob_umewqf.png",
          "categoryName": "Dọn dẹp nhà",
          "isActive": true
        },
        "quantity": 1,
        "pricePerUnit": 700000,
        "formattedPricePerUnit": "900,000đ",
        "subTotal": 700000.00,
        "formattedSubTotal": "900,000đ",
        "selectedChoices": [
          {
            "choiceId": 2,
            "choiceName": "Nhà phố",
            "optionName": "Loại hình nhà ở?",
            "priceAdjustment": 200000.00,
            "formattedPriceAdjustment": "200,000đ"
          },
          {
            "choiceId": 4,
            "choiceName": "Trên 80m²",
            "optionName": "Diện tích dọn dẹp?",
            "priceAdjustment": 200000.00,
            "formattedPriceAdjustment": "200,000đ"
          }
        ],
        "assignments": [
          {
            "assignmentId": "assign123",
            "employee": {
              "employeeId": "e1000001-0000-0000-0000-000000000001",
              "fullName": "Jane Smith",
              "email": "jane.smith@example.com",
              "phoneNumber": "0912345678",
              "avatar": "https://picsum.photos/200"
            },
            "status": "ASSIGNED"
          }
        ],
        "duration": "2 giờ",
        "formattedDuration": "2 giờ"
      }
    ],
    "paymentInfo": {
      "paymentId": "d2068e26-7333-43a4-a9e5-5a17b23ca7dc",
      "amount": 700000.00,
      "paymentMethod": {
        "methodId": 1,
        "name": "MOMO",
        "isActive": true
      },
      "paymentStatus": "PENDING",
      "transactionCode": "TXN_1727169562581",
      "createdAt": "2025-09-24 14:39:22",
      "paidAt": null
    },
    "promotionApplied": null,
    "assignedEmployees": [
      {
        "employeeId": "e1000001-0000-0000-0000-000000000001",
        "fullName": "Jane Smith",
        "email": "jane.smith@example.com",
        "phoneNumber": "0912345678",
        "avatar": "https://picsum.photos/200",
        "rating": null,
        "employeeStatus": "AVAILABLE",
        "skills": ["Cleaning", "Organizing"],
        "bio": "Có kinh nghiệm dọn dẹp nhà cửa và sắp xếp đồ đạc."
      }
    ],
    "totalServices": 1,
    "totalEmployees": 1,
    "estimatedDuration": "2 hours 0 minutes",
    "hasPromotion": false
  }
  ```
- **Status Code**: `201 Created`

---

### Test Case 5: Successfully Create Booking without Assignments (AWAITING_EMPLOYEE)
- **Test Case ID**: TC_BOOKING_005
- **Description**: Verify booking creation without employee assignments results in AWAITING_EMPLOYEE status.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/bookings`
  - **Body**:
    ```json
    {
      "addressId": "adrs0001-0000-0000-0000-000000000001",
      "bookingTime": "2025-09-26T14:00:00",
      "note": "Booking without specific employee assignment",
      "promoCode": null,
      "bookingDetails": [
        {
          "serviceId": 2,
          "quantity": 1,
          "expectedPrice": 700000,
          "expectedPricePerUnit": 700000,
          "selectedChoiceIds": [2, 4]
        }
      ],
      "assignments": null,
      "paymentMethodId": 1
    }
    ```
- **Expected Output**:
  ```json
  {
    "bookingId": "c4eec53c-01f0-4ec4-8adf-111b99beee45",
    "bookingCode": "BK7341716",
    "status": "AWAITING_EMPLOYEE",
    "totalAmount": 700000.00,
    "formattedTotalAmount": "700,000đ",
    "bookingTime": "2025-09-26T14:00:00",
    "createdAt": "2025-09-24T15:45:07.37806",
    "customerInfo": {
        "addressId": "adrs0001-0000-0000-0000-000000000001",
        "fullAddress": "123 Lê Trọng Tấn, Tây Thạnh, Tân Phú, TP. Hồ Chí Minh",
        "ward": "Phường Tây Thạnh",
        "city": "TP. Hồ Chí Minh",
        "latitude": 10.7943,
        "longitude": 106.6256,
        "isDefault": true
    },
    "serviceDetails": [
        {
            "bookingDetailId": "e7a497ea-60f2-45f8-a6b4-110f68e01b04",
            "service": {
                "serviceId": 2,
                "name": "Tổng vệ sinh",
                "description": "Làm sạch sâu toàn diện, bao gồm các khu vực khó tiếp cận, trần nhà, lau cửa kính. Thích hợp cho nhà mới hoặc dọn dẹp theo mùa.",
                "basePrice": 500000.00,
                "unit": "Gói",
                "estimatedDurationHours": 2.0,
                "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599581/house_cleaning_nob_umewqf.png",
                "categoryName": "Dọn dẹp nhà",
                "isActive": true
            },
            "quantity": 1,
            "pricePerUnit": 700000,
            "formattedPricePerUnit": "700,000đ",
            "subTotal": 700000.00,
            "formattedSubTotal": "700,000đ",
            "selectedChoices": [
                {
                    "choiceId": 2,
                    "choiceName": "Nhà phố",
                    "optionName": "Loại hình nhà ở?",
                    "priceAdjustment": 200000.00,
                    "formattedPriceAdjustment": "200,000đ"
                },
                {
                    "choiceId": 4,
                    "choiceName": "Trên 80m²",
                    "optionName": "Diện tích dọn dẹp?",
                    "priceAdjustment": 200000.00,
                    "formattedPriceAdjustment": "200,000đ"
                }
            ],
            "assignments": [],
            "duration": "2 giờ",
            "formattedDuration": "2 giờ"
        }
    ],
    "paymentInfo": {
        "paymentId": "41aadcef-3653-4365-81c7-bc5787901e1c",
        "amount": 700000.00,
        "paymentMethod": "Thanh toán tiền mặt",
        "paymentStatus": "PENDING",
        "transactionCode": "TXN_1758703507341",
        "createdAt": "2025-09-24 15:45:07",
        "paidAt": null
    },
    "promotionApplied": null,
    "assignedEmployees": [],
    "totalServices": 1,
    "totalEmployees": 0,
    "estimatedDuration": "2 giờ 0 phút",
    "hasPromotion": false
  }
  ```
- **Status Code**: `201 Created`

---

### Test Case 6: Successfully Create Booking with New Address
- **Test Case ID**: TC_BOOKING_006
- **Description**: Verify booking creation with new address (including latitude/longitude).
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/bookings`
  - **Body**:
    ```json
    {
      "addressId": null,
      "newAddress": {
        "customerId": "c1000001-0000-0000-0000-000000000001",
        "fullAddress": "456 Nguyễn Văn Linh, An Phú, Quận 2, TP. Hồ Chí Minh",
        "ward": "Phường An Phú",
        "city": "TP. Hồ Chí Minh",
        "latitude": 10.7829,
        "longitude": 106.7439
      },
      "bookingTime": "2025-09-26T16:00:00",
      "note": "New address booking test",
      "bookingDetails": [
        {
          "serviceId": 2,
          "quantity": 1,
          "expectedPrice": 700000,
          "expectedPricePerUnit": 700000,
          "selectedChoiceIds": [2, 4]
        }
      ],
      "assignments": [
        {
          "serviceId": 2,
          "employeeId": "e1000001-0000-0000-0000-000000000001"
        }
      ],
      "paymentMethodId": 1
    }
    ```
- **Expected Output**:
  ```json
  {
    "bookingId": "...",
    "status": "PENDING",
    "customerInfo": {
      "addressId": "newly-generated-address-id",
      "fullAddress": "456 Nguyễn Văn Linh, An Phú, Quận 2, TP. Hồ Chí Minh",
      "ward": "Phường An Phú",
      "city": "TP. Hồ Chí Minh",
      "latitude": 10.7829,
      "longitude": 106.7439,
      "isDefault": false
    }
    // ...other booking details...
  }
  ```
- **Status Code**: `201 Created`

---

### Test Case 7: Successfully Create Booking with Promotion
- **Test Case ID**: TC_BOOKING_007
- **Description**: Verify booking creation with valid promotion code applies discount correctly.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/bookings`
  - **Body**:
    ```json
    {
      "addressId": "adrs0001-0000-0000-0000-000000000001",
      "bookingTime": "2025-09-26T11:00:00",
      "note": "Testing promotion discount",
      "promoCode": "SAVE20K",
      "bookingDetails": [
        {
          "serviceId": 2,
          "quantity": 1,
          "expectedPrice": 880000,
          "expectedPricePerUnit": 880000,
          "selectedChoiceIds": [2, 4]
        }
      ],
      "assignments": null,
      "paymentMethodId": 1
    }
    ```
- **Expected Output**:
  ```json
  {
    "bookingId": "...",
    "status": "AWAITING_EMPLOYEE",
    "totalAmount": 880000.00,
    "formattedTotalAmount": "880,000đ",
    "promotionApplied": {
      "promoCode": "SAVE20K",
      "discountAmount": 20000.00,
      "formattedDiscountAmount": "20,000đ",
      "discountType": "FIXED_AMOUNT"
    }
    // ...other details...
  }
  ```
- **Status Code**: `201 Created`

---

### Test Case 8: Employee Conflict Error
- **Test Case ID**: TC_BOOKING_008
- **Description**: Verify that booking creation fails when selected employee has scheduling conflict.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/bookings`
  - **Body**:
    ```json
    {
      "addressId": "adrs0001-0000-0000-0000-000000000001",
      "bookingTime": "2025-09-26T09:00:00",
      "note": "Test conflict",
      "bookingDetails": [
        {
          "serviceId": 2,
          "quantity": 1,
          "expectedPrice": 700000,
          "expectedPricePerUnit": 700000,
          "selectedChoiceIds": [2, 4]
        }
      ],
      "assignments": [
        {
          "serviceId": 2,
          "employeeId": "e1000001-0000-0000-0000-000000000001"
        }
      ],
      "paymentMethodId": 1
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Employee scheduling conflict",
    "conflicts": [
      {
        "conflictType": "ASSIGNMENT_CONFLICT",
        "employeeId": "e1000001-0000-0000-0000-000000000001",
        "conflictStartTime": "2025-09-26T08:00:00",
        "conflictEndTime": "2025-09-26T10:00:00",
        "reason": "Employee Jane Smith has another assignment during this time"
      }
    ]
  }
  ```
- **Status Code**: `409 Conflict`

---

### Test Case 9: Booking Validation Errors
- **Test Case ID**: TC_BOOKING_009
- **Description**: Verify comprehensive validation errors for invalid booking data.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/bookings`
  - **Body**:
    ```json
    {
      "addressId": "adrs0001-0000-0000-0000-000000000001",
      "bookingTime": "2025-09-24T06:00:00",
      "note": "Test validation errors",
      "bookingDetails": [
        {
          "serviceId": 9999,
          "quantity": 1,
          "expectedPrice": 100000,
          "expectedPricePerUnit": 100000,
          "selectedChoiceIds": [999, 888]
        }
      ],
      "assignments": [
        {
          "serviceId": 2,
          "employeeId": "e1000001-0000-0000-0000-000000000001"
        }
      ],
      "paymentMethodId": 1
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Booking validation failed",
    "errors": [
      "Booking time must be between 8:00 AM and 8:00 PM",
      "Service not found or not bookable: 9999",
      "Invalid choice IDs for service 9999: [999, 888]"
    ]
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 10: Price Mismatch Error
- **Test Case ID**: TC_BOOKING_010
- **Description**: Verify price validation when expected price doesn't match calculated price.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/bookings`
  - **Body**:
    ```json
    {
      "addressId": "adrs0001-0000-0000-0000-000000000001",
      "bookingTime": "2025-09-26T10:00:00",
      "note": "Price mismatch test",
      "bookingDetails": [
        {
          "serviceId": 2,
          "quantity": 1,
          "expectedPrice": 100000,
          "expectedPricePerUnit": 100000,
          "selectedChoiceIds": [2, 4]
        }
      ],
      "assignments": null,
      "paymentMethodId": 1
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Booking validation failed",
    "errors": [
      "Price mismatch for service 2. Expected: 100,000đ, Calculated: 900,000đ"
    ]
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 11: Booking Time Too Soon
- **Test Case ID**: TC_BOOKING_011
- **Description**: Verify validation error when booking time is less than 2 hours from now.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/bookings`
  - **Body**:
    ```json
    {
      "addressId": "adrs0001-0000-0000-0000-000000000001",
      "bookingTime": "2025-09-24T15:00:00",
      "note": "Too soon booking",
      "bookingDetails": [
        {
          "serviceId": 2,
          "quantity": 1,
          "expectedPrice": 700000,
          "expectedPricePerUnit": 700000,
          "selectedChoiceIds": [2, 4]
        }
      ],
      "assignments": null,
      "paymentMethodId": 1
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Booking validation failed",
    "errors": [
      "Booking time must be at least 2 hours from now"
    ]
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 12: Booking Time Too Far
- **Test Case ID**: TC_BOOKING_012
- **Description**: Verify validation error when booking time is more than 30 days ahead.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/bookings`
  - **Body**:
    ```json
    {
      "addressId": "adrs0001-0000-0000-0000-000000000001",
      "bookingTime": "2025-11-24T10:00:00",
      "note": "Too far booking",
      "bookingDetails": [
        {
          "serviceId": 2,
          "quantity": 1,
          "expectedPrice": 700000,
          "expectedPricePerUnit": 700000,
          "selectedChoiceIds": [2, 4]
        }
      ],
      "assignments": null,
      "paymentMethodId": 1
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Booking validation failed",
    "errors": [
      "Booking time cannot be more than 30 days from now"
    ]
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 13: Invalid Promotion Code
- **Test Case ID**: TC_BOOKING_013
- **Description**: Verify validation error when promotion code is invalid or expired.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/bookings`
  - **Body**:
    ```json
    {
      "addressId": "adrs0001-0000-0000-0000-000000000001",
      "bookingTime": "2025-09-26T10:00:00",
      "note": "Invalid promo test",
      "promoCode": "INVALID_PROMO",
      "bookingDetails": [
        {
          "serviceId": 2,
          "quantity": 1,
          "expectedPrice": 700000,
          "expectedPricePerUnit": 700000,
          "selectedChoiceIds": [2, 4]
        }
      ],
      "assignments": null,
      "paymentMethodId": 1
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Booking validation failed",
    "errors": [
      "Promotion code is invalid or expired: INVALID_PROMO"
    ]
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 14: Employee Count Mismatch
- **Test Case ID**: TC_BOOKING_014
- **Description**: Verify validation error when assigned employees don't match service requirements.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/bookings`
  - **Body**:
    ```json
    {
      "addressId": "adrs0001-0000-0000-0000-000000000001",
      "bookingTime": "2025-09-26T10:00:00",
      "note": "Employee count mismatch",
      "bookingDetails": [
        {
          "serviceId": 2,
          "quantity": 2,
          "expectedPrice": 1800000,
          "expectedPricePerUnit": 700000,
          "selectedChoiceIds": [2, 4]
        }
      ],
      "assignments": [
        {
          "serviceId": 2,
          "employeeId": "e1000001-0000-0000-0000-000000000001"
        }
      ],
      "paymentMethodId": 1
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Booking validation failed",
    "errors": [
      "Total employees assigned (1) does not match required employees (2)"
    ]
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 15: Address and New Address Conflict
- **Test Case ID**: TC_BOOKING_015
- **Description**: Verify validation error when both addressId and newAddress are provided.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/bookings`
  - **Body**:
    ```json
    {
      "addressId": "adrs0001-0000-0000-0000-000000000001",
      "newAddress": {
        "customerId": "c1000001-0000-0000-0000-000000000001",
        "fullAddress": "456 Test Street",
        "ward": "Test Ward",
        "city": "Test City"
      },
      "bookingTime": "2025-09-26T10:00:00",
      "bookingDetails": [
        {
          "serviceId": 2,
          "quantity": 1,
          "expectedPrice": 700000,
          "expectedPricePerUnit": 700000,
          "selectedChoiceIds": [2, 4]
        }
      ],
      "assignments": null,
      "paymentMethodId": 1
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Booking validation failed",
    "errors": [
      "Either addressId or newAddress must be provided"
    ]
  }
  ```
- **Status Code**: `400 Bad Request`

---

## GET /{bookingId} - Get Booking Details

### Test Case 16: Successfully Get Booking Details
- **Test Case ID**: TC_BOOKING_016
- **Description**: Verify that booking details can be retrieved successfully.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/bookings/7a35373e-20c6-43a2-aab2-1486fb6c89e5`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    ```
- **Expected Output**:
  ```json
  {
    "bookingId": "7a35373e-20c6-43a2-aab2-1486fb6c89e5",
    "bookingCode": "BK62589569",
    "status": "PENDING",
    "totalAmount": 700000.00,
    "formattedTotalAmount": "900,000đ",
    "bookingTime": "2025-09-26T10:00:00",
    "createdAt": "2025-09-24T14:39:22.589451644",
    "customerInfo": {
      // ...customer and address details...
    },
    "serviceDetails": [
      // ...service details with assignments...
    ],
    "paymentInfo": {
      // ...payment information...
    },
    "assignedEmployees": [
      // ...employee details...
    ]
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 17: Booking Not Found
- **Test Case ID**: TC_BOOKING_017
- **Description**: Verify error handling when booking ID doesn't exist.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/bookings/non-existent-booking-id`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Booking not found: non-existent-booking-id"
  }
  ```
- **Status Code**: `404 Not Found`

---

## POST /validate - Validate Booking Request

### Test Case 18: Successfully Validate Booking Request
- **Test Case ID**: TC_BOOKING_018
- **Description**: Verify that booking validation endpoint works correctly with valid data.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/bookings/validate`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "addressId": "adrs0001-0000-0000-0000-000000000001",
      "bookingTime": "2025-09-26T10:00:00",
      "note": "Validation test",
      "promoCode": null,
      "bookingDetails": [
        {
          "serviceId": 2,
          "quantity": 1,
          "expectedPrice": 700000,
          "expectedPricePerUnit": 700000,
          "selectedChoiceIds": [2, 4]
        }
      ],
      "assignments": [
        {
          "serviceId": 2,
          "employeeId": "e1000001-0000-0000-0000-000000000001"
        }
      ],
      "paymentMethodId": 1
    }
    ```
- **Expected Output**:
  ```json
  {
    "isValid": true,
    "calculatedTotalAmount": 700000.00,
    "formattedTotalAmount": "900,000đ",
    "errors": [],
    "conflicts": [],
    "serviceValidations": [
      {
        "serviceId": 2,
        "serviceName": "Tổng vệ sinh",
        "exists": true,
        "active": true,
        "basePrice": 500000.00,
        "calculatedPrice": 700000.00,
        "expectedPrice": 700000.00,
        "priceMatches": true,
        "validChoiceIds": [2, 4],
        "invalidChoiceIds": [],
        "recommendedStaff": 1,
        "valid": true
      }
    ],
    "customer": {
      "customerId": "c1000001-0000-0000-0000-000000000001",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "phoneNumber": "0901234567"
    },
    "address": {
      "addressId": "adrs0001-0000-0000-0000-000000000001",
      "fullAddress": "123 Lê Trọng Tấn, Tây Thạnh, Tân Phú, TP. Hồ Chí Minh",
      "ward": "Phường Tây Thạnh",
      "city": "TP. Hồ Chí Minh",
      "latitude": 10.7769,
      "longitude": 106.6601,
      "isDefault": true
    },
    "usingNewAddress": false
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 19: Validation with Errors
- **Test Case ID**: TC_BOOKING_019
- **Description**: Verify validation endpoint returns detailed errors for invalid data.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/bookings/validate`
  - **Body**: (Same as Test Case 9 - invalid service, choices, time)
- **Expected Output**:
  ```json
  {
    "isValid": false,
    "calculatedTotalAmount": null,
    "errors": [
      "Booking time must be between 8:00 AM and 8:00 PM",
      "Service not found or not bookable: 9999",
      "Invalid choice IDs for service 9999: [999, 888]"
    ],
    "conflicts": [],
    "serviceValidations": [],
    "customer": null,
    "address": null,
    "usingNewAddress": false
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 20: Validation with Employee Conflicts
- **Test Case ID**: TC_BOOKING_020
- **Description**: Verify validation endpoint detects employee scheduling conflicts.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/bookings/validate`
  - **Body**: (Same as Test Case 8 - conflicting employee assignment)
- **Expected Output**:
  ```json
  {
    "isValid": false,
    "calculatedTotalAmount": 700000.00,
    "errors": [],
    "conflicts": [
      {
        "conflictType": "ASSIGNMENT_CONFLICT",
        "employeeId": "e1000001-0000-0000-0000-000000000001",
        "conflictStartTime": "2025-09-26T08:00:00",
        "conflictEndTime": "2025-09-26T10:00:00",
        "reason": "Employee Jane Smith has another assignment during this time"
      }
    ],
    "serviceValidations": [
      // ...valid service validations...
    ],
    "customer": {
      // ...customer details...
    },
    "address": {
      // ...address details...
    },
    "usingNewAddress": false
  }
  ```
- **Status Code**: `200 OK`

---

## Error Response Format
All error responses follow a consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error 1", "Detailed error 2"],
  "conflicts": [
    {
      "conflictType": "ASSIGNMENT_CONFLICT",
      "employeeId": "employee-id",
      "conflictStartTime": "2025-09-26T08:00:00",
      "conflictEndTime": "2025-09-26T10:00:00",
      "reason": "Conflict description"
    }
  ]
}
```

---

## Test Data Setup Requirements
- Customer accounts with valid authentication tokens
- Employees with varying availability schedules
- Services with different pricing structures and choice options
- Valid and invalid promotion codes
- Address records with and without default flags
- Payment methods in active and inactive states
- Existing bookings to create conflict scenarios

---

## Summary
This comprehensive test suite covers all aspects of the enhanced BookingServiceImpl including:
- **20 Test Cases** covering all endpoints and scenarios
- **Advanced Validation Logic** with detailed error messages
- **Employee Conflict Detection** with scheduling validation
- **Price Calculation Verification** with tolerance handling
- **Promotion Code Support** with discount calculations
- **New Address Creation** with latitude/longitude support
- **Business Rules Enforcement** (time constraints, advance booking limits)
- **Comprehensive Error Handling** with structured responses
