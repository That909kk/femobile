# API Test Cases - Employee Management

## Overview
This document outlines minimal test cases for the **Employee** endpoints. The endpoints allow authorized clients to view and modify employee information.
**Base URL**: `/api/v1/employee`

---

## Test Case Structure
Each test case includes:
- **Test Case ID**
- **Description**
- **Preconditions**
- **Input**
- **Expected Output**
- **Status Code**

---

## GET /api/v1/employee/ - Retrieve Employees

### Test Case 1: Successfully Retrieve All Employees
- **Test Case ID**: TC_EMPLOYEE_001
- **Description**: Verify that an authorized request returns the list of employees.
- **Preconditions**:
  - Client is authenticated with a valid token.
  - Client has permission to view employees.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/employee/`
  - **Headers**:
    ```
    Authorization: Bearer <valid_token>
    ```
- **Expected Output**:
  ```json
  [
    {
      "employeeId": "e1000001-0000-0000-0000-000000000001",
      "fullName": "Jane Smith",
      "email": "jane.smith@example.com",
      "skills": ["Cleaning", "Organizing"]
    },
    {
      "employeeId": "e1000001-0000-0000-0000-000000000002",
      "fullName": "Bob Wilson",
      "email": "bob.wilson@examplefieldset.com",
      "skills": ["Deep Cleaning", "Laundry"]
    }
  ]
  ```
- **Status Code**: `200 OK`

### Test Case 2: Unauthorized Access
- **Test Case ID**: TC_EMPLOYEE_002
- **Description**: Verify that the request fails without authentication.
- **Preconditions**: None.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/employee/`
  - No Authorization header.
- **Expected Output**: Error message indicating authentication required.
- **Status Code**: `401 Unauthorized`

---

## PUT /api/v1/employee/{employeeId} - Update Employee

The request body includes all of the following fields:
- `avatar`
- `fullName`
- `isMale`
- `email`
- `birthdate`
- `hiredDate`
- `skills` (array of strings)
- `bio`
- `rating`
- `employeeStatus`

### Test Case 3: Successfully Update Employee
- **Test Case ID**: TC_EMPLOYEE_003
- **Description**: Verify that an authorized client can update an existing employee.
- **Preconditions**:
  - Client is authenticated with a valid token.
  - Client has permission to modify employees.
  - Employee with the specified ID exists.
- **Input**:
  - **Method**: `PUT`
  - **URL**: `/api/v1/employee/e1000001-0000-0000-0000-000000000001`
  - **Headers**:
    ```
    Authorization: Bearer <valid_token>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "avatar": "https://example.com/avatar.jpg",
      "fullName": "Jane A. Smith",
      "isMale": false,
      "email": "jane.smith@example.com",
      "birthdate": "1990-05-20",
      "hiredDate": "2020-03-15",
      "skills": ["Cleaning", "Organizing", "Cooking"],
      "bio": "Senior housekeeper",
      "rating": "AVERAGE",
      "employeeStatus": "AVAILABLE"
    }
    ```
- **Expected Output**:
  ```json
  {
    "employeeId": "e1000001-0000-0000-0000-000000000001",
    "avatar": "https://example.com/avatar.jpg",
    "fullName": "Jane A. Smith",
    "isMale": false,
    "email": "jane.smith@example.com",
    "birthdate": "1990-05-20",
    "hiredDate": "2020-03-15",
    "skills": ["Cleaning", "Organizing", "Cooking"],
    "bio": "Senior housekeeper",
    "rating": "AVERAGE",
    "employeeStatus": "AVAILABLE"
  }
  ```
- **Status Code**: `200 OK`

### Test Case 4: Validation Failure
- **Test Case ID**: TC_EMPLOYEE_004
- **Description**: Verify that invalid data is rejected.
- **Preconditions**:
  - Client is authenticated with a valid token.
  - Client has permission to modify employees.
  - Employee with the specified ID exists.
- **Input**:
  - **Method**: `PUT`
  - **URL**: `/api/v1/employee/e1000001-0000-0000-0000-000000000001`
  - **Headers**:
    ```
    Authorization: Bearer <valid_token>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "avatar": "https://example.com/avatar.jpg",
      "fullName": "",
      "isMale": false,
      "email": "invalid-email",
      "birthdate": "1990-05-20",
      "hiredDate": "2020-03-15",
      "skills": ["Cleaning", "Organizing", "Cooking"],
      "bio": "Senior housekeeper",
      "rating": "AVERAGE",
      "employeeStatus": "AVAILABLE"
    }
    ```
- **Expected Output**: Error message indicating validation failure for `fullName` and `email`.
- **Status Code**: `400 Bad Request`

### Test Case 5: Forbidden Access
- **Test Case ID**: TC_EMPLOYEE_005
- **Description**: Verify that a user without sufficient permissions cannot update an employee.
- **Preconditions**:
  - Client is authenticated with a valid token.
  - Client lacks permission to modify employees.
  - Employee with the specified ID exists.
- **Input**:
  - **Method**: `PUT`
  - **URL**: `/api/v1/employee/e1000001-0000-0000-0000-000000000001`
  - **Headers**:
    ```
    Authorization: Bearer <token_without_permission>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "avatar": "https://example.com/avatar.jpg",
      "fullName": "Jane A. Smith",
      "isMale": false,
      "email": "jane.smith@example.com",
      "birthdate": "1990-05-20",
      "hiredDate": "2020-03-15",
      "skills": ["Cleaning", "Organizing", "Cooking"],
      "bio": "Senior housekeeper",
      "rating": "AVERAGE",
      "employeeStatus": "AVAILABLE"
    }
    ```
- **Expected Output**: Error message indicating insufficient permissions.
- **Status Code**: `403 Forbidden`

---

## POST /api/v1/employee/{employeeId}/avatar - Upload Employee Avatar

### Test Case 6: Successfully Upload Employee Avatar
- **Test Case ID**: TC_EMPLOYEE_006
- **Description**: Verify that an authorized employee can upload their avatar image.
- **Preconditions**:
  - Employee is authenticated with a valid token.
  - Employee has permission to update their own profile.
  - Employee with the specified ID exists.
  - Valid image file is provided (JPG, PNG, etc.).
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/employee/e1000001-0000-0000-0000-000000000001/avatar`
  - **Headers**:
    ```
    Authorization: Bearer <valid_employee_token>
    Content-Type: multipart/form-data
    ```
  - **Form Data**:
    ```
    avatar: [image_file.jpg] (binary data)
    ```
- **Expected Output**:
  ```json
  {
    "data": {
        "employee": {
            "employeeId": "e1000001-0000-0000-0000-000000000001",
            "account": {
                "accountId": "a1000001-0000-0000-0000-000000000002",
                "username": "jane_smith",
                "password": "$2a$12$dRX/zeerYun4LF16PRZuzuaaQDv673McBavp3xEciXKezLjSzyyiK",
                "phoneNumber": "0912345678",
                "status": "ACTIVE",
                "isPhoneVerified": true,
                "createdAt": "2025-09-26T19:08:01.001699",
                "updatedAt": "2025-09-27T20:01:13.285365",
                "lastLogin": "2025-09-27T20:01:13.284007",
                "roles": [
                    {
                        "roleId": 2,
                        "roleName": "EMPLOYEE"
                    },
                    {
                        "roleId": 1,
                        "roleName": "CUSTOMER"
                    }
                ]
            },
            "avatar": "https://res.cloudinary.com/dhhntolb5/image/upload/v1758978104/employee_avatars/bioawzgqfipodf7nb6cj.jpg",
            "fullName": "Jane Smith",
            "isMale": false,
            "email": "jane.smith@example.com",
            "birthdate": "2003-04-14",
            "hiredDate": "2024-01-15",
            "skills": [
                "Cleaning",
                "Organizing"
            ],
            "bio": "Có kinh nghiệm dọn dẹp nhà cửa và sắp xếp đồ đạc.",
            "rating": null,
            "employeeStatus": "AVAILABLE",
            "createdAt": "2025-09-26T19:08:01.053334",
            "updatedAt": "2025-09-27T20:01:43.790769787"
        },
        "avatarPublicId": "employee_avatars/bioawzgqfipodf7nb6cj"
    },
    "success": true
  }
  ```
- **Status Code**: `200 OK`

### Test Case 7: Upload Avatar - Access Denied
- **Test Case ID**: TC_EMPLOYEE_007
- **Description**: Verify that an employee cannot upload avatar for another employee's account.
- **Preconditions**:
  - Employee is authenticated with a valid token.
  - Employee tries to upload avatar for a different employee ID.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/employee/e1000001-0000-0000-0000-000000000002/avatar`
  - **Headers**:
    ```
    Authorization: Bearer <valid_employee_token_for_different_user>
    Content-Type: multipart/form-data
    ```
  - **Form Data**:
    ```
    avatar: [image_file.jpg] (binary data)
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Access denied. You can only update your own data."
  }
  ```
- **Status Code**: `403 Forbidden`

### Test Case 8: Upload Avatar - Admin Access
- **Test Case ID**: TC_EMPLOYEE_008
- **Description**: Verify that an admin can upload avatar for any employee.
- **Preconditions**:
  - Admin is authenticated with a valid token.
  - Admin has ROLE_ADMIN permission.
  - Employee with the specified ID exists.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/employee/e1000001-0000-0000-0000-000000000001/avatar`
  - **Headers**:
    ```
    Authorization: Bearer <valid_admin_token>
    Content-Type: multipart/form-data
    ```
  - **Form Data**:
    ```
    avatar: [image_file.jpg] (binary data)
    ```
- **Expected Output**:
  ```json
  {
    "data": {
        "employee": {
            "employeeId": "e1000001-0000-0000-0000-000000000001",
            "account": {
                "accountId": "a1000001-0000-0000-0000-000000000002",
                "username": "jane_smith",
                "password": "$2a$12$dRX/zeerYun4LF16PRZuzuaaQDv673McBavp3xEciXKezLjSzyyiK",
                "phoneNumber": "0912345678",
                "status": "ACTIVE",
                "isPhoneVerified": true,
                "createdAt": "2025-09-26T19:08:01.001699",
                "updatedAt": "2025-09-27T20:01:13.285365",
                "lastLogin": "2025-09-27T20:01:13.284007",
                "roles": [
                    {
                        "roleId": 2,
                        "roleName": "EMPLOYEE"
                    },
                    {
                        "roleId": 1,
                        "roleName": "CUSTOMER"
                    }
                ]
            },
            "avatar": "https://res.cloudinary.com/dhhntolb5/image/upload/v1758978104/employee_avatars/bioawzgqfipodf7nb6cj.jpg",
            "fullName": "Jane Smith",
            "isMale": false,
            "email": "jane.smith@example.com",
            "birthdate": "2003-04-14",
            "hiredDate": "2024-01-15",
            "skills": [
                "Cleaning",
                "Organizing"
            ],
            "bio": "Có kinh nghiệm dọn dẹp nhà cửa và sắp xếp đồ đạc.",
            "rating": null,
            "employeeStatus": "AVAILABLE",
            "createdAt": "2025-09-26T19:08:01.053334",
            "updatedAt": "2025-09-27T20:01:43.790769787"
        },
        "avatarPublicId": "employee_avatars/bioawzgqfipodf7nb6cj"
    },
    "success": true
  }
  ```
- **Status Code**: `200 OK`

### Test Case 9: Upload Avatar - Invalid File Format
- **Test Case ID**: TC_EMPLOYEE_009
- **Description**: Verify that invalid file formats are rejected when uploading avatar.
- **Preconditions**:
  - Employee is authenticated with a valid token.
  - Employee provides an invalid file format (e.g., .txt, .pdf).
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/employee/e1000001-0000-0000-0000-000000000001/avatar`
  - **Headers**:
    ```
    Authorization: Bearer <valid_employee_token>
    Content-Type: multipart/form-data
    ```
  - **Form Data**:
    ```
    avatar: [document.txt] (text file)
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Invalid file format. Only image files (JPG, PNG, GIF) are allowed."
  }
  ```
- **Status Code**: `400 Bad Request`

### Test Case 10: Upload Avatar - File Too Large
- **Test Case ID**: TC_EMPLOYEE_010
- **Description**: Verify that files exceeding the maximum size limit are rejected.
- **Preconditions**:
  - Employee is authenticated with a valid token.
  - Employee provides an image file larger than the allowed limit (e.g., > 5MB).
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/employee/e1000001-0000-0000-0000-000000000001/avatar`
  - **Headers**:
    ```
    Authorization: Bearer <valid_employee_token>
    Content-Type: multipart/form-data
    ```
  - **Form Data**:
    ```
    avatar: [large_image.jpg] (>5MB file)
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "File size exceeds maximum limit of 5MB."
  }
  ```
- **Status Code**: `400 Bad Request`

### Test Case 11: Upload Avatar - Missing File
- **Test Case ID**: TC_EMPLOYEE_011
- **Description**: Verify that request fails when no file is provided.
- **Preconditions**:
  - Employee is authenticated with a valid token.
  - No file is included in the request.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/employee/e1000001-0000-0000-0000-000000000001/avatar`
  - **Headers**:
    ```
    Authorization: Bearer <valid_employee_token>
    Content-Type: multipart/form-data
    ```
  - **Form Data**: (empty or missing avatar field)
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Avatar file is required."
  }
  ```
- **Status Code**: `400 Bad Request`

### Test Case 12: Upload Avatar - Employee Not Found
- **Test Case ID**: TC_EMPLOYEE_012
- **Description**: Verify that request fails when employee ID doesn't exist.
- **Preconditions**:
  - User is authenticated with a valid token.
  - Employee ID provided doesn't exist in the system.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/employee/non-existent-employee-id/avatar`
  - **Headers**:
    ```
    Authorization: Bearer <valid_token>
    Content-Type: multipart/form-data
    ```
  - **Form Data**:
    ```
    avatar: [image_file.jpg] (binary data)
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Không tìm thấy thông tin nhân viên"
  }
  ```
- **Status Code**: `400 Bad Request`

---

## Notes
- These test cases are high-level and may be expanded with additional fields and scenarios.
- Ensure the test environment contains representative employee data.