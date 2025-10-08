# API Test Cases - Customer Management

## Overview
This document outlines minimal test cases for the **Customer** endpoints. The endpoints allow authorized clients to view, update, and deactivate customer accounts.
**Base URL**: `/api/v1/customer`

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

## GET /api/v1/customer/active - Retrieve Active Customers

### Test Case 1: Successfully Retrieve Active Customers
- **Test Case ID**: TC_CUSTOMER_001
- **Description**: Verify that an authorized request returns all active customers.
- **Preconditions**:
    - Client is authenticated with a valid token.
    - Client has permission to view customers.
- **Input**:
    - **Method**: `GET`
    - **URL**: `/api/v1/customer/active`
    - **Headers**:
      ```
      Authorization: Bearer <valid_token>
      ```
- **Expected Output**:
  ```json
  [
    {
      "customerId": "c1000001-0000-0000-0000-000000000001",
      "fullName": "John Doe",
      "email": "john.doe@example.com"
    },
    {
      "customerId": "c1000001-0000-0000-0000-000000000002",
      "fullName": "Mary Jones",
      "email": "mary.jones@example.com"
    }
  ]
  ```
- **Status Code**: `200 OK`

### Test Case 2: Unauthorized Access
- **Test Case ID**: TC_CUSTOMER_002
- **Description**: Verify that the request fails without authentication.
- **Preconditions**: None.
- **Input**:
    - **Method**: `GET`
    - **URL**: `/api/v1/customer/active`
    - No Authorization header.
- **Expected Output**: Error message indicating authentication required.
- **Status Code**: `401 Unauthorized`

---

## PUT /api/v1/customer/{customerId} - Update Customer

The request body includes:
- `avatar`
- `fullName`
- `isMale`
- `email`
- `birthdate`

### Test Case 3: Successfully Update Customer
- **Test Case ID**: TC_CUSTOMER_003
- **Description**: Verify that an authorized client can update an existing customer.
- **Preconditions**:
    - Client is authenticated with a valid token.
    - Client has permission to modify customers.
    - Customer with the specified ID exists.
- **Input**:
    - **Method**: `PUT`
    - **URL**: `/api/v1/customer/c1000001-0000-0000-0000-000000000001`
    - **Headers**:
      ```
      Authorization: Bearer <valid_token>
      Content-Type: application/json
      ```
    - **Body**:
      ```json
      {
        "avatar": "https://example.com/avatar.jpg",
        "fullName": "John A. Doe",
        "isMale": true,
        "email": "john.doe@example.com",
        "birthdate": "2003-09-10"
      }
      ```
- **Expected Output**:
  ```json
  {
    "customerId": "c1000001-0000-0000-0000-000000000001",
    "avatar": "https://example.com/avatar.jpg",
    "fullName": "John A. Doe",
    "isMale": true,
    "email": "john.doe@example.com",
    "birthdate": "2003-09-10"
  }
  ```
- **Status Code**: `200 OK`

### Test Case 4: Validation Failure
- **Test Case ID**: TC_CUSTOMER_004
- **Description**: Verify that invalid data is rejected.
- **Preconditions**:
    - Client is authenticated with a valid token.
    - Client has permission to modify customers.
    - Customer with the specified ID exists.
- **Input**:
    - **Method**: `PUT`
    - **URL**: `/api/v1/customer/c1000001-0000-0000-0000-000000000001`
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
        "isMale": true,
        "email": "invalid-email",
        "birthdate": "2003-09-10"
      }
      ```
- **Expected Output**: Error message indicating validation failure for `fullName` and `email`.
- **Status Code**: `400 Bad Request`

### Test Case 5: Forbidden Access
- **Test Case ID**: TC_CUSTOMER_005
- **Description**: Verify that a user without sufficient permissions cannot update a customer.
- **Preconditions**:
    - Client is authenticated with a valid token.
    - Client lacks permission to modify customers.
    - Customer with the specified ID exists.
- **Input**:
    - **Method**: `PUT`
    - **URL**: `/api/v1/customer/c1000001-0000-0000-0000-000000000001`
    - **Headers**:
      ```
      Authorization: Bearer <token_without_permission>
      Content-Type: application/json
      ```
    - **Body**:
      ```json
      {
        "avatar": "https://example.com/avatar.jpg",
        "fullName": "John A. Doe",
        "isMale": true,
        "email": "john.doe@example.com",
        "birthdate": "2003-09-10"
      }
      ```
- **Expected Output**: Error message indicating insufficient permissions.
- **Status Code**: `403 Forbidden`

---

## POST /api/v1/customer/{customerId}/avatar - Upload Customer Avatar

### Test Case 6: Successfully Upload Customer Avatar
- **Test Case ID**: TC_CUSTOMER_006
- **Description**: Verify that an authorized customer can upload their avatar image.
- **Preconditions**:
    - Customer is authenticated with a valid token.
    - Customer has permission to update their own profile.
    - Customer with the specified ID exists.
    - Valid image file is provided (JPG, PNG, etc.).
- **Input**:
    - **Method**: `POST`
    - **URL**: `/api/v1/customer/c1000001-0000-0000-0000-000000000001/avatar`
    - **Headers**:
      ```
      Authorization: Bearer <valid_customer_token>
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
        "customer": {
            "customerId": "c1000001-0000-0000-0000-000000000001",
            "account": {
                "accountId": "a1000001-0000-0000-0000-000000000001",
                "username": "john_doe",
                "password": "$2a$12$dRX/zeerYun4LF16PRZuzuaaQDv673McBavp3xEciXKezLjSzyyiK",
                "phoneNumber": "0901234567",
                "status": "ACTIVE",
                "isPhoneVerified": true,
                "createdAt": "2025-09-26T19:08:01.001699",
                "updatedAt": "2025-09-27T19:33:27.799901",
                "lastLogin": "2025-09-27T19:33:27.798829",
                "roles": [
                    {
                        "roleId": 1,
                        "roleName": "CUSTOMER"
                    }
                ]
            },
            "avatar": "https://res.cloudinary.com/dhhntolb5/image/upload/v1758976440/customer_avatars/xbqzb8jwu8lu1inm8k1j.jpg",
            "fullName": "John Doe",
            "isMale": true,
            "email": "john.doe@example.com",
            "birthdate": "2003-09-10",
            "rating": null,
            "vipLevel": null,
            "createdAt": "2025-09-26T19:08:01.035142",
            "updatedAt": "2025-09-27T19:34:01.588288682"
        },
        "avatarPublicId": "customer_avatars/xbqzb8jwu8lu1inm8k1j"
    },
    "success": true
  }
  ```
- **Status Code**: `200 OK`

### Test Case 7: Upload Avatar - Access Denied
- **Test Case ID**: TC_CUSTOMER_007
- **Description**: Verify that a customer cannot upload avatar for another customer's account.
- **Preconditions**:
    - Customer is authenticated with a valid token.
    - Customer tries to upload avatar for a different customer ID.
- **Input**:
    - **Method**: `POST`
    - **URL**: `/api/v1/customer/c1000001-0000-0000-0000-000000000002/avatar`
    - **Headers**:
      ```
      Authorization: Bearer <valid_customer_token_for_different_user>
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

### Test Case 8: Upload Avatar - Invalid File Format
- **Test Case ID**: TC_CUSTOMER_008
- **Description**: Verify that invalid file formats are rejected when uploading avatar.
- **Preconditions**:
    - Customer is authenticated with a valid token.
    - Customer provides an invalid file format (e.g., .txt, .pdf).
- **Input**:
    - **Method**: `POST`
    - **URL**: `/api/v1/customer/c1000001-0000-0000-0000-000000000001/avatar`
    - **Headers**:
      ```
      Authorization: Bearer <valid_customer_token>
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

### Test Case 9: Upload Avatar - File Too Large
- **Test Case ID**: TC_CUSTOMER_009
- **Description**: Verify that files exceeding the maximum size limit are rejected.
- **Preconditions**:
    - Customer is authenticated with a valid token.
    - Customer provides an image file larger than the allowed limit (e.g., > 5MB).
- **Input**:
    - **Method**: `POST`
    - **URL**: `/api/v1/customer/c1000001-0000-0000-0000-000000000001/avatar`
    - **Headers**:
      ```
      Authorization: Bearer <valid_customer_token>
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

### Test Case 10: Upload Avatar - Missing File
- **Test Case ID**: TC_CUSTOMER_010
- **Description**: Verify that request fails when no file is provided.
- **Preconditions**:
    - Customer is authenticated with a valid token.
    - No file is included in the request.
- **Input**:
    - **Method**: `POST`
    - **URL**: `/api/v1/customer/c1000001-0000-0000-0000-000000000001/avatar`
    - **Headers**:
      ```
      Authorization: Bearer <valid_customer_token>
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

---

## PUT /api/v1/customer/{customerId}/deactivate - Deactivate Customer

### Test Case 11: Successfully Deactivate Customer
- **Test Case ID**: TC_CUSTOMER_011
- **Description**: Verify that an authorized client can deactivate a customer.
- **Preconditions**:
    - Client is authenticated with a valid token.
    - Client has permission to modify customers.
    - Customer with the specified ID exists.
- **Input**:
    - **Method**: `PUT`
    - **URL**: `/api/v1/customer/c1000001-0000-0000-0000-000000000001/deactivate`
    - **Headers**:
      ```
      Authorization: Bearer <valid_token>
      ```
- **Expected Output**:
  ```json
  {
    "customerId": "c1000001-0000-0000-0000-000000000001",
    "status": "INACTIVE"
  }
  ```
- **Status Code**: `200 OK`

### Test Case 12: Forbidden Access
- **Test Case ID**: TC_CUSTOMER_012
- **Description**: Verify that a user without sufficient permissions cannot deactivate a customer.
- **Preconditions**:
    - Client is authenticated with a valid token.
    - Client lacks permission to modify customers.
    - Customer with the specified ID exists.
- **Input**:
    - **Method**: `PUT`
    - **URL**: `/api/v1/customer/c1000001-0000-0000-0000-000000000001/deactivate`
    - **Headers**:
      ```
      Authorization: Bearer <token_without_permission>
      ```
- **Expected Output**: Error message indicating insufficient permissions.
- **Status Code**: `403 Forbidden`

---

## Notes
- These test cases are minimal and can be expanded with additional scenarios.
- Ensure the test environment includes representative customer data from `housekeeping_service_v8.sql`.