# API Test Cases - Service Booking Management

## Overview
This document describes the test cases for the **Service Booking** endpoints of the Customer API.  
The endpoints allow authenticated customers to get service options and calculate pricing for bookings.  
**Base URL**: `/api/v1/customer/services`

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
- **Permission**: User must have "service.view" permission
- **Role**: Accessible by CUSTOMER, EMPLOYEE, and ADMIN roles

---

## Database Test Data
Based on `housekeeping_service_v8.sql`:
- **Services**:
  - Service ID 1: "Dọn dẹp theo giờ" (50,000đ/Giờ, 2.0 giờ, recommended 1 staff)
  - Service ID 2: "Tổng vệ sinh" (100,000đ/Gói, 2.0 giờ, recommended 3 staff)
- **Service Options**:
  - **Service 2**:
    - Option ID 1: "Loại hình nhà ở?" (SINGLE_CHOICE_RADIO)
      - Choice ID 1: "Căn hộ"
      - Choice ID 2: "Nhà phố"
    - Option ID 2: "Nhà bạn có mấy tầng (bao gồm trệt)?" (QUANTITY_INPUT, phụ thuộc Choice ID 2)
    - Option ID 3: "Diện tích dọn dẹp?" (SINGLE_CHOICE_DROPDOWN)
      - Choice ID 3: "Dưới 80m²"
      - Choice ID 4: "Trên 80m²"
  - **Service 1**:
    - Option ID 4: "Số phòng ngủ cần dọn?" (QUANTITY_INPUT)
    - Option ID 5: "Bạn có yêu cầu thêm công việc nào?" (MULTIPLE_CHOICE_CHECKBOX)
      - Choice ID 5: "Giặt chăn ga"
      - Choice ID 6: "Rửa chén"
      - Choice ID 7: "Lau cửa kính"
- **Pricing Rules**:
  - "Phụ thu nhà phố lớn": áp dụng khi chọn Choice ID 2 và 4 (+250,000đ, +1 nhân viên, +2.0 giờ)
  - "Giặt chăn ga": Choice ID 5 (+30,000đ, +0.5 giờ)
  - "Rửa chén": Choice ID 6 (+15,000đ, +0.5 giờ)
  - "Lau cửa kính": Choice ID 7 (+40,000đ, +1.0 giờ)

---

## GET /services/{serviceId}/options - Get Service Options

### Test Case 1: Successfully Get Service Options
- **Test Case ID**: TC_SERVICE_OPTIONS_001
- **Description**: Verify that a customer can retrieve available options for a specific service.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Customer has "service.view" permission.
  - Service with ID 1 exists and has options configured.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/services/1/options`
  - **Path Parameter**: `serviceId = 1`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    ```
- **Output**:
  ```json
  {
    "success": true,
    "message": "Lấy thông tin dịch vụ và tùy chọn thành công",
    "data": {
        "serviceId": 1,
        "serviceName": "Dọn dẹp theo giờ",
        "description": "Lau dọn, hút bụi, làm sạch các bề mặt cơ bản trong nhà. Phù hợp cho nhu cầu duy trì vệ sinh hàng tuần.",
        "basePrice": 50000.00,
        "unit": "Giờ",
        "estimatedDurationHours": 2.00,
        "recommendedStaff": 1,
        "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599899/Cleaning_Clock_z29juh.png",
        "formattedPrice": "50,000đ/Giờ",
        "formattedDuration": "2 giờ 0 phút",
        "options": [
            {
                "optionId": 4,
                "optionName": "Số phòng ngủ cần dọn?",
                "optionType": "QUANTITY_INPUT",
                "displayOrder": 1,
                "isRequired": true,
                "choices": []
            },
            {
                "optionId": 5,
                "optionName": "Bạn có yêu cầu thêm công việc nào?",
                "optionType": "MULTIPLE_CHOICE_CHECKBOX",
                "displayOrder": 2,
                "isRequired": true,
                "choices": [
                    {
                        "choiceId": 5,
                        "choiceName": "Giặt chăn ga",
                        "displayOrder": 1,
                        "isDefault": false
                    },
                    {
                        "choiceId": 6,
                        "choiceName": "Rửa chén",
                        "displayOrder": 2,
                        "isDefault": false
                    },
                    {
                        "choiceId": 7,
                        "choiceName": "Lau cửa kính",
                        "displayOrder": 3,
                        "isDefault": false
                    }
                ]
            }
        ]
    }
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 2: Service Not Found for Options
- **Test Case ID**: TC_SERVICE_OPTIONS_002
- **Description**: Verify that request fails when serviceId does not exist or service is inactive.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Customer has "service.view" permission.
  - Service with ID 999 does not exist.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/services/999/options`
  - **Path Parameter**: `serviceId = 999`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Không tìm thấy dịch vụ hoặc dịch vụ đã ngừng hoạt động",
    "data": null
  }
  ```
- **Status Code**: `404 Not Found`

---

### Test Case 3: Invalid Token for Service Options
- **Test Case ID**: TC_SERVICE_OPTIONS_003
- **Description**: Verify that request fails when Authorization header is missing or invalid.
- **Preconditions**: None
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/services/1/options`
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

### Test Case 4: Successfully Get Service Options (Service 2)
- **Test Case ID**: TC_SERVICE_OPTIONS_004
- **Description**: Verify that a customer can retrieve options for service ID 2.
- **Preconditions**:
  - Customer has "service.view" permission.
  - Service with ID 2 exists and has options configured.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/customer/services/2/options`
  - **Path Parameter**: `serviceId = 2`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    ```
- **Output**:
  ```json
  {
    "success": true,
        "message": "Lấy thông tin dịch vụ và tùy chọn thành công",
    "data": {
      "serviceId": 2,
      "serviceName": "Tổng vệ sinh",
      "description": "Làm sạch sâu toàn diện, bao gồm các khu vực khó tiếp cận, trần nhà, lau cửa kính. Thích hợp cho nhà mới hoặc dọn dẹp theo mùa.",
      "basePrice": 100000.00,
      "unit": "Gói",
      "estimatedDurationHours": 2.00,
      "recommendedStaff": 3,
      "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599581/house_cleaning_nob_umewqf.png",
      "formattedPrice": "100,000đ/Gói",
      "formattedDuration": "2 giờ 0 phút",
      "options": [
        {
          "optionId": 1,
          "optionName": "Loại hình nhà ở?",
          "optionType": "SINGLE_CHOICE_RADIO",
          "displayOrder": 1,
          "isRequired": true,
          "choices": [
            {"choiceId": 1, "choiceName": "Căn hộ", "displayOrder": 1, "isDefault": false},
            {"choiceId": 2, "choiceName": "Nhà phố", "displayOrder": 2, "isDefault": false}
          ]
        },
        {
          "optionId": 2,
          "optionName": "Nhà bạn có mấy tầng (bao gồm trệt)?",
          "optionType": "QUANTITY_INPUT",
          "displayOrder": 2,
          "isRequired": false,
          "parentChoiceId": 2,
          "choices": []
        },
        {
          "optionId": 3,
          "optionName": "Diện tích dọn dẹp?",
          "optionType": "SINGLE_CHOICE_DROPDOWN",
          "displayOrder": 3,
          "isRequired": true,
          "choices": [
            {"choiceId": 3, "choiceName": "Dưới 80m²", "displayOrder": 1, "isDefault": false},
            {"choiceId": 4, "choiceName": "Trên 80m²", "displayOrder": 2, "isDefault": false}
          ]
        }
      ]
    }
  }
  ```
- **Status Code**: `200 OK`

---

## POST /services/calculate-price - Calculate Service Price

### Test Case 5: Successfully Calculate Price with Basic Choices
- **Test Case ID**: TC_CALCULATE_PRICE_001
- **Description**: Verify that customer can calculate price for a service with selected options.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Service with ID 1 exists.
  - Choice IDs 1 and 3 exist with pricing rules.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/services/calculate-price`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "serviceId": 1,
      "selectedChoiceIds": [1, 3]
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
      "finalPrice": 100000,
      "suggestedStaff": 1,
      "estimatedDuration": 3.0,
      "formattedPrice": "100,000đ/giờ",
      "formattedDuration": "3 giờ"
    }
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 6: Calculate Price with Multiple Add-on Services
- **Test Case ID**: TC_CALCULATE_PRICE_002
- **Description**: Verify price calculation with multiple add-on services that affect price, staff, and duration.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Service and choices exist with complex pricing rules.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/services/calculate-price`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "serviceId": 1,
      "selectedChoiceIds": [1, 3, 4]
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
      "finalPrice": 130000,
      "suggestedStaff": 2,
      "estimatedDuration": 3.5,
      "formattedPrice": "130,000đ/giờ",
      "formattedDuration": "3 giờ 30 phút"
    }
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 7: Calculate Price - Service Not Found
- **Test Case ID**: TC_CALCULATE_PRICE_003
- **Description**: Verify that price calculation fails when service does not exist.
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
  - **Body**:
    ```json
    {
      "serviceId": 999,
      "selectedChoiceIds": [1]
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
- **Status Code**: `200 OK`

---

### Test Case 8: Calculate Price - Missing Service ID
- **Test Case ID**: TC_CALCULATE_PRICE_004
- **Description**: Verify validation when service ID is missing from request.
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
  - **Body**:
    ```json
    {
      "selectedChoiceIds": [1, 2]
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Service ID không được để trống",
    "data": null
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 9: Calculate Price - Empty Choice Selection
- **Test Case ID**: TC_CALCULATE_PRICE_005
- **Description**: Verify validation when no choices are selected.
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
  - **Body**:
    ```json
    {
      "serviceId": 1,
      "selectedChoiceIds": []
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Vui lòng chọn ít nhất một tùy chọn",
    "data": null
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 10: Calculate Price - Invalid Choice IDs
- **Test Case ID**: TC_CALCULATE_PRICE_006
- **Description**: Verify behavior when non-existent choice IDs are provided.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Service exists but choice IDs 999, 998 do not exist.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/services/calculate-price`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "serviceId": 1,
      "selectedChoiceIds": [999, 998]
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
      "finalPrice": 50000,
      "suggestedStaff": 1,
      "estimatedDuration": 2.0,
      "formattedPrice": "50,000đ/giờ",
      "formattedDuration": "2 giờ"
    }
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 11: Calculate Price - Invalid Token
- **Test Case ID**: TC_CALCULATE_PRICE_007
- **Description**: Verify that price calculation fails with invalid authentication.
- **Preconditions**: None
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/services/calculate-price`
  - **Headers**: 
    ```
    Authorization: Bearer invalid_token_here
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "serviceId": 1,
      "selectedChoiceIds": [1]
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

---

### Test Case 12: Calculate Price - Malformed JSON
- **Test Case ID**: TC_CALCULATE_PRICE_008
- **Description**: Verify error handling when request body contains invalid JSON.
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
  - **Body**:
    ```json
    {
      "serviceId": 1,
      "selectedChoiceIds": [1, 2]
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

---

### Test Case 13: Calculate Price - Package Service with Complex Pricing
- **Test Case ID**: TC_CALCULATE_PRICE_009
- **Description**: Verify price calculation for package-based services with complex pricing rules.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Package service (ID 2) exists with complex pricing options.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/services/calculate-price`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "serviceId": 2,
      "selectedChoiceIds": [5, 6, 7]
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
      "finalPrice": 600000,
      "suggestedStaff": 3,
      "estimatedDuration": 6.0,
      "formattedPrice": "600,000đ/gói",
      "formattedDuration": "6 giờ"
    }
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 14: Calculate Price - Duration Under 1 Hour
- **Test Case ID**: TC_CALCULATE_PRICE_010
- **Description**: Verify proper formatting when calculated duration is less than 1 hour.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Service and choices configured to result in < 1 hour duration.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/services/calculate-price`
  - **Headers**: 
    ```
    Authorization: Bearer <valid_customer_token>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "serviceId": 3,
      "selectedChoiceIds": [8]
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Tính toán giá thành công",
    "data": {
      "serviceId": 3,
      "serviceName": "Dịch vụ nhanh",
      "finalPrice": 25000,
      "suggestedStaff": 1,
      "estimatedDuration": 0.5,
      "formattedPrice": "25,000đ/giờ",
      "formattedDuration": "30 phút"
    }
  }
  ```
- **Status Code**: `200 OK`

---

### Test Case 15: Calculate Price - House Type and Area (Service 2)
- **Test Case ID**: TC_CALCULATE_PRICE_011
- **Description**: Verify price calculation for service 2 when selecting house type and area triggering pricing rules.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Service with ID 2 exists.
  - Choice IDs 2 and 4 exist with pricing rules.
- **Input**:
  - **Method**: `POST`
  - **URL**: `/api/v1/customer/services/calculate-price`
  - **Headers**:
    ```
    Authorization: Bearer <valid_customer_token>
    Content-Type: application/json
    ```
  - **Body**:
    ```json
    {
      "serviceId": 2,
      "selectedChoiceIds": [2, 4]
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
      "finalPrice": 350000,
      "suggestedStaff": 2,
      "estimatedDuration": 4.0,
      "formattedPrice": "350,000đ/gói",
      "formattedDuration": "4 giờ"
    }
  }
  ```
- **Status Code**: `200 OK`

---

## Integration Test Scenarios

### Test Case 16: End-to-End: Get Options then Calculate Price
- **Test Case ID**: TC_INTEGRATION_001
- **Description**: Verify complete workflow from getting service options to calculating price.
- **Preconditions**:
  - Customer is authenticated with valid token.
  - Service with ID 1 exists with options.
- **Steps**:
  1. **Step 1**: Get service options
     - **URL**: `/api/v1/customer/services/1/options`
     - **Method**: `GET`
     - **Expected**: Successfully retrieve available options
  
  2. **Step 2**: Calculate price with selected options
     - **URL**: `/api/v1/customer/services/calculate-price`
     - **Method**: `POST`
     - **Body**: Selected choices from step 1
     - **Expected**: Successfully calculate final price
- **Expected Flow**:
  - Customer gets available options for service
  - Customer selects desired options
  - System calculates final price, staff count, and duration
  - All calculations are properly formatted for display

---

## Integration Flow
1. **GET Service Options**
  - **Request**: `GET /api/v1/customer/services/2/options`
  - **Response**:
    ```json
    {
      "success": true,
      "message": "Lấy thông tin dịch vụ và tùy chọn thành công",
      "data": {
        "serviceId": 2,
        "serviceName": "Tổng vệ sinh",
        "recommendedStaff": 3,
        "options": [
          {"optionId": 1, "optionName": "Loại hình nhà ở?", "choices": [{"choiceId":1,"choiceName":"Căn hộ"},{"choiceId":2,"choiceName":"Nhà phố"}]},
          {"optionId": 2, "optionName": "Nhà bạn có mấy tầng (bao gồm trệt)?", "choices": []},
          {"optionId": 3, "optionName": "Diện tích dọn dẹp?", "choices": [{"choiceId":3,"choiceName":"Dưới 80m²"},{"choiceId":4,"choiceName":"Trên 80m²"}]}
        ]
      }
    }
    ```
2. **Select Options**
  - Customer chooses `choiceId` 2 ("Nhà phố") and `choiceId` 4 ("Trên 80m²").
  - **Selection JSON**:
    ```json
    {
      "selectedChoiceIds": [2, 4]
    }
    ```
3. **POST Calculate Price**
  - **Request**: `POST /api/v1/customer/services/calculate-price`
    ```json
    {
      "serviceId": 2,
      "selectedChoiceIds": [2, 4]
    }
    ```
  - **Response**:
    ```json
    {
      "success": true,
      "message": "Tính toán giá thành công",
      "data": {
        "serviceId": 2,
        "serviceName": "Tổng vệ sinh",
        "finalPrice": 350000,
        "suggestedStaff": 2,
        "estimatedDuration": 4.0,
        "formattedPrice": "350,000đ/gói",
        "formattedDuration": "4 giờ"
      }
    }
    ```
    
---

## Notes
- **Test Environment**: Database should be configured with test data including services, service options, choices, and pricing rules from housekeeping_service_v8.sql.
- **Authentication**: All endpoints require valid JWT tokens.
- **Permission**: Users must have "service.view" permission to access these endpoints.
- **Service Status**: Only active services can have their options retrieved or prices calculated.
- **Price Formatting**: Different formatting based on service unit (hour, m2, package).
- **Duration Formatting**: Smart formatting for hours and minutes display.
- **Error Handling**: Service layer catches exceptions and returns appropriate error responses.
- **Security**: JWT tokens are validated for each request.
- **Business Logic**: 
  - Price calculation includes base price + pricing rule adjustments
  - Staff suggestions based on pricing rules and service complexity
  - Duration calculation includes base duration + rule adjustments
  - Minimum values enforced (price ≥ 0, staff ≥ 1, duration ≥ 0)
- **Data Validation**: Request validation for required fields and data types.
- **Integration**: Options endpoint provides data structure for calculate-price endpoint input.
