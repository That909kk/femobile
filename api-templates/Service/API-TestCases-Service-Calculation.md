# API Test Cases - Service Price Calculation

## Overview
This document describes the test cases for the **Service Price Calculation** endpoint of the Customer API.  
The endpoint allows authenticated customers to calculate the final price of a service based on selected options and quantity.  
**Base URL**: `/api/v1/customer/services/calculate-price`

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
- **Authorization Header**: `Bearer <valid_customer_token>`
- **Content-Type**: `application/json`
- **Role**: Accessible by CUSTOMER, EMPLOYEE, and ADMIN roles
- **Token Validation**: JWT token must be valid and not expired

---

## Database Test Data
Based on `housekeeping_service_v8.sql`:
- **Services**:
  - Service ID 1: "Dọn dẹp theo giờ" (50,000đ/hour, 2.0 hours, recommended 1 staff)
  - Service ID 2: "Tổng vệ sinh" (400,000đ/package, 4.0 hours, recommended 3 staff)
  - Service ID 3: "Vệ sinh Sofa - Nệm - Rèm" (300,000đ/package, 3.0 hours, recommended 2 staff)
- **Service Options**: Various option choices with pricing rules
- **Pricing Rules**: Rules that adjust price based on selected choices
- **Rule Conditions**: Conditions that trigger specific pricing rules

---

## POST /calculate-price - Calculate Service Price

### Test Case 1: Successfully Calculate Basic Service Price
- **Test Case ID**: TC_PRICE_CALC_001
- **Description**: Verify that a customer can calculate price for a basic service without additional options.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Service with ID 1 exists and is active.
  - No service options selected.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/services/calculate-price`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "serviceId": 1,
      "selectedChoiceIds": [],
      "quantity": 1
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Tính toán giá thành công",
    "data": {
      "serviceId": 1,
      "serviceName": "Dọn dẹp theo giờ",
      "basePrice": 50000,
      "totalAdjustment": 0,
      "finalPrice": 50000,
      "suggestedStaff": 1,
      "estimatedDurationHours": 2.0,
      "formattedPrice": "50,000đ",
      "formattedDuration": "2 giờ"
    }
  }
  ```
- **Status Code**: `200 OK`

- **Actual Output**:
  ```json
  {
    "success": true,
    "message": "Tính toán giá thành công",
    "data": {
      "serviceId": 1,
      "serviceName": "Dọn dẹp theo giờ",
      "basePrice": 50000,
      "totalAdjustment": 0,
      "finalPrice": 50000,
      "suggestedStaff": 1,
      "estimatedDurationHours": 2.0,
      "formattedPrice": "50,000đ",
      "formattedDuration": "2 giờ"
    }
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 2: Calculate Price with Service Options and Quantity
- **Test Case ID**: TC_PRICE_CALC_002
- **Description**: Verify that price calculation includes service options and quantity multiplier.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Service with ID 1 exists and is active.
  - Service option choices exist.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/services/calculate-price`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "serviceId": 1,
      "selectedChoiceIds": [2, 4],
      "quantity": 2
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Tính toán giá thành công",
    "data": {
      "serviceId": 1,
      "serviceName": "Dọn dẹp theo giờ",
      "basePrice": 50000,
      "totalAdjustment": 20000,
      "finalPrice": 140000,
      "suggestedStaff": 2,
      "estimatedDurationHours": 4.5,
      "formattedPrice": "140,000đ",
      "formattedDuration": "4 giờ 30 phút"
    }
  }
  ```
- **Status Code**: `200 OK`

- **Actual Output**:
  ```json
  {
    "success": true,
    "message": "Tính toán giá thành công",
    "data": {
      "serviceId": 1,
      "serviceName": "Dọn dẹp theo giờ",
      "basePrice": 50000,
      "totalAdjustment": 20000,
      "finalPrice": 140000,
      "suggestedStaff": 2,
      "estimatedDurationHours": 4.5,
      "formattedPrice": "140,000đ",
      "formattedDuration": "4 giờ 30 phút"
    }
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 3: Service Not Found
- **Test Case ID**: TC_PRICE_CALC_003
- **Description**: Verify that calculation fails when service ID does not exist.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Service with ID 999 does not exist.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/services/calculate-price`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "serviceId": 999,
      "selectedChoiceIds": [],
      "quantity": 1
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Không tìm thấy dịch vụ hoặc dịch vụ đã ngừng hoạt động",
    "data": null
  }
  ```
- **Status Code**: `400 Bad Request`

- **Actual Output**:
  ```json
  {
    "success": false,
    "message": "Không tìm thấy dịch vụ hoặc dịch vụ đã ngừng hoạt động",
    "data": null
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 4: Invalid Token
- **Test Case ID**: TC_PRICE_CALC_004
- **Description**: Verify that calculation fails when Authorization header is missing or invalid.
- **Preconditions**: None
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/services/calculate-price`
  - **Headers**: 
    ```
    Authorization: Bearer invalid_token
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "serviceId": 1,
      "selectedChoiceIds": [],
      "quantity": 1
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

### Test Case 5: Invalid Request Body - Missing Required Fields
- **Test Case ID**: TC_PRICE_CALC_005
- **Description**: Verify that calculation fails when required request body fields are missing.
- **Preconditions**:
  - Customer is authenticated with valid token.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/services/calculate-price`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "selectedChoiceIds": [],
      "quantity": 1
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Thiếu thông tin serviceId",
    "data": null
  }
  ```
- **Status Code**: `400 Bad Request`

- **Actual Output**:
  ```json
  {
    "success": false,
    "message": "Thiếu thông tin serviceId",
    "data": null
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 6: Invalid Quantity Value
- **Test Case ID**: TC_PRICE_CALC_006
- **Description**: Verify that calculation fails when quantity is zero or negative.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Service with ID 1 exists and is active.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/services/calculate-price`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "serviceId": 1,
      "selectedChoiceIds": [],
      "quantity": 0
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Số lượng phải lớn hơn 0",
    "data": null
  }
  ```
- **Status Code**: `400 Bad Request`

- **Actual Output**:
  ```json
  {
    "success": false,
    "message": "Số lượng phải lớn hơn 0",
    "data": null
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 7: Calculate Price with Complex Pricing Rules
- **Test Case ID**: TC_PRICE_CALC_007
- **Description**: Verify that price calculation correctly applies complex pricing rules based on selected options.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Service with ID 2 exists and is active.
  - Pricing rules are configured for specific choice combinations.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/services/calculate-price`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "serviceId": 2,
      "selectedChoiceIds": [2, 4],
      "quantity": 1
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Tính toán giá thành công",
    "data": {
      "serviceId": 2,
      "serviceName": "Tổng vệ sinh",
      "basePrice": 400000,
      "totalAdjustment": 50000,
      "finalPrice": 450000,
      "suggestedStaff": 4,
      "estimatedDurationHours": 5.0,
      "formattedPrice": "450,000đ",
      "formattedDuration": "5 giờ"
    }
  }
  ```
- **Status Code**: `200 OK`

- **Actual Output**:
  ```json
  {
    "success": true,
    "message": "Tính toán giá thành công",
    "data": {
      "serviceId": 2,
      "serviceName": "Tổng vệ sinh",
      "basePrice": 400000,
      "totalAdjustment": 50000,
      "finalPrice": 450000,
      "suggestedStaff": 4,
      "estimatedDurationHours": 5.0,
      "formattedPrice": "450,000đ",
      "formattedDuration": "5 giờ"
    }
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 8: Internal Server Error Simulation
- **Test Case ID**: TC_PRICE_CALC_008
- **Description**: Verify error handling when internal server error occurs during calculation.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Database connection or service error occurs.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/services/calculate-price`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "serviceId": 1,
      "selectedChoiceIds": [],
      "quantity": 1
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Lỗi hệ thống khi tính toán giá",
    "data": null
  }
  ```
- **Status Code**: `500 Internal Server Error`

- **Actual Output**:
  ```json
  {
    "success": false,
    "message": "Lỗi hệ thống khi tính toán giá",
    "data": null
  }
  ```
- **Status Code**: `500 Internal Server Error`

---

## Error Scenarios

### Test Case 9: Malformed JSON Request Body
- **Test Case ID**: TC_PRICE_CALC_009
- **Description**: Verify that calculation fails when request body contains malformed JSON.
- **Preconditions**:
  - Customer is authenticated with valid token.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/services/calculate-price`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    Content-Type: application/json
    ```
  - **Request Body**:
    ```
    {
      "serviceId": 1,
      "selectedChoiceIds": [,
      "quantity": 1
    }
    ```
- **Expected Output**:
  ```json
  {
    "timestamp": "2025-09-04T10:30:00.000+00:00",
    "status": 400,
    "error": "Bad Request",
    "message": "JSON parse error",
    "path": "/api/v1/customer/services/calculate-price"
  }
  ```
- **Status Code**: `400 Bad Request`

- **Actual Output**:
  ```json
  {
    "timestamp": "2025-09-04T10:30:00.000+00:00",
    "status": 400,
    "error": "Bad Request",
    "message": "JSON parse error",
    "path": "/api/v1/customer/services/calculate-price"
  }
  ```
- **Status Code**: `400 Bad Request`

---

### Test Case 10: Missing Authorization Header
- **Test Case ID**: TC_PRICE_CALC_010
- **Description**: Verify that calculation fails when Authorization header is completely missing.
- **Preconditions**: None
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/services/calculate-price`
  - **Headers**: 
    ```
    Content-Type: application/json
    ```
  - **Request Body**:
    ```json
    {
      "serviceId": 1,
      "selectedChoiceIds": [],
      "quantity": 1
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
- **Test Environment**: Database should be configured with test data including services, service options, pricing rules from housekeeping_service_v8.sql.
- **Authentication**: All endpoints require valid JWT tokens.
- **Token Validation**: JWT tokens are validated for format, expiration, and user existence.
- **Price Calculation**: Complex calculation includes base price, option adjustments, quantity multiplier, and pricing rules.
- **Business Logic**: Pricing rules are applied based on rule conditions and choice combinations.
- **Response Format**: Consistent CalculatePriceResponse structure with calculated pricing data.
- **Error Handling**: Service layer catches exceptions and returns appropriate error responses.
- **Duration Calculation**: Estimated duration is calculated based on service base duration and applicable rule adjustments.
- **Staff Suggestion**: System suggests number of staff based on service complexity and selected options.
- **Price Formatting**: Prices are formatted with Vietnamese currency format for better UX.
- **Validation**: Request body fields are validated for required values and proper data types.
- **Rule Engine**: Pricing rules support both ALL and ANY condition logic for flexible pricing strategies.
