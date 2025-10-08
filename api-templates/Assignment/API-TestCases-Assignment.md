# API Test Cases - Employee Assignment Management

## Overview
This document describes essential test cases for the **Employee Assignment Management** endpoints using realistic data from the housekeeping service database.  
**Base URL**: `/api/v1/employee`  
**Test Date Context**: September 22, 2025

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
  - Assignment management: EMPLOYEE or ADMIN role
  - Accept booking: EMPLOYEE role only

---

## API Endpoints Covered
1. **GET /{employeeId}/assignments** - Get Employee Assignments
2. **POST /assignments/{assignmentId}/cancel** - Cancel Assignment
3. **GET /available-bookings** - Get Available Bookings
4. **POST /booking-details/{detailId}/accept** - Accept Booking Detail
5. **POST /assignments/{assignmentId}/check-in** - Check In Assignment
6. **POST /assignments/{assignmentId}/check-out** - Check Out Assignment

---

## GET /{employeeId}/assignments - Get Employee Assignments

### Test Case 1: Successful Assignment Retrieval with Status Filter
- **Test Case ID**: TC_EMP_ASSIGN_001
- **Description**: Verify that Jane Smith can retrieve her assignments with status filtering
- **Preconditions**:
  - Employee Jane Smith exists with ID 'e1000001-0000-0000-0000-000000000001'
  - Valid JWT token with EMPLOYEE role for Jane Smith
  - Jane has assignment for BK000002 (Dọn dẹp theo giờ) scheduled for August 28, 2025
- **Input**:
  - **Path Parameter**: employeeId = "e1000001-0000-0000-0000-000000000001"
  - **Query Parameters**: status = "ASSIGNED", page = 0, size = 10
  - **Headers**: 
    ```
    Authorization: Bearer <jane_smith_employee_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Lấy danh sách công việc thành công",
    "data": [
      {
        "assignmentId": "as000001-0000-0000-0000-000000000002",
        "bookingCode": "BK000002",
        "serviceName": "Dọn dẹp theo giờ",
        "customerName": "Jane Smith Customer",
        "address": "104 Lê Lợi, Phường 1, Gò Vấp, TP. Hồ Chí Minh",
        "scheduledDate": "2025-08-28",
        "scheduledTime": "14:00",
        "status": "ASSIGNED",
        "estimatedDuration": 2.0,
        "price": 50000
      }
    ],
    "totalItems": 1
  }
  ```
- **Status Code**: 200 OK

### Test Case 2: Invalid Status Filter Graceful Handling
- **Test Case ID**: TC_EMP_ASSIGN_002
- **Description**: Verify system gracefully handles invalid status filters by returning all assignments
- **Preconditions**:
  - Employee Jane Smith exists and has multiple assignments
  - Valid JWT token with EMPLOYEE role
- **Input**:
  - **Path Parameter**: employeeId = "e1000001-0000-0000-0000-000000000001"
  - **Query Parameters**: status = "INVALID_STATUS", page = 0, size = 10
  - **Headers**: 
    ```
    Authorization: Bearer <jane_smith_employee_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Lấy danh sách công việc thành công",
    "data": [
      {
        "assignmentId": "as000001-0000-0000-0000-000000000002",
        "bookingCode": "BK000002",
        "serviceName": "Dọn dẹp theo giờ",
        "status": "ASSIGNED"
      }
    ],
    "totalItems": 1
  }
  ```
- **Status Code**: 200 OK

---

## POST /assignments/{assignmentId}/cancel - Cancel Assignment

### Test Case 3: Successful Assignment Cancellation
- **Test Case ID**: TC_EMP_ASSIGN_003
- **Description**: Verify Jane Smith can cancel her future assignment (more than 2 hours away)
- **Preconditions**:
  - Assignment 'as000001-0000-0000-0000-000000000002' exists in ASSIGNED status
  - Valid JWT token with EMPLOYEE role for Jane Smith
  - Current date: September 22, 2025
  - Booking scheduled for October 15, 2025 at 14:00 (more than 2 hours away)
- **Input**:
  - **Path Parameter**: assignmentId = "as000001-0000-0000-0000-000000000002"
  - **Request Body**:
    ```json
    {
      "reason": "Bị ốm đột xuất không thể thực hiện công việc",
      "employeeId": "e1000001-0000-0000-0000-000000000001"
    }
    ```
  - **Headers**: 
    ```
    Authorization: Bearer <jane_smith_employee_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Hủy công việc thành công. Hệ thống sẽ thông báo cho khách hàng."
  }
  ```
- **Status Code**: 200 OK

### Test Case 4: Cannot Cancel - Wrong Status or Too Close to Start Time
- **Test Case ID**: TC_EMP_ASSIGN_004
- **Description**: Verify cancellation restrictions for completed assignments or assignments too close to start time
- **Preconditions**:
  - Bob Wilson's assignment 'as000001-0000-0000-0000-000000000001' is in COMPLETED status
  - Valid JWT token with EMPLOYEE role for Bob Wilson
- **Input**:
  - **Path Parameter**: assignmentId = "as000001-0000-0000-0000-000000000001"
  - **Request Body**:
    ```json
    {
      "reason": "Thay đổi kế hoạch",
      "employeeId": "e1000001-0000-0000-0000-000000000002"
    }
    ```
  - **Headers**: 
    ```
    Authorization: Bearer <bob_wilson_employee_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Chỉ có thể hủy công việc đang ở trạng thái 'Đã nhận'"
  }
  ```
- **Status Code**: 400 Bad Request

---

## GET /available-bookings - Get Available Bookings

### Test Case 5: Zone-Based Booking Retrieval
- **Test Case ID**: TC_EMP_ASSIGN_005
- **Description**: Verify Jane Smith gets bookings from her working zones (Tân Phú, Tân Bình) prioritized first
- **Preconditions**:
  - Jane Smith has working zones: Quận Tân Phú, Quận Tân Bình in TP. Hồ Chí Minh
  - Available bookings exist in her working zones
  - Valid JWT token with EMPLOYEE role
- **Input**:
  - **Query Parameters**: 
    - employeeId = "e1000001-0000-0000-0000-000000000001"
    - page = 0
    - size = 10
  - **Headers**: 
    ```
    Authorization: Bearer <jane_smith_employee_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Lấy danh sách booking chờ thành công",
    "data": [
      {
        "detailId": "bd000001-0000-0000-0000-000000000003",
        "bookingCode": "BK000003",
        "serviceName": "Vệ sinh máy lạnh",
        "address": "456 Nguyễn Văn Trỗi, Phường 1, Tân Bình, TP. Hồ Chí Minh",
        "bookingTime": "2025-09-25T10:00:00+07:00",
        "estimatedDuration": 1.0,
        "quantity": 1
      }
    ],
    "totalItems": 1
  }
  ```
- **Status Code**: 200 OK

### Test Case 6: No Available Bookings
- **Test Case ID**: TC_EMP_ASSIGN_006
- **Description**: Verify proper handling when no bookings are available for the employee
- **Preconditions**:
  - No available bookings exist for the employee in any zone
  - Valid JWT token with EMPLOYEE role
- **Input**:
  - **Query Parameters**: 
    - employeeId = "e1000001-0000-0000-0000-000000000001"
    - page = 0
    - size = 10
  - **Headers**: 
    ```
    Authorization: Bearer <jane_smith_employee_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Không có booking chờ",
    "data": [],
    "totalItems": 0
  }
  ```
- **Status Code**: 200 OK

---

## POST /booking-details/{detailId}/accept - Accept Booking Detail

### Test Case 7: Successful Booking Detail Acceptance
- **Test Case ID**: TC_EMP_ASSIGN_007
- **Description**: Verify Jane Smith can successfully accept an air conditioner cleaning booking
- **Preconditions**:
  - Booking detail exists for "Vệ sinh máy lạnh" service with ID 'bd000001-0000-0000-0000-000000000005'
  - Jane Smith is qualified and available with no scheduling conflicts
  - Valid JWT token with EMPLOYEE role
  - Booking is in AWAITING_EMPLOYEE status
- **Input**:
  - **Path Parameter**: detailId = "bd000001-0000-0000-0000-000000000005"
  - **Query Parameters**: employeeId = "e1000001-0000-0000-0000-000000000001"
  - **Headers**: 
    ```
    Authorization: Bearer <jane_smith_employee_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Nhận công việc thành công",
    "data": {
      "assignmentId": "as000001-0000-0000-0000-000000000005",
      "bookingCode": "BK000005",
      "serviceName": "Vệ sinh máy lạnh",
      "status": "ASSIGNED",
      "scheduledDate": "2025-09-25",
      "scheduledTime": "10:00",
      "estimatedDuration": 1.0,
      "price": 150000
    }
  }
  ```
- **Status Code**: 200 OK

### Test Case 8: Booking Acceptance Conflict Scenarios
- **Test Case ID**: TC_EMP_ASSIGN_008
- **Description**: Verify comprehensive error handling for various booking acceptance conflicts
- **Sub-scenarios**:
  - **8a**: Employee already assigned to same booking detail
  - **8b**: Booking detail already at capacity (has enough employees)
  - **8c**: Employee has schedule conflict with existing assignment
  - **8d**: Employee has approved leave during booking time
  - **8e**: Booking is in invalid status (CANCELLED)
- **Input Example (8a)**:
  - **Path Parameter**: detailId = "bd000001-0000-0000-0000-000000000002"
  - **Query Parameters**: employeeId = "e1000001-0000-0000-0000-000000000001"
- **Expected Output (8a)**:
  ```json
  {
    "success": false,
    "message": "Nhân viên đã nhận chi tiết dịch vụ này"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 9: Multi-Staff Service Coordination
- **Test Case ID**: TC_EMP_ASSIGN_009
- **Description**: Verify booking status updates to CONFIRMED when all positions are filled for multi-staff services
- **Preconditions**:
  - Multi-staff service booking (Tổng vệ sinh requires 3 employees)
  - Currently has 2 employees assigned, needs 1 more
  - Booking status is AWAITING_EMPLOYEE
  - Bob Wilson is available to fill the last position
- **Input**:
  - **Path Parameter**: detailId = "bd000001-0000-0000-0000-000000000010"
  - **Query Parameters**: employeeId = "e1000001-0000-0000-0000-000000000002"
  - **Headers**: 
    ```
    Authorization: Bearer <bob_wilson_employee_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Nhận công việc thành công",
    "data": {
      "assignmentId": "as000001-0000-0000-0000-000000000010",
      "bookingCode": "BK000010",
      "serviceName": "Tổng vệ sinh",
      "status": "ASSIGNED",
      "bookingStatus": "CONFIRMED"
    }
  }
  ```
- **Status Code**: 200 OK

---

## Authorization and Error Scenarios

### Test Case 10: Role-Based Authorization Validation
- **Test Case ID**: TC_EMP_ASSIGN_010
- **Description**: Verify proper role-based access control across all endpoints
- **Sub-scenarios**:
  - **10a**: ADMIN cannot accept booking details (EMPLOYEE role required)
  - **10b**: ADMIN can view employee assignments
  - **10c**: Invalid/expired JWT tokens are rejected
- **Input Example (10a)**:
  - **Path Parameter**: detailId = "bd000001-0000-0000-0000-000000000005"
  - **Query Parameters**: employeeId = "e1000001-0000-0000-0000-000000000001"
  - **Headers**:
    ```
    Authorization: Bearer <admin_one_token>
    Content-Type: application/json
    ```
- **Expected Output (10a)**:
  ```json
  {
    "success": false,
    "message": "Access denied. Employee role required."
  }
  ```
- **Status Code**: 403 Forbidden

### Test Case 11: Data Validation and Edge Cases
- **Test Case ID**: TC_EMP_ASSIGN_011
- **Description**: Verify proper validation and edge case handling across all endpoints
- **Sub-scenarios**:
  - **11a**: Missing/invalid request body for assignment cancellation
  - **11b**: Non-existent employee ID for available bookings
  - **11c**: Non-existent assignment ID for cancellation
  - **11d**: Duration calculation with null service duration (defaults to 2 hours)
  - **11e**: Employee with no working zones configured (fallback to general bookings)
- **Input Example (11a)**:
  - **Path Parameter**: assignmentId = "as000001-0000-0000-0000-000000000002"
  - **Request Body**:
    ```json
    {
      "reason": "",
      "employeeId": null
    }
    ```
- **Expected Output (11a)**:
  ```json
  {
    "success": false,
    "message": "Dữ liệu yêu cầu không hợp lệ"
  }
  ```
- **Status Code**: 400 Bad Request

---

## POST /assignments/{assignmentId}/check-in - Check In Assignment

### Test Case 12: Successful Check-In Within Time Window
- **Test Case ID**: TC_EMP_ASSIGN_012
- **Description**: Verify employee can check in to assignment within the allowed time window (10 minutes before to 5 minutes after booking time)
- **Preconditions**:
  - Assignment exists with ASSIGNED status
  - Current time is within check-in window (booking time ±10/+5 minutes)
  - Employee Jane Smith is assigned to this booking
  - Booking time is September 22, 2025, 14:00
- **Input**:
  - **Path Parameter**: assignmentId = "as000001-0000-0000-0000-000000000002"
  - **Request Body**:
    ```json
    {
      "employeeId": "e1000001-0000-0000-0000-000000000001"
    }
    ```
  - **Headers**: 
    ```
    Authorization: Bearer <jane_smith_employee_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Điểm danh bắt đầu công việc thành công",
    "data": {
      "assignmentId": "as000001-0000-0000-0000-000000000002",
      "status": "IN_PROGRESS",
      "checkInTime": "2025-09-22T13:55:00+07:00",
      "checkOutTime": null,
      "bookingDetail": {
        "detailId": "bd000001-0000-0000-0000-000000000002",
        "serviceName": "Dọn dẹp theo giờ",
        "quantity": 1,
        "price": 50000,
        "duration": "2.00"
      },
      "employee": {
        "employeeId": "e1000001-0000-0000-0000-000000000001",
        "fullName": "Jane Smith"
      },
      "booking": {
        "bookingId": "BK000002",
        "bookingTime": "2025-09-22T14:00:00+07:00",
        "customerName": "Jane Smith Customer"
      }
    }
  }
  ```
- **Status Code**: 200 OK

### Test Case 13: Check-In Outside Time Window
- **Test Case ID**: TC_EMP_ASSIGN_013
- **Description**: Verify check-in is rejected when attempted outside the allowed time window
- **Preconditions**:
  - Assignment exists with ASSIGNED status
  - Current time is outside check-in window (more than 10 minutes before or 5 minutes after booking time)
  - Booking time is September 22, 2025, 14:00
  - Current time is September 22, 2025, 13:40 (20 minutes early)
- **Input**:
  - **Path Parameter**: assignmentId = "as000001-0000-0000-0000-000000000002"
  - **Request Body**:
    ```json
    {
      "employeeId": "e1000001-0000-0000-0000-000000000001"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Chỉ có thể điểm danh từ 13:50 22/09/2025 đến 14:05 22/09/2025"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 14: Check-In Already Completed
- **Test Case ID**: TC_EMP_ASSIGN_014
- **Description**: Verify employee cannot check in twice to the same assignment
- **Preconditions**:
  - Assignment already has check-in time recorded
  - Assignment status is IN_PROGRESS
- **Input**:
  - **Path Parameter**: assignmentId = "as000001-0000-0000-0000-000000000001"
  - **Request Body**:
    ```json
    {
      "employeeId": "e1000001-0000-0000-0000-000000000002"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Đã điểm danh cho công việc này rồi"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 15: Check-In Wrong Assignment Status
- **Test Case ID**: TC_EMP_ASSIGN_015
- **Description**: Verify check-in is rejected for assignments not in ASSIGNED status
- **Preconditions**:
  - Assignment exists with COMPLETED status (not ASSIGNED)
  - Employee tries to check in to completed assignment
- **Input**:
  - **Path Parameter**: assignmentId = "as000001-0000-0000-0000-000000000001"
  - **Request Body**:
    ```json
    {
      "employeeId": "e1000001-0000-0000-0000-000000000002"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Chỉ có thể điểm danh cho công việc đang được phân công"
  }
  ```
- **Status Code**: 400 Bad Request

---

## POST /assignments/{assignmentId}/check-out - Check Out Assignment

### Test Case 16: Successful Check-Out After Work Completion
- **Test Case ID**: TC_EMP_ASSIGN_016
- **Description**: Verify employee can successfully check out from assignment after completing work
- **Preconditions**:
  - Assignment exists with IN_PROGRESS status
  - Assignment has check-in time recorded
  - Employee Jane Smith is working on this assignment
- **Input**:
  - **Path Parameter**: assignmentId = "as000001-0000-0000-0000-000000000002"
  - **Request Body**:
    ```json
    {
      "employeeId": "e1000001-0000-0000-0000-000000000001"
    }
    ```
  - **Headers**: 
    ```
    Authorization: Bearer <jane_smith_employee_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Chấm công kết thúc công việc thành công",
    "data": {
      "assignmentId": "as000001-0000-0000-0000-000000000002",
      "status": "COMPLETED",
      "checkInTime": "2025-09-22T13:55:00+07:00",
      "checkOutTime": "2025-09-22T16:05:00+07:00",
      "bookingDetail": {
        "detailId": "bd000001-0000-0000-0000-000000000002",
        "serviceName": "Dọn dẹp theo giờ",
        "quantity": 1,
        "price": 50000,
        "duration": "2.00"
      },
      "employee": {
        "employeeId": "e1000001-0000-0000-0000-000000000001",
        "fullName": "Jane Smith"
      },
      "booking": {
        "bookingId": "BK000002",
        "bookingTime": "2025-09-22T14:00:00+07:00",
        "customerName": "Jane Smith Customer"
      }
    }
  }
  ```
- **Status Code**: 200 OK

### Test Case 17: Check-Out Without Check-In
- **Test Case ID**: TC_EMP_ASSIGN_017
- **Description**: Verify check-out is rejected for assignments that haven't been checked in
- **Preconditions**:
  - Assignment exists with ASSIGNED status (not checked in yet)
  - No check-in time recorded
- **Input**:
  - **Path Parameter**: assignmentId = "as000001-0000-0000-0000-000000000003"
  - **Request Body**:
    ```json
    {
      "employeeId": "e1000001-0000-0000-0000-000000000001"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Chỉ có thể chấm công cho công việc đang thực hiện"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 18: Double Check-Out Prevention
- **Test Case ID**: TC_EMP_ASSIGN_018
- **Description**: Verify employee cannot check out twice from the same assignment
- **Preconditions**:
  - Assignment already has check-out time recorded
  - Assignment status is COMPLETED
- **Input**:
  - **Path Parameter**: assignmentId = "as000001-0000-0000-0000-000000000001"
  - **Request Body**:
    ```json
    {
      "employeeId": "e1000001-0000-0000-0000-000000000002"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Đã chấm công kết thúc công việc này rồi"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 19: Booking Status Update After All Assignments Complete
- **Test Case ID**: TC_EMP_ASSIGN_019
- **Description**: Verify booking status updates to COMPLETED when all assigned employees check out
- **Preconditions**:
  - Multi-staff booking with multiple assignments
  - This is the last employee to check out
  - All other employees have already completed their assignments
- **Input**:
  - **Path Parameter**: assignmentId = "as000001-0000-0000-0000-000000000010"
  - **Request Body**:
    ```json
    {
      "employeeId": "e1000001-0000-0000-0000-000000000002"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Chấm công kết thúc công việc thành công",
    "data": {
      "assignmentId": "as000001-0000-0000-0000-000000000010",
      "status": "COMPLETED",
      "checkInTime": "2025-09-22T09:00:00+07:00",
      "checkOutTime": "2025-09-22T12:30:00+07:00",
      "bookingDetail": {
        "detailId": "bd000001-0000-0000-0000-000000000010",
        "serviceName": "Tổng vệ sinh",
        "quantity": 3,
        "price": 100000
      },
      "booking": {
        "bookingId": "BK000003",
        "bookingTime": "2025-09-22T09:00:00+07:00",
        "status": "COMPLETED"
      }
    }
  }
  ```
- **Status Code**: 200 OK

---

## Database Integration Test Scenarios

### Test Case 20: Real Database Integration
- **Test Case ID**: TC_EMP_ASSIGN_020
- **Description**: Verify integration with actual database data from housekeeping_service_v8.sql
- **Covered Data**:
  - **Employees**: Jane Smith (e1000001-0000-0000-0000-000000000001), Bob Wilson (e1000001-0000-0000-0000-000000000002)
  - **Customers**: John Doe, Mary Jones, Jane Smith Customer
  - **Services**: Dọn dẹp theo giờ (50,000 VND), Tổng vệ sinh (100,000 VND), Vệ sinh máy lạnh (150,000 VND)
  - **Working Zones**: Real Ho Chi Minh City wards (Tây Thạnh)
  - **Addresses**: Actual street addresses in Ho Chi Minh City
  - **Existing Assignments**: Bob's completed BK000001, Jane's pending BK000002
- **Validation Points**:
  - Zone-based booking matching works with real coordinates
  - Proximity calculations use actual geographic data
  - Service pricing and duration match database values
  - Employee skills align with service requirements

---

## Notes
- **Test Date Context**: All test cases assume current date is September 22, 2025
- **Real Data Integration**: Uses actual IDs, addresses, and service data from housekeeping_service_v8.sql
- **Employee Profiles**:
  - Jane Smith: Skills (Cleaning, Organizing), Zones (Tân Phú, Tân Bình)
  - Bob Wilson: Skills (Deep Cleaning, Laundry), Zone (Gò Vấp)
- **Service Categories**: House cleaning, laundry, other household services with realistic pricing
- **Business Logic Validation**:
  - 2-hour cancellation rule enforcement
  - Crisis notification system for customer alerts
  - Zone-based assignment optimization
  - Multi-staff service coordination
  - Conflict detection and prevention
- **Geographic Context**: Ho Chi Minh City wards and real addresses for location-based testing
