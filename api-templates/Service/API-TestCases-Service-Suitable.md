# API Test Cases - Service Options and Suitable Employees

## Overview
This document describes the test cases for the **Service Options** and **Suitable Employees** endpoints of the Customer API.  
The endpoints allow authenticated customers to retrieve service configuration options and find suitable employees for specific services.  
**Base URLs**: 
- Service Options: `/api/v1/customer/services/{serviceId}/options`
- Suitable Employees: `/api/v1/customer/services/suitable`

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
- **Role**: Accessible by CUSTOMER, EMPLOYEE, and ADMIN roles
- **Token Validation**: JWT token must be valid and not expired

---

## Database Test Data
Based on housekeeping_service_v8.sql:
- **Services**:
  - Service ID 1: "Dọn dẹp theo giờ" (50,000đ/hour, 2.0 hours, recommended staff: 1)
  - Service ID 2: "Tổng vệ sinh" (400,000đ/package, 4.0 hours, recommended staff: 3)
- **Service Options**: Various option types (RADIO, CHECKBOX, SELECT) with choices
- **Employees**: 
  - Jane Smith (ID: e1000001-0000-0000-0000-000000000001) - Skills: Cleaning, Organizing
  - Bob Wilson (ID: e1000001-0000-0000-0000-000000000002) - Skills: Deep Cleaning, Laundry
- **Working Zones**: Employee coverage areas by ward and city

---

## GET /{serviceId}/options - Get Service Options

### Test Case 1: Successfully Get Service Options
- **Test Case ID**: TC_SERVICE_OPTIONS_001
- **Description**: Verify that a customer can retrieve service options for a specific service.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Service with ID 1 exists and is active (recommended staff: 1).
  - Service has configured options and choices.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/services/1/options`
  - **Path Parameter**: `serviceId = 1`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    ```
- **Output**:
  ```json
  {
    "success": true,
    "message": "Lấy thông tin dịch vụ và tùy chọn thành công",
    "data": {
      "serviceId": 1,
      "serviceName": "Dọn dẹp theo giờ",
      "description": "Lau dọn, hút bụi, làm sạch các bề mặt cơ bản trong nhà.",
      "basePrice": 50000,
      "unit": "hour",
      "estimatedDurationHours": 2.0,
      "recommendedStaff": 1,
      "formattedPrice": "50,000đ/giờ",
      "formattedDuration": "2 giờ",
      "options": [
        {
          "optionId": 1,
          "optionName": "Loại phòng",
          "optionType": "RADIO",
          "displayOrder": 1,
          "isRequired": true,
          "choices": [
            {
              "choiceId": 1,
              "label": "Phòng khách",
              "displayOrder": 1,
              "isDefault": true
            },
            {
              "choiceId": 2,
              "label": "Phòng ngủ",
              "displayOrder": 2,
              "isDefault": false
            }
          ]
        }
      ]
    }
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 2: Get Options for Service Without Options
- **Test Case ID**: TC_SERVICE_OPTIONS_002
- **Description**: Verify behavior when requesting options for a service that has no configured options.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Service with ID 2 exists but has no options configured (recommended staff: 3).
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/services/2/options`
  - **Path Parameter**: `serviceId = 2`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    ```
- **Output**:
  ```json
  {
    "success": true,
    "message": "Dịch vụ này không có tùy chọn nào",
    "data": {
      "serviceId": 2,
      "serviceName": "Tổng vệ sinh",
      "description": "Làm sạch sâu toàn bộ căn nhà, bao gồm lau kính, vệ sinh các khu vực khó tiếp cận.",
      "basePrice": 400000,
      "unit": "package",
      "estimatedDurationHours": 4.0,
      "recommendedStaff": 3,
      "formattedPrice": "400,000đ/gói",
      "formattedDuration": "4 giờ",
      "options": []
    }
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 3: Service Not Found for Options
- **Test Case ID**: TC_SERVICE_OPTIONS_003
- **Description**: Verify error handling when requesting options for non-existent service.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Service with ID 999 does not exist.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/services/999/options`
  - **Path Parameter**: `serviceId = 999`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    ```
- **Output**:
  ```json
  {
    "success": false,
    "message": "Không tìm thấy dịch vụ hoặc dịch vụ đã ngừng hoạt động",
    "data": null
  }
  ```
- **Status Code**: `404 Not Found`

---

### Test Case 4: Invalid Token for Service Options
- **Test Case ID**: TC_SERVICE_OPTIONS_004
- **Description**: Verify that request fails when Authorization header is invalid.
- **Preconditions**: None
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/services/1/options`
  - **Headers**: 
    ```
    Authorization: Bearer invalid_token
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Token không hợp lệ",
    "data": null
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 5: Internal Server Error for Service Options
- **Test Case ID**: TC_SERVICE_OPTIONS_005
- **Description**: Verify error handling when internal server error occurs.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Database connection or service error occurs.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/services/1/options`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    ```
- **Output**:
  ```json
  {
    "success": false,
    "message": "Lỗi hệ thống",
    "data": null
  }
  ```
- **Status Code**: `500 Internal Server Error`

---

## GET /suitable - Find Suitable Employees

### Test Case 6: Successfully Find Suitable Employees
- **Test Case ID**: TC_SUITABLE_EMPLOYEES_001
- **Description**: Verify that a customer can find suitable employees for a specific service and location.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Service with ID 1 exists and is active (recommended staff: 1).
  - Employees are available in the specified ward and city.
  - Booking time is in the future.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/services/employee/suitable?serviceId=1&bookingTime=2025-09-05T10:00:00&ward=Phường Tây Thạnh&city=TP. Hồ Chí Minh`
  - **Query Parameters**: 
    - `serviceId = 1`
    - `bookingTime = 2025-09-05T10:00:00`
    - `ward = Phường Tây Thạnh`
    - `city = TP. Hồ Chí Minh`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    ```
- **Output**:
  ```json
  {
    "success": true,
    "message": "Tìm thấy 1 nhân viên phù hợp",
    "data": [
      {
        "employeeId": "e1000001-0000-0000-0000-000000000001",
        "fullName": "Jane Smith",
        "avatar": "https://picsum.photos/200",
        "skills": ["Cleaning", "Organizing"],
        "rating": "4.8",
        "status": "AVAILABLE",
        "workingWards": ["Phường Tây Thạnh", "Phường Bảy Hiền"],
        "workingCity": "TP. Hồ Chí Minh",
        "completedJobs": 45
      }
    ]
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 7: No Suitable Employees Found
- **Test Case ID**: TC_SUITABLE_EMPLOYEES_002
- **Description**: Verify response when no employees are available for the specified criteria.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Service with ID 1 exists and is active (recommended staff: 1).
  - No employees are available in the specified ward and time.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/services/employee/suitable?serviceId=1&bookingTime=2025-09-05T02:00:00&ward=Phường Thủ Đức&city=TP. Hồ Chí Minh`
  - **Query Parameters**: 
    - `serviceId = 1`
    - `bookingTime = 2025-09-05T02:00:00`
    - `ward = Phường Thủ Đức`
    - `city = TP. Hồ Chí Minh`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    ```
- **Output**:
  ```json
  {
    "success": true,
    "message": "Không tìm thấy nhân viên phù hợp cho yêu cầu này",
    "data": []
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 8: Missing Required Parameters for Suitable Employees
- **Test Case ID**: TC_SUITABLE_EMPLOYEES_003
- **Description**: Verify error handling when required parameters are missing.
- **Preconditions**:
  - Customer is authenticated with valid token.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/services/employee/suitable?serviceId=1`
  - **Query Parameters**: 
    - `serviceId = 1` (missing bookingTime)
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    ```
- **Output**:
  ```json
  {
    "success": false,
    "message": "Thiếu thông tin thời gian đặt lịch",
    "data": null
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 9: Invalid Service ID for Suitable Employees
- **Test Case ID**: TC_SUITABLE_EMPLOYEES_004
- **Description**: Verify error handling when service ID does not exist.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Service with ID 999 does not exist.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/services/employee/suitable?serviceId=999&bookingTime=2025-09-05T10:00:00&ward=Phường Tây Thạnh&city=TP. Hồ Chí Minh`
  - **Query Parameters**: 
    - `serviceId = 999`
    - `bookingTime = 2025-09-05T10:00:00`
    - `ward = Phường Tây Thạnh`
    - `city = TP. Hồ Chí Minh`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    ```
- **Output**:
  ```json
  {
    "success": false,
    "message": "Không tìm thấy dịch vụ",
    "data": null
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 10: Past Booking Time for Suitable Employees
- **Test Case ID**: TC_SUITABLE_EMPLOYEES_005
- **Description**: Verify error handling when booking time is in the past.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Service with ID 1 exists and is active (recommended staff: 1).
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/services/employee/suitable?serviceId=1&bookingTime=2024-09-01T10:00:00&ward=Phường Tây Thạnh&city=TP. Hồ Chí Minh`
  - **Query Parameters**: 
    - `serviceId = 1`
    - `bookingTime = 2024-09-01T10:00:00` (past date)
    - `ward = Phường Tây Thạnh`
    - `city = TP. Hồ Chí Minh`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    ```
- **Output**:
  ```json
  {
    "success": false,
    "message": "Thời gian đặt lịch phải trong tương lai",
    "data": null
  }
  ```
- **Status Code**: `400 Bad Request`

---

## Error Scenarios

### Test Case 11: Unauthorized Access - No Token
- **Test Case ID**: TC_OPTIONS_SUITABLE_ERROR_001
- **Description**: Verify that requests fail when Authorization header is missing.
- **Preconditions**: None
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/services/employee/suitable?serviceId=1&bookingTime=2025-09-05T10:00:00`
  - **Headers**: None
- **Output**:
  ```json
  {
    "timestamp": "2025-09-04T10:30:00.000+00:00",
    "status": 401,
    "error": "Unauthorized",
    "path": "/api/v1/customer/services/suitable"
  }
  ```
- **Status Code**: `401 Unauthorized`

---

### Test Case 12: Invalid Date Format for Suitable Employees
- **Test Case ID**: TC_SUITABLE_EMPLOYEES_006
- **Description**: Verify error handling when booking time format is invalid.
- **Preconditions**:
  - Customer is authenticated with valid token.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/services/employee/suitable?serviceId=1&bookingTime=invalid-date&ward=Phường Tây Thạnh&city=TP. Hồ Chí Minh`
  - **Query Parameters**: 
    - `serviceId = 1`
    - `bookingTime = invalid-date`
    - `ward = Phường Tây Thạnh`
    - `city = TP. Hồ Chí Minh`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    ```
- **Output**:
  ```json
  {
    "timestamp": "2025-09-04T10:30:00.000+00:00",
    "status": 400,
    "error": "Bad Request",
    "message": "Invalid date format",
    "path": "/api/v1/customer/services/suitable"
  }
  ```
- **Status Code**: `400 Bad Request`

---

## Notes
- **Test Environment**: Database should be configured with test data including services, service options, employees, and working zones from housekeeping_service_v8.sql.
- **Authentication**: All endpoints require valid JWT tokens.
- **Authorization**: PreAuthorize annotation ensures proper role-based access control for suitable employees endpoint.
- **Service Options**: Options are returned with proper display order and choice hierarchy.
- **Employee Matching**: Suitable employees are filtered by service compatibility, availability, and working zone coverage.
- **Date Validation**: Booking time must be in ISO 8601 format and in the future.
- **Geographic Filtering**: Employee matching considers ward and city working zones.
- **Response Format**: Consistent response structure with success status, message, and data fields.
- **Error Handling**: Comprehensive error scenarios with appropriate HTTP status codes and Vietnamese error messages.
- **Option Types**: Support for RADIO, CHECKBOX, and SELECT option types with multiple choices.
- **Employee Status**: Only active and available employees are returned in search results.
- **Performance**: Endpoints are optimized for quick response times with proper database indexing.
- **Data Integrity**: All employee data includes skills, ratings, and completion statistics for informed customer decisions.
