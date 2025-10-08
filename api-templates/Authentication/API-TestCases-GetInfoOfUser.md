# Test Cases for Get User Information APIs

## Overview
This document contains test cases for the User Information functionality covering Admin, Customer, and Employee endpoints.

**Endpoints:**
- `GET /api/v1/admin/{adminId}` - Get Admin Information
- `GET /api/v1/customer/{customerId}` - Get Customer Information  
- `GET /api/v1/employee/{employeeId}` - Get Employee Information

**Request Headers:**
- `Authorization: Bearer <token>` (Required)

**Response Format:**
```json
{
    "success": boolean,
    "data": object,
    "message": "string (only in error cases)"
}
```

---

## Admin Information Tests

### **TC_GET_ADMIN_001: Successful Admin Information Retrieval**
**Description:** Test successful retrieval of admin information with valid adminId and valid authorization
**Pre-conditions:** 
- Valid admin record exists in database
- AdminId is valid UUID format
- User has valid token and authorization to access this admin data

**Test Data:**
- **Admin ID:** `550e8400-e29b-41d4-a716-446655440001`

**Request:**
```
GET /api/v1/admin/550e8400-e29b-41d4-a716-446655440001
Authorization: Bearer <valid_admin_token>
```

**Expected Response:**
- **Status Code:** 200 OK
- **Response Body:**
```json
{
    "success": true,
    "data": {
        "adminProfileId": "550e8400-e29b-41d4-a716-446655440001",
        "fullName": "Admin Name",
        "isMale": true,
        "address": "Admin Address",
        "department": "IT Department",
        "contactInfo": "admin@email.com",
        "hireDate": "2023-01-15"
    }
}
```

---

### **TC_GET_ADMIN_002: Missing Authorization Header**
**Description:** Test retrieval of admin information without Authorization header
**Pre-conditions:** Valid adminId exists

**Test Data:**
- **Admin ID:** `550e8400-e29b-41d4-a716-446655440001`

**Request:**
```
GET /api/v1/admin/550e8400-e29b-41d4-a716-446655440001
```

**Expected Response:**
- **Status Code:** 400 Bad Request
- **Response Body:**
```json
{
    "success": false,
    "message": "Authorization header is required"
}
```

---

### **TC_GET_ADMIN_003: Access Denied - Unauthorized User**
**Description:** Test access control when user tries to access another admin's data
**Pre-conditions:** 
- Valid admin record exists
- User has valid token but for different admin ID

**Test Data:**
- **Admin ID:** `550e8400-e29b-41d4-a716-446655440001`
- **Token:** Valid token for different admin ID

**Request:**
```
GET /api/v1/admin/550e8400-e29b-41d4-a716-446655440001
Authorization: Bearer <valid_token_for_different_admin>
```

**Expected Response:**
- **Status Code:** 403 Forbidden
- **Response Body:**
```json
{
    "success": false,
    "message": "Access denied. You can only access your own data."
}
```

---

### **TC_GET_ADMIN_004: Admin Not Found**
**Description:** Test retrieval of admin information with non-existent adminId but valid authorization
**Pre-conditions:** 
- AdminId does not exist in database
- User has valid authorization token

**Test Data:**
- **Admin ID:** `550e8400-e29b-41d4-a716-446655440999`

**Request:**
```
GET /api/v1/admin/550e8400-e29b-41d4-a716-446655440999
Authorization: Bearer <valid_admin_token>
```

**Expected Response:**
- **Status Code:** 400 Bad Request
- **Response Body:**
```json
{
    "success": false,
    "message": "Không tìm thấy thông tin"
}
```

---

### **TC_GET_ADMIN_005: Invalid Admin ID Format**
**Description:** Test retrieval with invalid UUID format
**Pre-conditions:** User has valid authorization token

**Test Data:**
- **Admin ID:** `invalid-admin-id`

**Request:**
```
GET /api/v1/admin/invalid-admin-id
Authorization: Bearer <valid_admin_token>
```

**Expected Response:**
- **Status Code:** 400 Bad Request
- **Response Body:**
```json
{
    "success": false,
    "message": "Invalid admin ID format"
}
```

---

### **TC_GET_ADMIN_006: Invalid Token**
**Description:** Test retrieval with invalid or expired token
**Pre-conditions:** Valid adminId exists

**Test Data:**
- **Admin ID:** `550e8400-e29b-41d4-a716-446655440001`

**Request:**
```
GET /api/v1/admin/550e8400-e29b-41d4-a716-446655440001
Authorization: Bearer invalid_token_here
```

**Expected Response:**
- **Status Code:** 403 Forbidden
- **Response Body:**
```json
{
    "success": false,
    "message": "Access denied. You can only access your own data."
}
```

---

### **TC_GET_ADMIN_007: Empty Admin ID**
**Description:** Test retrieval with empty adminId
**Pre-conditions:** User has valid authorization token

**Test Data:**
- **Admin ID:** `` (empty)

**Request:**
```
GET /api/v1/admin/
Authorization: Bearer <valid_admin_token>
```

**Expected Response:**
- **Status Code:** 404 Not Found (endpoint not found)

---

### **TC_GET_ADMIN_008: Database Connection Error**
**Description:** Test behavior when database is unavailable
**Pre-conditions:** 
- Database connection issues
- User has valid authorization

**Test Data:**
- **Admin ID:** `550e8400-e29b-41d4-a716-446655440001`

**Request:**
```
GET /api/v1/admin/550e8400-e29b-41d4-a716-446655440001
Authorization: Bearer <valid_admin_token>
```

**Expected Response:**
- **Status Code:** 500 Internal Server Error
- **Response Body:**
```json
{
    "success": false,
    "message": "Đã xảy ra lỗi khi lấy thông tin quản trị viên"
}
```

---

### **TC_GET_ADMIN_009: Valid UUID but Non-existent Admin**
**Description:** Test retrieval with valid UUID format but non-existent admin record
**Pre-conditions:** 
- UUID format is valid
- Admin record does not exist in database
- User has valid authorization token

**Test Data:**
- **Admin ID:** `111e8400-e29b-41d4-a716-446655440000` (valid UUID, non-existent)

**Request:**
```
GET /api/v1/admin/111e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <valid_admin_token>
```

**Expected Response:**
- **Status Code:** 400 Bad Request
- **Response Body:**
```json
{
    "success": false,
    "message": "Không tìm thấy thông tin"
}
```

---

### **TC_GET_ADMIN_010: Malformed Authorization Header**
**Description:** Test retrieval with malformed Authorization header
**Pre-conditions:** Valid adminId exists

**Test Data:**
- **Admin ID:** `550e8400-e29b-41d4-a716-446655440001`

**Request:**
```
GET /api/v1/admin/550e8400-e29b-41d4-a716-446655440001
Authorization: InvalidFormat
```

**Expected Response:**
- **Status Code:** 403 Forbidden
- **Response Body:**
```json
{
    "success": false,
    "message": "Access denied. You can only access your own data."
}
```

---

## Customer Information Tests

### **TC_GET_CUSTOMER_001: Successful Customer Information Retrieval**
**Description:** Test successful retrieval of customer information with valid customerId and valid authorization
**Pre-conditions:** 
- Valid customer record exists in database
- CustomerId is valid UUID format
- User has valid token and authorization to access this customer data

**Test Data:**
- **Customer ID:** `650e8400-e29b-41d4-a716-446655440001`

**Request:**
```
GET /api/v1/customer/650e8400-e29b-41d4-a716-446655440001
Authorization: Bearer <valid_customer_token>
```

**Expected Response:**
- **Status Code:** 200 OK
- **Response Body:**
```json
{
    "success": true,
    "data": {
        "customerId": "650e8400-e29b-41d4-a716-446655440001",
        "fullName": "Customer Name",
        "email": "customer@email.com",
        "phoneNumber": "+84901234567",
        "isMale": false,
        "address": "Customer Address",
        "avatar": "avatar_url.jpg"
    }
}
```

---

### **TC_GET_CUSTOMER_002: Missing Authorization Header**
**Description:** Test retrieval of customer information without Authorization header
**Pre-conditions:** Valid customerId exists

**Test Data:**
- **Customer ID:** `650e8400-e29b-41d4-a716-446655440001`

**Request:**
```
GET /api/v1/customer/650e8400-e29b-41d4-a716-446655440001
```

**Expected Response:**
- **Status Code:** 400 Bad Request
- **Response Body:**
```json
{
    "success": false,
    "message": "Authorization header is required"
}
```

---

### **TC_GET_CUSTOMER_003: Access Denied - Unauthorized User**
**Description:** Test access control when user tries to access another customer's data
**Pre-conditions:** 
- Valid customer record exists
- User has valid token but for different customer ID

**Test Data:**
- **Customer ID:** `650e8400-e29b-41d4-a716-446655440001`
- **Token:** Valid token for different customer ID

**Request:**
```
GET /api/v1/customer/650e8400-e29b-41d4-a716-446655440001
Authorization: Bearer <valid_token_for_different_customer>
```

**Expected Response:**
- **Status Code:** 403 Forbidden
- **Response Body:**
```json
{
    "success": false,
    "message": "Access denied. You can only access your own data."
}
```

---

### **TC_GET_CUSTOMER_004: Customer Not Found**
**Description:** Test retrieval of customer information with non-existent customerId but valid authorization
**Pre-conditions:** 
- CustomerId does not exist in database
- User has valid authorization token

**Test Data:**
- **Customer ID:** `650e8400-e29b-41d4-a716-446655440999`

**Request:**
```
GET /api/v1/customer/650e8400-e29b-41d4-a716-446655440999
Authorization: Bearer <valid_customer_token>
```

**Expected Response:**
- **Status Code:** 400 Bad Request
- **Response Body:**
```json
{
    "success": false,
    "message": "Không tìm thấy thông tin khách hàng"
}
```

---

### **TC_GET_CUSTOMER_005: Invalid Customer ID Format**
**Description:** Test retrieval with invalid UUID format
**Pre-conditions:** User has valid authorization token

**Test Data:**
- **Customer ID:** `invalid-customer-id`

**Request:**
```
GET /api/v1/customer/invalid-customer-id
Authorization: Bearer <valid_customer_token>
```

**Expected Response:**
- **Status Code:** 400 Bad Request
- **Response Body:**
```json
{
    "success": false,
    "message": "Invalid customer ID format"
}
```

---

### **TC_GET_CUSTOMER_006: Invalid Token**
**Description:** Test retrieval with invalid or expired token
**Pre-conditions:** Valid customerId exists

**Test Data:**
- **Customer ID:** `650e8400-e29b-41d4-a716-446655440001`

**Request:**
```
GET /api/v1/customer/650e8400-e29b-41d4-a716-446655440001
Authorization: Bearer invalid_token_here
```

**Expected Response:**
- **Status Code:** 403 Forbidden
- **Response Body:**
```json
{
    "success": false,
    "message": "Access denied. You can only access your own data."
}
```

---

### **TC_GET_CUSTOMER_007: Special Characters in Customer ID**
**Description:** Test retrieval with special characters in customerId
**Pre-conditions:** User has valid authorization token

**Test Data:**
- **Customer ID:** `<script>alert('xss')</script>`

**Request:**
```
GET /api/v1/customer/<script>alert('xss')</script>
Authorization: Bearer <valid_customer_token>
```

**Expected Response:**
- **Status Code:** 400 Bad Request
- **Response Body:**
```json
{
    "success": false,
    "message": "Invalid customer ID format"
}
```

---

### **TC_GET_CUSTOMER_008: Database Connection Error**
**Description:** Test behavior when database is unavailable
**Pre-conditions:** 
- Database connection issues
- User has valid authorization

**Test Data:**
- **Customer ID:** `650e8400-e29b-41d4-a716-446655440001`

**Request:**
```
GET /api/v1/customer/650e8400-e29b-41d4-a716-446655440001
Authorization: Bearer <valid_customer_token>
```

**Expected Response:**
- **Status Code:** 500 Internal Server Error
- **Response Body:**
```json
{
    "success": false,
    "message": "Đã xảy ra lỗi khi lấy thông tin khách hàng"
}
```

---

### **TC_GET_CUSTOMER_009: Valid UUID but Non-existent Customer**
**Description:** Test retrieval with valid UUID format but non-existent customer record
**Pre-conditions:** 
- UUID format is valid
- Customer record does not exist in database
- User has valid authorization token

**Test Data:**
- **Customer ID:** `222e8400-e29b-41d4-a716-446655440000` (valid UUID, non-existent)

**Request:**
```
GET /api/v1/customer/222e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <valid_customer_token>
```

**Expected Response:**
- **Status Code:** 400 Bad Request
- **Response Body:**
```json
{
    "success": false,
    "message": "Không tìm thấy thông tin khách hàng"
}
```

---

### **TC_GET_CUSTOMER_010: Empty Authorization Header**
**Description:** Test retrieval with empty Authorization header value
**Pre-conditions:** Valid customerId exists

**Test Data:**
- **Customer ID:** `650e8400-e29b-41d4-a716-446655440001`

**Request:**
```
GET /api/v1/customer/650e8400-e29b-41d4-a716-446655440001
Authorization: 
```

**Expected Response:**
- **Status Code:** 403 Forbidden
- **Response Body:**
```json
{
    "success": false,
    "message": "Access denied. You can only access your own data."
}
```

---

## Employee Information Tests

### **TC_GET_EMPLOYEE_001: Successful Employee Information Retrieval**
**Description:** Test successful retrieval of employee information with valid employeeId and valid authorization
**Pre-conditions:** 
- Valid employee record exists in database
- EmployeeId is valid UUID format
- User has valid token and authorization to access this employee data

**Test Data:**
- **Employee ID:** `750e8400-e29b-41d4-a716-446655440001`

**Request:**
```
GET /api/v1/employee/750e8400-e29b-41d4-a716-446655440001
Authorization: Bearer <valid_employee_token>
```

**Expected Response:**
- **Status Code:** 200 OK
- **Response Body:**
```json
{
    "success": true,
    "data": {
        "employeeId": "750e8400-e29b-41d4-a716-446655440001",
        "fullName": "Employee Name",
        "email": "employee@email.com",
        "phoneNumber": "+84901234567",
        "isMale": true,
        "address": "Employee Address",
        "avatar": "avatar_url.jpg",
        "hiredDate": "2023-06-01"
    }
}
```

---

### **TC_GET_EMPLOYEE_002: Missing Authorization Header**
**Description:** Test retrieval of employee information without Authorization header
**Pre-conditions:** Valid employeeId exists

**Test Data:**
- **Employee ID:** `750e8400-e29b-41d4-a716-446655440001`

**Request:**
```
GET /api/v1/employee/750e8400-e29b-41d4-a716-446655440001
```

**Expected Response:**
- **Status Code:** 400 Bad Request
- **Response Body:**
```json
{
    "success": false,
    "message": "Authorization header is required"
}
```

---

### **TC_GET_EMPLOYEE_003: Access Denied - Unauthorized User**
**Description:** Test access control when user tries to access another employee's data
**Pre-conditions:** 
- Valid employee record exists
- User has valid token but for different employee ID

**Test Data:**
- **Employee ID:** `750e8400-e29b-41d4-a716-446655440001`
- **Token:** Valid token for different employee ID

**Request:**
```
GET /api/v1/employee/750e8400-e29b-41d4-a716-446655440001
Authorization: Bearer <valid_token_for_different_employee>
```

**Expected Response:**
- **Status Code:** 403 Forbidden
- **Response Body:**
```json
{
    "success": false,
    "message": "Access denied. You can only access your own data."
}
```

---

### **TC_GET_EMPLOYEE_004: Employee Not Found**
**Description:** Test retrieval of employee information with non-existent employeeId but valid authorization
**Pre-conditions:** 
- EmployeeId does not exist in database
- User has valid authorization token

**Test Data:**
- **Employee ID:** `750e8400-e29b-41d4-a716-446655440999`

**Request:**
```
GET /api/v1/employee/750e8400-e29b-41d4-a716-446655440999
Authorization: Bearer <valid_employee_token>
```

**Expected Response:**
- **Status Code:** 400 Bad Request
- **Response Body:**
```json
{
    "success": false,
    "message": "Không tìm thấy thông tin nhân viên"
}
```

---

### **TC_GET_EMPLOYEE_005: Invalid Employee ID Format**
**Description:** Test retrieval with invalid UUID format
**Pre-conditions:** User has valid authorization token

**Test Data:**
- **Employee ID:** `invalid-employee-id`

**Request:**
```
GET /api/v1/employee/invalid-employee-id
Authorization: Bearer <valid_employee_token>
```

**Expected Response:**
- **Status Code:** 400 Bad Request
- **Response Body:**
```json
{
    "success": false,
    "message": "Invalid employee ID format"
}
```

---

### **TC_GET_EMPLOYEE_006: Invalid Token**
**Description:** Test retrieval with invalid or expired token
**Pre-conditions:** Valid employeeId exists

**Test Data:**
- **Employee ID:** `750e8400-e29b-41d4-a716-446655440001`

**Request:**
```
GET /api/v1/employee/750e8400-e29b-41d4-a716-446655440001
Authorization: Bearer invalid_token_here
```

**Expected Response:**
- **Status Code:** 403 Forbidden
- **Response Body:**
```json
{
    "success": false,
    "message": "Access denied. You can only access your own data."
}
```

---

### **TC_GET_EMPLOYEE_007: Null Employee ID**
**Description:** Test retrieval with null employeeId
**Pre-conditions:** User has valid authorization token

**Test Data:**
- **Employee ID:** `null`

**Request:**
```
GET /api/v1/employee/null
Authorization: Bearer <valid_employee_token>
```

**Expected Response:**
- **Status Code:** 400 Bad Request
- **Response Body:**
```json
{
    "success": false,
    "message": "Employee ID cannot be null"
}
```

---

### **TC_GET_EMPLOYEE_008: Database Connection Error**
**Description:** Test behavior when database is unavailable
**Pre-conditions:** 
- Database connection issues
- User has valid authorization

**Test Data:**
- **Employee ID:** `750e8400-e29b-41d4-a716-446655440001`

**Request:**
```
GET /api/v1/employee/750e8400-e29b-41d4-a716-446655440001
Authorization: Bearer <valid_employee_token>
```

**Expected Response:**
- **Status Code:** 500 Internal Server Error
- **Response Body:**
```json
{
    "success": false,
    "message": "Đã xảy ra lỗi khi lấy thông tin nhân viên"
}
```

---

### **TC_GET_EMPLOYEE_009: Valid UUID but Non-existent Employee**
**Description:** Test retrieval with valid UUID format but non-existent employee record
**Pre-conditions:** 
- UUID format is valid
- Employee record does not exist in database
- User has valid authorization token

**Test Data:**
- **Employee ID:** `333e8400-e29b-41d4-a716-446655440000` (valid UUID, non-existent)

**Request:**
```
GET /api/v1/employee/333e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <valid_employee_token>
```

**Expected Response:**
- **Status Code:** 400 Bad Request
- **Response Body:**
```json
{
    "success": false,
    "message": "Không tìm thấy thông tin nhân viên"
}
```

---

### **TC_GET_EMPLOYEE_010: Bearer Token Without Value**
**Description:** Test retrieval with "Bearer" keyword but no token value
**Pre-conditions:** Valid employeeId exists

**Test Data:**
- **Employee ID:** `750e8400-e29b-41d4-a716-446655440001`

**Request:**
```
GET /api/v1/employee/750e8400-e29b-41d4-a716-446655440001
Authorization: Bearer 
```

**Expected Response:**
- **Status Code:** 403 Forbidden
- **Response Body:**
```json
{
    "success": false,
    "message": "Access denied. You can only access your own data."
}
```

---

## Cross-Cutting Tests

### **TC_GET_USER_006: Authorization Token Validation Across Endpoints**
**Description:** Test authorization token validation across all user types
**Pre-conditions:** Valid records exist for all user types

**Test Data:**
- **Admin ID:** `550e8400-e29b-41d4-a716-446655440001`
- **Customer ID:** `650e8400-e29b-41d4-a716-446655440001`
- **Employee ID:** `750e8400-e29b-41d4-a716-446655440001`

**Requests:**
```
GET /api/v1/admin/550e8400-e29b-41d4-a716-446655440001
Authorization: Bearer <customer_token>

GET /api/v1/customer/650e8400-e29b-41d4-a716-446655440001
Authorization: Bearer <employee_token>

GET /api/v1/employee/750e8400-e29b-41d4-a716-446655440001
Authorization: Bearer <admin_token>
```

**Expected Response (for all):**
- **Status Code:** 403 Forbidden
- **Response Body:**
```json
{
    "success": false,
    "message": "Access denied. You can only access your own data."
}
```

---

### **TC_GET_USER_007: SQL Injection Attempt**
**Description:** Test SQL injection protection across all endpoints
**Pre-conditions:** User has valid authorization tokens

**Test Data:**
- **ID:** `'; DROP TABLE users; --`

**Requests:**
```
GET /api/v1/admin/'; DROP TABLE users; --
Authorization: Bearer <valid_admin_token>

GET /api/v1/customer/'; DROP TABLE users; --
Authorization: Bearer <valid_customer_token>

GET /api/v1/employee/'; DROP TABLE users; --
Authorization: Bearer <valid_employee_token>
```

**Expected Response (for all):**
- **Status Code:** 400 Bad Request
- **Response Body:**
```json
{
    "success": false,
    "message": "Invalid ID format"
}
```

---

### **TC_GET_USER_008: Very Long ID String**
**Description:** Test handling of extremely long ID strings
**Pre-conditions:** User has valid authorization tokens

**Test Data:**
- **ID:** `very-long-string-that-exceeds-normal-uuid-length-by-a-lot-and-should-be-rejected-550e8400-e29b-41d4-a716-446655440001-extra-characters`

**Requests:**
```
GET /api/v1/admin/{very-long-id}
Authorization: Bearer <valid_admin_token>

GET /api/v1/customer/{very-long-id}
Authorization: Bearer <valid_customer_token>

GET /api/v1/employee/{very-long-id}
Authorization: Bearer <valid_employee_token>
```

**Expected Response (for all):**
- **Status Code:** 400 Bad Request
- **Response Body:**
```json
{
    "success": false,
    "message": "Invalid ID format"
}
```

---

### **TC_GET_USER_009: Unicode Characters in ID**
**Description:** Test handling of Unicode characters in ID
**Pre-conditions:** User has valid authorization tokens

**Test Data:**
- **ID:** `550e8400-e29b-41d4-a716-44665544测试`

**Requests:**
```
GET /api/v1/admin/550e8400-e29b-41d4-a716-44665544测试
Authorization: Bearer <valid_admin_token>

GET /api/v1/customer/550e8400-e29b-41d4-a716-44665544测试
Authorization: Bearer <valid_customer_token>

GET /api/v1/employee/550e8400-e29b-41d4-a716-44665544测试
Authorization: Bearer <valid_employee_token>
```

**Expected Response (for all):**
- **Status Code:** 400 Bad Request
- **Response Body:**
```json
{
    "success": false,
    "message": "Invalid ID format"
}
```

---

## Performance Tests

### **TC_GET_USER_010: Concurrent Requests with Authorization**
**Description:** Test system behavior under concurrent requests with proper authorization
**Pre-conditions:** Multiple valid IDs exist in database with corresponding tokens

**Test Data:**
- Send 100 concurrent requests to each endpoint with valid IDs and matching tokens

**Expected Response:**
- **Status Code:** 200 OK (for valid IDs with proper authorization)
- **Response Time:** < 2 seconds per request
- **No data corruption or server errors**
- **Proper authorization enforcement**

---

### **TC_GET_USER_015: Edge Case - Empty String ID**
**Description:** Test handling of empty string as ID parameter
**Pre-conditions:** User has valid authorization tokens

**Test Data:**
- **ID:** `` (empty string)

**Requests:**
```
GET /api/v1/admin/
Authorization: Bearer <valid_admin_token>

GET /api/v1/customer/
Authorization: Bearer <valid_customer_token>

GET /api/v1/employee/
Authorization: Bearer <valid_employee_token>
```

**Expected Response (for all):**
- **Status Code:** 404 Not Found
- **Note:** Endpoint not found due to empty path parameter

---

## Test Execution Notes

### Test Environment Setup
1. **Base URL:** `http://localhost:8080/api/v1`
2. **Database:** Ensure test data exists for valid IDs
3. **Authentication:** Generate valid JWT tokens for each user type
4. **Authorization Service:** Ensure AuthorizationService.canAccessResource() is properly configured

### Error Handling Validation
- All error responses follow consistent format
- Vietnamese error messages for user-facing errors
- Proper HTTP status codes: 200 OK, 400 Bad Request, 403 Forbidden, 500 Internal Server Error
- No sensitive information exposed in error messages
- Authorization errors return 403 Forbidden status
- Service layer exceptions properly handled and mapped to appropriate HTTP responses

### Security Considerations
- **Authorization Required:** All endpoints require valid Authorization header
- **Access Control:** Users can only access their own data via AuthorizationService
- **ID Validation:** Prevents injection attacks through proper UUID validation
- **Token Validation:** JWT tokens are properly validated before resource access
- **No Data Leakage:** Error responses don't expose sensitive information

### Performance Requirements
- Response time < 500ms for successful requests
- System handles concurrent requests gracefully
- No memory leaks during extended testing
- Database queries are optimized

---

**Total Test Cases:** 41
**Coverage:** Success scenarios, authorization control, error handling, security, performance, edge cases, service integration
**API Endpoints:** 3 (Admin, Customer, Employee)
**Security Features:** JWT Authentication, Access Control, Input Validation
**Service Integration:** AdminService, CustomerService, EmployeeService with proper exception handling
**Last Updated:** August 2025
