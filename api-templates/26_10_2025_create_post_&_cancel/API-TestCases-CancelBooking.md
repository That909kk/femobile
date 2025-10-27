# API Test Cases - Cancel Booking

## Overview
This document describes the comprehensive test cases for the **Cancel Booking** endpoint of the Customer API.  
The endpoint allows customers to cancel their bookings with proper validation, authorization, and automated processing of related assignments and payments.  
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
- **Authorization Header**: `Bearer <valid_token>`
- **Content-Type**: `application/json`
- **Role Requirements**: CUSTOMER or ADMIN role required
- **Ownership Validation**: Customer can only cancel their own bookings

---

## Business Rules
- **Cancellable Status**: PENDING, CONFIRMED, AWAITING_EMPLOYEE
- **Non-Cancellable Status**: IN_PROGRESS, COMPLETED, CANCELLED
- **Assignment Handling**: All related assignments are automatically cancelled
- **Payment Processing**:
  - PAID → REFUNDED (marked for refund)
  - PENDING → CANCELLED (cancelled transaction)
- **Reason**: Optional, maximum 500 characters

---

## Database Test Data
Based on housekeeping_service_v8.sql:
- **Sample Customer**: john_doe (c1000001-0000-0000-0000-000000000001)
- **Sample Employee**: jane_smith (e1000001-0000-0000-0000-000000000001)
- **Sample Bookings**: Various bookings in different statuses
- **Booking Statuses**: PENDING, AWAITING_EMPLOYEE, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
- **Assignment Statuses**: ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED
- **Payment Statuses**: PENDING, PAID, FAILED, CANCELLED, REFUNDED

---

## API Endpoint Covered
**PUT /{bookingId}/cancel** - Cancel Booking

---

## PUT /{bookingId}/cancel - Cancel Booking

### Test Case 1: Successfully Cancel PENDING Booking with Reason
- **Test Case ID**: TC_CANCEL_BOOKING_001
- **Description**: Verify that a customer can successfully cancel a PENDING booking with a cancellation reason.
- **Preconditions**: 
  - Customer is authenticated with valid token.
  - Booking exists and belongs to the customer.
  - Booking status is PENDING.
- **Input**:
  - **Method**: `PUT`
  - **URL**: `/api/v1/customer/bookings/7a35373e-20c6-43a2-aab2-1486fb6c89e5/cancel`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_john_doe>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "reason": "Tôi có việc đột xuất không thể sắp xếp được"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Huỷ booking thành công",
    "data": {
      "bookingId": "7a35373e-20c6-43a2-aab2-1486fb6c89e5",
      "bookingCode": "BK62589569",
      "status": "CANCELLED",
      "totalAmount": 700000.00,
      "formattedTotalAmount": "700,000đ",
      "bookingTime": "2025-09-26T10:00:00",
      "adminComment": "Khách hàng hủy: Tôi có việc đột xuất không thể sắp xếp được",
      "createdAt": "2025-09-24T14:39:22",
      "updatedAt": "2025-10-26T10:30:00",
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
            "description": "Làm sạch sâu toàn diện...",
            "basePrice": 500000.00,
            "unit": "Gói",
            "estimatedDurationHours": 2.0,
            "iconUrl": "https://res.cloudinary.com/...",
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
              "status": "CANCELLED"
            }
          ],
          "duration": "2 giờ",
          "formattedDuration": "2 giờ"
        }
      ],
      "paymentInfo": {
        "paymentId": "d2068e26-7333-43a4-a9e5-5a17b23ca7dc",
        "amount": 700000.00,
        "paymentMethod": "MOMO",
        "paymentStatus": "CANCELLED",
        "transactionCode": "TXN_1727169562581",
        "createdAt": "2025-09-24 14:39:22",
        "paidAt": null
      },
      "promotionApplied": null,
      "assignedEmployees": [],
      "totalServices": 1,
      "totalEmployees": 0,
      "estimatedDuration": "2 giờ 0 phút",
      "hasPromotion": false
    }
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 2: Successfully Cancel CONFIRMED Booking without Reason
- **Test Case ID**: TC_CANCEL_BOOKING_002
- **Description**: Verify that a customer can cancel a CONFIRMED booking without providing a reason.
- **Preconditions**: 
  - Customer is authenticated with valid token.
  - Booking exists and belongs to the customer.
  - Booking status is CONFIRMED.
- **Input**:
  - **Method**: `PUT`
  - **URL**: `/api/v1/customer/bookings/c4eec53c-01f0-4ec4-8adf-111b99beee45/cancel`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_john_doe>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "reason": ""
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Huỷ booking thành công",
    "data": {
      "bookingId": "c4eec53c-01f0-4ec4-8adf-111b99beee45",
      "bookingCode": "BK7341716",
      "status": "CANCELLED",
      "adminComment": "Khách hàng hủy booking",
      "updatedAt": "2025-10-26T10:35:00"
      // ...other booking details...
    }
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 3: Successfully Cancel AWAITING_EMPLOYEE Booking (Post)
- **Test Case ID**: TC_CANCEL_BOOKING_003
- **Description**: Verify that a customer can cancel a booking post (AWAITING_EMPLOYEE status).
- **Preconditions**: 
  - Customer is authenticated with valid token.
  - Booking exists and belongs to the customer.
  - Booking status is AWAITING_EMPLOYEE (no employees assigned yet).
- **Input**:
  - **Method**: `PUT`
  - **URL**: `/api/v1/customer/bookings/booking-post-id-123/cancel`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_john_doe>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "reason": "Đã tìm được người giúp việc khác"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Huỷ booking thành công",
    "data": {
      "bookingId": "booking-post-id-123",
      "status": "CANCELLED",
      "adminComment": "Khách hàng hủy: Đã tìm được người giúp việc khác",
      "assignedEmployees": []
      // ...other details...
    }
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 4: Cancel Booking with Paid Payment - Refund Processing
- **Test Case ID**: TC_CANCEL_BOOKING_004
- **Description**: Verify that cancelling a booking with paid payment marks payment for refund.
- **Preconditions**: 
  - Customer is authenticated with valid token.
  - Booking exists with payment status = PAID.
  - Booking status is PENDING or CONFIRMED.
- **Input**:
  - **Method**: `PUT`
  - **URL**: `/api/v1/customer/bookings/booking-with-paid-payment/cancel`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_john_doe>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "reason": "Thay đổi kế hoạch"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Huỷ booking thành công",
    "data": {
      "bookingId": "booking-with-paid-payment",
      "status": "CANCELLED",
      "paymentInfo": {
        "paymentId": "payment-123",
        "amount": 700000.00,
        "paymentMethod": "MOMO",
        "paymentStatus": "REFUNDED",
        "transactionCode": "TXN_1727169562581",
        "createdAt": "2025-09-24 14:39:22",
        "paidAt": "2025-09-24 15:00:00"
      }
      // ...other details...
    }
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 5: Cancel Booking with Multiple Assignments
- **Test Case ID**: TC_CANCEL_BOOKING_005
- **Description**: Verify that all assignments are cancelled when booking is cancelled.
- **Preconditions**: 
  - Booking has multiple employees assigned.
  - Booking status is CONFIRMED.
- **Input**:
  - **Method**: `PUT`
  - **URL**: `/api/v1/customer/bookings/booking-multi-employees/cancel`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_john_doe>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "reason": "Cần thay đổi thời gian"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Huỷ booking thành công",
    "data": {
      "bookingId": "booking-multi-employees",
      "status": "CANCELLED",
      "serviceDetails": [
        {
          "assignments": [
            {
              "assignmentId": "assign001",
              "status": "CANCELLED",
              "employee": {
                "employeeId": "e1000001-0000-0000-0000-000000000001",
                "fullName": "Jane Smith"
              }
            },
            {
              "assignmentId": "assign002",
              "status": "CANCELLED",
              "employee": {
                "employeeId": "e1000002-0000-0000-0000-000000000002",
                "fullName": "Bob Johnson"
              }
            }
          ]
        }
      ]
      // ...other details...
    }
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 6: Cancel Booking with Long Reason (Max 500 chars)
- **Test Case ID**: TC_CANCEL_BOOKING_006
- **Description**: Verify that cancellation reason can be up to 500 characters.
- **Input**:
  - **Method**: `PUT`
  - **URL**: `/api/v1/customer/bookings/valid-booking-id/cancel`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_john_doe>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "reason": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem."
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Huỷ booking thành công",
    "data": {
      "status": "CANCELLED",
      "adminComment": "Khách hàng hủy: Lorem ipsum dolor sit amet..."
      // ...full 500 character reason in adminComment...
    }
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 7: Cannot Cancel IN_PROGRESS Booking
- **Test Case ID**: TC_CANCEL_BOOKING_007
- **Description**: Verify that booking with IN_PROGRESS status cannot be cancelled.
- **Preconditions**: 
  - Booking status is IN_PROGRESS.
- **Input**:
  - **Method**: `PUT`
  - **URL**: `/api/v1/customer/bookings/in-progress-booking-id/cancel`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_john_doe>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "reason": "Muốn hủy booking đang thực hiện"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Booking validation failed",
    "errorCode": "VALIDATION_ERROR",
    "validationErrors": ["Không thể hủy booking đang thực hiện"],
    "conflicts": [],
    "timestamp": "2025-10-26T22:30:00"
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 8: Cannot Cancel COMPLETED Booking
- **Test Case ID**: TC_CANCEL_BOOKING_008
- **Description**: Verify that booking with COMPLETED status cannot be cancelled.
- **Preconditions**: 
  - Booking status is COMPLETED.
- **Input**:
  - **Method**: `PUT`
  - **URL**: `/api/v1/customer/bookings/completed-booking-id/cancel`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_john_doe>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "reason": "Muốn hủy booking đã hoàn thành"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Booking validation failed",
    "errorCode": "VALIDATION_ERROR",
    "validationErrors": ["Không thể hủy booking đã hoàn thành"],
    "conflicts": [],
    "timestamp": "2025-10-26T22:30:00"
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 9: Cannot Cancel Already CANCELLED Booking
- **Test Case ID**: TC_CANCEL_BOOKING_009
- **Description**: Verify that booking that is already cancelled cannot be cancelled again.
- **Preconditions**: 
  - Booking status is CANCELLED.
- **Input**:
  - **Method**: `PUT`
  - **URL**: `/api/v1/customer/bookings/already-cancelled-booking/cancel`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_john_doe>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "reason": "Hủy lại lần nữa"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Booking validation failed",
    "errorCode": "VALIDATION_ERROR",
    "validationErrors": ["Booking đã bị hủy trước đó"],
    "conflicts": [],
    "timestamp": "2025-10-26T22:30:00"
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 10: Unauthorized - Cancel Other Customer's Booking
- **Test Case ID**: TC_CANCEL_BOOKING_010
- **Description**: Verify that customer cannot cancel booking belonging to another customer.
- **Preconditions**: 
  - Booking belongs to customer A.
  - Request is made by customer B.
- **Input**:
  - **Method**: `PUT`
  - **URL**: `/api/v1/customer/bookings/other-customer-booking-id/cancel`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_customer_B>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "reason": "Test unauthorized access"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Booking validation failed",
    "errorCode": "VALIDATION_ERROR",
    "validationErrors": ["Bạn không có quyền hủy booking này"],
    "conflicts": [],
    "timestamp": "2025-10-26T22:30:00"
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 11: Booking Not Found
- **Test Case ID**: TC_CANCEL_BOOKING_011
- **Description**: Verify error handling when booking ID doesn't exist.
- **Input**:
  - **Method**: `PUT`
  - **URL**: `/api/v1/customer/bookings/non-existent-booking-id/cancel`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_john_doe>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "reason": "Test not found"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Booking not found with ID: non-existent-booking-id",
    "errorCode": "BOOKING_NOT_FOUND",
    "validationErrors": [],
    "conflicts": [],
    "timestamp": "2025-10-26T22:30:00"
  }
  ```
- **Status Code**: `404 Not Found`

---

### Test Case 12: Invalid Token - Missing Authorization Header
- **Test Case ID**: TC_CANCEL_BOOKING_012
- **Description**: Verify error handling when authorization header is missing.
- **Input**:
  - **Method**: `PUT`
  - **URL**: `/api/v1/customer/bookings/valid-booking-id/cancel`
  - **Headers**: 
    ```
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "reason": "Test missing token"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Token không hợp lệ"
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 13: Invalid Token - Malformed Bearer Token
- **Test Case ID**: TC_CANCEL_BOOKING_013
- **Description**: Verify error handling with malformed bearer token.
- **Input**:
  - **Method**: `PUT`
  - **URL**: `/api/v1/customer/bookings/valid-booking-id/cancel`
  - **Headers**: 
    ```
    Authorization: InvalidTokenFormat
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "reason": "Test malformed token"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Token không hợp lệ"
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 14: Expired Token
- **Test Case ID**: TC_CANCEL_BOOKING_014
- **Description**: Verify error handling when JWT token is expired.
- **Input**:
  - **Method**: `PUT`
  - **URL**: `/api/v1/customer/bookings/valid-booking-id/cancel`
  - **Headers**: 
    ```
    Authorization: Bearer <expired_token>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "reason": "Test expired token"
    }
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

### Test Case 15: Validation Error - Reason Too Long (>500 chars)
- **Test Case ID**: TC_CANCEL_BOOKING_015
- **Description**: Verify validation error when cancellation reason exceeds 500 characters.
- **Input**:
  - **Method**: `PUT`
  - **URL**: `/api/v1/customer/bookings/valid-booking-id/cancel`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_john_doe>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "reason": "Lorem ipsum dolor sit amet, consectetur adipiscing elit... (501+ characters total)"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Request validation failed",
    "errorCode": "VALIDATION_ERROR",
    "validationErrors": ["Lý do hủy không được quá 500 ký tự"],
    "conflicts": [],
    "timestamp": "2025-10-26T22:30:00"
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 16: Cancel Booking with Existing Admin Comment
- **Test Case ID**: TC_CANCEL_BOOKING_016
- **Description**: Verify that cancellation reason is appended to existing admin comment.
- **Preconditions**: 
  - Booking already has admin comment.
- **Input**:
  - **Method**: `PUT`
  - **URL**: `/api/v1/customer/bookings/booking-with-comment/cancel`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_john_doe>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "reason": "Muốn đổi thời gian"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Huỷ booking thành công",
    "data": {
      "status": "CANCELLED",
      "adminComment": "Admin verified booking | Khách hàng hủy: Muốn đổi thời gian"
      // ...other details...
    }
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 17: Cancel Booking with Promotion Applied
- **Test Case ID**: TC_CANCEL_BOOKING_017
- **Description**: Verify that booking with promotion can be cancelled properly.
- **Preconditions**: 
  - Booking has promotion applied.
  - Booking status is PENDING.
- **Input**:
  - **Method**: `PUT`
  - **URL**: `/api/v1/customer/bookings/booking-with-promo/cancel`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_john_doe>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "reason": "Không cần dịch vụ nữa"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Huỷ booking thành công",
    "data": {
      "status": "CANCELLED",
      "totalAmount": 880000.00,
      "promotionApplied": {
        "promoCode": "SAVE20K",
        "discountAmount": 20000.00,
        "discountType": "FIXED_AMOUNT"
      }
      // ...other details...
    }
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 18: Cancel Booking - Assignment with COMPLETED Status Not Changed
- **Test Case ID**: TC_CANCEL_BOOKING_018
- **Description**: Verify that assignments with COMPLETED status are not changed when booking is cancelled.
- **Preconditions**: 
  - Booking has one assignment with COMPLETED status.
  - Booking has other assignments with ASSIGNED status.
- **Input**:
  - **Method**: `PUT`
  - **URL**: `/api/v1/customer/bookings/booking-with-completed-assignment/cancel`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_john_doe>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "reason": "Test completed assignment handling"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Huỷ booking thành công",
    "data": {
      "status": "CANCELLED",
      "serviceDetails": [
        {
          "assignments": [
            {
              "assignmentId": "assign001",
              "status": "COMPLETED",
              "employee": {
                "employeeId": "e1000001-0000-0000-0000-000000000001"
              }
            },
            {
              "assignmentId": "assign002",
              "status": "CANCELLED",
              "employee": {
                "employeeId": "e1000002-0000-0000-0000-000000000002"
              }
            }
          ]
        }
      ]
      // ...other details...
    }
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 19: Cancel Booking - Internal Server Error
- **Test Case ID**: TC_CANCEL_BOOKING_019
- **Description**: Verify error handling for unexpected server errors.
- **Preconditions**: 
  - Simulate database connection failure or other internal error.
- **Input**:
  - **Method**: `PUT`
  - **URL**: `/api/v1/customer/bookings/valid-booking-id/cancel`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_john_doe>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "reason": "Test server error"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Đã xảy ra lỗi khi hủy booking"
  }
  ```
- **Status Code**: `500 Internal Server Error`

---

### Test Case 20: Cancel Booking - Null Reason (Optional Field)
- **Test Case ID**: TC_CANCEL_BOOKING_020
- **Description**: Verify that reason field can be null or omitted entirely.
- **Input**:
  - **Method**: `PUT`
  - **URL**: `/api/v1/customer/bookings/valid-booking-id/cancel`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_john_doe>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "reason": null
    }
    ```
  - **Alternative Body**:
    ```json
    {}
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Huỷ booking thành công",
    "data": {
      "status": "CANCELLED",
      "adminComment": "Khách hàng hủy booking"
      // ...other details...
    }
  }
  ```
- **Status Code**: `200 OK`

---

### Cancellation Flow
1. **Authenticate User** → Extract customer ID from JWT token
2. **Find Booking** → Verify booking exists
3. **Verify Ownership** → Ensure booking belongs to customer
4. **Check Status** → Validate booking status allows cancellation
5. **Update Booking** → Set status to CANCELLED, save reason
6. **Cancel Assignments** → Set all non-completed assignments to CANCELLED
7. **Process Payments** → Update payment status (PAID→REFUNDED, PENDING→CANCELLED)
8. **Save Changes** → Commit all changes in single transaction
9. **Return Response** → Send updated booking details to client

---

## Summary
This comprehensive test suite covers all aspects of the Cancel Booking feature **based on actual source code implementation**:
- **20 Test Cases** covering all scenarios and edge cases
- **Authorization & Authentication** validation via JWT in controller
- **Status-based Cancellation Rules** enforcement via `BookingValidationException`
- **Assignment Handling** with proper status updates (skip COMPLETED)
- **Payment Processing** with refund marking (PAID→REFUNDED, PENDING→CANCELLED)
- **Error Handling** via `GlobalExceptionHandler` with consistent `BookingErrorResponse` format
- **Database Consistency** through `@Transactional` annotation
- **Security** with ownership validation in service layer
- **Edge Cases** including null/empty reasons, long reasons, multiple assignments
- **Error Codes** from GlobalExceptionHandler (e.g., BOOKING_NOT_FOUND)

The test cases are aligned with:
- `BookingController.cancelBooking()` implementation
- `BookingServiceImpl.cancelBooking()` business logic
- `GlobalExceptionHandler` error response formats
- `BookingCancelRequest` DTO validation rules
- Actual exception types and messages from source code
