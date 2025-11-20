# API Test Cases - Vietnam Address API

## API Endpoints Covered
1. **GET /api/v1/addresses/vietnam** - Get All Vietnam Communes/Wards
2. **GET /api/v1/addresses/{effectiveDate}/provinces/{provinceId}/communes** - Get Communes by Province and Date
3. **GET /api/v1/addresses/{effectiveDate}/provinces** - Get Provinces by Date

---

## GET /api/v1/addresses/vietnam - Get All Vietnam Communes/Wards

### Test Case 1: Successfully Get All Communes (Latest Data)
- **Test Case ID**: TC_VIETNAM_ADDRESS_001
- **Description**: Verify that the system can retrieve all communes/wards from Vietnam address database with latest data.
- **Preconditions**: 
  - External API (https://production.cas.so/address-kit) is accessible.
  - No authentication required (public endpoint).
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/addresses/vietnam`
  - **Headers**: None required
- **Expected Output**:
  ```json
  [
    {
      "code": "00001",
      "name": "Phường Phúc Xá",
      "englishName": "",
      "administrativeLevel": "Phường",
      "provinceCode": "01",
      "provinceName": "Thành phố Hà Nội",
      "decree": ""
    },
    {
      "code": "00004",
      "name": "Phường Trúc Bạch",
      "englishName": "",
      "administrativeLevel": "Phường",
      "provinceCode": "01",
      "provinceName": "Thành phố Hà Nội",
      "decree": ""
    },
    {
      "code": "00006",
      "name": "Phường Vĩnh Phúc",
      "englishName": "",
      "administrativeLevel": "Phường",
      "provinceCode": "01",
      "provinceName": "Thành phố Hà Nội",
      "decree": ""
    }
  ]
  ```
- **Status Code**: `200 OK`
- **Notes**: 
  - Data is cached in Redis for 24 hours.
  - Response contains all communes/wards across Vietnam (typically 10,000+ entries).

### Test Case 2: No Data Available
- **Test Case ID**: TC_VIETNAM_ADDRESS_002
- **Description**: Verify system behavior when no address data is available.
- **Preconditions**: 
  - External API returns empty response or is temporarily unavailable.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/addresses/vietnam`
- **Expected Output**:
  ```json
  "No address data available"
  ```
- **Status Code**: `204 NO CONTENT`

### Test Case 3: External API Error
- **Test Case ID**: TC_VIETNAM_ADDRESS_003
- **Description**: Verify error handling when external API fails.
- **Preconditions**: 
  - External API is down or returns error.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/addresses/vietnam`
- **Expected Output**:
  ```json
  "Error retrieving address data: [error message]"
  ```
- **Status Code**: `500 INTERNAL SERVER ERROR`

---

## GET /api/v1/addresses/{effectiveDate}/provinces/{provinceId}/communes - Get Communes by Province

### Test Case 4: Successfully Get Communes for Hanoi
- **Test Case ID**: TC_PROVINCE_COMMUNES_001
- **Description**: Verify that the system can retrieve all communes for a specific province (Hà Nội) at a given effective date.
- **Preconditions**: 
  - External API is accessible.
  - No authentication required (public endpoint).
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/addresses/2025-06-16/provinces/01/communes`
  - **Path Parameters**:
    - `effectiveDate`: `2025-06-16` (format: yyyy-MM-dd)
    - `provinceId`: `01` (Hà Nội)
- **Expected Output**:
  ```json
  [
    {
      "code": "00001",
      "name": "Phường Phúc Xá",
      "englishName": "",
      "administrativeLevel": "Phường",
      "provinceCode": "01",
      "provinceName": "Thành phố Hà Nội",
      "decree": ""
    },
    {
      "code": "00004",
      "name": "Phường Trúc Bạch",
      "englishName": "",
      "administrativeLevel": "Phường",
      "provinceCode": "01",
      "provinceName": "Thành phố Hà Nội",
      "decree": ""
    }
  ]
  ```
- **Status Code**: `200 OK`
- **Notes**: 
  - Data is cached with key: `{effectiveDate}_{provinceId}` (e.g., `2025-06-16_01`).
  - Response contains only communes belonging to specified province.

### Test Case 5: Successfully Get Communes for Ho Chi Minh City
- **Test Case ID**: TC_PROVINCE_COMMUNES_002
- **Description**: Verify retrieval of communes for Ho Chi Minh City.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/addresses/2025-06-16/provinces/79/communes`
  - **Path Parameters**:
    - `effectiveDate`: `2025-06-16`
    - `provinceId`: `79` (TP. Hồ Chí Minh)
- **Expected Output**:
  ```json
  [
    {
      "code": "26734",
      "name": "Phường Tân Định",
      "englishName": "",
      "administrativeLevel": "Phường",
      "provinceCode": "79",
      "provinceName": "Thành phố Hồ Chí Minh",
      "decree": ""
    },
    {
      "code": "26737",
      "name": "Phường Đa Kao",
      "englishName": "",
      "administrativeLevel": "Phường",
      "provinceCode": "79",
      "provinceName": "Thành phố Hồ Chí Minh",
      "decree": ""
    }
  ]
  ```
- **Status Code**: `200 OK`

### Test Case 6: Invalid Province ID
- **Test Case ID**: TC_PROVINCE_COMMUNES_003
- **Description**: Verify system behavior when provided with invalid or non-existent province ID.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/addresses/2025-06-16/provinces/99/communes`
  - **Path Parameters**:
    - `effectiveDate`: `2025-06-16`
    - `provinceId`: `99` (invalid)
- **Expected Output**:
  ```json
  "No communes found for the specified province and date"
  ```
- **Status Code**: `204 NO CONTENT`

### Test Case 7: Invalid Date Format
- **Test Case ID**: TC_PROVINCE_COMMUNES_004
- **Description**: Verify error handling with invalid date format.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/addresses/2025-13-45/provinces/01/communes`
  - **Path Parameters**:
    - `effectiveDate`: `2025-13-45` (invalid date)
    - `provinceId`: `01`
- **Expected Output**:
  ```json
  "Error retrieving communes: [error message]"
  ```
- **Status Code**: `500 INTERNAL SERVER ERROR`

---

## GET /api/v1/addresses/{effectiveDate}/provinces - Get Provinces by Date

### Test Case 8: Successfully Get All Provinces
- **Test Case ID**: TC_PROVINCES_001
- **Description**: Verify that the system can retrieve all provinces/cities at a given effective date.
- **Preconditions**: 
  - External API is accessible.
  - No authentication required (public endpoint).
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/addresses/2025-06-16/provinces`
  - **Path Parameters**:
    - `effectiveDate`: `2025-06-16` (format: yyyy-MM-dd)
- **Expected Output**:
  ```json
  [
    {
      "code": "01",
      "name": "Thành phố Hà Nội",
      "englishName": "",
      "administrativeLevel": "Thành phố Trung ương",
      "decree": ""
    },
    {
      "code": "04",
      "name": "Tỉnh Cao Bằng",
      "englishName": "",
      "administrativeLevel": "Tỉnh",
      "decree": ""
    },
    {
      "code": "08",
      "name": "Tỉnh Tuyên Quang",
      "englishName": "",
      "administrativeLevel": "Tỉnh",
      "decree": "202/2025/QH15 - 12/06/2025"
    },
    {
      "code": "11",
      "name": "Tỉnh Điện Biên",
      "englishName": "",
      "administrativeLevel": "Tỉnh",
      "decree": "202/2025/QH15 - 12/06/2025"
    },
    {
      "code": "31",
      "name": "Thành phố Hải Phòng",
      "englishName": "",
      "administrativeLevel": "Thành phố Trung ương",
      "decree": "202/2025/QH15 - 12/06/2025"
    },
    {
      "code": "48",
      "name": "Thành phố Đà Nẵng",
      "englishName": "",
      "administrativeLevel": "Thành phố Trung ương",
      "decree": "202/2025/QH15 - 12/06/2025"
    },
    {
      "code": "79",
      "name": "Thành phố Hồ Chí Minh",
      "englishName": "",
      "administrativeLevel": "Thành phố Trung ương",
      "decree": "202/2025/QH15 - 12/06/2025"
    },
    {
      "code": "92",
      "name": "Thành phố Cần Thơ",
      "englishName": "",
      "administrativeLevel": "Thành phố Trung ương",
      "decree": "202/2025/QH15 - 12/06/2025"
    }
  ]
  ```
- **Status Code**: `200 OK`
- **Notes**: 
  - Data is cached with key: `{effectiveDate}` (e.g., `2025-06-16`).
  - Response contains all 63 provinces/cities of Vietnam.
  - `administrativeLevel` can be:
    - "Thành phố Trung ương" (Central-controlled city)
    - "Tỉnh" (Province)

### Test Case 9: No Provinces Found
- **Test Case ID**: TC_PROVINCES_002
- **Description**: Verify system behavior when no provinces are found for the specified date.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/addresses/1900-01-01/provinces`
  - **Path Parameters**:
    - `effectiveDate`: `1900-01-01` (very old date)
- **Expected Output**:
  ```json
  "No provinces found for the specified date"
  ```
- **Status Code**: `204 NO CONTENT`

### Test Case 10: Invalid Date Format for Provinces
- **Test Case ID**: TC_PROVINCES_003
- **Description**: Verify error handling with invalid date format.
- **Input**:
  - **Method**: `GET`
  - **URL**: `/api/v1/addresses/invalid-date/provinces`
  - **Path Parameters**:
    - `effectiveDate`: `invalid-date`
- **Expected Output**:
  ```json
  "Error retrieving provinces: [error message]"
  ```
- **Status Code**: `500 INTERNAL SERVER ERROR`

---

## Common Province Codes Reference

| Province Code | Province Name | Administrative Level |
|--------------|---------------|---------------------|
| 01 | Thành phố Hà Nội | Thành phố Trung ương |
| 31 | Thành phố Hải Phòng | Thành phố Trung ương |
| 48 | Thành phố Đà Nẵng | Thành phố Trung ương |
| 79 | Thành phố Hồ Chí Minh | Thành phố Trung ương |
| 92 | Thành phố Cần Thơ | Thành phố Trung ương |
| 04 | Tỉnh Cao Bằng | Tỉnh |
| 08 | Tỉnh Tuyên Quang | Tỉnh |
| 22 | Tỉnh Quảng Ninh | Tỉnh |
| 56 | Tỉnh Khánh Hòa | Tỉnh |
| 68 | Tỉnh Lâm Đồng | Tỉnh |

---

## Technical Notes

### Caching Strategy
- **Cache Name**: 
  - `vietnamAddressCache` - for all communes (latest)
  - `provinceCommunesCache` - for province-specific communes
  - `provincesCache` - for provinces list
- **Cache TTL**: 24 hours
- **Cache Key Format**:
  - All communes: Static key
  - Province communes: `{effectiveDate}_{provinceId}` (e.g., `2025-06-16_01`)
  - Provinces: `{effectiveDate}` (e.g., `2025-06-16`)

### External API Integration
- **Base URL**: `https://production.cas.so/address-kit`
- **Endpoints Used**:
  - `/latest/communes` - Get all latest communes
  - `/{effectiveDate}/provinces/{provinceID}/communes` - Get province communes
  - `/{effectiveDate}/provinces` - Get provinces list

### Security Configuration
- All endpoints under `/api/v1/addresses/**` are publicly accessible
- No authentication required
- Rate limiting may be applied at infrastructure level

### Data Validation
- `effectiveDate` format: `yyyy-MM-dd` (e.g., `2025-06-16`)
- `provinceId` format: Two-digit string (e.g., `01`, `79`)
- Response data validated against DTO schemas

### Error Handling
- **HTTP 200**: Successful data retrieval
- **HTTP 204**: No data found for request
- **HTTP 500**: Server error or external API failure

### Performance Considerations
- First request may take 2-3 seconds (external API call)
- Subsequent requests served from cache (~50ms response time)
- All communes endpoint returns large payload (10,000+ entries)
- Consider pagination if frontend performance is impacted
