# API Test Cases - Admin Get All Bookings

## Overview
This document describes comprehensive test cases for the **Admin Get All Bookings** endpoint using realistic data from the housekeeping service database.  
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
- **GET /bookings**: ADMIN role required
- **Authorization Header**: `Bearer <valid_admin_token>`
- **Content-Type**: `application/json`

---

## API Endpoint Covered
**GET /api/v1/admin/bookings** - Get All Bookings Sorted by Booking Time (Admin Only)

---

## GET /bookings - Get All Bookings

### Test Case 1: Successful Retrieval of All Bookings
- **Test Case ID**: TC_ADMIN_BOOKINGS_001
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
    page = 0 (optional, default 0)
    size = 10 (optional, default 10)
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "data": [
      {
        "bookingId": "BK000005",
        "bookingCode": "BK005",
        "customerId": "c1000001-0000-0000-0000-000000000001",
        "customerName": "John Doe",
        "address": {
          "addressId": "a1000001-0000-0000-0000-000000000001",
          "street": "123 Nguyen Hue",
          "ward": "Ben Nghe",
          "district": "District 1",
          "city": "Ho Chi Minh City"
        },
        "bookingTime": "2025-11-05T14:00:00+07:00",
        "note": "Please bring cleaning supplies",
        "totalAmount": "500,000 VND",
        "status": "CONFIRMED",
        "isVerified": true,
        "promotion": null,
        "payment": null,
        "createdAt": "2025-11-01T09:00:00+07:00"
      },
      {
        "bookingId": "BK000004",
        "bookingCode": "BK004",
        "customerId": "c1000001-0000-0000-0000-000000000002",
        "customerName": "Mary Jones",
        "address": {
          "addressId": "a1000001-0000-0000-0000-000000000002",
          "street": "456 Le Loi",
          "ward": "Ben Thanh",
          "district": "District 1",
          "city": "Ho Chi Minh City"
        },
        "bookingTime": "2025-11-04T10:00:00+07:00",
        "note": null,
        "totalAmount": "750,000 VND",
        "status": "AWAITING_EMPLOYEE",
        "isVerified": true,
        "promotion": null,
        "payment": null,
        "createdAt": "2025-10-31T15:30:00+07:00"
      }
    ],
    "currentPage": 0,
    "totalItems": 50,
    "totalPages": 5
  }
  ```
- **Status Code**: 200 OK

---

### Test Case 2: Empty Result Set
- **Test Case ID**: TC_ADMIN_BOOKINGS_009
- **Description**: Verify proper handling when no bookings exist in the database
- **Preconditions**:
  - Admin user exists with valid JWT token
  - No bookings exist in the database
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

### Test Case 3: Page Beyond Available Data
- **Test Case ID**: TC_ADMIN_BOOKINGS_010
- **Description**: Verify proper handling when requesting a page beyond available data
- **Preconditions**:
  - Admin user exists with valid JWT token
  - Only 15 bookings exist in the database
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    Content-Type: application/json
    ```
  - **Query Parameters**: 
    ```
    page = 5
    size = 10
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "data": [],
    "currentPage": 5,
    "totalItems": 15,
    "totalPages": 2
  }
  ```
- **Status Code**: 200 OK

### Test Case 4: Unauthorized Access - Missing Token
- **Test Case ID**: TC_ADMIN_BOOKINGS_011
- **Description**: Verify that requests without authorization token are rejected
- **Preconditions**:
  - Multiple bookings exist in the database
  - No authorization header provided
- **Input**:
  - **Headers**: 
    ```
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
    "message": "Unauthorized access"
  }
  ```
- **Status Code**: 401 Unauthorized

### Test Case 5: Unauthorized Access - Invalid Token
- **Test Case ID**: TC_ADMIN_BOOKINGS_012
- **Description**: Verify that requests with invalid authorization token are rejected
- **Preconditions**:
  - Multiple bookings exist in the database
  - Invalid authorization token provided
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer invalid_token_12345
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
    "message": "Invalid or expired token"
  }
  ```
- **Status Code**: 401 Unauthorized

### Test Case 6: Forbidden Access - Customer Role
- **Test Case ID**: TC_ADMIN_BOOKINGS_013
- **Description**: Verify that customer users cannot access this admin-only endpoint
- **Preconditions**:
  - Customer user exists with valid JWT token
  - User has ROLE_CUSTOMER authority only
  - Multiple bookings exist in the database
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

### Test Case 7: Forbidden Access - Employee Role
- **Test Case ID**: TC_ADMIN_BOOKINGS_014
- **Description**: Verify that employee users cannot access this admin-only endpoint
- **Preconditions**:
  - Employee user exists with valid JWT token
  - User has ROLE_EMPLOYEE authority only
  - Multiple bookings exist in the database
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
- **Status Code**: 403 Forbiddens

## Performance Considerations

### Resource Limits
- **Maximum Page Size**: 100 items (validated and capped)
- **Default Page Size**: 10 items
- **Minimum Page**: 0 (negative values automatically converted)

---

## Business Logic Validation

### Access Control
- **Admin Only**: Endpoint restricted to users with `ROLE_ADMIN` authority
- **Token Required**: Valid JWT token must be provided in Authorization header
- **Role Enforcement**: Spring Security's `@PreAuthorize` ensures proper authorization

### Data Completeness
- **All Bookings**: Returns all bookings regardless of:
  - Status (PENDING, CONFIRMED, AWAITING_EMPLOYEE, IN_PROGRESS, COMPLETED, CANCELLED)
  - Verification state (verified or unverified)
  - Customer
  - Date range
- **Full Information**: Includes customer, address, and promotion details for each booking

### Sorting Logic
- **Primary Sort**: `bookingTime` in descending order (newest booking times first)
- **Consistent Ordering**: Results are deterministic and reproducible

---

## Notes
- **Test Date Context**: All test cases assume current date is November 1, 2025
- **Real Data Integration**: Uses actual IDs, accounts, and service data from housekeeping_service_v8.sql
- **Authorization Pattern**: Follows same security pattern as other admin endpoints in the application
- **Response Format**: Consistent with other admin endpoints (success flag, data array, pagination info)
- **Error Handling**: Comprehensive error handling for authentication, authorization, and server errors
- **Logging**: Detailed logging for monitoring and debugging purposes
