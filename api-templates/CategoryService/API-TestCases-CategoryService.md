# API Test Cases - Category Service Management

## Overview
Tài liệu này mô tả các test case tối thiểu cho các endpoint quản lý danh mục dịch vụ (Category Service) của Customer API.
**Base URL**: `/api/v1/customer/categories`

---

## Test Case Structure
Mỗi test case gồm:
- **Test Case ID**
- **Description**
- **Preconditions**
- **Input**
- **Expected Output**
- **Status Code**

---

## Authentication Requirements
- **Authorization Header**: `Bearer <valid_customer_token>`
- **Permission**: "service.view"
- **Role**: CUSTOMER, EMPLOYEE, ADMIN

---

## Database Test Data (theo housekeeping_service_v6.sql)
- **Categories**: 
  - Category ID 1: "Dọn dẹp nhà" (active)
  - Category ID 2: "Giặt ủi" (active) 
  - Category ID 3: "Việc nhà khác" (active)
- **Services**: 
  - Category 1: 4 services (Dọn dẹp theo giờ, Tổng vệ sinh, Vệ sinh Sofa - Nệm - Rèm, Vệ sinh máy lạnh)
  - Category 2: 2 services (Giặt sấy theo kg, Giặt hấp cao cấp)
  - Category 3: 2 services (Nấu ăn gia đình, Đi chợ hộ)

---

## GET /categories - Lấy tất cả danh mục dịch vụ đang hoạt động

### Test Case 1: Lấy tất cả danh mục thành công
- **Test Case ID**: TC_CATEGORY_001
- **Description**: Lấy danh sách tất cả danh mục dịch vụ đang hoạt động
- **Preconditions**: Token hợp lệ, có quyền "service.view", có category active
- **Input**:
  - **Method**: GET
  - **URL**: `/api/v1/customer/categories`
  - **Headers**: `Authorization: Bearer <valid_customer_token>`
- **Output**:
  ```json
  {
    "success": true,
    "message": "Lấy danh sách danh mục dịch vụ thành công",
    "data": [
        {
            "categoryId": 1,
            "categoryName": "Dọn dẹp nhà",
            "description": "Các dịch vụ liên quan đến vệ sinh, làm sạch nhà cửa",
            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599581/house_cleaning_nob_umewqf.png",
            "isActive": true,
            "serviceCount": 4
        },
        {
            "categoryId": 2,
            "categoryName": "Giặt ủi",
            "description": "Dịch vụ giặt sấy, ủi đồ chuyên nghiệp",
            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599717/washing_nz3cbw.png",
            "isActive": true,
            "serviceCount": 2
        },
        {
            "categoryId": 3,
            "categoryName": "Việc nhà khác",
            "description": "Các dịch vụ tiện ích gia đình khác",
            "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599722/other_services_ozqdxk.png",
            "isActive": true,
            "serviceCount": 2
        }
    ]
  }
  ```
- **Status Code**: 200 OK

---

### Test Case 2: Không có quyền truy cập
- **Test Case ID**: TC_CATEGORY_002
- **Description**: Người dùng không có quyền "service.view" truy cập endpoint
- **Preconditions**: Token hợp lệ, không có quyền "service.view"
- **Input**:
  - **Method**: GET
  - **URL**: `/api/v1/customer/categories`
  - **Headers**: `Authorization: Bearer <token_without_service_permission>`
- **Output**:
  ```json
  {
    "success": false,
    "message": "Không có quyền xem danh mục dịch vụ",
    "data": null
  }
  ```
- **Status Code**: 403 Forbidden

---

## GET /categories/{categoryId}/services - Lấy danh mục kèm dịch vụ

### Test Case 3: Lấy danh mục và dịch vụ thành công
- **Test Case ID**: TC_CATEGORY_003
- **Description**: Lấy thông tin danh mục và các dịch vụ thuộc danh mục
- **Preconditions**: Token hợp lệ, có quyền "service.view", categoryId tồn tại và active
- **Input**:
  - **Method**: GET
  - **URL**: `/api/v1/customer/categories/1/services`
  - **Headers**: `Authorization: Bearer <valid_customer_token>`
- **Output**:
  ```json
  {
    "success": true,
    "message": "Lấy thông tin danh mục và dịch vụ thành công",
    "data": {
        "categoryId": 1,
        "categoryName": "Dọn dẹp nhà",
        "description": "Các dịch vụ liên quan đến vệ sinh, làm sạch nhà cửa",
        "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599581/house_cleaning_nob_umewqf.png",
        "services": [
            {
                "serviceId": 1,
                "name": "Dọn dẹp theo giờ",
                "description": "Lau dọn, hút bụi, làm sạch các bề mặt cơ bản trong nhà. Phù hợp cho nhu cầu duy trì vệ sinh hàng tuần.",
                "basePrice": 50000.00,
                "unit": "Giờ",
                "estimatedDurationHours": 2.00,
                "recommendedStaff": 1,
                "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599899/Cleaning_Clock_z29juh.png",
                "isActive": true
            },
            {
                "serviceId": 2,
                "name": "Tổng vệ sinh",
                "description": "Làm sạch sâu toàn diện, bao gồm các khu vực khó tiếp cận, trần nhà, lau cửa kính. Thích hợp cho nhà mới hoặc dọn dẹp theo mùa.",
                "basePrice": 100000.00,
                "unit": "Gói",
                "estimatedDurationHours": 2.00,
                "recommendedStaff": 3,  
                "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599581/house_cleaning_nob_umewqf.png",
                "isActive": true
            },
            {
                "serviceId": 4,
                "name": "Vệ sinh máy lạnh",
                "description": "Bảo trì, làm sạch dàn nóng và dàn lạnh, bơm gas nếu cần.",
                "basePrice": 150000.00,
                "unit": "Máy",
                "estimatedDurationHours": 1.00,
                "recommendedStaff": 1,
                "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757600733/cooler_rnyppn.png",
                "isActive": true
            },
            {
                "serviceId": 3,
                "name": "Vệ sinh Sofa - Nệm - Rèm",
                "description": "Giặt sạch và khử khuẩn Sofa, Nệm, Rèm cửa bằng máy móc chuyên dụng.",
                "basePrice": 300000.00,
                "unit": "Gói",
                "estimatedDurationHours": 3.00,
                "recommendedStaff": 2,
                "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757600057/sofa_bed_vkkjz8.png",
                "isActive": true
            }
        ]
    }
  }
  ```
- **Status Code**: 200 OK

---

### Test Case 4: Danh mục không tồn tại
- **Test Case ID**: TC_CATEGORY_004
- **Description**: Truy vấn categoryId không tồn tại hoặc không active
- **Preconditions**: Token hợp lệ, có quyền "service.view", categoryId không tồn tại
- **Input**:
  - **Method**: GET
  - **URL**: `/api/v1/customer/categories/999/services`
  - **Headers**: `Authorization: Bearer <valid_customer_token>`
- **Output**:
  ```json
  {
    "success": false,
    "message": "Không tìm thấy danh mục dịch vụ",
    "data": null
  }
  ```
- **Status Code**: 404 Not Found

---

## GET /categories/{categoryId}/count - Đếm số lượng dịch vụ trong danh mục

### Test Case 5: Đếm số lượng dịch vụ thành công
- **Test Case ID**: TC_CATEGORY_005
- **Description**: Lấy số lượng dịch vụ active trong một danh mục
- **Preconditions**: Token hợp lệ, có quyền "service.view", categoryId tồn tại
- **Input**:
  - **Method**: GET
  - **URL**: `/api/v1/customer/categories/1/count`
  - **Headers**: `Authorization: Bearer <valid_customer_token>`
- **Output**:
  ```json
  {
    "success": true,
    "message": "Lấy số lượng dịch vụ trong danh mục thành công",
    "data": {
      "categoryId": 1,
      "serviceCount": 4
    }
  }
  ```
- **Status Code**: 200 OK

---

### Test Case 6: Token không hợp lệ
- **Test Case ID**: TC_CATEGORY_006
- **Description**: Thiếu hoặc sai Authorization header
- **Preconditions**: Không có hoặc token sai
- **Input**:
  - **Method**: GET
  - **URL**: `/api/v1/customer/categories`
  - **Headers**: Không có Authorization
- **Output**:
  ```json
  {
    "success": false,
    "message": "Token không hợp lệ",
    "data": null
  }
  ```
- **Status Code**: 400 Bad Request

---

### Test Case 7: Lỗi hệ thống (service layer exception)
- **Test Case ID**: TC_CATEGORY_007
- **Description**: Service layer gặp lỗi, trả về lỗi hệ thống
- **Preconditions**: Token hợp lệ, có quyền "service.view", mô phỏng lỗi DB/service
- **Input**:
  - **Method**: GET
  - **URL**: `/api/v1/customer/categories`
  - **Headers**: `Authorization: Bearer <valid_customer_token>`
  - **Simulation**: Lỗi DB
- **Output**:
  ```json
  {
    "success": false,
    "message": "Lỗi khi lấy danh sách danh mục dịch vụ",
    "data": null
  }
  ```
- **Status Code**: 500 Internal Server Error

---

## Notes
- Chỉ test các case tối thiểu, mỗi endpoint 1-2 case
- Đảm bảo test đủ các luồng: thành công, không quyền, không tồn tại, lỗi hệ thống, token sai
- Dữ liệu test dựa trên v6.sql (ít nhất 1 category, 1 service active)
- Response format và message theo đúng controller/serviceImpl
