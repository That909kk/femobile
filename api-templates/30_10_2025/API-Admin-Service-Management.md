# Admin Service Management API

Tài liệu này mô tả các API endpoints cho Admin để quản lý dịch vụ (Services), Service Options, Service Option Choices và Pricing Rules.

## Base URL
```
/api/v1/admin/services
```

## Authentication
Tất cả các endpoints yêu cầu:
- Header: `Authorization: Bearer <token>`
- Role: `ADMIN`

---

## 1. QUẢN LÝ DỊCH VỤ (SERVICES)

### 1.1. Lấy danh sách dịch vụ (có phân trang)
```http
GET /api/v1/admin/services?page=0&size=10&sortBy=name&sortDir=asc
```

**Query Parameters:**
- `page` (optional, default: 0): Số trang
- `size` (optional, default: 10): Số lượng items trên mỗi trang
- `sortBy` (optional, default: "name"): Trường để sắp xếp (name, basePrice, createdAt, etc.)
- `sortDir` (optional, default: "asc"): Hướng sắp xếp (asc/desc)

**Response:**
```json
{
   "data": [
      {
         "serviceId": 8,
         "name": "Đi chợ hộ",
         "description": "Mua sắm và giao hàng tận nơi theo danh sách của bạn.",
         "basePrice": 50000.00,
         "unit": "Lần",
         "estimatedDurationHours": 1.00,
         "recommendedStaff": 1,
         "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757601712/shopping_etf5iz.png",
         "isActive": true,
         "categoryId": 3,
         "categoryName": "Việc nhà khác",
         "optionsCount": 0,
         "pricingRulesCount": 0
      },
      {
         "serviceId": 1,
         "name": "Dọn dẹp theo giờ",
         "description": "Lau dọn, hút bụi, làm sạch các bề mặt cơ bản trong nhà. Phù hợp cho nhu cầu duy trì vệ sinh hàng tuần.",
         "basePrice": 60000.00,
         "unit": "Giờ",
         "estimatedDurationHours": 2.00,
         "recommendedStaff": 1,
         "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599899/Cleaning_Clock_z29juh.png",
         "isActive": true,
         "categoryId": 1,
         "categoryName": "Dọn dẹp nhà",
         "optionsCount": 1,
         "pricingRulesCount": 3
      },
      {
         "serviceId": 6,
         "name": "Giặt hấp cao cấp",
         "description": "Giặt khô cho các loại vải cao cấp như vest, áo dài, lụa.",
         "basePrice": 150000.00,
         "unit": "Bộ",
         "estimatedDurationHours": 48.00,
         "recommendedStaff": 1,
         "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757601414/vest_2_kfigzg.png",
         "isActive": true,
         "categoryId": 2,
         "categoryName": "Giặt ủi",
         "optionsCount": 1,
         "pricingRulesCount": 2
      },
      {
         "serviceId": 5,
         "name": "Giặt sấy theo kg",
         "description": "Giặt và sấy khô quần áo thông thường, giao nhận tận nơi.",
         "basePrice": 25000.00,
         "unit": "Kg",
         "estimatedDurationHours": 24.00,
         "recommendedStaff": 1,
         "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757601210/shirt_nmee0d.png",
         "isActive": true,
         "categoryId": 2,
         "categoryName": "Giặt ủi",
         "optionsCount": 1,
         "pricingRulesCount": 1
      },
      {
         "serviceId": 7,
         "name": "Nấu ăn gia đình",
         "description": "Đi chợ (chi phí thực phẩm tính riêng) và chuẩn bị bữa ăn cho gia đình theo thực đơn yêu cầu.",
         "basePrice": 80000.00,
         "unit": "Giờ",
         "estimatedDurationHours": 2.50,
         "recommendedStaff": 1,
         "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757601546/pan_ysmoql.png",
         "isActive": true,
         "categoryId": 3,
         "categoryName": "Việc nhà khác",
         "optionsCount": 1,
         "pricingRulesCount": 0
      },
      {
         "serviceId": 2,
         "name": "Tổng vệ sinh",
         "description": "Làm sạch sâu toàn diện, bao gồm các khu vực khó tiếp cận, trần nhà, lau cửa kính. Thích hợp cho nhà mới hoặc dọn dẹp theo mùa.",
         "basePrice": 500000.00,
         "unit": "Gói",
         "estimatedDurationHours": 2.00,
         "recommendedStaff": 1,
         "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599581/house_cleaning_nob_umewqf.png",
         "isActive": true,
         "categoryId": 1,
         "categoryName": "Dọn dẹp nhà",
         "optionsCount": 3,
         "pricingRulesCount": 1
      },
      {
         "serviceId": 4,
         "name": "Vệ sinh máy lạnh",
         "description": "Bảo trì, làm sạch dàn nóng và dàn lạnh, bơm gas nếu cần.",
         "basePrice": 200000.00,
         "unit": "Máy",
         "estimatedDurationHours": 1.00,
         "recommendedStaff": 1,
         "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757600733/cooler_rnyppn.png",
         "isActive": true,
         "categoryId": 1,
         "categoryName": "Dọn dẹp nhà",
         "optionsCount": 2,
         "pricingRulesCount": 2
      },
      {
         "serviceId": 3,
         "name": "Vệ sinh Sofa - Nệm - Rèm",
         "description": "Giặt sạch và khử khuẩn Sofa, Nệm, Rèm cửa bằng máy móc chuyên dụng.",
         "basePrice": 350000.00,
         "unit": "Gói",
         "estimatedDurationHours": 3.00,
         "recommendedStaff": 1,
         "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757600057/sofa_bed_vkkjz8.png",
         "isActive": true,
         "categoryId": 1,
         "categoryName": "Dọn dẹp nhà",
         "optionsCount": 1,
         "pricingRulesCount": 2
      }
   ],
   "success": true,
   "currentPage": 0,
   "totalItems": 8,
   "totalPages": 1
}
```

### 1.2. Lấy thông tin chi tiết dịch vụ
```http
GET /api/v1/admin/services/{serviceId}
```

**Response:**
```json
{
   "data": {
      "serviceId": 1,
      "name": "Dọn dẹp theo giờ",
      "description": "Lau dọn, hút bụi, làm sạch các bề mặt cơ bản trong nhà. Phù hợp cho nhu cầu duy trì vệ sinh hàng tuần.",
      "basePrice": 60000.00,
      "unit": "Giờ",
      "estimatedDurationHours": 2.00,
      "recommendedStaff": 1,
      "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599899/Cleaning_Clock_z29juh.png",
      "isActive": true,
      "categoryId": 1,
      "categoryName": "Dọn dẹp nhà",
      "optionsCount": 1,
      "pricingRulesCount": 3
   },
   "success": true
}
```

### 1.3. Tạo dịch vụ mới
```http
POST /api/v1/admin/services
Content-Type: multipart/form-data
```

**FormData:**
```json
{
  "name": "Vệ sinh nhà cửa",
  "description": "Dịch vụ vệ sinh tổng thể",
  "basePrice": "200000",
  "unit": "giờ",
  "estimatedDurationHours": "2.5",
  "recommendedStaff": "2",
  "categoryId": "1",
  "icon": "<FILE>"
}
```

**Mô tả các field:**
- `name`: String (bắt buộc) - Tên dịch vụ, tối đa 100 ký tự
- `basePrice`: String (bắt buộc) - Giá cơ bản (số), phải > 0
- `unit`: String (bắt buộc) - Đơn vị, tối đa 20 ký tự
- `recommendedStaff`: String (bắt buộc) - Số nhân viên khuyến nghị (số), phải >= 1
- `categoryId`: String (bắt buộc) - ID category (số)
- `description`: String (tùy chọn) - Mô tả, tối đa 1000 ký tự
- `estimatedDurationHours`: String (tùy chọn) - Thời gian ước tính (số), phải >= 0
- `icon`: File (tùy chọn) - File ảnh icon (jpg, png, gif, webp)

**Ví dụ sử dụng với Postman:**
1. Method: POST
2. URL: `http://localhost:8080/api/v1/admin/services`
3. Headers: `Authorization: Bearer YOUR_TOKEN`
4. Body: chọn `form-data`
5. Thêm các key-value:
   - name: Vệ sinh nhà cửa
   - basePrice: 200000
   - unit: giờ
   - recommendedStaff: 2
   - categoryId: 1
   - description: Dịch vụ vệ sinh tổng thể
   - estimatedDurationHours: 2.5
   - icon: (chọn type File và browse file ảnh)

**Response:**
```json
{
  "success": true,
  "message": "Tạo dịch vụ thành công",
  "data": {
    "serviceId": 999,
    "name": "Vệ sinh nhà cửa",
    "description": "Dịch vụ vệ sinh tổng thể",
    "basePrice": 200000.00,
    "unit": "giờ",
    "estimatedDurationHours": 2.5,
    "recommendedStaff": 2,
    "iconUrl": "https://res.cloudinary.com/xxx/image/upload/v123/services/icons/xxx.png",
    "isActive": true,
    "categoryId": 1,
    "categoryName": "Dọn dẹp nhà",
    "optionsCount": 0,
    "pricingRulesCount": 0
  }
}
```

**Note:** 
- Icon sẽ được upload lên Cloudinary vào folder `services/icons`
- Nếu không upload icon, dịch vụ sẽ được tạo mà không có iconUrl
- Tất cả các giá trị số phải gửi dưới dạng String

### 1.4. Cập nhật dịch vụ
```http
PUT /api/v1/admin/services/{serviceId}
Content-Type: multipart/form-data
```

**FormData:** (Tất cả các trường đều tùy chọn)
```json
{
  "name": "Vệ sinh nhà cửa - Updated",
  "description": "Mô tả mới",
  "basePrice": "250000",
  "unit": "giờ",
  "estimatedDurationHours": "3.0",
  "recommendedStaff": "3",
  "categoryId": "2",
  "isActive": "true",
  "icon": "<FILE>"
}
```

**Mô tả các field:**
- `name`: String - Tên dịch vụ, tối đa 100 ký tự
- `basePrice`: String - Giá cơ bản (số), phải > 0
- `unit`: String - Đơn vị, tối đa 20 ký tự
- `recommendedStaff`: String - Số nhân viên khuyến nghị (số), phải >= 1
- `categoryId`: String - ID category (số)
- `description`: String - Mô tả, tối đa 1000 ký tự
- `estimatedDurationHours`: String - Thời gian ước tính (số), phải >= 0
- `isActive`: String - Trạng thái ("true" hoặc "false")
- `icon`: File - File ảnh icon mới (jpg, png, gif, webp)

**Response:**
```json
{
  "success": true,
  "message": "Cập nhật dịch vụ thành công",
  "data": {
    "serviceId": 1,
    "name": "Vệ sinh nhà cửa - Updated",
    "description": "Mô tả mới",
    "basePrice": 250000.00,
    "unit": "giờ",
    "estimatedDurationHours": 3.0,
    "recommendedStaff": 3,
    "iconUrl": "https://res.cloudinary.com/xxx/image/upload/v123/services/icons/new-xxx.png",
    "isActive": true,
    "categoryId": 2,
    "categoryName": "Giặt ủi",
    "optionsCount": 5,
    "pricingRulesCount": 3
  }
}
```

### 1.5. Xóa dịch vụ (Soft Delete)
```http
DELETE /api/v1/admin/services/{serviceId}
```

**Note:** Đây là soft delete, chỉ set `isActive = false`

**Response:**
```json
{
  "success": true,
  "message": "Xóa dịch vụ thành công"
}
```

### 1.6. Kích hoạt lại dịch vụ
```http
PATCH /api/v1/admin/services/{serviceId}/activate
```

**Response:**
```json
{
  "success": true,
  "message": "Kích hoạt dịch vụ thành công",
  "data": {
    "serviceId": 1,
    "name": "Dọn dẹp theo giờ",
    "description": "Lau dọn, hút bụi, làm sạch các bề mặt cơ bản trong nhà. Phù hợp cho nhu cầu duy trì vệ sinh hàng tuần.",
    "basePrice": 60000.00,
    "unit": "Giờ",
    "estimatedDurationHours": 2.00,
    "recommendedStaff": 1,
    "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757599899/Cleaning_Clock_z29juh.png",
    "isActive": true,
    "categoryId": 1,
    "categoryName": "Dọn dẹp nhà",
    "optionsCount": 1,
    "pricingRulesCount": 3
  }
}
```

---

## 2. QUẢN LÝ SERVICE OPTIONS

### 2.1. Lấy danh sách options của một dịch vụ
```http
GET /api/v1/admin/services/{serviceId}/options
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "optionId": 1,
      "serviceId": 1,
      "serviceName": "Vệ sinh nhà cửa",
      "label": "Loại nhà",
      "optionType": "SINGLE_CHOICE",
      "displayOrder": 1,
      "isRequired": true,
      "isActive": true,
      "parentOptionId": null,
      "parentChoiceId": null,
      "validationRules": {},
      "choices": [
        {
          "choiceId": 1,
          "optionId": 1,
          "label": "Căn hộ",
          "isDefault": true,
          "isActive": true,
          "displayOrder": 1
        }
      ]
    }
  ]
}
```

### 2.2. Lấy thông tin chi tiết một option
```http
GET /api/v1/admin/services/options/{optionId}
```

**Response**
```json
{
    "data": {
        "optionId": 1,
        "serviceId": 2,
        "serviceName": "Tổng vệ sinh",
        "label": "Loại hình nhà ở?",
        "optionType": "SINGLE_CHOICE_RADIO",
        "displayOrder": 1,
        "isRequired": true,
        "isActive": true,
        "parentOptionId": null,
        "parentChoiceId": null,
        "validationRules": null,
        "choices": [
            {
                "choiceId": 1,
                "optionId": 1,
                "label": "Căn hộ",
                "isDefault": false,
                "isActive": true,
                "displayOrder": null
            },
            {
                "choiceId": 2,
                "optionId": 1,
                "label": "Nhà phố",
                "isDefault": false,
                "isActive": true,
                "displayOrder": null
            }
        ]
    },
    "success": true
}
```

### 2.3. Tạo Service Option mới
```http
POST /api/v1/admin/services/options
```

**Request Body:**
```json
{
  "serviceId": 1,
  "label": "Loại nhà",
  "optionType": "SINGLE_CHOICE",
  "displayOrder": 1,
  "isRequired": true,
  "parentOptionId": null,
  "parentChoiceId": null,
  "validationRules": {
    "min": 1,
    "max": 10
  }
}
```

**Option Types:**
- `SINGLE_CHOICE`: Chọn một
- `MULTIPLE_CHOICE`: Chọn nhiều
- `NUMERIC_INPUT`: Nhập số
- `TEXT_INPUT`: Nhập text

**Validation:**
- `serviceId`: Bắt buộc
- `label`: Bắt buộc, tối đa 255 ký tự
- `optionType`: Bắt buộc

**Response:**
```json
{
  "success": true,
  "message": "Tạo tùy chọn dịch vụ thành công",
  "data": {
    "optionId": 1,
    "serviceId": 1,
    "serviceName": "Dọn dẹp theo giờ",
    "label": "Loại nhà",
    "optionType": "SINGLE_CHOICE",
    "displayOrder": 1,
    "isRequired": true,
    "isActive": true,
    "parentOptionId": null,
    "parentChoiceId": null,
    "validationRules": {
      "min": 1,
      "max": 10
    },
    "choices": []
  }
}
```

### 2.4. Cập nhật Service Option
```http
PUT /api/v1/admin/services/options/{optionId}
```

**Request Body:** (Tất cả các trường đều optional)
```json
{
  "label": "Loại nhà - Updated",
  "optionType": "MULTIPLE_CHOICE",
  "displayOrder": 2,
  "isRequired": false,
  "isActive": true,
  "validationRules": {}
}
```

### 2.5. Xóa Service Option
```http
DELETE /api/v1/admin/services/options/{optionId}
```

**Note:** Đây là hard delete. Sẽ xóa luôn option và các choices liên quan (CASCADE)

**Response:**
```json
{
  "success": true,
  "message": "Xóa tùy chọn dịch vụ thành công"
}
```

---

## 3. QUẢN LÝ SERVICE OPTION CHOICES

### 3.1. Lấy danh sách choices của một option
```http
GET /api/v1/admin/services/options/{optionId}/choices
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "choiceId": 1,
      "optionId": 1,
      "label": "Căn hộ",
      "isDefault": true,
      "isActive": true,
      "displayOrder": 1
    },
    {
      "choiceId": 2,
      "optionId": 1,
      "label": "Nhà phố",
      "isDefault": false,
      "isActive": true,
      "displayOrder": 2
    }
  ]
}
```

### 3.2. Lấy thông tin chi tiết một choice
```http
GET /api/v1/admin/services/choices/{choiceId}
```

**Response**
```json
{
    "data": {
        "choiceId": 1,
        "optionId": 1,
        "label": "Căn hộ",
        "isDefault": false,
        "isActive": true,
        "displayOrder": null
    },
    "success": true
}
```

### 3.3. Tạo Service Option Choice mới
```http
POST /api/v1/admin/services/choices
```

**Request Body:**
```json
{
  "optionId": 1,
  "label": "Căn hộ",
  "isDefault": true,
  "displayOrder": 1
}
```

**Validation:**
- `optionId`: Bắt buộc
- `label`: Bắt buộc, tối đa 255 ký tự
- `isDefault`: Tùy chọn, default = false
- `displayOrder`: Tùy chọn

**Response:**
```json
{
  "success": true,
  "message": "Tạo lựa chọn thành công",
  "data": {
    "choiceId": 1,
    "optionId": 1,
    "label": "Căn hộ",
    "isDefault": true,
    "isActive": true,
    "displayOrder": 1
  }
}
```

### 3.4. Cập nhật Service Option Choice
```http
PUT /api/v1/admin/services/choices/{choiceId}
```

**Request Body:** (Tất cả các trường đều optional)
```json
{
  "label": "Căn hộ chung cư",
  "isDefault": false,
  "isActive": true,
  "displayOrder": 2
}
```

### 3.5. Xóa Service Option Choice
```http
DELETE /api/v1/admin/services/choices/{choiceId}
```

**Note:** Đây là hard delete.

**Response:**
```json
{
  "success": true,
  "message": "Xóa lựa chọn thành công"
}
```

---

## 4. QUẢN LÝ PRICING RULES

### 4.1. Lấy danh sách pricing rules của một dịch vụ
```http
GET /api/v1/admin/services/{serviceId}/pricing-rules
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "ruleId": 1,
      "serviceId": 1,
      "serviceName": "Vệ sinh nhà cửa",
      "ruleName": "Tăng giá cuối tuần",
      "conditionLogic": "AND",
      "priority": 10,
      "isActive": true,
      "priceAdjustment": 50000,
      "staffAdjustment": 0,
      "durationAdjustmentHours": 0.5
    }
  ]
}
```

### 4.2. Lấy thông tin chi tiết một pricing rule
```http
GET /api/v1/admin/services/pricing-rules/{ruleId}
```

**Response**

```json
{
    "data": {
        "ruleId": 1,
        "serviceId": 2,
        "serviceName": "Tổng vệ sinh",
        "ruleName": "Phụ thu nhà phố lớn",
        "conditionLogic": "ALL",
        "priority": 10,
        "isActive": true,
        "priceAdjustment": 200000.00,
        "staffAdjustment": 1,
        "durationAdjustmentHours": 2.00
    },
    "success": true
}
```

### 4.3. Tạo Pricing Rule mới
```http
POST /api/v1/admin/services/pricing-rules
```

**Request Body:**
```json
{
  "serviceId": 1,
  "ruleName": "Tăng giá cuối tuần",
  "conditionLogic": "AND",
  "priority": 10,
  "priceAdjustment": 50000,
  "staffAdjustment": 1,
  "durationAdjustmentHours": 0.5
}
```

**Condition Logic:**
- `AND`: Tất cả điều kiện phải thỏa mãn
- `OR`: Một trong các điều kiện thỏa mãn

**Validation:**
- `serviceId`: Bắt buộc
- `ruleName`: Bắt buộc, tối đa 255 ký tự
- `priority`: Tùy chọn, default = 0 (số càng cao càng ưu tiên)
- `priceAdjustment`: Tùy chọn, default = 0 (số tiền điều chỉnh thêm/bớt)
- `staffAdjustment`: Tùy chọn, default = 0 (số nhân viên điều chỉnh)
- `durationAdjustmentHours`: Tùy chọn, default = 0 (thời gian điều chỉnh)

**Response:**
```json
{
  "success": true,
  "message": "Tạo quy tắc giá thành công",
  "data": {
    "ruleId": 1,
    "serviceId": 1,
    "serviceName": "Dọn dẹp theo giờ",
    "ruleName": "Tăng giá cuối tuần",
    "conditionLogic": "AND",
    "priority": 10,
    "isActive": true,
    "priceAdjustment": 50000,
    "staffAdjustment": 0,
    "durationAdjustmentHours": 0.5
  }
}
```

### 4.4. Cập nhật Pricing Rule
```http
PUT /api/v1/admin/services/pricing-rules/{ruleId}
```

**Request Body:** (Tất cả các trường đều optional)
```json
{
  "ruleName": "Tăng giá cuối tuần - Updated",
  "conditionLogic": "OR",
  "priority": 15,
  "isActive": true,
  "priceAdjustment": 75000,
  "staffAdjustment": 2,
  "durationAdjustmentHours": 1.0
}
```

### 4.5. Xóa Pricing Rule
```http
DELETE /api/v1/admin/services/pricing-rules/{ruleId}
```

**Note:** Đây là hard delete.

**Response:**
```json
{
  "success": true,
  "message": "Xóa quy tắc giá thành công"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error message"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Service không tồn tại với ID: 123"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Đã xảy ra lỗi khi xử lý yêu cầu"
}
```

---

## Use Cases

### 1. Tạo một dịch vụ hoàn chỉnh từ đầu đến cuối

**Bước 1: Tạo Service với icon**
```http
POST /api/v1/admin/services
Content-Type: multipart/form-data
Authorization: Bearer YOUR_TOKEN

FormData:
- name: Dọn dẹp văn phòng
- description: Dọn dẹp văn phòng hàng tuần, bao gồm lau bàn, hút bụi, đổ rác
- basePrice: 80000
- unit: Giờ
- estimatedDurationHours: 1.5
- recommendedStaff: 1
- categoryId: 1
- icon: [FILE]
```

**Bước 2: Tạo Service Options**

Tạo option đầu tiên - Loại văn phòng:
```http
POST /api/v1/admin/services/options
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "serviceId": 9,
  "label": "Loại văn phòng",
  "optionType": "SINGLE_CHOICE_RADIO",
  "displayOrder": 1,
  "isRequired": true
}
```

Tạo option thứ hai - Diện tích:
```http
POST /api/v1/admin/services/options
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "serviceId": 9,
  "label": "Diện tích văn phòng (m²)",
  "optionType": "NUMERIC_INPUT",
  "displayOrder": 2,
  "isRequired": true,
  "validationRules": {
    "min": 10,
    "max": 500
  }
}
```

**Bước 3: Tạo Option Choices cho option "Loại văn phòng"**
```http
POST /api/v1/admin/services/choices
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "optionId": 10,
  "label": "Văn phòng nhỏ (1-5 người)",
  "isDefault": true,
  "displayOrder": 1
}
```

```http
POST /api/v1/admin/services/choices
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "optionId": 10,
  "label": "Văn phòng trung (6-20 người)",
  "isDefault": false,
  "displayOrder": 2
}
```

```http
POST /api/v1/admin/services/choices
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "optionId": 10,
  "label": "Văn phòng lớn (>20 người)",
  "isDefault": false,
  "displayOrder": 3
}
```

**Bước 4: Tạo Pricing Rules**
```http
POST /api/v1/admin/services/pricing-rules
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "serviceId": 9,
  "ruleName": "Phụ thu cuối tuần",
  "conditionLogic": "AND",
  "priority": 10,
  "priceAdjustment": 30000,
  "staffAdjustment": 0,
  "durationAdjustmentHours": 0
}
```

### 2. Cập nhật service hiện có (bao gồm cả icon)

**Cập nhật thông tin service với icon mới:**
```http
PUT /api/v1/admin/services/1
Content-Type: multipart/form-data
Authorization: Bearer YOUR_TOKEN

FormData:
- name: Dọn dẹp theo giờ - Nâng cấp
- description: Dịch vụ dọn dẹp theo giờ với nhân viên được đào tạo chuyên nghiệp
- basePrice: 70000
- unit: Giờ
- estimatedDurationHours: 2.0
- recommendedStaff: 1
- categoryId: 1
- isActive: true
- icon: [FILE]
```

**Chỉ cập nhật một số thông tin (không đổi icon):**
```http
PUT /api/v1/admin/services/1
Content-Type: multipart/form-data
Authorization: Bearer YOUR_TOKEN

FormData:
- basePrice: 75000
- description: Mô tả mới
```

### 3. Vô hiệu hóa và kích hoạt lại dịch vụ

**Vô hiệu hóa dịch vụ (soft delete):**
```http
DELETE /api/v1/admin/services/8
Authorization: Bearer YOUR_TOKEN
```

Response:
```json
{
  "success": true,
  "message": "Xóa dịch vụ thành công"
}
```

**Kích hoạt lại dịch vụ:**
```http
PATCH /api/v1/admin/services/8/activate
Authorization: Bearer YOUR_TOKEN
```

Response:
```json
{
  "success": true,
  "message": "Kích hoạt dịch vụ thành công",
  "data": {
    "serviceId": 8,
    "name": "Đi chợ hộ",
    "description": "Mua sắm và giao hàng tận nơi theo danh sách của bạn.",
    "basePrice": 50000.00,
    "unit": "Lần",
    "estimatedDurationHours": 1.00,
    "recommendedStaff": 1,
    "iconUrl": "https://res.cloudinary.com/dkzemgit8/image/upload/v1757601712/shopping_etf5iz.png",
    "isActive": true,
    "categoryId": 3,
    "categoryName": "Việc nhà khác",
    "optionsCount": 0,
    "pricingRulesCount": 0
  }
}
```

### 4. Quản lý Service Options và Choices

**Lấy tất cả options của service "Tổng vệ sinh" (serviceId=2):**
```http
GET /api/v1/admin/services/2/options
Authorization: Bearer YOUR_TOKEN
```

**Cập nhật một option:**
```http
PUT /api/v1/admin/services/options/1
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "label": "Loại hình nhà ở? (Cập nhật)",
  "optionType": "SINGLE_CHOICE_RADIO",
  "displayOrder": 1,
  "isRequired": true
}
```

**Soft delete một option:**
```http
PUT /api/v1/admin/services/options/1
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "isActive": false
}
```

**Hard delete một choice:**
```http
DELETE /api/v1/admin/services/choices/5
Authorization: Bearer YOUR_TOKEN
```

### 5. Quản lý Pricing Rules

**Lấy tất cả pricing rules của service "Dọn dẹp theo giờ" (serviceId=1):**
```http
GET /api/v1/admin/services/1/pricing-rules
Authorization: Bearer YOUR_TOKEN
```

**Cập nhật pricing rule:**
```http
PUT /api/v1/admin/services/pricing-rules/1
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "ruleName": "Phụ thu nhà phố lớn - Điều chỉnh",
  "conditionLogic": "ALL",
  "priority": 15,
  "priceAdjustment": 250000,
  "staffAdjustment": 2,
  "durationAdjustmentHours": 2.5
}
```

**Soft delete một pricing rule:**
```http
PUT /api/v1/admin/services/pricing-rules/1
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "isActive": false
}
```

---

## Notes

1. **Soft Delete vs Hard Delete:**
   - Service: Soft delete (set `isActive = false`)
   - Service Options: Hard delete (CASCADE delete choices) - **Có thể soft delete bằng cách set `isActive = false` qua endpoint UPDATE**
   - Service Option Choices: Hard delete - **Có thể soft delete bằng cách set `isActive = false` qua endpoint UPDATE**
   - Pricing Rules: Hard delete - **Có thể soft delete bằng cách set `isActive = false` qua endpoint UPDATE**

2. **Cascade Delete:**
   - Khi xóa Service Option (hard delete), tất cả các Service Option Choices liên quan cũng sẽ bị xóa

3. **Soft Delete cho Options, Choices, và Pricing Rules:**
   - Mặc dù các endpoint DELETE vẫn thực hiện hard delete
   - Bạn có thể thực hiện soft delete bằng cách gọi endpoint UPDATE và set `isActive = false`
   - Ví dụ: `PUT /api/v1/admin/services/options/{optionId}` với body `{"isActive": false}`

4. **Sorting:**
   - Services có thể sort theo: name, basePrice, estimatedDurationHours, createdAt, etc.
   - Options và Choices được sort theo displayOrder

5. **Permissions:**
   - Chỉ ADMIN mới có quyền truy cập tất cả các endpoints này

6. **Cloudinary Upload:**
   - Tất cả icon được upload vào folder `services/icons` trên Cloudinary
   - File được chấp nhận: jpg, png, gif, webp
   - Khi upload icon mới, icon cũ vẫn tồn tại trên Cloudinary (không tự động xóa)
   - Cloudinary tự động tối ưu hóa ảnh và tạo secure URL (https)

7. **Multipart Form Data:**
   - Endpoint POST và PUT cho services sử dụng `multipart/form-data` để hỗ trợ upload icon
   - Tất cả các trường text phải được gửi dưới dạng String trong form-data
   - Số (basePrice, recommendedStaff, etc.) phải gửi dưới dạng String và sẽ được parse tự động
   - Boolean (isActive) phải gửi dưới dạng "true" hoặc "false"
   - Icon là optional - có thể tạo/cập nhật service mà không cần upload icon

8. **Data Consistency:**
   - Tất cả ví dụ trong tài liệu này sử dụng dữ liệu thực từ database
   - ServiceId từ 1-8 là các dịch vụ có sẵn trong hệ thống
   - CategoryId: 1 = "Dọn dẹp nhà", 2 = "Giặt ủi", 3 = "Việc nhà khác"

9. **isActive Field:**
   - Tất cả Service Options, Choices, và Pricing Rules đều có field `isActive` (default: true)
   - Field này cho phép soft delete thông qua endpoint UPDATE
   - Khi query data, có thể filter theo `isActive` để chỉ lấy các item đang active
