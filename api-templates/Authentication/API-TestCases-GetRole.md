# API Test Cases - Get Role Endpoint

## Base URL: `/api/v1/auth/get-role`
## Method: `POST`
## Content-Type: `application/json`

---

## Test Case 1: Valid credentials with single role
**Objective:** Verify successful role retrieval for user with one role
**Method:** POST
**Request Body:**
```json
{
    "username": "admin_1",
    "password": "123456789"
}
```
**Expected Response:** 200 OK
```json
{
    "success": true,
    "message": "Lấy vai trò thành công",
    "data": {
        "ADMIN": "ACTIVE"
    },
    "roleNumbers": 1
}
```

---

## Test Case 2: Valid credentials with multiple roles
**Objective:** Verify successful role retrieval for user with multiple roles
**Method:** POST
**Request Body:**
```json
{
    "username": "jane_smith",
    "password": "123456789"
}
```
**Expected Response:** 200 OK
```json
{
    "success": true,
    "message": "Lấy vai trò thành công",
    "data": {
        "CUSTOMER": "ACTIVE",
        "EMPLOYEE": "ACTIVE"
    },
    "roleNumbers": 2
}
```

---

## Test Case 3: Valid credentials with customer role
**Objective:** Verify successful role retrieval for customer
**Method:** POST
**Request Body:**
```json
{
    "username": "john_doe",
    "password": "123456789"
}
```
**Expected Response:** 200 OK
```json
{
    "success": true,
    "message": "Lấy vai trò thành công",
    "data": {
        "CUSTOMER": "ACTIVE"
    },
    "roleNumbers": 1
}
```

---

## Test Case 4: Valid credentials with employee role
**Objective:** Verify successful role retrieval for employee
**Method:** POST
**Request Body:**
```json
{
    "username": "jane_smith",
    "password": "123456789"
}
```
**Expected Response:** 200 OK
```json
{
    "success": true,
    "message": "Lấy vai trò thành công",
    "data": {
        "EMPLOYEE": "ACTIVE",
        "CUSTOMER": "INACTIVE"
    },
    "roleNumbers": 2
}
```

---

## Test Case 5: Empty username
**Objective:** Verify validation error for empty username
**Method:** POST
**Request Body:**
```json
{
    "username": "",
    "password": "123456789"
}
```
**Expected Response:** 400 Bad Request
```json
{
    "success": false,
    "message": "Tên đăng nhập không được để trống"
}
```

---

## Test Case 6: Null username
**Objective:** Verify validation error for null username
**Method:** POST
**Request Body:**
```json
{
    "username": null,
    "password": "123456789"
}
```
**Expected Response:** 400 Bad Request
```json
{
    "success": false,
    "message": "Tên đăng nhập không được để trống"
}
```

---

## Test Case 7: Whitespace-only username
**Objective:** Verify validation error for whitespace username
**Method:** POST
**Request Body:**
```json
{
    "username": "   ",
    "password": "123456789"
}
```
**Expected Response:** 400 Bad Request
```json
{
    "success": false,
    "message": "Tên đăng nhập không được để trống"
}
```

---

## Test Case 8: Empty password
**Objective:** Verify validation error for empty password
**Method:** POST
**Request Body:**
```json
{
    "username": "valid_user",
    "password": ""
}
```
**Expected Response:** 400 Bad Request
```json
{
    "success": false,
    "message": "Mật khẩu không được để trống"
}
```

---

## Test Case 9: Null password
**Objective:** Verify validation error for null password
**Method:** POST
**Request Body:**
```json
{
    "username": "valid_user",
    "password": null
}
```
**Expected Response:** 400 Bad Request
```json
{
    "success": false,
    "message": "Mật khẩu không được để trống"
}
```

---

## Test Case 10: Whitespace-only password
**Objective:** Verify validation error for whitespace password
**Method:** POST
**Request Body:**
```json
{
    "username": "valid_user",
    "password": "   "
}
```
**Expected Response:** 400 Bad Request
```json
{
    "success": false,
    "message": "Mật khẩu không được để trống"
}
```

---

## Test Case 11: Non-existent username
**Objective:** Verify error for username that doesn't exist
**Method:** POST
**Request Body:**
```json
{
    "username": "nonexistent_user",
    "password": "any_password"
}
```
**Expected Response:** 401 Unauthorized
```json
{
    "success": false,
    "message": "Tài khoản không tồn tại"
}
```

---

## Test Case 12: Incorrect password
**Objective:** Verify error for wrong password
**Method:** POST
**Request Body:**
```json
{
    "username": "john_doe",
    "password": "wrong_password"
}
```
**Expected Response:** 401 Unauthorized
```json
{
    "success": false,
    "message": "Mật khẩu không chính xác"
}
```

---

## Test Case 13: Username with leading/trailing spaces
**Objective:** Verify trimming of username spaces
**Method:** POST
**Request Body:**
```json
{
    "username": "  john_doe  ",
    "password": "123456789"
}
```
**Expected Response:** 200 OK
```json
{
    "success": true,
    "message": "Lấy vai trò thành công",
    "data": {
        "CUSTOMER": "ACTIVE"
    },
    "roleNumbers": 1
}
```

---

## Notes:
1. All responses include Vietnamese error messages as per system requirements
2. The endpoint does not require authentication (no Authorization header needed)
3. Username trimming is performed server-side
4. Password verification uses BCrypt encoding
5. Multiple roles are returned as a map with role name as key and status as value
6. The roleNumbers field indicates the count of roles returned
7. Database exceptions are caught and return generic error messages
8. Input validation is performed before database queries
