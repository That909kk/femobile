# API Test Cases - Notification Service

## Overview
This document describes essential test cases for the **Notification Service** endpoints.  
**Base URL**: `/api/v1/notifications`  
**Test Date Context**: October 30, 2025

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
- **Content-Type**: `application/json`
- **Role Requirements**: 
  - Get/Read/Delete notifications: CUSTOMER, EMPLOYEE, or ADMIN role
  - Create notification: ADMIN role only

---

## API Endpoints Covered
1. **GET /** - Get All Notifications (with pagination and filters)
2. **GET /unread-count** - Get Unread Notification Count
3. **GET /{notificationId}** - Get Notification By ID
4. **PUT /{notificationId}/read** - Mark Notification As Read
5. **PUT /mark-all-read** - Mark All Notifications As Read
6. **DELETE /{notificationId}** - Delete Notification
7. **POST /** - Create Notification (Admin only)

---

## GET / - Get All Notifications

### Test Case 1: Get All Notifications with Default Pagination
- **Test Case ID**: TC_NOTIF_001
- **Description**: Verify customer can retrieve all their notifications with default pagination
- **Preconditions**:
  - Customer John Doe has multiple notifications
  - Valid JWT token with CUSTOMER role
- **Input**:
  - **Query Parameters**: (none - using defaults)
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_customer_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "data": [
      {
        "notificationId": "ntf00002-0000-0000-0000-000000000001",
        "accountId": "a1000001-0000-0000-0000-000000000001",
        "type": "BOOKING_CONFIRMED",
        "title": "Booking đã được xác nhận",
        "message": "Booking HKS000001 của bạn đã được xác nhận. Nhân viên sẽ đến đúng giờ đã hẹn.",
        "relatedId": "b0000001-0000-0000-0000-000000000001",
        "relatedType": "BOOKING",
        "isRead": false,
        "readAt": null,
        "priority": "HIGH",
        "actionUrl": "/bookings/b0000001-0000-0000-0000-000000000001",
        "createdAt": "2025-10-26T10:30:00+07:00"
      },
      {
        "notificationId": "ntf00001-0000-0000-0000-000000000001",
        "accountId": "a1000001-0000-0000-0000-000000000001",
        "type": "BOOKING_CREATED",
        "title": "Đặt lịch thành công",
        "message": "Booking HKS000001 của bạn đã được tạo thành công và đang chờ xác minh.",
        "relatedId": "b0000001-0000-0000-0000-000000000001",
        "relatedType": "BOOKING",
        "isRead": true,
        "readAt": "2025-10-25T10:15:00+07:00",
        "priority": "NORMAL",
        "actionUrl": "/bookings/b0000001-0000-0000-0000-000000000001",
        "createdAt": "2025-10-25T09:00:00+07:00"
      }
    ],
    "currentPage": 0,
    "totalItems": 3,
    "totalPages": 1
  }
  ```
- **Status Code**: 200 OK

### Test Case 2: Get Unread Notifications Only
- **Test Case ID**: TC_NOTIF_002
- **Description**: Verify user can filter to see only unread notifications
- **Preconditions**:
  - User has both read and unread notifications
  - Valid JWT token
- **Input**:
  - **Query Parameters**: 
    - unreadOnly = true
    - page = 0
    - size = 10
  - **Headers**: 
    ```
    Authorization: Bearer <valid_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "data": [
      {
        "notificationId": "ntf00010-0000-0000-0000-000000000001",
        "type": "ASSIGNMENT_CRISIS",
        "title": "KHẨN CẤP: Nhân viên hủy công việc",
        "isRead": false,
        "priority": "URGENT",
        "createdAt": "2025-10-30T08:30:00+07:00"
      },
      {
        "notificationId": "ntf00002-0000-0000-0000-000000000001",
        "type": "BOOKING_CONFIRMED",
        "title": "Booking đã được xác nhận",
        "isRead": false,
        "priority": "HIGH",
        "createdAt": "2025-10-26T10:30:00+07:00"
      }
    ],
    "currentPage": 0,
    "totalItems": 2,
    "totalPages": 1
  }
  ```
- **Status Code**: 200 OK

### Test Case 3: Get Notifications with Custom Pagination
- **Test Case ID**: TC_NOTIF_003
- **Description**: Verify pagination works correctly with custom page size
- **Preconditions**:
  - User has multiple notifications (more than 5)
  - Valid JWT token
- **Input**:
  - **Query Parameters**: 
    - page = 1
    - size = 5
  - **Headers**: 
    ```
    Authorization: Bearer <valid_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "data": [
      {
        "notificationId": "ntf00010-0000-0000-0000-000000000001",
        "type": "ASSIGNMENT_CRISIS",
        "title": "KHẨN CẤP: Nhân viên hủy công việc",
        "isRead": false,
        "priority": "URGENT",
        "createdAt": "2025-10-30T08:30:00+07:00"
      },
      {
        "notificationId": "ntf00002-0000-0000-0000-000000000001",
        "type": "BOOKING_CONFIRMED",
        "title": "Booking đã được xác nhận",
        "isRead": false,
        "priority": "HIGH",
        "createdAt": "2025-10-26T10:30:00+07:00"
      }
    ],
    "currentPage": 1,
    "totalItems": 12,
    "totalPages": 3
  }
  ```
- **Status Code**: 200 OK

---

## GET /unread-count - Get Unread Count

### Test Case 4: Get Unread Notification Count
- **Test Case ID**: TC_NOTIF_004
- **Description**: Verify user can get the count of unread notifications
- **Preconditions**:
  - User has some unread notifications
  - Valid JWT token
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_customer_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "count": 2
  }
  ```
- **Status Code**: 200 OK

### Test Case 5: Unread Count is Zero
- **Test Case ID**: TC_NOTIF_005
- **Description**: Verify count is 0 when all notifications are read
- **Preconditions**:
  - User has marked all notifications as read
  - Valid JWT token
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <valid_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "count": 0
  }
  ```
- **Status Code**: 200 OK

---

## GET /{notificationId} - Get Notification By ID

### Test Case 6: Get Notification By ID Successfully
- **Test Case ID**: TC_NOTIF_006
- **Description**: Verify user can retrieve a specific notification by ID
- **Preconditions**:
  - Notification exists and belongs to user
  - Valid JWT token
- **Input**:
  - **Path Parameter**: notificationId = "ntf00001-0000-0000-0000-000000000001"
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_customer_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "data": {
      "notificationId": "ntf00001-0000-0000-0000-000000000001",
      "accountId": "a1000001-0000-0000-0000-000000000001",
      "type": "BOOKING_CREATED",
      "title": "Đặt lịch thành công",
      "message": "Booking HKS000001 của bạn đã được tạo thành công và đang chờ xác minh.",
      "relatedId": "b0000001-0000-0000-0000-000000000001",
      "relatedType": "BOOKING",
      "isRead": true,
      "readAt": "2025-10-25T10:15:00+07:00",
      "priority": "NORMAL",
      "actionUrl": "/bookings/b0000001-0000-0000-0000-000000000001",
      "createdAt": "2025-10-25T09:00:00+07:00"
    }
  }
  ```
- **Status Code**: 200 OK

### Test Case 7: Get Notification - Not Found
- **Test Case ID**: TC_NOTIF_007
- **Description**: Verify proper error when notification doesn't exist
- **Preconditions**:
  - Notification ID doesn't exist in database
  - Valid JWT token
- **Input**:
  - **Path Parameter**: notificationId = "ntf99999-0000-0000-0000-000000000999"
  - **Headers**: 
    ```
    Authorization: Bearer <valid_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Không tìm thấy thông báo với ID: ntf99999-0000-0000-0000-000000000999"
  }
  ```
- **Status Code**: 404 Not Found

### Test Case 8: Get Notification - Access Denied
- **Test Case ID**: TC_NOTIF_008
- **Description**: Verify user cannot access another user's notification
- **Preconditions**:
  - Notification exists but belongs to different user
  - Valid JWT token for different user
- **Input**:
  - **Path Parameter**: notificationId = "ntf00004-0000-0000-0000-000000000001" (belongs to jane_smith)
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_customer_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Bạn không có quyền truy cập thông báo này"
  }
  ```
- **Status Code**: 403 Forbidden

---

## PUT /{notificationId}/read - Mark As Read

### Test Case 9: Mark Notification As Read Successfully
- **Test Case ID**: TC_NOTIF_009
- **Description**: Verify user can mark their unread notification as read
- **Preconditions**:
  - Notification exists, belongs to user, and is unread
  - Valid JWT token
- **Input**:
  - **Path Parameter**: notificationId = "ntf00002-0000-0000-0000-000000000001"
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_customer_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Đánh dấu đã đọc thành công",
    "data": {
      "notificationId": "ntf00002-0000-0000-0000-000000000001",
      "accountId": "a1000001-0000-0000-0000-000000000001",
      "type": "BOOKING_CONFIRMED",
      "title": "Booking đã được xác nhận",
      "isRead": true,
      "readAt": "2025-10-30T14:25:00+07:00",
      "priority": "HIGH",
      "createdAt": "2025-10-26T10:30:00+07:00"
    }
  }
  ```
- **Status Code**: 200 OK

### Test Case 10: Mark Already Read Notification
- **Test Case ID**: TC_NOTIF_010
- **Description**: Verify marking an already-read notification doesn't cause error
- **Preconditions**:
  - Notification is already marked as read
  - Valid JWT token
- **Input**:
  - **Path Parameter**: notificationId = "ntf00001-0000-0000-0000-000000000001"
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_customer_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Đánh dấu đã đọc thành công",
    "data": {
      "notificationId": "ntf00001-0000-0000-0000-000000000001",
      "isRead": true,
      "readAt": "2025-10-25T10:15:00+07:00"
    }
  }
  ```
- **Status Code**: 200 OK

---

## PUT /mark-all-read - Mark All As Read

### Test Case 11: Mark All Notifications As Read
- **Test Case ID**: TC_NOTIF_011
- **Description**: Verify user can mark all their notifications as read at once
- **Preconditions**:
  - User has multiple unread notifications
  - Valid JWT token
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_customer_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Đánh dấu tất cả thông báo đã đọc thành công",
    "updated": 3
  }
  ```
- **Status Code**: 200 OK

### Test Case 12: Mark All When No Unread Notifications
- **Test Case ID**: TC_NOTIF_012
- **Description**: Verify marking all as read when there are no unread notifications
- **Preconditions**:
  - User has no unread notifications
  - Valid JWT token
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <valid_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Đánh dấu tất cả thông báo đã đọc thành công",
    "updated": 0
  }
  ```
- **Status Code**: 200 OK

---

## DELETE /{notificationId} - Delete Notification

### Test Case 13: Delete Notification Successfully
- **Test Case ID**: TC_NOTIF_013
- **Description**: Verify user can delete their own notification
- **Preconditions**:
  - Notification exists and belongs to user
  - Valid JWT token
- **Input**:
  - **Path Parameter**: notificationId = "ntf00001-0000-0000-0000-000000000001"
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_customer_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Xóa thông báo thành công"
  }
  ```
- **Status Code**: 200 OK

### Test Case 14: Delete Notification - Access Denied
- **Test Case ID**: TC_NOTIF_014
- **Description**: Verify user cannot delete another user's notification
- **Preconditions**:
  - Notification exists but belongs to different user
  - Valid JWT token
- **Input**:
  - **Path Parameter**: notificationId = "ntf00004-0000-0000-0000-000000000001"
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_customer_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Bạn không có quyền xóa thông báo này"
  }
  ```
- **Status Code**: 403 Forbidden

---

## POST / - Create Notification (Admin Only)

### Test Case 15: Admin Creates Notification Successfully
- **Test Case ID**: TC_NOTIF_015
- **Description**: Verify admin can create notification for any user
- **Preconditions**:
  - Valid JWT token with ADMIN role
  - Target account exists
- **Input**:
  - **Request Body**:
    ```json
    {
      "accountId": "a1000001-0000-0000-0000-000000000001",
      "type": "SYSTEM_ANNOUNCEMENT",
      "title": "Bảo trì hệ thống",
      "message": "Hệ thống sẽ bảo trì vào 2:00 AM ngày 05/11/2025.",
      "relatedId": null,
      "relatedType": "SYSTEM",
      "priority": "HIGH",
      "actionUrl": null
    }
    ```
  - **Headers**: 
    ```
    Authorization: Bearer <admin_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Tạo thông báo thành công",
    "data": {
      "notificationId": "ntf00012-0000-0000-0000-000000000001",
      "accountId": "a1000001-0000-0000-0000-000000000001",
      "type": "SYSTEM_ANNOUNCEMENT",
      "title": "Bảo trì hệ thống",
      "message": "Hệ thống sẽ bảo trì vào 2:00 AM ngày 05/11/2025.",
      "relatedId": null,
      "relatedType": "SYSTEM",
      "isRead": false,
      "readAt": null,
      "priority": "HIGH",
      "actionUrl": null,
      "createdAt": "2025-10-30T15:00:00+07:00"
    }
  }
  ```
- **Status Code**: 201 Created

### Test Case 16: Non-Admin Cannot Create Notification
- **Test Case ID**: TC_NOTIF_016
- **Description**: Verify CUSTOMER or EMPLOYEE role cannot create notifications
- **Preconditions**:
  - Valid JWT token with CUSTOMER role
- **Input**:
  - **Request Body**:
    ```json
    {
      "accountId": "a1000001-0000-0000-0000-000000000002",
      "type": "SYSTEM_ANNOUNCEMENT",
      "title": "Test",
      "message": "Test message",
      "priority": "NORMAL"
    }
    ```
  - **Headers**: 
    ```
    Authorization: Bearer <customer_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "timestamp": "2025-10-30T15:00:00.000+00:00",
    "status": 403,
    "error": "Forbidden",
    "message": "Access Denied",
    "path": "/api/v1/notifications"
  }
  ```
- **Status Code**: 403 Forbidden

### Test Case 17: Create Notification with Missing Required Fields
- **Test Case ID**: TC_NOTIF_017
- **Description**: Verify validation for required fields
- **Preconditions**:
  - Valid JWT token with ADMIN role
- **Input**:
  - **Request Body**:
    ```json
    {
      "accountId": "",
      "type": null,
      "title": "",
      "message": ""
    }
    ```
  - **Headers**: 
    ```
    Authorization: Bearer <admin_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Dữ liệu không hợp lệ",
    "errors": {
      "accountId": "Account ID không được để trống",
      "type": "Loại thông báo không được để trống",
      "title": "Tiêu đề không được để trống",
      "message": "Nội dung không được để trống"
    }
  }
  ```
- **Status Code**: 400 Bad Request

---

## Authorization Error Scenarios

### Test Case 18: Missing Authorization Token
- **Test Case ID**: TC_NOTIF_018
- **Description**: Verify unauthorized access is rejected
- **Preconditions**:
  - No authorization token provided
- **Input**:
  - **Headers**: 
    ```
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "timestamp": "2025-10-30T10:30:00.000+00:00",
    "status": 401,
    "error": "Unauthorized",
    "message": "Full authentication is required to access this resource",
    "path": "/api/v1/notifications"
  }
  ```
- **Status Code**: 401 Unauthorized

### Test Case 19: Invalid/Expired Token
- **Test Case ID**: TC_NOTIF_019
- **Description**: Verify system rejects invalid or expired tokens
- **Preconditions**:
  - Expired or malformed JWT token
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer invalid_token_12345
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Token không hợp lệ"
  }
  ```
- **Status Code**: 401 Unauthorized

---

## Notification Type Testing

### Test Case 20: Different Notification Types
- **Test Case ID**: TC_NOTIF_020
- **Description**: Verify system handles all notification types correctly
- **Notification Types Tested**:
  - BOOKING_CREATED
  - BOOKING_CONFIRMED
  - BOOKING_CANCELLED
  - BOOKING_COMPLETED
  - BOOKING_VERIFIED
  - BOOKING_REJECTED
  - ASSIGNMENT_CREATED
  - ASSIGNMENT_CANCELLED
  - ASSIGNMENT_CRISIS
  - PAYMENT_SUCCESS
  - PAYMENT_FAILED
  - REVIEW_RECEIVED
  - SYSTEM_ANNOUNCEMENT
  - PROMOTION_AVAILABLE
- **Expected Behavior**: Each type is properly stored and retrieved with correct metadata

---

## Priority Level Testing

### Test Case 21: Notification Priority Levels
- **Test Case ID**: TC_NOTIF_021
- **Description**: Verify system handles all priority levels correctly
- **Priority Levels Tested**:
  - LOW: General information notifications
  - NORMAL: Regular booking/payment notifications
  - HIGH: Important booking confirmations, assignment notifications
  - URGENT: Crisis notifications (employee cancellations)
- **Expected Behavior**: Priority is correctly stored and can be used for sorting/filtering

---

## Notes
- **Test Date Context**: All test cases assume current date is October 30, 2025
- **Real Data Integration**: Uses actual account IDs from seed data
- **Notification Types**: 14 different types covering all major system events
- **Priority System**: 4 priority levels (LOW, NORMAL, HIGH, URGENT)
- **Related Entities**: Notifications can link to BOOKING, ASSIGNMENT, PAYMENT, REVIEW, PROMOTION, or SYSTEM
- **Security**: 
  - Users can only access their own notifications
  - Only ADMIN can create notifications manually
  - Automatic notifications created by system on events
- **Pagination**: 
  - Default: page=0, size=10
  - Maximum size: 100
- **Read Status Tracking**: 
  - isRead flag and readAt timestamp
  - Unread count available via separate endpoint
- **Action URLs**: Deep links to related resources for quick navigation
