# API Test Cases - Review Management

## Overview
This document describes comprehensive test cases for the **Review Management** endpoints using realistic data from the housekeeping service database.  
**Base URL**: `/api/v1/reviews`  
**Test Date Context**: October 1, 2025

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
- **POST /reviews**: CUSTOMER role required
- **Other endpoints**: No authentication required
- **Authorization Header**: `Bearer <valid_token>` (when required)
- **Content-Type**: `application/json`

---

## API Endpoints Covered
1. **POST /** - Create Review
2. **GET /reviews/criteria** - Get Review Criteria
3. **GET /employees/{employeeId}/reviews** - Get Reviews for Employee
4. **GET /employees/{employeeId}/reviews/summary** - Get Employee Review Summary

---

## POST /reviews - Create Review

### Test Case 1: Successful Review Creation
- **Test Case ID**: TC_REVIEW_001
- **Description**: Verify that a customer can successfully create a review for a completed booking
- **Preconditions**:
  - Customer John Doe exists with ID 'c1000001-0000-0000-0000-000000000001'
  - Booking BK000001 exists with COMPLETED status
  - Employee Jane Smith was assigned to this booking
  - No existing review for this booking-employee combination
  - Valid JWT token with CUSTOMER role
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_customer_token>
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "bookingId": "BK000001",
      "employeeId": "e1000001-0000-0000-0000-000000000001",
      "comment": "Jane did an excellent job cleaning our house. Very professional and thorough.",
      "criteriaRatings": [
        {
          "criteriaId": 1,
          "rating": 5.0
        },
        {
          "criteriaId": 2,
          "rating": 4.5
        },
        {
          "criteriaId": 3,
          "rating": 5.0
        }
      ]
    }
    ```
- **Expected Output**:
  ```json
  {
    "reviewId": 1,
    "bookingId": "BK000001",
    "customerId": "c1000001-0000-0000-0000-000000000001",
    "employeeId": "e1000001-0000-0000-0000-000000000001",
    "comment": "Jane did an excellent job cleaning our house. Very professional and thorough.",
    "createdAt": "2025-10-01T10:00:00+07:00",
    "details": [
      {
        "criteriaId": 1,
        "criteriaName": "Thái độ",
        "rating": 5.0
      },
      {
        "criteriaId": 2,
        "criteriaName": "Đúng giờ",
        "rating": 4.5
      },
      {
        "criteriaId": 3,
        "criteriaName": "Chất lượng công việc",
        "rating": 5.0
      }
    ]
  }
  ```
- **Status Code**: 201 Created

### Test Case 2: Review Permission Denied
- **Test Case ID**: TC_REVIEW_002
- **Description**: Verify that only customers with proper permissions can create reviews
- **Preconditions**:
  - Customer exists but lacks review.create permission
  - Valid JWT token with CUSTOMER role
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <restricted_customer_token>
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "bookingId": "BK000001",
      "employeeId": "e1000001-0000-0000-0000-000000000001",
      "comment": "Good service",
      "criteriaRatings": [
        {
          "criteriaId": 1,
          "rating": 4.0
        }
      ]
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Bạn không có quyền tạo đánh giá"
  }
  ```
- **Status Code**: 403 Forbidden

### Test Case 3: Review for Non-Owned Booking
- **Test Case ID**: TC_REVIEW_003
- **Description**: Verify that customers cannot review bookings they didn't make
- **Preconditions**:
  - Customer John Doe exists
  - Booking BK000002 belongs to different customer (Mary Jones)
  - Valid JWT token with CUSTOMER role
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_customer_token>
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "bookingId": "BK000002",
      "employeeId": "e1000001-0000-0000-0000-000000000001",
      "comment": "Trying to review someone else's booking",
      "criteriaRatings": [
        {
          "criteriaId": 1,
          "rating": 3.0
        }
      ]
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Bạn không thể đánh giá đặt chỗ của người khác"
  }
  ```
- **Status Code**: 403 Forbidden

### Test Case 4: Review for Incomplete Booking
- **Test Case ID**: TC_REVIEW_004
- **Description**: Verify that reviews can only be created for completed bookings
- **Preconditions**:
  - Customer John Doe exists
  - Booking BK000003 has status CONFIRMED (not COMPLETED)
  - Valid JWT token with CUSTOMER role
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_customer_token>
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "bookingId": "BK000003",
      "employeeId": "e1000001-0000-0000-0000-000000000001",
      "comment": "Service is still ongoing",
      "criteriaRatings": [
        {
          "criteriaId": 1,
          "rating": 4.0
        }
      ]
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Chỉ có thể đánh giá khi dịch vụ đã hoàn thành"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 5: Review for Unassigned Employee
- **Test Case ID**: TC_REVIEW_005
- **Description**: Verify that reviews can only be created for employees who were actually assigned to the booking
- **Preconditions**:
  - Customer John Doe exists
  - Booking BK000001 exists with COMPLETED status
  - Employee Bob Wilson was NOT assigned to this booking
  - Valid JWT token with CUSTOMER role
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_customer_token>
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "bookingId": "BK000001",
      "employeeId": "e1000001-0000-0000-0000-000000000002",
      "comment": "Bob wasn't even assigned to this job",
      "criteriaRatings": [
        {
          "criteriaId": 1,
          "rating": 3.0
        }
      ]
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Nhân viên không được phân công cho đơn đặt chỗ này"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 6: Duplicate Review Prevention
- **Test Case ID**: TC_REVIEW_006
- **Description**: Verify that customers cannot create multiple reviews for the same booking-employee combination
- **Preconditions**:
  - Customer John Doe already created a review for booking BK000001 and employee Jane Smith
  - Valid JWT token with CUSTOMER role
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_customer_token>
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "bookingId": "BK000001",
      "employeeId": "e1000001-0000-0000-0000-000000000001",
      "comment": "Trying to review again",
      "criteriaRatings": [
        {
          "criteriaId": 1,
          "rating": 2.0
        }
      ]
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Bạn đã đánh giá nhân viên cho đơn này rồi"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 7: Invalid Review Criteria
- **Test Case ID**: TC_REVIEW_007
- **Description**: Verify proper error handling when using non-existent review criteria
- **Preconditions**:
  - Customer John Doe exists
  - Booking BK000005 exists with COMPLETED status
  - Valid JWT token with CUSTOMER role
  - Criteria ID 999 does not exist
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_customer_token>
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "bookingId": "BK000005",
      "employeeId": "e1000001-0000-0000-0000-000000000001",
      "comment": "Good service",
      "criteriaRatings": [
        {
          "criteriaId": 999,
          "rating": 4.0
        }
      ]
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Không tìm thấy tiêu chí đánh giá với ID: 999"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 8: Non-existent Booking
- **Test Case ID**: TC_REVIEW_008
- **Description**: Verify proper error handling when booking ID doesn't exist
- **Preconditions**:
  - Customer John Doe exists
  - Booking ID "NONEXISTENT" does not exist
  - Valid JWT token with CUSTOMER role
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_customer_token>
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "bookingId": "NONEXISTENT",
      "employeeId": "e1000001-0000-0000-0000-000000000001",
      "comment": "Review for non-existent booking",
      "criteriaRatings": [
        {
          "criteriaId": 1,
          "rating": 4.0
        }
      ]
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Booking not found with ID: NONEXISTENT"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 9: Non-existent Employee
- **Test Case ID**: TC_REVIEW_009
- **Description**: Verify proper error handling when employee ID doesn't exist
- **Preconditions**:
  - Customer John Doe exists
  - Booking BK000001 exists with COMPLETED status
  - Employee ID "NONEXISTENT" does not exist
  - Valid JWT token with CUSTOMER role
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_customer_token>
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "bookingId": "BK000001",
      "employeeId": "NONEXISTENT",
      "comment": "Review for non-existent employee",
      "criteriaRatings": [
        {
          "criteriaId": 1,
          "rating": 4.0
        }
      ]
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Employee not found with ID: NONEXISTENT"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 10: Invalid Authorization Token
- **Test Case ID**: TC_REVIEW_010
- **Description**: Verify proper error handling when authorization token is invalid or missing
- **Preconditions**:
  - Valid booking and employee exist
  - Invalid or missing authorization header
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer invalid_token
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "bookingId": "BK000001",
      "employeeId": "e1000001-0000-0000-0000-000000000001",
      "comment": "Unauthorized review attempt",
      "criteriaRatings": [
        {
          "criteriaId": 1,
          "rating": 4.0
        }
      ]
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Invalid or expired token"
  }
  ```
- **Status Code**: 401 Unauthorized

---

## GET /reviews/criteria - Get Review Criteria

### Test Case 11: Successful Criteria Retrieval
- **Test Case ID**: TC_REVIEW_011
- **Description**: Verify that all review criteria can be successfully retrieved
- **Preconditions**:
  - Review criteria exist in the database
  - No authentication required
- **Input**:
  - **Headers**: 
    ```
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  [
    {
      "criteriaId": 1,
      "criteriaName": "Thái độ"
    },
    {
      "criteriaId": 2,
      "criteriaName": "Đúng giờ"
    },
    {
      "criteriaId": 3,
      "criteriaName": "Chất lượng công việc"
    }
  ]
  ```
- **Status Code**: 200 OK

### Test Case 12: Empty Criteria List
- **Test Case ID**: TC_REVIEW_012
- **Description**: Verify proper handling when no criteria exist in the database
- **Preconditions**:
  - No review criteria exist in the database
- **Input**:
  - **Headers**: 
    ```
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  []
  ```
- **Status Code**: 200 OK

---

## GET /employees/{employeeId}/reviews - Get Reviews for Employee

### Test Case 13: Successful Reviews Retrieval
- **Test Case ID**: TC_REVIEW_013
- **Description**: Verify that reviews for a specific employee can be successfully retrieved with pagination
- **Preconditions**:
  - Employee Jane Smith exists with ID 'e1000001-0000-0000-0000-000000000001'
  - Employee has at least one review
  - No authentication required
- **Input**:
  - **Path Parameter**: employeeId = "e1000001-0000-0000-0000-000000000001"
  - **Query Parameters**: page = 0, size = 10
  - **Headers**: 
    ```
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "content": [
      {
        "reviewId": 1,
        "bookingId": "BK000001",
        "customerId": "c1000001-0000-0000-0000-000000000001",
        "employeeId": "e1000001-0000-0000-0000-000000000001",
        "comment": "Jane did an excellent job cleaning our house. Very professional and thorough.",
        "createdAt": "2025-10-01T10:00:00+07:00",
        "details": [
          {
            "criteriaId": 1,
            "criteriaName": "Thái độ",
            "rating": 5.0
          },
          {
            "criteriaId": 2,
            "criteriaName": "Đúng giờ",
            "rating": 4.5
          },
          {
            "criteriaId": 3,
            "criteriaName": "Chất lượng công việc",
            "rating": 5.0
          }
        ]
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 10,
      "sort": {
        "sorted": true,
        "orderBy": "createdAt",
        "direction": "DESC"
      }
    },
    "totalElements": 1,
    "totalPages": 1,
    "last": true,
    "first": true,
    "numberOfElements": 1
  }
  ```
- **Status Code**: 200 OK

### Test Case 14: No Reviews Found for Employee
- **Test Case ID**: TC_REVIEW_014
- **Description**: Verify proper handling when employee has no reviews
- **Preconditions**:
  - Employee Bob Wilson exists with ID 'e1000001-0000-0000-0000-000000000002'
  - Employee has no reviews
- **Input**:
  - **Path Parameter**: employeeId = "e1000001-0000-0000-0000-000000000002"
  - **Query Parameters**: page = 0, size = 10
  - **Headers**: 
    ```
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "content": [],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 10,
      "sort": {
        "sorted": true,
        "orderBy": "createdAt",
        "direction": "DESC"
      }
    },
    "totalElements": 0,
    "totalPages": 0,
    "last": true,
    "first": true,
    "numberOfElements": 0
  }
  ```
- **Status Code**: 200 OK

### Test Case 15: Invalid Pagination Parameters
- **Test Case ID**: TC_REVIEW_015
- **Description**: Verify that invalid pagination parameters are handled gracefully with defaults
- **Preconditions**:
  - Employee Jane Smith exists
  - Employee has reviews
- **Input**:
  - **Path Parameter**: employeeId = "e1000001-0000-0000-0000-000000000001"
  - **Query Parameters**: page = -1, size = 0
  - **Headers**: 
    ```
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "content": [
      {
        "reviewId": 1,
        "bookingId": "BK000001",
        "customerId": "c1000001-0000-0000-0000-000000000001",
        "employeeId": "e1000001-0000-0000-0000-000000000001",
        "comment": "Jane did an excellent job cleaning our house. Very professional and thorough.",
        "createdAt": "2025-10-01T10:00:00+07:00",
        "details": [
          {
            "criteriaId": 1,
            "criteriaName": "Thái độ",
            "rating": 5.0
          }
        ]
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 10,
      "sort": {
        "sorted": true,
        "orderBy": "createdAt",
        "direction": "DESC"
      }
    },
    "totalElements": 1,
    "totalPages": 1,
    "last": true,
    "first": true,
    "numberOfElements": 1
  }
  ```
- **Status Code**: 200 OK

### Test Case 16: Large Page Size Limitation
- **Test Case ID**: TC_REVIEW_016
- **Description**: Verify that page size is limited to prevent resource exhaustion
- **Preconditions**:
  - Employee Jane Smith exists
  - Employee has reviews
- **Input**:
  - **Path Parameter**: employeeId = "e1000001-0000-0000-0000-000000000001"
  - **Query Parameters**: page = 0, size = 100
  - **Headers**: 
    ```
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "content": [],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 50,
      "sort": {
        "sorted": true,
        "orderBy": "createdAt",
        "direction": "DESC"
      }
    },
    "totalElements": 1,
    "totalPages": 1,
    "last": true,
    "first": true,
    "numberOfElements": 1
  }
  ```
- **Status Code**: 200 OK

---

## GET /employees/{employeeId}/reviews/summary - Get Employee Review Summary

### Test Case 17: Successful Summary Retrieval with Reviews
- **Test Case ID**: TC_REVIEW_017
- **Description**: Verify that employee review summary is correctly calculated when reviews exist
- **Preconditions**:
  - Employee Jane Smith exists with ID 'e1000001-0000-0000-0000-000000000001'
  - Employee has multiple reviews with average rating of 4.7
  - No authentication required
- **Input**:
  - **Path Parameter**: employeeId = "e1000001-0000-0000-0000-000000000001"
  - **Headers**: 
    ```
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "employeeId": "e1000001-0000-0000-0000-000000000001",
    "totalReviews": 5,
    "averageRating": 4.7,
    "ratingTier": "HIGHEST"
  }
  ```
- **Status Code**: 200 OK

### Test Case 18: Summary for Employee with No Reviews
- **Test Case ID**: TC_REVIEW_018
- **Description**: Verify proper handling when employee has no reviews
- **Preconditions**:
  - Employee Bob Wilson exists with ID 'e1000001-0000-0000-0000-000000000002'
  - Employee has no reviews
- **Input**:
  - **Path Parameter**: employeeId = "e1000001-0000-0000-0000-000000000002"
  - **Headers**: 
    ```
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "employeeId": "e1000001-0000-0000-0000-000000000002",
    "totalReviews": 0,
    "averageRating": 0.0,
    "ratingTier": null
  }
  ```
- **Status Code**: 200 OK

### Test Case 19: Summary with Various Rating Tiers
- **Test Case ID**: TC_REVIEW_019
- **Description**: Verify correct rating tier calculation for different average ratings
- **Preconditions**:
  - Employee with average rating 2.5 (should be LOW tier)
- **Input**:
  - **Path Parameter**: employeeId = "e1000001-0000-0000-0000-000000000003"
  - **Headers**: 
    ```
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "employeeId": "e1000001-0000-0000-0000-000000000003",
    "totalReviews": 3,
    "averageRating": 2.5,
    "ratingTier": "LOW"
  }
  ```
- **Status Code**: 200 OK

### Test Case 20: Non-existent Employee Summary
- **Test Case ID**: TC_REVIEW_020
- **Description**: Verify proper handling when requesting summary for non-existent employee
- **Preconditions**:
  - Employee ID "NONEXISTENT" does not exist
- **Input**:
  - **Path Parameter**: employeeId = "NONEXISTENT"
  - **Headers**: 
    ```
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  {
    "employeeId": "NONEXISTENT",
    "totalReviews": 0,
    "averageRating": 0.0,
    "ratingTier": null
  }
  ```
- **Status Code**: 200 OK

---

## Database Integration Test Scenarios

### Test Case 21: Real Database Integration
- **Test Case ID**: TC_REVIEW_021
- **Description**: Verify integration with actual database data from housekeeping_service_v8.sql
- **Covered Data**:
  - **Employees**: Jane Smith (e1000001-0000-0000-0000-000000000001), Bob Wilson (e1000001-0000-0000-0000-000000000002)
  - **Customers**: John Doe, Mary Jones, Jane Smith Customer
  - **Bookings**: Real booking IDs with COMPLETED status
  - **Review Criteria**: Thái độ, Đúng giờ, Chất lượng công việc
  - **Assignments**: Valid employee-booking assignments
- **Validation Points**:
  - Review creation follows business rules
  - Rating calculations update employee profiles correctly
  - Permission system works with real user roles
  - Pagination works with realistic data volumes
  - Rating tier assignments match business logic

---

## Notes
- **Test Date Context**: All test cases assume current date is October 1, 2025
- **Real Data Integration**: Uses actual IDs, accounts, and service data from housekeeping_service_v8.sql
- **Employee Rating System**:
  - LOWEST: ≤ 2.0 average rating
  - LOW: 2.0 - 2.9 average rating  
  - MEDIUM: 3.0 - 3.9 average rating
  - HIGH: 4.0 - 4.4 average rating
  - HIGHEST: ≥ 4.5 average rating
- **Business Logic Validation**:
  - Reviews only allowed for COMPLETED bookings
  - Duplicate review prevention per booking-employee pair
  - Employee assignment verification before review creation
  - Permission-based access control for review creation
  - Automatic employee rating updates after review submission
- **Performance Considerations**: Pagination limits prevent resource exhaustion (max 50 items per page)
