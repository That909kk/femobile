# API Test Cases - Permission Management

## Overview
This document describes the test cases for the **Permission Management** endpoints of the Admin API.  
The endpoints allow administrators to manage roles and permissions for users in the system.  
**Base URL**: `/api/v1/admin/permissions`

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
- **Authorization Header**: `Bearer <valid_admin_token>`
- **Content-Type**: `application/json` (for POST/PUT requests)
- **Role**: Only ADMIN role can access these endpoints (enforced by SecurityConfig)

---

## Database Test Data
Based on housekeeping_service_v5.sql:
- **Roles**: CUSTOMER (roleId=1), EMPLOYEE (roleId=2), ADMIN (roleId=3)
- **Features**: Organized by modules (Booking, Account, Service, Review, Admin)
- **Sample Customer Features**: 
  - Feature ID 1: "booking.create" (Module: Booking)
  - Feature ID 5: "profile.customer.edit" (Module: Account)
- **Sample Employee Features**:
  - Feature ID 7: "booking.view.available" (Module: Booking)
  - Feature ID 8: "booking.accept" (Module: Booking)
  - Feature ID 10: "profile.employee.edit" (Module: Account)

---

## GET /roles - Get All Manageable Roles

### Test Case 1: Successfully Get All Manageable Roles
- **Test Case ID**: TC_PERMISSION_001
- **Description**: Verify that an admin can retrieve all manageable roles (non-admin roles).
- **Preconditions**:
  - Admin is authenticated with valid token.
  - Database contains CUSTOMER and EMPLOYEE roles.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/admin/permissions/roles`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Lấy danh sách vai trò thành công",
    "data": [
      {
        "roleId": 1,
        "roleName": "CUSTOMER"
      },
      {
        "roleId": 2,
        "roleName": "EMPLOYEE"
      }
    ]
  }
  ```
- **Status Code**: `200 OK`

- **Actual Output**:
  ```json
  {
    "success": true,
    "message": "Lấy danh sách vai trò thành công",
    "data": [
      {
        "roleId": 1,
        "roleName": "CUSTOMER"
      },
      {
        "roleId": 2,
        "roleName": "EMPLOYEE"
      }
    ]
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 2: Security Test - Non-Admin Access Denied
- **Test Case ID**: TC_PERMISSION_002
- **Description**: Verify that non-admin users cannot access permission management endpoints (SecurityConfig test).
- **Preconditions**: 
  - User has valid token but with CUSTOMER role
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/admin/permissions/roles`
  - **Headers**: 
    ```
    Authorization: Bearer <customer_token>
    ```
- **Expected Output**:
  ```json
  {
    "timestamp": "2025-08-24T10:30:00.000+00:00",
    "status": 403,
    "error": "Forbidden",
    "path": "/api/v1/admin/permissions/roles"
  }
  ```
- **Status Code**: `403 Forbidden`

- **Actual Output**:
  ```json
  {
    "timestamp": "2025-08-24T10:30:00.000+00:00",
    "status": 403,
    "error": "Forbidden",
    "path": "/api/v1/admin/permissions/roles"
  }
  ```
- **Status Code**: `403 Forbidden`

---

## GET /roles/{roleId} - Get Role Permissions

### Test Case 3: Successfully Get Customer Role Permissions
- **Test Case ID**: TC_PERMISSION_003
- **Description**: Verify that admin can retrieve permissions for CUSTOMER role.
- **Preconditions**:
  - Admin is authenticated with valid token.
  - Role with ID 1 (CUSTOMER) exists in database.
  - Features and permissions are configured for the role.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/admin/permissions/roles/1`
  - **Path Parameter**: `roleId = 1`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Lấy quyền vai trò thành công",
    "data": [
      {
        "roleId": 1,
        "roleName": "CUSTOMER",
        "modules": [
          {
            "moduleName": "Account",
            "features": [
              {
                "featureId": 5,
                "featureName": "profile.customer.edit",
                "description": "Chỉnh sửa hồ sơ cá nhân",
                "isEnabled": true
              }
            ]
          },
          {
            "moduleName": "Booking",
            "features": [
              {
                "featureId": 1,
                "featureName": "booking.create",
                "description": "Tạo một lịch đặt mới",
                "isEnabled": true
              },
              {
                "featureId": 2,
                "featureName": "booking.view.history",
                "description": "Xem lịch sử đặt lịch của bản thân",
                "isEnabled": true
              },
              {
                "featureId": 3,
                "featureName": "booking.cancel",
                "description": "Hủy một lịch đặt",
                "isEnabled": true
              }
            ]
          },
          {
            "moduleName": "Review",
            "features": [
              {
                "featureId": 4,
                "featureName": "review.create",
                "description": "Viết đánh giá cho nhân viên",
                "isEnabled": true
              }
            ]
          },
          {
            "moduleName": "Service",
            "features": [
              {
                "featureId": 6,
                "featureName": "service.view",
                "description": "Xem danh sách và chi tiết dịch vụ",
                "isEnabled": true
              }
            ]
          }
        ]
      }
    ]
  }
  ```
- **Status Code**: `200 OK`

- **Actual Output**:
  ```json
  {
    "success": true,
    "message": "Lấy quyền vai trò thành công",
    "data": [
      {
        "roleId": 1,
        "roleName": "CUSTOMER",
        "modules": [
          {
            "moduleName": "Account", 
            "features": [
              {
                "featureId": 5,
                "featureName": "profile.customer.edit",
                "description": "Chỉnh sửa hồ sơ cá nhân",
                "isEnabled": true
              }
            ]
          }
        ]
      }
    ]
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 4: Get Permissions for Non-Existent Role
- **Test Case ID**: TC_PERMISSION_004
- **Description**: Verify that request fails when roleId does not exist.
- **Preconditions**:
  - Admin is authenticated with valid token.
  - Role with ID 999 does not exist in database.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/admin/permissions/roles/999`
  - **Path Parameter**: `roleId = 999`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Vai trò không tồn tại",
    "data": []
  }
  ```
- **Status Code**: `200 OK`

- **Actual Output**:
  ```json
  {
    "success": false,
    "message": "Vai trò không tồn tại",
    "data": []
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 4.1: Successfully Get Employee Role Permissions
- **Test Case ID**: TC_PERMISSION_004_1
- **Description**: Verify that admin can retrieve permissions for EMPLOYEE role.
- **Preconditions**:
  - Admin is authenticated with valid token.
  - Role with ID 2 (EMPLOYEE) exists in database.
  - Features and permissions are configured for the employee role.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/admin/permissions/roles/2`
  - **Path Parameter**: `roleId = 2`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Lấy quyền vai trò thành công",
    "data": [
      {
        "roleId": 2,
        "roleName": "EMPLOYEE",
        "modules": [
          {
            "moduleName": "Account",
            "features": [
              {
                "featureId": 10,
                "featureName": "profile.employee.edit",
                "description": "Chỉnh sửa hồ sơ nhân viên",
                "isEnabled": true
              }
            ]
          },
          {
            "moduleName": "Booking",
            "features": [
              {
                "featureId": 7,
                "featureName": "booking.view.available",
                "description": "Xem các lịch đặt mới có sẵn",
                "isEnabled": true
              },
              {
                "featureId": 8,
                "featureName": "booking.accept",
                "description": "Chấp nhận một lịch đặt",
                "isEnabled": true
              },
              {
                "featureId": 9,
                "featureName": "booking.view.assigned",
                "description": "Xem các lịch đã nhận",
                "isEnabled": true
              }
            ]
          }
        ]
      }
    ]
  }
  ```
- **Status Code**: `200 OK`

- **Actual Output**:
  ```json
  {
    "success": true,
    "message": "Lấy quyền vai trò thành công",
    "data": [
      {
        "roleId": 2,
        "roleName": "EMPLOYEE",
        "modules": [
          {
            "moduleName": "Account",
            "features": [
              {
                "featureId": 10,
                "featureName": "profile.employee.edit",
                "description": "Chỉnh sửa hồ sơ nhân viên",
                "isEnabled": true
              }
            ]
          },
          {
            "moduleName": "Booking",
            "features": [
              {
                "featureId": 7,
                "featureName": "booking.view.available",
                "description": "Xem các lịch đặt mới có sẵn",
                "isEnabled": true
              }
            ]
          }
        ]
      }
    ]
  }
  ```
- **Status Code**: `200 OK`

---

## PUT /roles/{roleId}/features/{featureId} - Update Role Permission

### Test Case 5: Successfully Enable Customer Booking Permission
- **Test Case ID**: TC_PERMISSION_005
- **Description**: Verify that admin can enable/disable booking.create permission for CUSTOMER role.
- **Preconditions**:
  - Admin is authenticated with valid token.
  - Role with ID 1 (CUSTOMER) exists in database.
  - Feature with ID 1 (booking.create) exists in database.
- **Input**:
  - **Method**: `PUT`
  - **URL**: `/api/v1/admin/permissions/roles/1/features/1`
  - **Path Parameters**: `roleId = 1`, `featureId = 1`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "isEnabled": true
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Lấy quyền vai trò thành công",
    "data": [
      {
        "roleId": 1,
        "roleName": "CUSTOMER",
        "modules": [
          {
            "moduleName": "Booking",
            "features": [
              {
                "featureId": 1,
                "featureName": "booking.create",
                "description": "Tạo một lịch đặt mới",
                "isEnabled": true
              }
            ]
          }
        ]
      }
    ]
  }
  ```
- **Status Code**: `200 OK`

- **Actual Output**:
  ```json
  {
    "success": true,
    "message": "Lấy quyền vai trò thành công",
    "data": [
      {
        "roleId": 1,
        "roleName": "CUSTOMER",
        "modules": [
          {
            "moduleName": "Booking",
            "features": [
              {
                "featureId": 1,
                "featureName": "booking.create",
                "description": "Tạo một lịch đặt mới",
                "isEnabled": true
              }
            ]
          }
        ]
      }
    ]
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 5.1: Successfully Enable Employee Booking Permission
- **Test Case ID**: TC_PERMISSION_005_1
- **Description**: Verify that admin can enable/disable booking.accept permission for EMPLOYEE role.
- **Preconditions**:
  - Admin is authenticated with valid token.
  - Role with ID 2 (EMPLOYEE) exists in database.
  - Feature with ID 8 (booking.accept) exists in database.
- **Input**:
  - **Method**: `PUT`
  - **URL**: `/api/v1/admin/permissions/roles/2/features/8`
  - **Path Parameters**: `roleId = 2`, `featureId = 8`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "isEnabled": false
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Lấy quyền vai trò thành công",
    "data": [
      {
        "roleId": 2,
        "roleName": "EMPLOYEE",
        "modules": [
          {
            "moduleName": "Booking",
            "features": [
              {
                "featureId": 8,
                "featureName": "booking.accept",
                "description": "Chấp nhận một lịch đặt",
                "isEnabled": false
              }
            ]
          }
        ]
      }
    ]
  }
  ```
- **Status Code**: `200 OK`

- **Actual Output**:
  ```json
  {
    "success": true,
    "message": "Lấy quyền vai trò thành công",
    "data": [
      {
        "roleId": 2,
        "roleName": "EMPLOYEE",
        "modules": [
          {
            "moduleName": "Booking",
            "features": [
              {
                "featureId": 8,
                "featureName": "booking.accept",
                "description": "Chấp nhận một lịch đặt",
                "isEnabled": false
              }
            ]
          }
        ]
      }
    ]
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 6: Invalid Token Test
- **Test Case ID**: TC_PERMISSION_006
- **Description**: Verify that request fails when Authorization header is missing or invalid.
- **Preconditions**: None
- **Input**: 
  - **Method**: `PUT`
  - **URL**: `/api/v1/admin/permissions/roles/1/features/1`
  - **Headers**: 
    ```
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "isEnabled": true
    }
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

- **Actual Output**:
  ```json
  {
    "success": false,
    "message": "Token không hợp lệ",
    "data": null
  }
  ```
- **Status Code**: `400 Bad Request`

---

## Notes
- **Test Environment**: Database should be configured with test data including roles and features from housekeeping_service_v5.sql.
- **Authentication**: All endpoints require valid admin JWT tokens (enforced by SecurityConfig).
- **Authorization**: Only ADMIN role users can access these endpoints.
- **Transaction Management**: Update operations are wrapped in database transactions.
- **Error Handling**: Service layer catches exceptions and returns appropriate error responses.
- **Security**: JWT tokens are validated for format, expiration, and role authorization.
- **Data Structure**: Features are organized by modules (Account, Booking, Service, Review, Admin) as defined in the database schema.