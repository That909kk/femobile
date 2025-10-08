# API Test Cases - User Permission Management (Minimum Essential)

## Overview
This document describes the minimum essential test cases for the **User Permission** endpoints that retrieve user features and permissions using the new getFeatures structure.  
**Base URLs**: 
- Customer: `/api/v1/customer/{customerId}/features`
- Employee: `/api/v1/employee/{employeeId}/features`

---

## Test Data Setup

### Database Test Data
The following test data should be available in the database from `housekeeping_service_v7.sql`:

**Accounts:**
- john_doe (Customer, ID: c1000001-0000-0000-0000-000000000001)
- jane_smith (Customer + Employee, ID: c1000001-0000-0000-0000-000000000003, e1000001-0000-0000-0000-000000000001)
- admin_1 (Admin)

**Roles:**
- CUSTOMER (ID: 1)
- EMPLOYEE (ID: 2)
- ADMIN (ID: 3)

**Sample Features:**
- booking.create (ID: 1) - Tạo một lịch đặt mới
- booking.view.history (ID: 2) - Xem lịch sử đặt lịch của bản thân
- booking.cancel (ID: 3) - Hủy một lịch đặt
- review.create (ID: 4) - Viết đánh giá cho nhân viên
- profile.customer.edit (ID: 5) - Chỉnh sửa hồ sơ cá nhân
- service.view (ID: 6) - Xem danh sách và chi tiết dịch vụ
- booking.view.available (ID: 7) - Xem các lịch đặt mới có sẵn
- booking.accept (ID: 8) - Chấp nhận một lịch đặt
- booking.view.assigned (ID: 9) - Xem các lịch đã nhận
- profile.employee.edit (ID: 10) - Chỉnh sửa hồ sơ nhân viên

---

## Essential Test Cases

### Test Case 1: Successfully Get Customer Own Permissions
- **Test Case ID**: TC_USER_PERMISSION_001
- **Description**: Verify that a customer can retrieve their own permissions and features.
- **Preconditions**: Customer is authenticated with valid token.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/c1000001-0000-0000-0000-000000000001/features`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_john_doe>
    ```
- **Expected Output**:
  ```json
  {
    "data": {
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
    },
    "success": true
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 2: Customer Not Found
- **Test Case ID**: TC_USER_PERMISSION_002
- **Description**: Verify error handling when customer ID does not exist.
- **Preconditions**: User is authenticated with valid token.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/999/features`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Khách hàng không tồn tại"
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 3: Invalid Token
- **Test Case ID**: TC_USER_PERMISSION_003
- **Description**: Verify that request fails when Authorization header is missing or invalid.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/c1000001-0000-0000-0000-000000000001/features`
  - **Headers**: 
    ```
    Authorization: Bearer invalid_token
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

---

### Test Case 4: Successfully Get Employee Own Permissions
- **Test Case ID**: TC_USER_PERMISSION_004
- **Description**: Verify that an employee can retrieve their own permissions and features.
- **Preconditions**: Employee is authenticated with valid token.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/employee/e1000001-0000-0000-0000-000000000001/features`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_employee_token_jane_smith>
    ```
- **Expected Output**:
  ```json
  {
    "data": {
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
    },
    "success": true
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 5: Employee Not Found
- **Test Case ID**: TC_USER_PERMISSION_005
- **Description**: Verify error handling when employee ID does not exist.
- **Preconditions**: User is authenticated with valid token.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/employee/999/features`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_employee_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Nhân viên không tồn tại"
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 6: Unauthorized Access
- **Test Case ID**: TC_USER_PERMISSION_006
- **Description**: Verify that customer role cannot access employee permission endpoints.
- **Preconditions**: Customer is authenticated with valid token.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/employee/e1000001-0000-0000-0000-000000000001/features`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    ```
- **Expected Output**:
  ```json
  {
    "timestamp": "2025-01-15T10:30:00.000+00:00",
    "status": 403,
    "error": "Forbidden",
    "path": "/api/v1/employee/e1000001-0000-0000-0000-000000000001/features"
  }
  ```
- **Status Code**: `403 Forbidden`

---

### Test Case 7: Missing Authorization Header
- **Test Case ID**: TC_USER_PERMISSION_007
- **Description**: Verify that request fails when Authorization header is completely missing.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/c1000001-0000-0000-0000-000000000001/features`
  - **Headers**: None
- **Expected Output**:
  ```json
  {
    "timestamp": "2025-01-15T10:30:00.000+00:00",
    "status": 401,
    "error": "Unauthorized",
    "path": "/api/v1/customer/c1000001-0000-0000-0000-000000000001/features"
  }
  ```
- **Status Code**: `401 Unauthorized`

---

### Test Case 8: Multi-Role User Access (Jane Smith)
- **Test Case ID**: TC_USER_PERMISSION_008
- **Description**: Verify permissions for user with multiple roles (CUSTOMER + EMPLOYEE).
- **Preconditions**: Jane Smith is authenticated with valid token and has both CUSTOMER and EMPLOYEE roles.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/c1000001-0000-0000-0000-000000000003/features`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_jane_smith_token>
    ```
- **Expected Output**:
  ```json
  {
    "data": {
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
                            },
                            {
                                "featureId": 7,
                                "featureName": "booking.view.available",
                                "description": "Xem các lịch đặt mới có sẵn",
                                "isEnabled": true
                            }
                        ]
                    }
                ]
            },
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
                                "isEnabled": true
                            }
                        ]
                    }
                ]
            }
        ]
    },
    "success": true
  }
  ```
- **Status Code**: `200 OK`

---

## Notes
- **Test Environment**: Database should be configured with test data from housekeeping_service_v7.sql.
- **Authentication**: All endpoints require valid JWT tokens.
- **Authorization**: 
  - Customer endpoints: ADMIN or CUSTOMER role required
  - Employee endpoints: ADMIN or EMPLOYEE role required
- **Multi-Role Support**: Users with multiple roles receive data for all their roles.
- **Response Format**: Features grouped by modules within roles, with isEnabled flags.
- **Path Parameters**: Customer/Employee IDs must be valid UUIDs matching existing profiles.
- **Error Handling**: Service layer catches exceptions and returns appropriate error responses.
- **New Structure**: This version uses the getFeatures endpoint structure with modules and features grouping.
