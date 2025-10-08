# API-TestCases-Register.md

## Overview
This document describes the test cases for the **Register** endpoint of the Authentication API.  
The endpoint allows users to create a new account with validated username, password, email, and role, ensuring no duplicate usernames or emails for specific roles.  
**Base URL**: `/api/v1/auth`  
**Endpoint**: `POST /register`

---

## Test Case Structure
Each test case includes:
- **Test Case ID**: Unique identifier for the test case.
- **Description**: Purpose of the test.
- **Preconditions**: Requirements before executing the test.
- **Input**: Request data.
- **Expected Output**: Expected response based on the API specification.
- **Status Code**: HTTP status code expected.

---
All fields are mandatory and cannot be left empty:

**Username**: Must be provided and cannot be blank
**Password**: Must be provided and cannot be blank
**Full Name**: Must be provided and cannot be blank
**Email**: Must be provided and cannot be blank
**Phone Number**: Must be provided and cannot be blank
**Role**: Must be provided and cannot be blank
### Field Format Requirements
**Username**
- Length: Must be between 3 and 50 characters
- Characters: Only letters, numbers, and underscores are allowed
- Uniqueness: Must be unique across the entire system (no duplicate usernames allowed)
**Password**
- Minimum Length: Must be at least 6 characters long
- Maximum Length: Cannot exceed 100 characters
- Security: Will be encrypted before storage
**Email**
- Format: Must be a valid email address format (e.g., user@example.com)
- Maximum Length: Cannot exceed 255 characters
- Role-based Uniqueness: Must be unique within the same role (same email can be used for different roles)
**Phone Number**
- Format: Must follow valid phone number patterns
- Accepted Formats:
  - International format: +84123456789
  - Domestic format: 0123456789
  - Various international codes supported
**Full Name**
- Characters: Only letters and spaces are allowed (no numbers or special characters)
- Maximum Length: Cannot exceed 100 characters
**Role**
- Valid Values: Must be one of the following:
  - CUSTOMER
  - EMPLOYEE
  - ADMIN
- Case Sensitive: Must be provided in uppercase
**Business Rules**
- Email Uniqueness by Role
- Each role maintains separate email uniqueness
- A customer email cannot be used for another customer account
- An employee email cannot be used for another employee account
- An admin email cannot be used for another admin account
- **However**: The same email can be used across different roles (e.g., same email for customer and employee)
---

## Test Cases

### Test Case 1: Successful Registration (Customer)
- **Test Case ID**: TC_REGISTER_001
- **Description**: Verify that a new customer account can be registered with valid input data.
- **Preconditions**:
  - Username `examplec` does not exist in the `account` table.
  - Email `examplec@gmail.com` is not associated with any existing customer account.
- **Input**:
  ```json
  {
    "username": "examplec",
    "password": "P@ssw0rd!",
    "fullName": "ExampleC",
    "email": "examplec@gmail.com",
    "phoneNumber": "+84123456789",
    "role": "CUSTOMER"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Đăng ký thành công",
    "data": {
      "username": "examplec",
      "email": "examplec@gmail.com",
      "role": "CUSTOMER"
    }
  }
  ```
- **Status Code**: 201 Created

- **Actual Output**:
  ```json
  {
    "success": true,
    "message": "Đăng ký thành công",
    "data": {
      "username": "examplec",
      "email": "examplec@gmail.com",
      "role": "CUSTOMER"
    }
  }
  ```
- **Status Code**: 201 Created

---

### Test Case 2: Successful Registration (Employee)
- **Test Case ID**: TC_REGISTER_002
- **Description**: Verify that a new employee account can be registered with valid input data.
- **Preconditions**:
  - Username `employee1` does not exist in the `account` table.
  - Email `employee1@company.com` is not associated with any existing employee account.
- **Input**:
  ```json
  {
    "username": "employee1",
    "password": "p11111!",
    "fullName": "John Employee",
    "email": "employee1@company.com",
    "phoneNumber": "+84987654321",
    "role": "EMPLOYEE"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Đăng ký thành công",
    "data": {
      "username": "employee1",
      "email": "employee1@company.com",
      "role": "EMPLOYEE"
    }
  }
  ```
- **Status Code**: 201 Created

- **Actual Output**:
  ```json
  {
    "success": true,
    "message": "Đăng ký thành công",
    "data": {
      "username": "employee1",
      "email": "employee1@company.com",
      "role": "EMPLOYEE"
    }
  }
  ```
- **Status Code**: 201 Created

---

### Test Case 3: Successful Registration (Admin)
- **Test Case ID**: TC_REGISTER_003
- **Description**: Verify that a new admin account can be registered with valid input data.
- **Preconditions**:
  - Username `admin1` does not exist in the `account` table.
  - Email `admin1@company.com` is not associated with any existing admin account.
- **Input**:
  ```json
  {
    "username": "admin1",
    "password": "AdminPass123!",
    "fullName": "Jane Admin",
    "email": "admin1@company.com",
    "phoneNumber": "+84111222333",
    "role": "ADMIN"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Đăng ký thành công",
    "data": {
      "username": "admin1",
      "email": "admin1@company.com",
      "role": "ADMIN"
    }
  }
  ```
- **Status Code**: 201 Created

- **Actual Output**:
  ```json
  {
    "success": true,
    "message": "Đăng ký thành công",
    "data": {
      "username": "admin1",
      "email": "admin1@company.com",
      "role": "ADMIN"
    }
  }
  ```
- **Status Code**: 201 Created

---

### Test Case 4: Missing Username
- **Test Case ID**: TC_REGISTER_004
- **Description**: Verify that registration fails when username is missing or blank.
- **Preconditions**:
  - None.
- **Input**:
  ```json
  {
    "username": "",
    "password": "P@ssw0rd!",
    "fullName": "Example1",
    "email": "example1@gmail.com",
    "phoneNumber": "+84123456789",
    "role": "CUSTOMER"
  }
  ```
- **Expected Output**:
  ```json
  {
    "field": "username",
    "success": false,
    "message": "Tên đăng nhập không được thiếu"
  }
  ```
- **Status Code**: 400 Bad Request

- **Actual Output**:
  ```json
  {
    "field": "username",
    "success": false,
    "message": "Tên đăng nhập không được thiếu"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 5: Username Too Short
- **Test Case ID**: TC_REGISTER_005
- **Description**: Verify that registration fails when username is less than 3 characters.
- **Preconditions**:
  - None.
- **Input**:
  ```json
  {
    "username": "ab",
    "password": "P@ssw0rd!",
    "fullName": "Example Short",
    "email": "short@gmail.com",
    "phoneNumber": "+84123456789",
    "role": "CUSTOMER"
  }
  ```
- **Expected Output**:
  ```json
  {
    "field": "username",
    "success": false,
    "message": "Tên đăng nhập phải có từ 3 đến 50 ký tự"
  }
  ```
- **Status Code**: 400 Bad Request

- **Actual Output**:
  ```json
  {
    "field": "username",
    "success": false,
    "message": "Tên đăng nhập phải có từ 3 đến 50 ký tự"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 6: Username Too Long
- **Test Case ID**: TC_REGISTER_006
- **Description**: Verify that registration fails when username exceeds 50 characters.
- **Preconditions**:
  - None.
- **Input**:
  ```json
  {
    "username": "this_is_a_very_very_very_very_very_long_username_that_exceeds_fifty_characters",
    "password": "P@ssw0rd!",
    "fullName": "Example Long",
    "email": "long@gmail.com",
    "phoneNumber": "+84123456789",
    "role": "CUSTOMER"
  }
  ```
- **Expected Output**:
  ```json
  {
    "field": "username",
    "success": false,
    "message": "Tên đăng nhập phải có từ 3 đến 50 ký tự"
  }
  ```
- **Status Code**: 400 Bad Request

- **Actual Output**:
  ```json
  {
    "field": "username",
    "success": false,
    "message": "Tên đăng nhập phải có từ 3 đến 50 ký tự"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 7: Missing Password
- **Test Case ID**: TC_REGISTER_007
- **Description**: Verify that registration fails when password is missing or blank.
- **Preconditions**:
  - None.
- **Input**:
  ```json
  {
    "username": "testuser",
    "password": "",
    "fullName": "Test User",
    "email": "test@gmail.com",
    "phoneNumber": "+84123456789",
    "role": "CUSTOMER"
  }
  ```
- **Expected Output**:
  ```json
  {
    "field": "password",
    "success": false,
    "message": "Mật khẩu không được thiếu"
  }
  ```
- **Status Code**: 400 Bad Request

- **Actual Output**:
  ```json
  {
    "field": "password",
    "success": false,
    "message": "Mật khẩu không được thiếu"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 8: Invalid Password (Too Short)
- **Test Case ID**: TC_REGISTER_008
- **Description**: Verify that registration fails when password is less than 6 characters.
- **Preconditions**:
  - Username `examplp` does not exist in the `account` table.
- **Input**:
  ```json
  {
    "username": "examplp",
    "password": "P@ss1",
    "fullName": "ExampleP",
    "email": "examplep@gmail.com",
    "phoneNumber": "+84123456789",
    "role": "CUSTOMER"
  }
  ```
- **Expected Output**:
  ```json
  {
    "field": "password",
    "success": false,
    "message": "Mật khẩu phải có ít nhất 6 ký tự"
  }
  ```
- **Status Code**: 400 Bad Request

- **Actual Output**:
  ```json
  {
    "field": "password",
    "success": false,
    "message": "Mật khẩu phải có ít nhất 6 ký tự"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 9: Missing Email
- **Test Case ID**: TC_REGISTER_009
- **Description**: Verify that registration fails when email is missing or blank.
- **Preconditions**:
  - None.
- **Input**:
  ```json
  {
    "username": "testuser",
    "password": "P@ssw0rd!",
    "fullName": "Test User",
    "email": "",
    "phoneNumber": "+84123456789",
    "role": "CUSTOMER"
  }
  ```
- **Expected Output**:
  ```json
  {
    "field": "email",
    "success": false,
    "message": "Email không được thiếu"
  }
  ```
- **Status Code**: 400 Bad Request

- **Actual Output**:
  ```json
  {
    "field": "email",
    "success": false,
    "message": "Email không được thiếu"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 10: Invalid Email Format
- **Test Case ID**: TC_REGISTER_010
- **Description**: Verify that registration fails when email format is invalid.
- **Preconditions**:
  - Username `john_doe` does not exist in the `accounts` table.
- **Input**:
  ```json
  {
    "username": "john_doe",
    "password": "P@ssw0rd!",
    "fullName": "John Doe",
    "email": "invalid-email",
    "phoneNumber": "+84123456789",
    "role": "CUSTOMER"
  }
  ```
- **Expected Output**:
  ```json
  {
    "field": "email",
    "success": false,
    "message": "Định dạng email không hợp lệ"
  }
  ```
- **Status Code**: 400 Bad Request

- **Actual Output**:
  ```json
  {
    "field": "email",
    "success": false,
    "message": "Định dạng email không hợp lệ"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 11: Missing Phone Number
- **Test Case ID**: TC_REGISTER_011
- **Description**: Verify that registration fails when phone number is missing or blank.
- **Preconditions**:
  - None.
- **Input**:
  ```json
  {
    "username": "testuser",
    "password": "P@ssw0rd!",
    "fullName": "Test User",
    "email": "test@gmail.com",
    "phoneNumber": "",
    "role": "CUSTOMER"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Số điện thoại không được thiếu",
    "field": "phoneNumber"
  }
  ```
- **Status Code**: 400 Bad Request

- **Actual Output**:
  ```json
  {
    "success": false,
    "message": "Số điện thoại không được thiếu",
    "field": "phoneNumber"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 12: Invalid Phone Number Format
- **Test Case ID**: TC_REGISTER_012
- **Description**: Verify that registration fails when phone number format is invalid.
- **Preconditions**:
  - Username `testuser` does not exist in the `account` table.
- **Input**:
  ```json
  {
    "username": "testuser",
    "password": "P@ssw0rd!",
    "fullName": "Test User",
    "email": "test@gmail.com",
    "phoneNumber": "123abc",
    "role": "CUSTOMER"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Định dạng số điện thoại không hợp lệ",
    "field": "phoneNumber"
  }
  ```
- **Status Code**: 400 Bad Request

- **Actual Output**:
  ```json
  {
    "success": false,
    "message": "Định dạng số điện thoại không hợp lệ",
    "field": "phoneNumber"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 13: Missing Role
- **Test Case ID**: TC_REGISTER_013
- **Description**: Verify that registration fails when role is missing or blank.
- **Preconditions**:
  - None.
- **Input**:
  ```json
  {
    "username": "testuser",
    "password": "P@ssw0rd!",
    "fullName": "Test User",
    "email": "test@gmail.com",
    "phoneNumber": "+84123456789",
    "role": ""
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Vai trò không được thiếu",
    "field": "role"
  }
  ```
- **Status Code**: 400 Bad Request

- **Actual Output**:
  ```json
  {
    "success": false,
    "message": "Vai trò không được thiếu",
    "field": "role"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 14: Invalid Role
- **Test Case ID**: TC_REGISTER_014
- **Description**: Verify that registration fails when an invalid role is provided.
- **Preconditions**:
  - Username `john_doe` does not exist in the `accounts` table.
- **Input**:
  ```json
  {
    "username": "john_doe",
    "password": "P@ssw0rd!",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+84123456789",
    "role": "INVALID_ROLE"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Vai trò phải là CUSTOMER, EMPLOYEE hoặc ADMIN",
    "field": "role"
  }
  ```
- **Status Code**: 400 Bad Request

- **Actual Output**:
  ```json
  {
    "success": false,
    "message": "Vai trò phải là CUSTOMER, EMPLOYEE hoặc ADMIN",
    "field": "role"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 15: Missing Full Name
- **Test Case ID**: TC_REGISTER_015
- **Description**: Verify that registration fails when full name is missing or blank.
- **Preconditions**:
  - None.
- **Input**:
  ```json
  {
    "username": "testuser",
    "password": "P@ssw0rd!",
    "fullName": "",
    "email": "test@gmail.com",
    "phoneNumber": "+84123456789",
    "role": "CUSTOMER"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Họ và tên không được thiếu",
    "field": "fullName"
  }
  ```
- **Status Code**: 400 Bad Request

- **Actual Output**:
  ```json
  {
    "success": false,
    "message": "Họ và tên không được thiếu",
    "field": "fullName"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 16: Full Name Too Long
- **Test Case ID**: TC_REGISTER_016
- **Description**: Verify that registration fails when full name exceeds 100 characters.
- **Preconditions**:
  - None.
- **Input**:
  ```json
  {
    "username": "testuser",
    "password": "P@ssw0rd!",
    "fullName": "This is a very very very very very very very very very very very very very very long full name that exceeds one hundred characters limit set by the system validation rules",
    "email": "test@gmail.com",
    "phoneNumber": "+84123456789",
    "role": "CUSTOMER"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Họ và tên không được vượt quá 100 ký tự",
    "field": "fullName"
  }
  ```
- **Status Code**: 400 Bad Request

- **Actual Output**:
  ```json
  {
    "success": false,
    "message": "Họ và tên không được vượt quá 100 ký tự",
    "field": "fullName"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 17: Username Already Exists
- **Test Case ID**: TC_REGISTER_017
- **Description**: Verify that registration fails when the username already exists in the system.
- **Preconditions**:
  - Username `john_doe` already exists in the `accounts` table.
- **Input**:
  ```json
  {
    "username": "john_doe",
    "password": "P@ssw0rd!",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+84123456789",
    "role": "CUSTOMER"
  }
  ```
- **Expected Output**:
  ```json
  {
    "message": "Tên đăng nhập đã được sử dụng",
    "success": false,
    "field": "username"
  }
  ```
- **Status Code**: 400 Bad Request

- **Actual Output**:
  ```json
  {
    "message": "Tên đăng nhập đã được sử dụng",
    "success": false,
    "field": "username"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 18: Email Already Exists for Customer
- **Test Case ID**: TC_REGISTER_018
- **Description**: Verify that registration fails when the email is already associated with a customer account.
- **Preconditions**:
  - Username `new_customer` does not exist in the `accounts` table.
  - Email `john.doe@example.com` is already associated with a customer account in the `Customer` table.
- **Input**:
  ```json
  {
    "username": "new_customer",
    "password": "P@ssw0rd!",
    "fullName": "New Customer",
    "email": "john.doe@example.com",
    "phoneNumber": "+84123456789",
    "role": "CUSTOMER"
  }
  ```
- **Expected Output**:
  ```json
  {
    "message": "Đã có khách hàng dùng email này",
    "success": false,
    "field": "email"
  }
  ```
- **Status Code**: 400 Bad Request

- **Actual Output**:
  ```json
  {
    "message": "Đã có khách hàng dùng email này",
    "success": false,
    "field": "email"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 19: Email Already Exists for Employee
- **Test Case ID**: TC_REGISTER_019
- **Description**: Verify that registration fails when the email is already associated with an employee account.
- **Preconditions**:
  - Username `new_employee` does not exist in the `accounts` table.
  - Email `jane.smith@example.com` is already associated with an employee account in the `Employee` table.
- **Input**:
  ```json
  {
    "username": "new_employee",
    "password": "P@ssw0rd!",
    "fullName": "New Employee",
    "email": "jane.smith@example.com",
    "phoneNumber": "+84123456789",
    "role": "EMPLOYEE"
  }
  ```
- **Expected Output**:
  ```json
  {
    "message": "Đã có nhân viên dùng email này",
    "success": false,
    "field": "email"
  }
  ```
- **Status Code**: 400 Bad Request

- **Actual Output**:
  ```json
  {
    "message": "Đã có nhân viên dùng email này",
    "success": false,
    "field": "email"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 20: Email Already Exists for Admin
- **Test Case ID**: TC_REGISTER_020
- **Description**: Verify that registration fails when the email is already associated with an admin account.
- **Preconditions**:
  - Username `new_admin` does not exist in the `accounts` table.
  - Email `admin1@example.com` is already associated with an admin account in the `AdminProfile` table.
- **Input**:
  ```json
  {
    "username": "new_admin",
    "password": "P@ssw0rd!",
    "fullName": "New Admin",
    "email": "admin1@example.com",
    "phoneNumber": "+84123456789",
    "role": "ADMIN"
  }
  ```
- **Expected Output**:
  ```json
  {
    "message": "Đã có admin dùng email này",
    "success": false,
    "field": "email"
  }
  ```
- **Status Code**: 400 Bad Request

- **Actual Output**:
  ```json
  {
    "message": "Đã có admin dùng email này",
    "success": false,
    "field": "email"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 21: Database Connection Failure
- **Test Case ID**: TC_REGISTER_021
- **Description**: Verify proper error handling when database operations fail during registration.
- **Preconditions**:
  - Username `db_fail_user` does not exist in the `accounts` table.
  - Database connection fails or throws exceptions during save operations.
- **Input**:
  ```json
  {
    "username": "db_fail_user",
    "password": "P@ssw0rd!",
    "fullName": "DB Fail User",
    "email": "dbfail@example.com",
    "phoneNumber": "+84123456789",
    "role": "CUSTOMER"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Registration failed"
  }
  ```
- **Status Code**: 500 Internal Server Error

---

### Test Case 22: Cross-Role Email Validation
- **Test Case ID**: TC_REGISTER_022
- **Description**: Verify that email uniqueness is checked only within the same role (email can exist for different roles).
- **Preconditions**:
  - Username `cross_role_user` does not exist in the `accounts` table.
  - Email `john.doe@example.com` exists for a CUSTOMER account but not for EMPLOYEE.
- **Input**:
  ```json
  {
    "username": "cross_role_user",
    "password": "P@ssw0rd!",
    "fullName": "Cross Role User",
    "email": "john.doe@example.com",
    "phoneNumber": "+84123456789",
    "role": "EMPLOYEE"
  }
  ```
- **Expected Output**:
  ```json
  {
    "message": "Đăng ký thành công",
    "success": true,
    "data": {
        "username": "cross_role_user",
        "email": "john.doe@example.com",
        "role": "EMPLOYEE"
    }
  }
  ```
- **Status Code**: 201 Created

- **Actual Output**:
  ```json
  {
    "message": "Đăng ký thành công",
    "success": true,
    "data": {
        "username": "cross_role_user",
        "email": "john.doe@example.com",
        "role": "EMPLOYEE"
    }
  }
  ```
- **Status Code**: 201 Created

---

### Test Case 23: Phone Number Format Validation
- **Test Case ID**: TC_REGISTER_023
- **Description**: Verify various valid phone number formats are accepted.
- **Preconditions**:
  - Username `phone_valid_test` does not exist in the `accounts` table.
- **Test Steps**:
  1. Test with international format: +84123456789
  2. Test with domestic format: 0123456789
  3. Test with longer international: +1234567890123
- **Input (Example with valid format)**:
  ```json
  {
    "username": "phone_valid_test",
    "password": "P@ssw0rd!",
    "fullName": "Phone Valid Test",
    "email": "phonevalid@example.com",
    "phoneNumber": "0123456789",
    "role": "CUSTOMER"
  }
  ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Đăng ký thành công",
    "data": {
      "username": "phone_valid_test",
      "email": "phonevalid@example.com",
      "role": "CUSTOMER"
    }
  }
  ```
- **Status Code**: 201 Created

- **Actual Output**:
  ```json
  {
    "success": true,
    "message": "Đăng ký thành công",
    "data": {
      "username": "phone_valid_test",
      "email": "phonevalid@example.com",
      "role": "CUSTOMER"
    }
  }
  ```
- **Status Code**: 201 Created

---

### Test Case 24: Username with Special Characters
- **Test Case ID**: TC_REGISTER_024
- **Description**: Verify that usernames with valid special characters (alphanumeric and underscore) are accepted.
- **Preconditions**:
  - Username `user_with_underscore123` does not exist in the `accounts` table.
- **Input**:
  ```json
  {
    "username": "user_with_underscore123",
    "password": "P@ssw0rd!",
    "fullName": "User With Underscore",
    "email": "underscore@example.com",
    "phoneNumber": "+84123456777",
    "role": "CUSTOMER"
  }
  ```
- **Expected Output**:
  ```json
  {
    "message": "Đăng ký thành công",
    "success": true,
    "data": {
        "username": "user_with_underscore123",
        "email": "underscore@example.com",
        "role": "CUSTOMER"
    }
  }
  ```
- **Status Code**: 201 Created

- **Actual Output**:
  ```json
  {
    "message": "Đăng ký thành công",
    "success": true,
    "data": {
        "username": "user_with_underscore123",
        "email": "underscore@example.com",
        "role": "CUSTOMER"
    }
  }
  ```
- **Status Code**: 201 Created

---

### Test Case 25: Invalid Username Characters
- **Test Case ID**: TC_REGISTER_025
- **Description**: Verify that usernames with invalid special characters are rejected.
- **Preconditions**:
  - None.
- **Input**:
  ```json
  {
    "username": "user@invalid",
    "password": "P@ssw0rd!",
    "fullName": "User Invalid",
    "email": "invalid@example.com",
    "phoneNumber": "+84123456666",
    "role": "CUSTOMER"
  }
  ```
- **Expected Output**:
  ```json
  {
    "message": "Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới",
    "success": false,
    "field": "username"
  }
  ```
- **Status Code**: 400 Bad Request

- **Actual Output**:
  ```json
  {
    "message": "Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới",
    "success": false,
    "field": "username"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 26: Full Name with Invalid Characters
- **Test Case ID**: TC_REGISTER_026
- **Description**: Verify that full names with invalid characters (numbers, special chars) are rejected.
- **Preconditions**:
  - None.
- **Input**:
  ```json
  {
    "username": "testuser",
    "password": "P@ssw0rd!",
    "fullName": "John123 Doe@",
    "email": "test@example.com",
    "phoneNumber": "+84122222222",
    "role": "CUSTOMER"
  }
  ```
- **Expected Output**:
  ```json
  {
    "message": "Họ và tên chỉ được chứa chữ cái và khoảng trắng",
    "success": false,
    "field": "fullName"
  }
  ```
- **Status Code**: 400 Bad Request

- **Actual Output**:
  ```json
  {
    "message": "Họ và tên chỉ được chứa chữ cái và khoảng trắng",
    "success": false,
    "field": "fullName"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 27: Password Too Long
- **Test Case ID**: TC_REGISTER_027
- **Description**: Verify that registration fails when password exceeds 100 characters.
- **Preconditions**:
  - None.
- **Input**:
  ```json
  {
    "username": "testuser",
    "password": "ThisIsAVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryVeryLongPasswordThatExceedsOneHundredCharactersLimitSetByTheSystemValidationRulesAndShouldBeRejected",
    "fullName": "Test User",
    "email": "testabc@example.com",
    "phoneNumber": "+84123333333",
    "role": "CUSTOMER"
  }
  ```
- **Expected Output**:
  ```json
  {
    "message": "Mật khẩu không được vượt quá 100 ký tự",
    "success": false,
    "field": "password"
  }
  ```
- **Status Code**: 400 Bad Request

- **Actual Output**:
  ```json
  {
    "message": "Mật khẩu không được vượt quá 100 ký tự",
    "success": false,
    "field": "password"
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 28: Email Too Long
- **Test Case ID**: TC_REGISTER_028
- **Description**: Verify that registration fails when email exceeds 255 characters.
- **Preconditions**:
  - None.
- **Input**:
  ```json
  {
    "username": "testuser",
    "password": "P@ssw0rd!",
    "fullName": "Test User",
    "email": "this_is_a_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_very_long_email_address@example.com",
    "phoneNumber": "+84123456789",
    "role": "CUSTOMER"
  }
  ```
- **Expected Output**:
  ```json
  {
    "message": "Đã xảy ra lỗi khi đăng ký tài khoản",
    "success": false
  }
  ```
- **Status Code**: 500 Bad Request

- **Actual Output**:
  ```json
  {
    "message": "Đã xảy ra lỗi khi đăng ký tài khoản",
    "success": false
  }
  ```
- **Status Code**: 500 Bad Request - DB can store max size (255) of email field

## Notes
- **Test Environment**: Ensure the database is properly configured with test data before running tests.
- **Validation**: The registration endpoint uses Jakarta Bean Validation with custom business logic validation in AuthServiceImpl.
- **Success Messages**: All successful registrations return Vietnamese message "Đăng ký thành công".
- **Error Handling**: Field-specific validation errors are returned with the problematic field name.
- **Profile Creation**: Each role creates a corresponding profile record (Customer, Employee, or AdminProfile).
- **Email Uniqueness**: Email uniqueness is enforced per role, allowing the same email for different roles.
- **Security**: Passwords are encoded before storage, and accounts are created with ACTIVE status.