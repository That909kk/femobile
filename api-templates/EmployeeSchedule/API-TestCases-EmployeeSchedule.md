# API Test Cases - Employee Schedule Management

## Overview
This document describes the test cases for the **Employee Schedule** endpoints of the Admin API.
The endpoints allow admin, customers, and employees to manage employee schedules, availability, and unavailability periods.
**Base URL**: `/api/v1/employee-schedule`

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
- **Role**:
  - ADMIN: Full access to all endpoints
  - CUSTOMER: Access to search suitable employees and view employee lists
  - EMPLOYEE: Limited access (can only view/modify own schedule)

---

## Database Test Data
Based on housekeeping_service_v6.sql:
- **Employees**:
  - Employee ID: "e1000001-0000-0000-0000-000000000001" (Jane Smith, AVAILABLE)
  - Employee ID: "e1000001-0000-0000-0000-000000000002" (Bob Wilson, AVAILABLE)
- **Working Zones**:
  - Jane Smith: Phường Tây Thạnh, Phường 15 (TP. Hồ Chí Minh)
  - Bob Wilson: Phường Hạnh Thông (TP. Hồ Chí Minh)
- **Assignments**: Active assignments and unavailability periods exist
- **Services**: Various services with different estimated durations
- **Time Period**: Test queries with 2025-08-28 to 2025-08-30 range

---

## GET /employee-schedule - Get Employees by Status

### Test Case 1: Successfully Get Available Employees (Default)
- **Test Case ID**: TC_SCHEDULE_001
- **Description**: Verify that admin/customer can retrieve available employees for a specific time period and location.
- **Preconditions**:
  - User is authenticated with valid token.
  - User has ROLE_ADMIN or ROLE_CUSTOMER authority.
  - Database contains available employees in specified location.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/employee-schedule?status=AVAILABLE&ward=Phường Tây Thạnh&city=TP. Hồ Chí Minh&startDate=2025-08-28T09:00:00&endDate=2025-08-28T17:00:00`
  - **Query Parameters**:
    - `status = AVAILABLE` (default parameter)
    - `ward = Phường Tây Thạnh`
    - `city = TP. Hồ Chí Minh`
    - `startDate = 2025-08-28T09:00:00`
    - `endDate = 2025-08-28T17:00:00`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Lấy danh sách nhân viên rảnh thành công",
    "data": [
      {
        "employeeId": "e1000001-0000-0000-0000-000000000001",
        "fullName": "Jane Smith",
        "avatar": "https://picsum.photos/200",
        "skills": ["Cleaning", "Organizing"],
        "rating": "N/A",
        "status": "AVAILABLE",
        "workingZones": [
          {
            "ward": "Phường Tây Thạnh",
            "city": "TP. Hồ Chí Minh"
          },
          {
            "ward": "Phường Hạnh Thông",
            "city": "TP. Hồ Chí Minh"
          }
        ],
        "timeSlots": [
          {
            "startTime": "2025-08-28T09:00:00",
            "endTime": "2025-08-28T17:00:00",
            "status": "AVAILABLE",
            "reason": null,
            "bookingCode": null,
            "serviceName": null,
            "customerName": null,
            "address": null,
            "assignmentStatus": null,
            "durationHours": 8
          }
        ]
      }
    ]
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 2: Customer Access to Employee List
- **Test Case ID**: TC_SCHEDULE_002
- **Description**: Verify that customer can retrieve available employees for booking purposes.
- **Preconditions**:
  - User is authenticated with valid customer token.
  - User has ROLE_CUSTOMER authority.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/employee-schedule?startDate=2025-08-28T09:00:00&endDate=2025-08-28T17:00:00`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Lấy danh sách nhân viên rảnh thành công",
    "data": [...employees...]
  }
  ```
- **Status Code**: `200 OK`

---

## GET /employee-schedule - Get Busy Employees

### Test Case 3: Successfully Get Busy Employees
- **Test Case ID**: TC_SCHEDULE_003
- **Description**: Verify that admin can retrieve busy employees for a specific time period.
- **Preconditions**:
  - User is authenticated with valid admin token.
  - User has ROLE_ADMIN (ADMIN), ROLE_CUSTOMER (CUSTOMER) authority.
  - Database contains busy employees in the specified time period.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/employee-schedule?status=BUSY&city=TP. Hồ Chí Minh&startDate=2025-08-28T09:00:00&endDate=2025-08-28T17:00:00`
  - **Query Parameters**:
    - `status = BUSY` or `status = AVAILABLE`
    - `city = TP. Hồ Chí Minh`
    - `startDate = 2025-08-28T09:00:00`
    - `endDate = 2025-08-28T17:00:00`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Lấy danh sách nhân viên bận thành công",
    "data": [
      {
        "employeeId": "e1000001-0000-0000-0000-000000000002",
        "fullName": "Bob Wilson",
        "avatar": "https://picsum.photos/200",
        "skills": ["Deep Cleaning", "Laundry"],
        "rating": "N/A",
        "status": "AVAILABLE",
        "workingZones": [
          {
            "ward": "Phường Hạnh Thông",
            "city": "TP. Hồ Chí Minh"
          }
        ],
        "timeSlots": [
          {
            "startTime": "2025-08-28T10:00:00",
            "endTime": "2025-08-28T14:00:00",
            "status": "ASSIGNMENT",
            "reason": null,
            "bookingCode": "BK000001",
            "serviceName": "Tổng vệ sinh",
            "customerName": "John Doe",
            "address": "123 Lê Trọng Tấn, Tây Thạnh, TP. Hồ Chí Minh",
            "assignmentStatus": "ASSIGNED",
            "durationHours": 4
          }
        ]
      }
    ]
  }
  ```
- **Status Code**: `200 OK`

---

## GET /employee-schedule/{employeeId} - Get Employee Schedule

### Test Case 4: Successfully Get Employee Schedule (Admin)
- **Test Case ID**: TC_SCHEDULE_004
- **Description**: Verify that admin can retrieve specific employee's schedule.
- **Preconditions**:
  - User is authenticated with valid admin token.
  - User has ROLE_ADMIN authority.
  - Employee with specified ID exists.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/employee-schedule/e1000001-0000-0000-0000-000000000001?startDate=2025-08-28T09:00:00&endDate=2025-08-28T17:00:00`
  - **Path Parameter**: `employeeId = e1000001-0000-0000-0000-000000000001`
  - **Query Parameters**:
    - `startDate = 2025-08-28T09:00:00`
    - `endDate = 2025-08-28T17:00:00`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Lấy lịch làm việc nhân viên thành công",
    "data": {
      "employeeId": "e1000001-0000-0000-0000-000000000001",
      "fullName": "Jane Smith",
      "avatar": "https://picsum.photos/200",
      "skills": ["Cleaning", "Organizing"],
      "rating": "N/A",
      "status": "AVAILABLE",
      "workingZones": [
        {
          "ward": "Phường Tây Thạnh",
          "city": "TP. Hồ Chí Minh"
        }
      ],
      "timeSlots": [
        {
          "startTime": "2025-08-28T09:00:00",
          "endTime": "2025-08-28T17:00:00",
          "status": "AVAILABLE",
          "reason": null,
          "bookingCode": null,
          "serviceName": null,
          "customerName": null,
          "address": null,
          "assignmentStatus": null,
          "durationHours": 8
        }
      ]
    }
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 5: Employee Not Found
- **Test Case ID**: TC_SCHEDULE_005
- **Description**: Verify that request fails when employeeId does not exist.
- **Preconditions**:
  - User is authenticated with valid admin token.
  - User has ROLE_ADMIN authority.
  - Employee with ID 999 does not exist.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/employee-schedule/999?startDate=2025-08-28T09:00:00&endDate=2025-08-28T17:00:00`
  - **Path Parameter**: `employeeId = 999`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Không tìm thấy nhân viên này",
    "data": null
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 6: Employee Access Own Schedule
- **Test Case ID**: TC_SCHEDULE_006
- **Description**: Verify that employee can access their own schedule.
- **Preconditions**:
  - User is authenticated with valid employee token.
  - User has ROLE_EMPLOYEE authority.
  - Authentication name matches the employeeId.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/employee-schedule/e1000001-0000-0000-0000-000000000001?startDate=2025-08-28T09:00:00&endDate=2025-08-28T17:00:00`
  - **Path Parameter**: `employeeId = e1000001-0000-0000-0000-000000000001`
  - **Headers**: 
    ```
    Authorization: Bearer <employee_token_for_jane_smith>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Lấy lịch làm việc nhân viên thành công",
    "data": {
      "employeeId": "e1000001-0000-0000-0000-000000000001",
      "fullName": "Jane Smith",
      "avatar": "https://picsum.photos/200",
      "skills": ["Cleaning", "Organizing"],
      "rating": "N/A",
      "status": "AVAILABLE",
      "workingZones": [
        {
          "ward": "Phường Tây Thạnh",
          "city": "TP. Hồ Chí Minh"
        }
      ],
      "timeSlots": []
    }
  }
  ```
- **Status Code**: `200 OK`

---

## POST /employee-schedule/unavailability - Create Unavailability

### Test Case 7: Successfully Create Unavailability (Admin)
- **Test Case ID**: TC_SCHEDULE_007
- **Description**: Verify that admin can create unavailability period for an employee.
- **Preconditions**:
  - User is authenticated with valid admin token.
  - User has ROLE_ADMIN authority.
  - Employee exists and has no schedule conflict.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/employee-schedule/unavailability`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "employeeId": "e1000001-0000-0000-0000-000000000001",
      "startTime": "2025-08-29T14:00:00",
      "endTime": "2025-08-29T16:00:00",
      "reason": "Nghỉ phép cá nhân"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Tạo ngày nghỉ thành công",
    "data": {
      "employeeId": "e1000001-0000-0000-0000-000000000001",
      "fullName": "Jane Smith",
      "avatar": "https://picsum.photos/200",
      "skills": ["Cleaning", "Organizing"],
      "rating": "N/A",
      "status": "AVAILABLE",
      "workingZones": [
        {
          "ward": "Phường Tây Thạnh",
          "city": "TP. Hồ Chí Minh"
        }
      ],
      "timeSlots": [
        {
          "startTime": "2025-08-29T14:00:00",
          "endTime": "2025-08-29T16:00:00",
          "status": "UNAVAILABLE",
          "reason": "Nghỉ phép cá nhân",
          "bookingCode": null,
          "serviceName": null,
          "customerName": null,
          "address": null,
          "assignmentStatus": null,
          "durationHours": 2
        }
      ]
    }
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 8: Schedule Conflict Error
- **Test Case ID**: TC_SCHEDULE_008
- **Description**: Verify that creating unavailability fails when there's a schedule conflict.
- **Preconditions**:
  - User is authenticated with valid admin token.
  - Employee exists but has conflicting schedule.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/employee-schedule/unavailability`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "employeeId": "e1000001-0000-0000-0000-000000000002",
      "startTime": "2025-08-28T12:00:00",
      "endTime": "2025-08-28T15:00:00",
      "reason": "Lịch cá nhân"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Đã bị trùng lịch ",
    "data": null
  }
  ```
- **Status Code**: `400 Bad Request`

---

## GET /employee-schedule/suitable - Find Suitable Employees

### Test Case 9: Successfully Find Suitable Employees (Admin/Customer)
- **Test Case ID**: TC_SCHEDULE_009
- **Description**: Verify that admin or customer can find suitable employees for a specific service and time.
- **Preconditions**:
  - User is authenticated with valid admin or customer token.
  - User has ROLE_ADMIN or ROLE_CUSTOMER authority.
  - Database contains employees available for the requested time and service.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/employee-schedule/suitable?serviceId=1&bookingTime=2025-08-28T10:00:00&ward=Phường Tây Thạnh&city=TP. Hồ Chí Minh`
  - **Query Parameters**:
    - `serviceId = 1`
    - `bookingTime = 2025-08-28T10:00:00`
    - `ward = Phường Tây Thạnh` (optional)
    - `city = TP. Hồ Chí Minh` (optional)
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_or_customer_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Tìm thấy 2 nhân viên phù hợp cho dịch vụ Dọn dẹp nhà",
    "data": [
      {
        "employeeId": "e1000001-0000-0000-0000-000000000001",
        "fullName": "Jane Smith",
        "avatar": "https://picsum.photos/200",
        "skills": ["Cleaning", "Organizing"],
        "rating": 4.5,
        "phone": "+84987654321",
        "workingZones": [
          {
            "ward": "Phường Tây Thạnh",
            "city": "TP. Hồ Chí Minh"
          },
          {
            "ward": "Phường Bảy Hiền",
            "city": "TP. Hồ Chí Minh"
          }
        ],
        "completedJobs": 25,
        "totalJobs": 30,
        "isAvailable": true
      }
    ]
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 10: No Suitable Employees Found
- **Test Case ID**: TC_SCHEDULE_010
- **Description**: Verify response when no employees are available for the requested service and time.
- **Preconditions**:
  - User is authenticated with valid token.
  - All employees are busy during the requested time period.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/employee-schedule/suitable?serviceId=1&bookingTime=2025-08-28T14:00:00`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Không có nhân viên nào rảnh trong thời gian được yêu cầu",
    "data": []
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 11: Service Not Found
- **Test Case ID**: TC_SCHEDULE_011
- **Description**: Verify error response when service ID does not exist.
- **Preconditions**:
  - User is authenticated with valid token.
  - Service ID does not exist in database.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/employee-schedule/suitable?serviceId=999&bookingTime=2025-08-28T10:00:00`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Không tìm thấy dịch vụ với ID: 999",
    "data": null
  }
  ```
- **Status Code**: 400 Bad Request

---

## Notes
- All endpoints require proper JWT token validation
- Date parameters must be in ISO DateTime format
- Location-based filtering helps optimize employee assignment
- Schedule conflicts should be properly validated
- Real-time availability updates should be considered
- Implement proper caching for frequently accessed schedule data
