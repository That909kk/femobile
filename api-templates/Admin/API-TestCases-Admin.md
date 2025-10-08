# API Test Cases - Admin Management

## Overview
This document describes comprehensive test cases for the **Admin Management** endpoints.  
**Base URL**: `/api/v1/admin`

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
- **Role Requirements**: ADMIN role required
- **Permission Requirements**: Resource access validation

---

## API Endpoints Covered
1. **GET /{adminId}** - Get Admin Profile

---

## GET /{adminId} - Get Admin Profile

### Test Case 1: Successful Admin Profile Retrieval
- **Test Case ID**: TC_ADMIN_001
- **Description**: Verify that an admin can successfully retrieve their own profile
- **Preconditions**:
  - Admin account exists with valid adminId
  - Valid JWT token with ADMIN role
  - User has access to the requested resource
- **Input**:
  - **Path Parameter**: adminId = "a1000001-0000-0000-0000-000000000001"
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "data": {
      "adminId": "a1000001-0000-0000-0000-000000000001",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com",
      "phone": "0123456789",
      "createdAt": "2023-01-01T00:00:00",
      "updatedAt": "2023-01-01T00:00:00"
    }
  }
  ```
- **Status Code**: 200 OK

### Test Case 2: Access Denied - Different Admin ID
- **Test Case ID**: TC_ADMIN_002
- **Description**: Verify that an admin cannot access another admin's profile
- **Preconditions**:
  - Two admin accounts exist
  - Valid JWT token for first admin
  - Requesting second admin's profile
- **Input**:
  - **Path Parameter**: adminId = "a1000002-0000-0000-0000-000000000001"
  - **Headers**: 
    ```
    Authorization: Bearer <admin1_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Access denied. You can only access your own data."
  }
  ```
- **Status Code**: 403 Forbidden

### Test Case 3: Admin Not Found
- **Test Case ID**: TC_ADMIN_003
- **Description**: Verify proper error handling when admin ID doesn't exist
- **Preconditions**:
  - Valid JWT token with ADMIN role
  - Non-existent adminId
- **Input**:
  - **Path Parameter**: adminId = "nonexistent-admin-id"
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Admin not found with ID: nonexistent-admin-id"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 4: Invalid/Missing Authorization Token
- **Test Case ID**: TC_ADMIN_004
- **Description**: Verify proper error handling when authorization token is missing or invalid
- **Preconditions**:
  - Valid adminId exists
  - Missing or invalid authorization header
- **Input**:
  - **Path Parameter**: adminId = "a1000001-0000-0000-0000-000000000001"
  - **Headers**: 
    ```
    Authorization: Bearer invalid_token
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Invalid or expired token"
  }
  ```
- **Status Code**: 401 Unauthorized

### Test Case 5: Internal Server Error
- **Test Case ID**: TC_ADMIN_005
- **Description**: Verify proper error handling when internal server error occurs
- **Preconditions**:
  - Valid JWT token with ADMIN role
  - Database connection issue or service error
- **Input**:
  - **Path Parameter**: adminId = "a1000001-0000-0000-0000-000000000001"
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Đã xảy ra lỗi khi lấy thông tin quản trị viên"
  }
  ```
- **Status Code**: 500 Internal Server Error

### Test Case 6: Invalid Admin ID Format
- **Test Case ID**: TC_ADMIN_006
- **Description**: Verify proper error handling when admin ID format is invalid
- **Preconditions**:
  - Valid JWT token with ADMIN role
  - Invalid UUID format for adminId
- **Input**:
  - **Path Parameter**: adminId = "invalid-uuid-format"
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Invalid admin ID format"
  }
  ```
- **Status Code**: 400 Bad Request

---

## Notes
- All test cases should include proper error logging verification
- Resource access validation is critical for admin endpoints
