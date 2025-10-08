# Test Cases for Change Password API

## Overview
This document contains test cases for the Change Password functionality in the Authentication Controller.
**Login Account**: john_doe
**Endpoint:** `POST /api/v1/auth/change-password`

**Request Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
    "currentPassword": "string",
    "newPassword": "string", 
    "confirmPassword": "string"
}
```

---

## Test Cases

### **TC_CHANGE_PASSWORD_001: Successful Password Change**
**Description:** Test successful password change with valid credentials
**Pre-conditions:** 
- User is authenticated with valid token
- Current password is "123456"

**Test Data:**
```json
{
    "currentPassword": "123456",
    "newPassword": "newPassword789",
    "confirmPassword": "newPassword789"
}
```

**Headers:**
```
Authorization: Bearer <valid_token>
Content-Type: application/json
```

**Expected Response:**
- **Status Code:** 200 OK
- **Response Body:**
```json
{
    "success": true,
    "message": "Đổi mật khẩu thành công"
}
```

**Post-conditions:**
- Password is updated in database
- All user sessions are terminated
- User needs to login again with new password

---

### **TC_CHANGE_PASSWORD_002: Missing Authorization Header**
**Description:** Test password change without Authorization header

**Test Data:**
```json
{
    "currentPassword": "123456",
    "newPassword": "newPassword789",
    "confirmPassword": "newPassword789"
}
```

**Headers:**
```
Content-Type: application/json
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

### **TC_CHANGE_PASSWORD_003: Invalid Token**
**Description:** Test password change with invalid/expired token

**Test Data:**
```json
{
    "currentPassword": "123456",
    "newPassword": "newPassword789",
    "confirmPassword": "newPassword789"
}
```

**Headers:**
```
Authorization: Bearer invalid_token_here
Content-Type: application/json
```

**Expected Response:**
- **Status Code:** 401 Unauthorized
- **Response Body:**
```json
{
    "success": false,
    "message": "Token không hợp lệ"
}
```

---

### **TC_CHANGE_PASSWORD_004: Incorrect Current Password**
**Description:** Test password change with wrong current password

**Test Data:**
```json
{
    "currentPassword": "wrongPassword",
    "newPassword": "newPassword789",
    "confirmPassword": "newPassword789"
}
```

**Headers:**
```
Authorization: Bearer <valid_token>
Content-Type: application/json
```

**Expected Response:**
- **Status Code:** 400 Bad Request
- **Response Body:**
```json
{
    "success": false,
    "message": "Mật khẩu hiện tại không đúng",
    "field": "currentPassword"
}
```

---

### **TC_CHANGE_PASSWORD_005: Password Confirmation Mismatch**
**Description:** Test when new password and confirm password don't match

**Test Data:**
```json
{
    "currentPassword": "123456",
    "newPassword": "newPassword789",
    "confirmPassword": "differentPassword"
}
```

**Headers:**
```
Authorization: Bearer <valid_token>
Content-Type: application/json
```

**Expected Response:**
- **Status Code:** 400 Bad Request
- **Response Body:**
```json
{
    "success": false,
    "message": "Mật khẩu xác nhận không khớp",
    "field": "confirmPassword"
}
```

---

### **TC_CHANGE_PASSWORD_006: New Password Too Short**
**Description:** Test password change with new password less than 6 characters

**Test Data:**
```json
{
    "currentPassword": "123456",
    "newPassword": "12345",
    "confirmPassword": "12345"
}
```

**Headers:**
```
Authorization: Bearer <valid_token>
Content-Type: application/json
```

**Expected Response:**
- **Status Code:** 400 Bad Request
- **Response Body:**
```json
{
    "success": false,
    "message": "Mật khẩu mới phải có từ 6 đến 50 ký tự",
    "field": "newPassword"
}
```

---

### **TC_CHANGE_PASSWORD_007: New Password Too Long**
**Description:** Test password change with new password more than 50 characters

**Test Data:**
```json
{
    "currentPassword": "123456",
    "newPassword": "thisPasswordIsWayTooLongAndExceedsFiftyCharactersLimit123456789",
    "confirmPassword": "thisPasswordIsWayTooLongAndExceedsFiftyCharactersLimit123456789"
}
```

**Headers:**
```
Authorization: Bearer <valid_token>
Content-Type: application/json
```

**Expected Response:**
- **Status Code:** 400 Bad Request
- **Response Body:**
```json
{
    "success": false,
    "message": "Mật khẩu mới phải có từ 6 đến 50 ký tự",
    "field": "newPassword"
}
```

---

### **TC_CHANGE_PASSWORD_008: Same Current and New Password**
**Description:** Test when new password is same as current password

**Test Data:**
```json
{
    "currentPassword": "123456",
    "newPassword": "123456",
    "confirmPassword": "123456"
}
```

**Headers:**
```
Authorization: Bearer <valid_token>
Content-Type: application/json
```

**Expected Response:**
- **Status Code:** 400 Bad Request
- **Response Body:**
```json
{
    "success": false,
    "message": "Mật khẩu mới phải khác mật khẩu hiện tại",
    "field": "newPassword"
}
```

---

### **TC_CHANGE_PASSWORD_009: Empty Current Password**
**Description:** Test password change with empty current password

**Test Data:**
```json
{
    "currentPassword": "",
    "newPassword": "newPassword789",
    "confirmPassword": "newPassword789"
}
```

**Headers:**
```
Authorization: Bearer <valid_token>
Content-Type: application/json
```

**Expected Response:**
- **Status Code:** 400 Bad Request
- **Response Body:**
```json
{
    "success": false,
    "message": "Mật khẩu hiện tại không được để trống",
    "field": "currentPassword"
}
```

---

### **TC_CHANGE_PASSWORD_010: Empty New Password**
**Description:** Test password change with empty new password

**Test Data:**
```json
{
    "currentPassword": "123456",
    "newPassword": "",
    "confirmPassword": ""
}
```

**Headers:**
```
Authorization: Bearer <valid_token>
Content-Type: application/json
```

**Expected Response:**
- **Status Code:** 400 Bad Request
- **Response Body:**
```json
{
    "success": false,
    "message": "Mật khẩu mới không được để trống",
    "field": "newPassword"
}
```

---

### **TC_CHANGE_PASSWORD_011: Empty Confirm Password**
**Description:** Test password change with empty confirm password

**Test Data:**
```json
{
    "currentPassword": "123456",
    "newPassword": "newPassword789",
    "confirmPassword": ""
}
```

**Headers:**
```
Authorization: Bearer <valid_token>
Content-Type: application/json
```

**Expected Response:**
- **Status Code:** 400 Bad Request
- **Response Body:**
```json
{
    "success": false,
    "message": "Xác nhận mật khẩu không được để trống",
    "field": "confirmPassword"
}
```

---

### **TC_CHANGE_PASSWORD_012: Strong Password with Special Characters**
**Description:** Test password change with strong password containing special characters

**Test Data:**
```json
{
    "currentPassword": "123456",
    "newPassword": "MyStr0ng@Pass#2025!",
    "confirmPassword": "MyStr0ng@Pass#2025!"
}
```

**Headers:**
```
Authorization: Bearer <valid_token>
Content-Type: application/json
```

**Expected Response:**
- **Status Code:** 200 OK
- **Response Body:**
```json
{
    "success": true,
    "message": "Đổi mật khẩu thành công"
}
```

---

### **TC_CHANGE_PASSWORD_013: Password with Vietnamese Characters**
**Description:** Test password change with Vietnamese Unicode characters

**Test Data:**
```json
{
    "currentPassword": "123456",
    "newPassword": "mậtKhẩuViệtNam2025",
    "confirmPassword": "mậtKhẩuViệtNam2025"
}
```

**Headers:**
```
Authorization: Bearer <valid_token>
Content-Type: application/json
```

**Expected Response:**
- **Status Code:** 200 OK
- **Response Body:**
```json
{
    "success": true,
    "message": "Đổi mật khẩu thành công"
}
```

---

### **TC_CHANGE_PASSWORD_014: Minimum Length Password**
**Description:** Test password change with exactly 6 characters (minimum allowed)

**Test Data:**
```json
{
    "currentPassword": "123456",
    "newPassword": "abc123",
    "confirmPassword": "abc123"
}
```

**Headers:**
```
Authorization: Bearer <valid_token>
Content-Type: application/json
```

**Expected Response:**
- **Status Code:** 200 OK
- **Response Body:**
```json
{
    "success": true,
    "message": "Đổi mật khẩu thành công"
}
```

---

### **TC_CHANGE_PASSWORD_015: Maximum Length Password**
**Description:** Test password change with exactly 50 characters (maximum allowed)

**Test Data:**
```json
{
    "currentPassword": "123456",
    "newPassword": "12345678901234567890123456789012345678901234567890",
    "confirmPassword": "12345678901234567890123456789012345678901234567890"
}
```

**Headers:**
```
Authorization: Bearer <valid_token>
Content-Type: application/json
```

**Expected Response:**
- **Status Code:** 200 OK
- **Response Body:**
```json
{
    "success": true,
    "message": "Đổi mật khẩu thành công"
}
```

---

### **TC_CHANGE_PASSWORD_016: Multiple Sessions Logout**
**Description:** Test that password change logs out all device sessions

**Pre-conditions:**
- User is logged in on multiple devices (WEB and MOBILE)
- User has active sessions on both devices

**Test Data:**
```json
{
    "currentPassword": "123456",
    "newPassword": "newSecurePassword2025",
    "confirmPassword": "newSecurePassword2025"
}
```

**Headers:**
```
Authorization: Bearer <valid_token>
Content-Type: application/json
```

**Expected Response:**
- **Status Code:** 200 OK
- **Response Body:**
```json
{
    "success": true,
    "message": "Đổi mật khẩu thành công"
}
```

**Post-conditions:**
- All user sessions are terminated (WEB and MOBILE)
- All access tokens are invalidated
- All refresh tokens are invalidated
- User must login again on all devices

---

### **TC_CHANGE_PASSWORD_017: Case Sensitivity Test**
**Description:** Test password case sensitivity

**Test Data:**
```json
{
    "currentPassword": "123456",
    "newPassword": "NewPassword789",
    "confirmPassword": "newpassword789"
}
```

**Headers:**
```
Authorization: Bearer <valid_token>
Content-Type: application/json
```

**Expected Response:**
- **Status Code:** 400 Bad Request
- **Response Body:**
```json
{
    "success": false,
    "message": "Mật khẩu xác nhận không khớp",
    "field": "confirmPassword"
}
```

---

### **TC_CHANGE_PASSWORD_018: Numeric Only Password**
**Description:** Test password change with numeric-only password (should fail due to letter requirement)

**Test Data:**
```json
{
    "currentPassword": "123456",
    "newPassword": "789012345",
    "confirmPassword": "789012345"
}
```

**Headers:**
```
Authorization: Bearer <valid_token>
Content-Type: application/json
```

**Expected Response:**
- **Status Code:** 400 Bad Request
- **Response Body:**
```json
{
    "success": false,
    "message": "Mật khẩu mới phải chứa ít nhất một chữ cái",
    "field": "newPassword"
}
```

---

### **TC_CHANGE_PASSWORD_019: Whitespace in Password**
**Description:** Test password change with whitespace characters

**Test Data:**
```json
{
    "currentPassword": "123456",
    "newPassword": "my new password 2025",
    "confirmPassword": "my new password 2025"
}
```

**Headers:**
```
Authorization: Bearer <valid_token>
Content-Type: application/json
```

**Expected Response:**
- **Status Code:** 200 OK
- **Response Body:**
```json
{
    "success": true,
    "message": "Đổi mật khẩu thành công"
}
```

---

### **TC_CHANGE_PASSWORD_020: Invalid Characters in Password**
**Description:** Test password change with non-ASCII characters that are not allowed

**Test Data:**
```json
{
    "currentPassword": "123456",
    "newPassword": "password™®©",
    "confirmPassword": "password™®©"
}
```

**Headers:**
```
Authorization: Bearer <valid_token>
Content-Type: application/json
```

**Expected Response:**
- **Status Code:** 400 Bad Request
- **Response Body:**
```json
{
    "success": false,
    "message": "Mật khẩu mới chứa ký tự không hợp lệ",
    "field": "newPassword"
}
```

---

### **TC_CHANGE_PASSWORD_021: Password Without Letters**
**Description:** Test password change with password that doesn't contain any letters

**Test Data:**
```json
{
    "currentPassword": "123456",
    "newPassword": "123456789",
    "confirmPassword": "123456789"
}
```

**Headers:**
```
Authorization: Bearer <valid_token>
Content-Type: application/json
```

**Expected Response:**
- **Status Code:** 400 Bad Request
- **Response Body:**
```json
{
    "success": false,
    "message": "Mật khẩu mới phải chứa ít nhất một chữ cái",
    "field": "newPassword"
}
```

---

### **TC_CHANGE_PASSWORD_022: SQL Injection Attempt**
**Description:** Test password change with SQL injection attempt

**Test Data:**
```json
{
    "currentPassword": "123456",
    "newPassword": "password'; DROP TABLE accounts; --",
    "confirmPassword": "password'; DROP TABLE accounts; --"
}
```

**Headers:**
```
Authorization: Bearer <valid_token>
Content-Type: application/json
```

**Expected Response:**
- **Status Code:** 200 OK
- **Response Body:**
```json
{
    "success": true,
    "message": "Đổi mật khẩu thành công"
}
```

**Note:** Password should be safely encoded without executing SQL commands

---

## Test Execution Notes

### Pre-requisites
1. **Base URL:** `http://localhost:8080/api/v1/auth`
2. **Valid User:** Account with current password "123456"
3. **Authentication Token:** Valid JWT token for the user
4. **Database:** Clean test environment

### Test Data Setup
- Create test user with password "123456"
- Ensure user account is active
- Generate valid JWT token for authentication

### Security Validations
- All passwords are BCrypt encoded
- Session cleanup after password change
- Token invalidation for security
- SQL injection prevention

### Post-Test Cleanup
- Reset test user password to "123456"
- Clear Redis sessions
- Remove temporary tokens
- Verify database integrity

---

**Total Test Cases:** 22
**Coverage:** Success scenarios, validation errors, security tests, edge cases, character validation
**Test User Password:** 123456
**Login Account:** john_doe
**Last Updated:** August 2025
