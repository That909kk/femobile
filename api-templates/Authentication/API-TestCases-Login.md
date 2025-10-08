# API-TestCases-Login.md

## Overview
This document describes the test cases for the **Login** endpoint of the Authentication API.  
The endpoint authenticates users and returns access and refresh tokens upon successful login.  
**Base URL**: `/api/v1/auth`  
**Endpoint**: `POST /login`

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

## Test Cases

### Test Case 1: Successful Login (Customer)
- **Test Case ID**: TC_LOGIN_001
- **Description**: Verify that a customer can log in with valid credentials and receive tokens and user data.
- **Preconditions**:
  - A customer account exists in the `account` table with username `john_doe`, password `123456789`, and role `CUSTOMER`.
  - Account is not locked in Redis (`login:locked:john_doe` does not exist).
- **Input**:
  ```json
  {
    "username": "john_doe",
    "password": "123456789",
    "role": "CUSTOMER",
    "deviceType": "WEB"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Đăng nhập thành công",
    "data": {
      "accessToken": "<valid_jwt_token>",
      "refreshToken": "<valid_refresh_token>",
      "expireIn": 3600,
      "role": "CUSTOMER",
      "deviceType": "WEB",
      "data": {
        "customerId": "a58a104d-1b38-40cf-93bc-8e81826dcaee",
        "username": "john_doe",
        "avatar": "https://example.com/avatars/john.jpg",
        "fullName": "John Doe",
        "email": "john.doe@example.com",
        "phoneNumber": "0901234567",
        "isMale": true,
        "status": "ACTIVE",
        "address": "123 Nguyen Van Cu, Hanoi"
      }
    }
  }
  ```

- **Actual Output**:
  ```json
  {
    "success": true,
    "message": "Đăng nhập thành công",
    "data": {
        "accessToken": "eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJqb2huX2RvZSIsImlhdCI6MTc1NTIyNjA5OSwiZXhwIjoxNzU1MjI5Njk5fQ.WzQ_kpdJ1SDKCl8xexZbpo3eesG-iCfpkCSbjzV-rwKbaqOz-5u40Ytc8R_lEPWl",
        "refreshToken": "eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJqb2huX2RvZSIsImlhdCI6MTc1NTIyNjA5OSwiZXhwIjoxNzU1MzEyNDk5fQ.3qJwGjNQO8ivMFbndcxUVmOmX4MhN7hIlqxrFrz9HH56nszm-pRXoMGro3RDeyTq",
        "expireIn": 3600,
        "role": "CUSTOMER",
        "deviceType": "WEB",
        "data": {
            "customerId": "a58a104d-1b38-40cf-93bc-8e81826dcaee",
            "username": "john_doe",
            "avatar": "https://example.com/avatars/john.jpg",
            "fullName": "John Doe",
            "email": "john.doe@example.com",
            "phoneNumber": "0901234567",
            "isMale": true,
            "status": "ACTIVE",
            "address": "123 Nguyen Van Cu, Hanoi"
        }
    }
  }
  ```
- **Status Code**: 200 OK

---

### Test Case 2: Successful Login (Employee)
- **Test Case ID**: TC_LOGIN_002
- **Description**: Verify that an employee can log in with valid credentials and receive tokens and employee-specific data.
- **Preconditions**:
  - An employee account exists in the `account` table with username `jane_smith`, password `123456`, and role `EMPLOYEE`.
  - Account is not locked in Redis (`login:locked:jane_smith` does not exist).
- **Input**:
  ```json
  {
    "username": "jane_smith",
    "password": "123456",
    "role": "EMPLOYEE",
    "deviceType": "WEB"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Đăng nhập thành công",
    "data": {
      "accessToken": "<valid_jwt_token>",
      "refreshToken": "<valid_refresh_token>",
      "expireIn": 3600,
      "role": "EMPLOYEE",
      "deviceType": "WEB",
      "data": {
        "employeeId": "65a0d32c-558f-4db6-8d15-9843ddfe1f32",
        "username": "jane_smith",
        "avatar": "https://example.com/avatars/jane.jpg",
        "fullName": "Jane Smith",
        "email": "jane.smith@example.com",
        "phoneNumber": "0912345678",
        "isMale": false,
        "status": "ACTIVE",
        "address": "789 Tran Hung Dao, Hanoi"
      }
    }
  }
  ```
- **Status Code**: 200 OK

- **Actual Output**:
  ```json
  {
    "success": true,
    "message": "Đăng nhập thành công",
    "data": {
        "accessToken": "eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJqYW5lX3NtaXRoIiwiaWF0IjoxNzU1MjI2MjY3LCJleHAiOjE3NTUyMjk4Njd9.d1ABvPNDhFr5x0_rT2qAmhmpbxyKt-V9g_F5ZMKw_tnhfOOhBrZdBlnOlyvviD9d",
        "refreshToken": "eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJqYW5lX3NtaXRoIiwiaWF0IjoxNzU1MjI2MjY3LCJleHAiOjE3NTUzMTI2Njf9.KW1gX9balnNLju7Hdj0osCHMC9Qe0SrV8dpwJB9w8-efCic7p63PCuXRasA1g0tS",
        "expireIn": 3600,
        "role": "EMPLOYEE",
        "deviceType": "WEB",
        "data": {
            "employeeId": "65a0d32c-558f-4db6-8d15-9843ddfe1f32",
            "username": "jane_smith",
            "avatar": "https://example.com/avatars/jane.jpg",
            "fullName": "Jane Smith",
            "email": "jane.smith@example.com",
            "phoneNumber": "0912345678",
            "isMale": false,
            "status": "ACTIVE",
            "address": "789 Tran Hung Dao, Hanoi"
        }
    }
  }
  ```
- **Status Code**: 200 OK

---

### Test Case 3: Successful Login (Admin)
- **Test Case ID**: TC_LOGIN_003
- **Description**: Verify that an admin can log in with valid credentials and receive tokens and admin-specific data.
- **Preconditions**:
  - An admin account exists in the `account` table with username `admin_1`, password `123456`, and role `ADMIN`.
  - Account is not locked in Redis (`login:locked:admin_1` does not exist).
- **Input**:
  ```json
  {
    "username": "admin_1",
    "password": "123456",
    "role": "ADMIN",
    "deviceType": "WEB"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Đăng nhập thành công",
    "data": {
      "accessToken": "<valid_jwt_token>",
      "refreshToken": "<valid_refresh_token>",
      "expireIn": 3600,
      "role": "ADMIN",
      "deviceType": "WEB",
      "data": {
        "adminId": "e5e48579-8ebb-4ea6-9d59-37cc11943f1a",
        "username": "admin_1",
        "fullName": "Admin One",
        "isMale": true,
        "address": "Ho Chi Minh City",
        "department": "Management",
        "contactInfo": "admin1@example.com",
        "hireDate": "2023-03-01"
      }
    }
  }
  ```
- **Status Code**: 200 OK

- **Actual Output**:
  ```json
  {
    "success": true,
    "message": "Đăng nhập thành công",
    "data": {
        "accessToken": "eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbl8xIiwiaWF0IjoxNzU1MjI3ODc1LCJleHAiOjE3NTUyMzE0NzV9.RjFoPijxS8AA7Ps8W6qNzvZcOgaRbEgrFjPwuvuAvnkmYR1VJGTaHLxcM6JmfVOW",
        "refreshToken": "eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbl8xIiwiaWF0IjoxNzU1MjI3ODc1LCJleHAiOjE3NTUzMTQyNzV9.dyNkcVaraNDmPzT2mWDfit-w9KGapZdT6rTPKGmCoyHxvsZ3uFBzp0PMF6Fz0W3_",
        "expireIn": 3600,
        "role": "ADMIN",
        "deviceType": "WEB",
        "data": {
            "adminId": "e5e48579-8ebb-4ea6-9d59-37cc11943f1a",
            "username": "admin_1",
            "fullName": "Admin One",
            "isMale": true,
            "address": "Ho Chi Minh City",
            "department": "Management",
            "contactInfo": "admin1@example.com",
            "hireDate": "2023-03-01"
        }
    }
  }
  ```
- **Status Code**: 200 OK

---

### Test Case 4: Invalid Credentials
- **Test Case ID**: TC_LOGIN_004
- **Description**: Verify that login fails with incorrect username or password.
- **Preconditions**:
  - Account with username `john_doe` exists but the password is incorrect.
- **Input**:
  ```json
  {
    "username": "john_doe",
    "password": "1234",
    "role": "CUSTOMER",
    "deviceType": "WEB"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Thông tin đăng nhập không hợp lệ"
  }
  ```
- **Status Code**: 401 Unauthorized
- 
- **Actual Output**:
  ```json
  {
    "success": false,
    "message": "Thông tin đăng nhập không hợp lệ"
  }
  ```
- **Status Code**: 401 Unauthorized

---

### Test Case 5: Missing Username
- **Test Case ID**: TC_LOGIN_005
- **Description**: Verify that login fails when username is missing or blank.
- **Preconditions**:
  - None.
- **Input**:
  ```json
  {
    "username": "",
    "password": "123456",
    "role": "CUSTOMER",
    "deviceType": "WEB"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Tên đăng nhập không được để trống"
  }
  ```
- **Status Code**: 400 Bad Request

- **Actual Output**:
  ```json
  {
    "success": false,
    "message": "Tên đăng nhập không được để trống"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 6: Missing Password
- **Test Case ID**: TC_LOGIN_006
- **Description**: Verify that login fails when password is missing or blank.
- **Preconditions**:
  - None.
- **Input**:
  ```json
  {
    "username": "john_doe",
    "password": "",
    "role": "CUSTOMER",
    "deviceType": "WEB"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Mật khẩu không được để trống"
  }
  ```
- **Status Code**: 400 Bad Request

- **Actual Output**:
  ```json
  {
    "success": false,
    "message": "Mật khẩu không được để trống"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 7: Internal Server Error
- **Test Case ID**: TC_LOGIN_007
- **Description**: Verify that login fails with an internal server error when an unexpected issue occurs (e.g., Redis failure).
- **Preconditions**:
  - Account with username `john_doe` exists.
  - Redis throws an unexpected exception during the login process.
- **Input**:
  ```json
  {
    "username": "john_doe",
    "password": "123456",
    "role": "CUSTOMER",
    "deviceType": "WEB"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Đã xảy ra lỗi khi đăng nhập"
  }
  ```
- **Status Code**: 500 Internal Server Error

- **Actual Output**:
  ```json
  {
    "success": false,
    "message": "Đã xảy ra lỗi khi đăng nhập"
  }
  ```
- **Status Code**: 500 Internal Server Error

---

### Test Case 8: Missing Role
- **Test Case ID**: TC_LOGIN_008
- **Description**: Verify that login fails when role is missing or blank.
- **Preconditions**:
  - None.
- **Input**:
  ```json
  {
    "username": "john_doe",
    "password": "123456",
    "role": "",
    "deviceType": "WEB"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Vai trò không được để trống"
  }
  ```
- **Status Code**: 400 Bad Request

- **Actual Output**:
  ```json
  {
    "success": false,
    "message": "Vai trò không được để trống"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 9: Invalid Role
- **Test Case ID**: TC_LOGIN_009
- **Description**: Verify that login fails when an invalid role is provided.
- **Preconditions**:
  - None.
- **Input**:
  ```json
  {
    "username": "john_doe",
    "password": "123456",
    "role": "INVALID_ROLE",
    "deviceType": "WEB"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Vai trò không hợp lệ. Chỉ chấp nhận CUSTOMER, EMPLOYEE hoặc ADMIN"
  }
  ```
- **Status Code**: 400 Bad Request

- **Actual Output**:
  ```json
  {
    "success": false,
    "message": "Vai trò không hợp lệ. Chỉ chấp nhận CUSTOMER, EMPLOYEE hoặc ADMIN"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 10: Missing Device Type
- **Test Case ID**: TC_LOGIN_010
- **Description**: Verify that login fails when deviceType is missing or blank.
- **Preconditions**:
  - None.
- **Input**:
  ```json
  {
    "username": "john_doe",
    "password": "123456",
    "role": "CUSTOMER",
    "deviceType": ""
  }
  ```
- **Expected Output**:
  ```json
  {
      "success": false,
      "message": "Loại thiết bị không được để trống"
  }
  ```
- **Status Code**: 400 Bad Request

- **Actual Output**:
  ```json
  {
      "success": false,
      "message": "Loại thiết bị không được để trống"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 11: Invalid Device Type
- **Test Case ID**: TC_LOGIN_011
- **Description**: Verify that login fails when an invalid deviceType is provided.
- **Preconditions**:
  - None.
- **Input**:
  ```json
  {
    "username": "john_doe",
    "password": "123456",
    "role": "CUSTOMER",
    "deviceType": "INVALID_DEVICE"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Loại thiết bị không hợp lệ. Chỉ chấp nhận WEB hoặc MOBILE"
  }
  ```
- **Status Code**: 400 Bad Request

- **Acutal Output**:
  ```json
  {
    "success": false,
    "message": "Loại thiết bị không hợp lệ. Chỉ chấp nhận WEB hoặc MOBILE"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 12: Role Mismatch
- **Test Case ID**: TC_LOGIN_012
- **Description**: Verify that login fails when the requested role doesn't match the account's actual role.
- **Preconditions**:
  - Account with username `john_doe` exists with role `CUSTOMER`.
- **Input**:
  ```json
  {
    "username": "john_doe",
    "password": "123456",
    "role": "EMPLOYEE",
    "deviceType": "WEB"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Thông tin đăng nhập không hợp lệ"
  }
  ```
- **Status Code**: 401 Unauthorized

- **Actual Output**:
  ```json
  {
    "success": false,
    "message": "Thông tin đăng nhập không hợp lệ"
  }
  ```
- **Status Code**: 401 Unauthorized

---

### Test Case 13: Account Inactive
- **Test Case ID**: TC_LOGIN_013
- **Description**: Verify that login fails when account status is not ACTIVE.
- **Preconditions**:
  - Account with username `inactive_user` exists but status is `INACTIVE`.
- **Input**:
  ```json
  {
    "username": "mary_jones",
    "password": "123456",
    "role": "CUSTOMER",
    "deviceType": "WEB"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Tài khoản chưa được kích hoạt hoặc đã bị khóa"
  }
  ```
- **Status Code**: 401 Unauthorized

- **Actual Output**:
  ```json
  {
    "success": false,
    "message": "Tài khoản chưa được kích hoạt hoặc đã bị khóa"
  }
  ```
- **Status Code**: 401 Unauthorized

---

### Test Case 14: Login with Mobile Device Type (Customer)
- **Test Case ID**: TC_LOGIN_014
- **Description**: Verify that a customer can log in with mobile device type and receive appropriate tokens.
- **Preconditions**:
  - A customer account exists with username `john_doe`, password `123456`, and role `CUSTOMER`.
  - Account is not locked in Redis.
- **Input**:
  ```json
  {
    "username": "john_doe",
    "password": "123456",
    "role": "CUSTOMER",
    "deviceType": "MOBILE"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Đăng nhập thành công",
    "data": {
      "accessToken": "<valid_jwt_token>",
      "refreshToken": "<valid_refresh_token>",
      "expireIn": 3600,
      "role": "CUSTOMER",
      "deviceType": "MOBILE",
      "data": {
         "customerId": "a58a104d-1b38-40cf-93bc-8e81826dcaee",
          "username": "john_doe",
          "avatar": "https://example.com/avatars/john.jpg",
          "fullName": "John Doe",
          "email": "john.doe@example.com",
          "phoneNumber": "0901234567",
          "isMale": true,
          "status": "ACTIVE",
          "address": "123 Nguyen Van Cu, Hanoi"
      }
    }
  }
  ```
- **Status Code**: 200 OK

- **Actual Output**:
  ```json
  {
    "success": true,
    "message": "Đăng nhập thành công",
    "data": {
      "accessToken": "<valid_jwt_token>",
      "refreshToken": "<valid_refresh_token>",
      "expireIn": 3600,
      "role": "CUSTOMER",
      "deviceType": "MOBILE",
      "data": {
         "customerId": "a58a104d-1b38-40cf-93bc-8e81826dcaee",
          "username": "john_doe",
          "avatar": "https://example.com/avatars/john.jpg",
          "fullName": "John Doe",
          "email": "john.doe@example.com",
          "phoneNumber": "0901234567",
          "isMale": true,
          "status": "ACTIVE",
          "address": "123 Nguyen Van Cu, Hanoi"
      }
    }
  }
  ```
- **Status Code**: 200 OK

---

### Test Case 15: Multiple Failed Login Attempts (Account Locking)
- **Test Case ID**: TC_LOGIN_015
- **Description**: Verify that after 3 failed login attempts, the account gets locked for 10 minutes.
- **Preconditions**:
  - Account with username `john_doe` exists.
  - No existing lock in Redis.
- **Test Steps**:
  1. Make 3 consecutive failed login attempts
  2. Attempt a 4th login (should be blocked)
- **Input (4th attempt)**:
  ```json
  {
    "username": "john_doe",
    "password": "wrong_password",
    "role": "CUSTOMER",
    "deviceType": "WEB"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Tài khoản tạm thời bị khóa do đăng nhập sai nhiều lần"
  }
  ```
- **Status Code**: 401 Unauthorized

- **Actual Output**:
  ```json
  {
    "success": false,
    "message": "Tài khoản tạm thời bị khóa do đăng nhập sai nhiều lần"
  }
  ```
- **Status Code**: 401 Unauthorized

---

### Test Case 16: Concurrent Login Different Devices (Session Management)
- **Test Case ID**: TC_LOGIN_016
- **Description**: Verify that a user can log in from different device types and old sessions are properly managed.
- **Preconditions**:
  - Account with username `john_doe` exists.
  - User is already logged in from WEB device.
- **Input**:
  ```json
  {
    "username": "john_doe",
    "password": "123456",
    "role": "CUSTOMER",
    "deviceType": "MOBILE"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Đăng nhập thành công",
    "data": {
      "accessToken": "<new_jwt_token>",
      "refreshToken": "<new_refresh_token>",
      "expireIn": 3600,
      "role": "CUSTOMER",
      "deviceType": "MOBILE",
      "data": {
        "customerId": "a58a104d-1b38-40cf-93bc-8e81826dcaee",
          "username": "john_doe",
          "avatar": "https://example.com/avatars/john.jpg",
          "fullName": "John Doe",
          "email": "john.doe@example.com",
          "phoneNumber": "0901234567",
          "isMale": true,
          "status": "ACTIVE",
          "address": "123 Nguyen Van Cu, Hanoi"
      }
    }
  }
  ```
- **Status Code**: 200 OK
- **Additional Verification**: WEB session should remain active

- **Actual Output**:
  ```json
  {
    "success": true,
    "message": "Đăng nhập thành công",
    "data": {
      "accessToken": "<new_jwt_token>",
      "refreshToken": "<new_refresh_token>",
      "expireIn": 3600,
      "role": "CUSTOMER",
      "deviceType": "MOBILE",
      "data": {
        "customerId": "a58a104d-1b38-40cf-93bc-8e81826dcaee",
          "username": "john_doe",
          "avatar": "https://example.com/avatars/john.jpg",
          "fullName": "John Doe",
          "email": "john.doe@example.com",
          "phoneNumber": "0901234567",
          "isMale": true,
          "status": "ACTIVE",
          "address": "123 Nguyen Van Cu, Hanoi"
      }
    }
  }
  ```
- **Status Code**: 200 OK
- **Additional Verification**: WEB session should remain active

---

### Test Case 17: Login Same Device Type (Token Replacement)
- **Test Case ID**: TC_LOGIN_017
- **Description**: Verify that logging in from the same device type replaces the previous session tokens.
- **Preconditions**:
  - Account with username `john_doe` exists.
  - User is already logged in from WEB device.
- **Input**:
  ```json
  {
    "username": "john_doe",
    "password": "123456",
    "role": "CUSTOMER",
    "deviceType": "WEB"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Đăng nhập thành công",
    "data": {
      "accessToken": "<new_jwt_token>",
      "refreshToken": "<new_refresh_token>",
      "expireIn": 3600,
      "role": "CUSTOMER",
      "deviceType": "WEB",
      "data": {
        "customerId": "a58a104d-1b38-40cf-93bc-8e81826dcaee",
        "username": "john_doe",
        "avatar": "https://example.com/avatars/john.jpg",
        "fullName": "John Doe",
        "email": "john.doe@example.com",
        "phoneNumber": "0901234567",
        "isMale": true,
        "status": "ACTIVE",
        "address": "123 Nguyen Van Cu, Hanoi"
      }
    }
  }
  ```
- **Status Code**: 200 OK
- **Additional Verification**: Old tokens should be invalidated in Redis

- **Actual Output**:
  ```json
  {
    "success": true,
    "message": "Đăng nhập thành công",
    "data": {
      "accessToken": "<new_jwt_token>",
      "refreshToken": "<new_refresh_token>",
      "expireIn": 3600,
      "role": "CUSTOMER",
      "deviceType": "WEB",
      "data": {
        "customerId": "a58a104d-1b38-40cf-93bc-8e81826dcaee",
        "username": "john_doe",
        "avatar": "https://example.com/avatars/john.jpg",
        "fullName": "John Doe",
        "email": "john.doe@example.com",
        "phoneNumber": "0901234567",
        "isMale": true,
        "status": "ACTIVE",
        "address": "123 Nguyen Van Cu, Hanoi"
      }
    }
  }
  ```
- **Status Code**: 200 OK
- **Additional Verification**: Old tokens should be invalidated in Redis

---

### Test Case 18: User Not Found
- **Test Case ID**: TC_LOGIN_018
- **Description**: Verify that login fails when username doesn't exist in the database.
- **Preconditions**:
  - Username `nonexistent_user` does not exist in the database.
- **Input**:
  ```json
  {
    "username": "test",
    "password": "123456",
    "role": "CUSTOMER",
    "deviceType": "WEB"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Tài khoản hoặc mật khẩu không hợp lệ"
  }
  ```
- **Status Code**: 400 Bad Request

- **Actual Output**:
  ```json
  {
    "success": false,
    "message": "Tài khoản hoặc mật khẩu không hợp lệ"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 19: Redis Connection Failure
- **Test Case ID**: TC_LOGIN_019
- **Description**: Verify proper error handling when Redis operations fail.
- **Preconditions**:
  - Valid account exists but Redis is unavailable or throws exceptions.
- **Input**:
  ```json
  {
    "username": "john_doe",
    "password": "123456",
    "role": "CUSTOMER",
    "deviceType": "WEB"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Đã xảy ra lỗi khi đăng nhập"
  }
  ```
- **Status Code**: 500 Internal Server Error

---

### Test Case 20: Failed Login Attempt Tracking
- **Test Case ID**: TC_LOGIN_020
- **Description**: Verify that failed login attempts are properly tracked and incremented in Redis.
- **Preconditions**:
  - Account with username `john_doe` exists.
  - No existing failed attempts in Redis.
- **Test Steps**:
  1. Make 1 failed login attempt
  2. Verify Redis counter is incremented
  3. Make 2 more failed attempts
  4. Verify account gets locked on 3rd attempt
- **Input (1st failed attempt)**:
  ```json
  {
    "username": "john_doe",
    "password": "1234",
    "role": "CUSTOMER",
    "deviceType": "WEB"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Tài khoản hoặc mật khẩu không hợp lệ"
  }
  ```
- **Status Code**: 401 Unauthorized
- **Additional Verification**: Redis key `login:failed:john_doe` should have value 1


- **Actual Output**:
  ```json
  {
    "success": false,
    "message": "Tài khoản hoặc mật khẩu không hợp lệ"
  }
  ```
- **Status Code**: 401 Unauthorized
- **Additional Verification**: Redis key `login:failed:john_doe` should have value 1

---

### Test Case 21: Login After Account Unlock
- **Test Case ID**: TC_LOGIN_021
- **Description**: Verify that login works correctly after account lock expires (10 minutes).
- **Preconditions**:
  - Account with username `john_doe` was previously locked.
  - Lock period has expired (Redis key `login:locked:john_doe` no longer exists).
- **Input**:
  ```json
  {
    "username": "john_doe",
    "password": "123456",
    "role": "CUSTOMER",
    "deviceType": "WEB"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Đăng nhập thành công",
    "data": {
      "accessToken": "<valid_jwt_token>",
      "refreshToken": "<valid_refresh_token>",
      "expireIn": 3600,
      "role": "CUSTOMER",
      "deviceType": "WEB",
      "data": {
        "customerId": "a58a104d-1b38-40cf-93bc-8e81826dcaee",
        "username": "john_doe",
        "avatar": "https://example.com/avatars/john.jpg",
        "fullName": "John Doe",
        "email": "john.doe@example.com",
        "phoneNumber": "0901234567",
        "isMale": true,
        "status": "ACTIVE",
        "address": "123 Nguyen Van Cu, Hanoi"
      }
    }
  }
  ```
- **Status Code**: 200 OK
- **Additional Verification**: Failed login attempts counter should be reset

- **Actual Output**:
  ```json
  {
    "success": true,
    "message": "Đăng nhập thành công",
    "data": {
      "accessToken": "<valid_jwt_token>",
      "refreshToken": "<valid_refresh_token>",
      "expireIn": 3600,
      "role": "CUSTOMER",
      "deviceType": "WEB",
      "data": {
        "customerId": "a58a104d-1b38-40cf-93bc-8e81826dcaee",
        "username": "john_doe",
        "avatar": "https://example.com/avatars/john.jpg",
        "fullName": "John Doe",
        "email": "john.doe@example.com",
        "phoneNumber": "0901234567",
        "isMale": true,
        "status": "ACTIVE",
        "address": "123 Nguyen Van Cu, Hanoi"
      }
    }
  }
  ```
- **Status Code**: 200 OK
- **Additional Verification**: Failed login attempts counter should be reset

---

### Test Case 22: Successful Login Resets Failed Attempts
- **Test Case ID**: TC_LOGIN_022
- **Description**: Verify that successful login resets the failed login attempts counter.
- **Preconditions**:
  - Account with username `john_doe` exists.
  - Redis key `login:failed:john_doe` exists with value < 3.
- **Input**:
  ```json
  {
    "username": "john_doe",
    "password": "123456",
    "role": "CUSTOMER",
    "deviceType": "WEB"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Đăng nhập thành công",
    "data": {
      "accessToken": "<valid_jwt_token>",
      "refreshToken": "<valid_refresh_token>",
      "expireIn": 3600,
      "role": "CUSTOMER",
      "deviceType": "WEB",
      "data": {
        "customerId": "a58a104d-1b38-40cf-93bc-8e81826dcaee",
        "username": "john_doe",
        "avatar": "https://example.com/avatars/john.jpg",
        "fullName": "John Doe",
        "email": "john.doe@example.com",
        "phoneNumber": "0901234567",
        "isMale": true,
        "status": "ACTIVE",
        "address": "123 Nguyen Van Cu, Hanoi"
      }
    }
  }
  ```
- **Status Code**: 200 OK
- **Additional Verification**: Redis key `login:failed:john_doe` should be deleted

- **Actual Output**:
  ```json
  {
    "success": true,
    "message": "Đăng nhập thành công",
    "data": {
      "accessToken": "<valid_jwt_token>",
      "refreshToken": "<valid_refresh_token>",
      "expireIn": 3600,
      "role": "CUSTOMER",
      "deviceType": "WEB",
      "data": {
        "customerId": "a58a104d-1b38-40cf-93bc-8e81826dcaee",
        "username": "john_doe",
        "avatar": "https://example.com/avatars/john.jpg",
        "fullName": "John Doe",
        "email": "john.doe@example.com",
        "phoneNumber": "0901234567",
        "isMale": true,
        "status": "ACTIVE",
        "address": "123 Nguyen Van Cu, Hanoi"
      }
    }
  }
  ```
- **Status Code**: 200 OK
- **Additional Verification**: Redis key `login:failed:john_doe` should be deleted

---

## Notes
- **Test Environment**: Ensure Redis and the database are properly configured with test data before running tests.
- **Mocking**: Use mocking for `AuthService`, `AccountRepository`, `CustomerService`, `EmployeeService`, `AdminService`, and `RedisTemplate` to isolate the controller logic.
- **Edge Cases**: Additional test cases may be added for scenarios like database connection failures, Redis connectivity issues, or JWT generation failures.
- **Device Type Validation**: All test cases should include the `deviceType` field as it's required by the API.
- **Session Management**: Test cases should verify proper session management for different device types.
- **Security**: Test cases include account locking mechanism and proper error handling to prevent information disclosure.