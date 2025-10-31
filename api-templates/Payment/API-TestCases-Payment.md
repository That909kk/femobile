# API Test Cases - Payment Management

## Overview
This document describes the minimum essential test cases for the **Payment Management** endpoints of the Customer API.  
The endpoints allow customers to create payments, view payment history, and handle payment status updates.  
**Base URL**: `/api/v1/customer/payments`

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
- **Authorization Header**: `Bearer <valid_token>`
- **Content-Type**: `application/json` (for POST requests)
- **Role Requirements**: 
  - Customer endpoints: CUSTOMER role required
  - Booking lookup: CUSTOMER, EMPLOYEE, or ADMIN role required
  - Webhook: No authentication (called by payment gateways)

---

## Database Test Data
Based on housekeeping_service_v8.sql:
- **Sample Customer**: john_doe (ID: a1000001-0000-0000-0000-000000000001)
- **Sample Employee**: jane_smith (ID: a1000001-0000-0000-0000-000000000002)
- **Sample Booking**: booking_001 with amount 500000 VND
- **Payment Methods**: 
  - Method ID 1: "CASH" (Thanh toán tiền mặt)
  - Method ID 2: "MOMO" (Ví điện tử Momo)
  - Method ID 3: "VNPAY" (Cổng thanh toán VNPAY)
  - Method ID 4: "BANK_TRANSFER" (Chuyển khoản ngân hàng)
- **Payment Statuses**: PENDING, PAID, FAILED, CANCELED, REFUNDED

---

## API Endpoints Covered
1. **POST /** - Create Payment
2. **GET /booking/{bookingId}** - Get Payment for Booking  
3. **GET /history/{customerId}** - Get Payment History by Customer ID
4. **POST /webhook/update-status** - Payment Webhook
5. **GET /methods** - Get Available Payment Methods

---

## POST / - Create Payment

### Test Case 1: Successfully Create Payment for Customer Booking
- **Test Case ID**: TC_PAYMENT_001
- **Description**: Verify that a customer can create a payment for their own booking.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Booking exists and belongs to the customer.
  - Payment method is active and available.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/payments`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_john_doe>
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "bookingId": "b0000001-0000-0000-0000-000000000001",
      "methodId": 2
    }
    ```
- **Expected Output**:
  ```json
  {
    "paymentId": "pay00001-0000-0000-0000-000000000001",
    "bookingCode": "BK000001",
    "amount": 480000,
    "status": "PENDING",
    "paymentMethodName": "Ví điện tử Momo",
    "transactionCode": null,
    "createdAt": "2025-01-15T10:30:00.000",
    "paidAt": null
  }
  ```
- **Status Code**: `201 Created`

---

### Test Case 2: Create Payment for Non-Existent Booking
- **Test Case ID**: TC_PAYMENT_002
- **Description**: Verify error handling when booking ID does not exist.
- **Preconditions**: Customer is authenticated with valid token.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/payments`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "bookingId": "non_existent_booking",
      "methodId": 2
    }
    ```
- **Expected Output**:
  ```json
  {
    "error": "RuntimeException",
    "message": "Không tìm thấy Booking với ID: non_existent_booking"
  }
  ```
- **Status Code**: `500 Internal Server Error`

---

### Test Case 3: Create Payment with Invalid Payment Method
- **Test Case ID**: TC_PAYMENT_003
- **Description**: Verify error handling when payment method ID does not exist.
- **Preconditions**: Customer is authenticated with valid token.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/payments`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "bookingId": "b0000001-0000-0000-0000-000000000001",
      "methodId": 999
    }
    ```
- **Expected Output**:
  ```json
  {
    "error": "RuntimeException",
    "message": "Không tìm thấy Payment Method với ID: 999"
  }
  ```
- **Status Code**: `500 Internal Server Error`

---

### Test Case 4: Customer Tries to Create Payment for Other Customer's Booking
- **Test Case ID**: TC_PAYMENT_004
- **Description**: Verify that a customer cannot create payment for booking that doesn't belong to them.
- **Preconditions**: Customer is authenticated with valid token.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/payments`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "bookingId": "b0000001-0000-0000-0000-000000000002",
      "methodId": 2
    }
    ```
- **Expected Output**: HTTP 403 Forbidden (no response body)
- **Status Code**: `403 Forbidden`

---

## GET /booking/{bookingId} - Get Payment for Booking

### Test Case 5: Successfully Get Payment for Booking
- **Test Case ID**: TC_PAYMENT_005
- **Description**: Verify that an authorized user can retrieve payment information for a booking.
- **Preconditions**:
  - User is authenticated with valid token (CUSTOMER, EMPLOYEE, or ADMIN).
  - Booking exists with payment.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/payments/booking/b0000001-0000-0000-0000-000000000001`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    ```
- **Expected Output**:
  ```json
  {
    "paymentId": "pay00001-0000-0000-0000-000000000001",
    "bookingCode": "BK000001",
    "amount": 480000,
    "status": "PAID",
    "paymentMethodName": "Cổng thanh toán VNPAY",
    "transactionCode": "VNP123456789",
    "createdAt": "2025-01-15T10:30:00.000",
    "paidAt": "2025-01-15T10:35:00.000"
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 6: Get Payment for Non-Existent Booking
- **Test Case ID**: TC_PAYMENT_006
- **Description**: Verify error handling when no payment exists for booking ID.
- **Preconditions**: User is authenticated with valid token.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/payments/booking/non_existent_booking`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    ```
- **Expected Output**:
  ```json
  {
    "error": "RuntimeException",
    "message": "Không tìm thấy thanh toán cho Booking ID: non_existent_booking"
  }
  ```
- **Status Code**: `500 Internal Server Error`

---

## GET /history/{customerId} - Get Payment History by Customer ID

### Test Case 7: Successfully Get Customer Payment History (Own Data)
- **Test Case ID**: TC_PAYMENT_007
- **Description**: Verify that a customer can retrieve their own payment history with pagination.
- **Preconditions**: Customer is authenticated and has payment history.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/payments/history/c1000001-0000-0000-0000-000000000001?page=0&size=10&sort=createdAt,desc`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_john_doe>
    ```
- **Expected Output**:
  ```json
  {
    "content": [
      {
        "paymentId": "pay00001-0000-0000-0000-000000000003",
        "bookingCode": "BK000004",
        "amount": 150000,
        "status": "PAID",
        "paymentMethodName": "Thanh toán tiền mặt",
        "transactionCode": null,
        "createdAt": "2025-01-15T14:30:00.000",
        "paidAt": "2025-01-15T14:32:00.000"
      },
      {
        "paymentId": "pay00001-0000-0000-0000-000000000001",
        "bookingCode": "BK000001",
        "amount": 480000,
        "status": "PAID",
        "paymentMethodName": "Cổng thanh toán VNPAY",
        "transactionCode": "VNP123456789",
        "createdAt": "2025-01-15T10:30:00.000",
        "paidAt": "2025-01-15T10:35:00.000"
      }
    ],
    "pageable": {
      "pageNumber": 0,
      "pageSize": 10,
      "sort": {
        "sorted": true,
        "ascending": false
      }
    },
    "totalElements": 2,
    "totalPages": 1,
    "last": true,
    "first": true
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 8: Admin Access to Any Customer Payment History
- **Test Case ID**: TC_PAYMENT_008
- **Description**: Verify that admin can access any customer's payment history.
- **Preconditions**: Admin is authenticated.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/payments/history/c1000001-0000-0000-0000-000000000002?page=0&size=5&sort=amount,asc`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_admin_token>
    ```
- **Expected Output**: Payment history for the specified customer with pagination
- **Status Code**: `200 OK`

---

### Test Case 9: Customer Tries to Access Other Customer's Payment History
- **Test Case ID**: TC_PAYMENT_009
- **Description**: Verify that a customer cannot access another customer's payment history.
- **Preconditions**: Customer is authenticated.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/payments/history/c1000001-0000-0000-0000-000000000002`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_john_doe>
    ```
- **Expected Output**: HTTP 403 Forbidden (no response body)
- **Status Code**: `403 Forbidden`

---

### Test Case 10: Get Payment History for Non-Existent Customer
- **Test Case ID**: TC_PAYMENT_010
- **Description**: Verify error handling when customer ID does not exist.
- **Preconditions**: User is authenticated.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/payments/history/non_existent_customer`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    ```
- **Expected Output**: HTTP 404 Not Found (no response body)
- **Status Code**: `404 Not Found`

---

### Test Case 11: Get Payment History with Invalid Sort Parameter
- **Test Case ID**: TC_PAYMENT_011
- **Description**: Verify that invalid sort parameters default to createdAt,desc.
- **Preconditions**: Customer is authenticated.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/payments/history/c1000001-0000-0000-0000-000000000001?page=0&size=10&sort=invalidField,invalidDirection`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token_john_doe>
    ```
- **Expected Output**: Payment history sorted by createdAt DESC (default behavior)
- **Status Code**: `200 OK`

---

## POST /webhook/update-status - Payment Webhook

### Test Case 12: Successfully Update Payment Status via Webhook
- **Test Case ID**: TC_PAYMENT_012
- **Description**: Verify that payment gateways can update payment status via webhook.
- **Preconditions**: Payment exists with transaction code.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/payments/webhook/update-status`
  - **Headers**: 
    ```
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "transactionCode": "VNP123456789",
      "status": "PAID",
      "paidAt": "2025-01-15T10:35:00.000"
    }
    ```
- **Expected Output**: No response body (HTTP 200 OK acknowledgment)
- **Status Code**: `200 OK`

---

### Test Case 13: Update Status for Non-Existent Transaction
- **Test Case ID**: TC_PAYMENT_013
- **Description**: Verify error handling when transaction code does not exist.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/payments/webhook/update-status`
  - **Headers**: 
    ```
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "transactionCode": "NON_EXISTENT_TXN",
      "status": "FAILED"
    }
    ```
- **Expected Output**:
  ```json
  {
    "error": "RuntimeException",
    "message": "Không tìm thấy giao dịch với mã: NON_EXISTENT_TXN"
  }
  ```
- **Status Code**: `500 Internal Server Error`

---

### Test Case 14: Update Payment Status to FAILED
- **Test Case ID**: TC_PAYMENT_014
- **Description**: Verify webhook can update payment status to FAILED.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/payments/webhook/update-status`
  - **Headers**: 
    ```
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "transactionCode": "VNP123456789",
      "status": "FAILED"
    }
    ```
- **Expected Output**: No response body (HTTP 200 OK acknowledgment)
- **Status Code**: `200 OK`

---

## GET /methods - Get Available Payment Methods

### Test Case 15: Successfully Get Available Payment Methods
- **Test Case ID**: TC_PAYMENT_015
- **Description**: Verify that users can retrieve all available payment methods.
- **Preconditions**: None (public endpoint).
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/payments/methods`
  - **Headers**: 
    ```
    Content-Type: application/json
    ```
- **Expected Output**:
  ```json
  [
    {
        "methodId": 1,
        "methodCode": "CASH",
        "methodName": "Thanh toán tiền mặt"
    },
    {
        "methodId": 2,
        "methodCode": "MOMO",
        "methodName": "Ví điện tử Momo"
    },
    {
        "methodId": 3,
        "methodCode": "VNPAY",
        "methodName": "Cổng thanh toán VNPAY"
    },
    {
        "methodId": 4,
        "methodCode": "BANK_TRANSFER",
        "methodName": "Chuyển khoản ngân hàng"
    }
  ]
  ```
- **Status Code**: `200 OK`

---

## Error Scenarios

### Test Case 16: Unauthorized Access - Missing Token
- **Test Case ID**: TC_PAYMENT_016
- **Description**: Verify that requests fail when Authorization header is missing.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/payments`
  - **Headers**: 
    ```
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "bookingId": "b0000001-0000-0000-0000-000000000001",
      "methodId": 2
    }
    ```
- **Expected Output**:
  ```json
  {
    "timestamp": "2025-01-15T10:30:00.000+00:00",
    "status": 401,
    "error": "Unauthorized",
    "path": "/api/v1/customer/payments"
  }
  ```
- **Status Code**: `401 Unauthorized`

---

### Test Case 17: Invalid Token
- **Test Case ID**: TC_PAYMENT_017
- **Description**: Verify that requests fail when token is invalid or expired.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/payments/history/c1000001-0000-0000-0000-000000000001`
  - **Headers**: 
    ```
    Authorization: Bearer invalid_token_here
    ```
- **Expected Output**:
  ```json
  {
    "timestamp": "2025-01-15T10:30:00.000+00:00",
    "status": 401,
    "error": "Unauthorized",
    "path": "/api/v1/customer/payments/history/c1000001-0000-0000-0000-000000000001"
  }
  ```
- **Status Code**: `401 Unauthorized`

---

### Test Case 18: Role Authorization - Employee Access to Customer Payment Creation
- **Test Case ID**: TC_PAYMENT_018
- **Description**: Verify that employee role cannot create payments (customer-only endpoint).
- **Preconditions**: Employee is authenticated with valid token.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/payments`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_employee_token>
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "bookingId": "b0000001-0000-0000-0000-000000000001",
      "methodId": 2
    }
    ```
- **Expected Output**:
  ```json
  {
    "timestamp": "2025-01-15T10:30:00.000+00:00",
    "status": 403,
    "error": "Forbidden",
    "path": "/api/v1/customer/payments"
  }
  ```
- **Status Code**: `403 Forbidden`

---

### Test Case 19: Role Authorization - Employee Access to Payment History
- **Test Case ID**: TC_PAYMENT_019
- **Description**: Verify that employee role cannot access customer payment history.
- **Preconditions**: Employee is authenticated with valid token.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/payments/history/c1000001-0000-0000-0000-000000000001`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_employee_token>
    ```
- **Expected Output**:
  ```json
  {
    "timestamp": "2025-01-15T10:30:00.000+00:00",
    "status": 403,
    "error": "Forbidden",
    "path": "/api/v1/customer/payments/history/c1000001-0000-0000-0000-000000000001"
  }
  ```
- **Status Code**: `403 Forbidden`

---

### Test Case 20: Customer Account Not Found
- **Test Case ID**: TC_PAYMENT_020
- **Description**: Verify error handling when authenticated user has no associated customer record.
- **Preconditions**: User is authenticated but has no customer record.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/payments`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_token_no_customer>
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "bookingId": "b0000001-0000-0000-0000-000000000001",
      "methodId": 2
    }
    ```
- **Expected Output**: HTTP 404 Not Found (no response body)
- **Status Code**: `404 Not Found`

---

## Notes
- **Test Environment**: Database should be configured with test data from housekeeping_service_v8.sql.
- **Authentication**: Most endpoints require valid JWT tokens except webhook endpoint and methods endpoint.
- **Authorization**: 
  - Payment creation: CUSTOMER role required
  - Payment history: CUSTOMER and ADMIN roles required (customers can only access their own data, admins can access any customer's data)
  - Booking payment lookup: CUSTOMER, EMPLOYEE, or ADMIN role required
  - Payment methods lookup: No authentication required (public endpoint)
  - Webhook: No authentication (called by external payment gateways)
- **Transaction Management**: Payment operations are wrapped in database transactions.
- **Error Handling**: Service layer throws RuntimeExceptions which return 500 Internal Server Error.
- **Security**: JWT tokens are validated for format, expiration, and role authorization.
- **Pagination**: Payment history supports standard Spring Boot pagination with customizable page size and sorting.
- **Payment Gateway Integration**: Webhook endpoint designed for external payment gateway callbacks.
- **Transaction Codes**: Generated by payment gateways and used for payment tracking and status updates.
- **Amount Format**: Payment amounts in VND (Vietnamese Dong) as BigDecimal for precision.
- **Payment Status Values**: PENDING, PAID, FAILED, CANCELED, REFUNDED (based on PaymentStatus enum).
- **Payment Method Codes**: CASH, MOMO, VNPAY, BANK_TRANSFER (based on PaymentMethodCode enum).
- **Customer Ownership Validation**: Payment creation validates that the booking belongs to the authenticated customer.
- **Default Sorting**: Payment history defaults to createdAt DESC when no sort parameter is provided or invalid sort parameters are used.
- **Customer ID Validation**: Payment history endpoint requires customerId path parameter and validates customer existence.
- **Customer Data Access Control**: Customers can only access their own payment history unless they have ADMIN role.
