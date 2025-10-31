# API Test Cases - Booking Image Upload

## Overview
This document describes essential test cases for the **Booking Image Upload** endpoint using realistic data from the housekeeping service database.  
**Base URL**: `/api/v1/customer/bookings`  
**Test Date Context**: October 30, 2025

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
- **Content-Type**: `multipart/form-data`
- **Role Requirements**: CUSTOMER or ADMIN role

---

## API Endpoint Covered
**POST /{bookingId}/upload-image** - Upload Booking Image to Cloudinary

---

## POST /{bookingId}/upload-image - Upload Booking Image

### Test Case 1: Successful Image Upload
- **Test Case ID**: TC_BOOKING_IMG_001
- **Description**: Verify customer can successfully upload a valid image for their booking
- **Preconditions**:
  - Booking exists with ID 'b0000001-0000-0000-0000-000000000001'
  - Customer John Doe owns this booking
  - Valid JWT token with CUSTOMER role
  - Valid image file (JPEG, PNG) under 5MB
- **Input**:
  - **Path Parameter**: bookingId = "b0000001-0000-0000-0000-000000000001"
  - **Form Data**: 
    - file: booking_image.jpg (2.5MB, image/jpeg)
  - **Headers**: 
    ```
    Authorization: Bearer <john_doe_customer_token>
    Content-Type: multipart/form-data
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Tải ảnh lên thành công",
    "data": {
      "bookingId": "b0000001-0000-0000-0000-000000000001",
      "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1698652800/booking_images/abc123def456.jpg",
      "publicId": "booking_images/abc123def456"
    }
  }
  ```
- **Status Code**: 200 OK

### Test Case 2: Upload PNG Image
- **Test Case ID**: TC_BOOKING_IMG_002
- **Description**: Verify system accepts PNG format images
- **Preconditions**:
  - Valid booking exists
  - PNG image file under 5MB
  - Valid CUSTOMER token
- **Input**:
  - **Path Parameter**: bookingId = "b0000001-0000-0000-0000-000000000002"
  - **Form Data**: 
    - file: booking_photo.png (1.8MB, image/png)
  - **Headers**: 
    ```
    Authorization: Bearer <customer_token>
    Content-Type: multipart/form-data
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Tải ảnh lên thành công",
    "data": {
      "bookingId": "b0000001-0000-0000-0000-000000000002",
      "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1698652900/booking_images/xyz789ghi012.png",
      "publicId": "booking_images/xyz789ghi012"
    }
  }
  ```
- **Status Code**: 200 OK

### Test Case 3: Admin Upload Image
- **Test Case ID**: TC_BOOKING_IMG_003
- **Description**: Verify admin can upload images for any booking
- **Preconditions**:
  - Valid booking exists
  - Valid JWT token with ADMIN role
  - Valid image file
- **Input**:
  - **Path Parameter**: bookingId = "b0000001-0000-0000-0000-000000000003"
  - **Form Data**: 
    - file: verification_image.jpg (3.2MB, image/jpeg)
  - **Headers**: 
    ```
    Authorization: Bearer <admin_token>
    Content-Type: multipart/form-data
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Tải ảnh lên thành công",
    "data": {
      "bookingId": "b0000001-0000-0000-0000-000000000003",
      "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1698653000/booking_images/mno345pqr678.jpg",
      "publicId": "booking_images/mno345pqr678"
    }
  }
  ```
- **Status Code**: 200 OK

---

## Validation Error Scenarios

### Test Case 4: Empty File Upload
- **Test Case ID**: TC_BOOKING_IMG_004
- **Description**: Verify system rejects empty file uploads
- **Preconditions**:
  - Valid booking exists
  - Valid CUSTOMER token
  - Empty or null file
- **Input**:
  - **Path Parameter**: bookingId = "b0000001-0000-0000-0000-000000000001"
  - **Form Data**: 
    - file: (empty)
  - **Headers**: 
    ```
    Authorization: Bearer <customer_token>
    Content-Type: multipart/form-data
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "File không được để trống"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 5: Invalid File Type - PDF
- **Test Case ID**: TC_BOOKING_IMG_005
- **Description**: Verify system rejects non-image file formats
- **Preconditions**:
  - Valid booking exists
  - Valid CUSTOMER token
  - PDF file instead of image
- **Input**:
  - **Path Parameter**: bookingId = "b0000001-0000-0000-0000-000000000001"
  - **Form Data**: 
    - file: document.pdf (1MB, application/pdf)
  - **Headers**: 
    ```
    Authorization: Bearer <customer_token>
    Content-Type: multipart/form-data
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "File phải là định dạng ảnh"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 6: Invalid File Type - Text
- **Test Case ID**: TC_BOOKING_IMG_006
- **Description**: Verify system rejects text files
- **Preconditions**:
  - Valid booking exists
  - Valid CUSTOMER token
  - Text file instead of image
- **Input**:
  - **Path Parameter**: bookingId = "b0000001-0000-0000-0000-000000000001"
  - **Form Data**: 
    - file: notes.txt (500KB, text/plain)
  - **Headers**: 
    ```
    Authorization: Bearer <customer_token>
    Content-Type: multipart/form-data
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "File phải là định dạng ảnh"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 7: File Size Exceeds Limit
- **Test Case ID**: TC_BOOKING_IMG_007
- **Description**: Verify system rejects files larger than 5MB
- **Preconditions**:
  - Valid booking exists
  - Valid CUSTOMER token
  - Image file larger than 5MB
- **Input**:
  - **Path Parameter**: bookingId = "b0000001-0000-0000-0000-000000000001"
  - **Form Data**: 
    - file: large_image.jpg (7.5MB, image/jpeg)
  - **Headers**: 
    ```
    Authorization: Bearer <customer_token>
    Content-Type: multipart/form-data
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Kích thước file không được vượt quá 5MB"
  }
  ```
- **Status Code**: 400 Bad Request

### Test Case 8: File Size Exactly 5MB
- **Test Case ID**: TC_BOOKING_IMG_008
- **Description**: Verify system accepts files exactly at the 5MB limit
- **Preconditions**:
  - Valid booking exists
  - Valid CUSTOMER token
  - Image file exactly 5MB (5,242,880 bytes)
- **Input**:
  - **Path Parameter**: bookingId = "b0000001-0000-0000-0000-000000000001"
  - **Form Data**: 
    - file: max_size_image.jpg (5MB exactly, image/jpeg)
  - **Headers**: 
    ```
    Authorization: Bearer <customer_token>
    Content-Type: multipart/form-data
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Tải ảnh lên thành công",
    "data": {
      "bookingId": "b0000001-0000-0000-0000-000000000001",
      "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1698653100/booking_images/stu901vwx234.jpg",
      "publicId": "booking_images/stu901vwx234"
    }
  }
  ```
- **Status Code**: 200 OK

### Test Case 9: File Size Just Over 5MB
- **Test Case ID**: TC_BOOKING_IMG_009
- **Description**: Verify system rejects files just slightly over 5MB
- **Preconditions**:
  - Valid booking exists
  - Valid CUSTOMER token
  - Image file 5.1MB (5,349,376 bytes)
- **Input**:
  - **Path Parameter**: bookingId = "b0000001-0000-0000-0000-000000000001"
  - **Form Data**: 
    - file: slightly_over.jpg (5.1MB, image/jpeg)
  - **Headers**: 
    ```
    Authorization: Bearer <customer_token>
    Content-Type: multipart/form-data
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Kích thước file không được vượt quá 5MB"
  }
  ```
- **Status Code**: 400 Bad Request

---

## Authorization and Error Scenarios

### Test Case 10: Missing Authorization Token
- **Test Case ID**: TC_BOOKING_IMG_010
- **Description**: Verify unauthorized access is rejected without token
- **Preconditions**:
  - Valid booking exists
  - No authorization token provided
- **Input**:
  - **Path Parameter**: bookingId = "b0000001-0000-0000-0000-000000000001"
  - **Form Data**: 
    - file: image.jpg (2MB, image/jpeg)
  - **Headers**: 
    ```
    Content-Type: multipart/form-data
    ```
- **Expected Output**:
  ```json
  {
    "timestamp": "2025-10-30T10:30:00.000+00:00",
    "status": 401,
    "error": "Unauthorized",
    "message": "Full authentication is required to access this resource",
    "path": "/api/v1/customer/bookings/b0000001-0000-0000-0000-000000000001/upload-image"
  }
  ```
- **Status Code**: 401 Unauthorized

### Test Case 11: Invalid/Expired Token
- **Test Case ID**: TC_BOOKING_IMG_011
- **Description**: Verify system rejects expired or invalid JWT tokens
- **Preconditions**:
  - Valid booking exists
  - Expired or malformed JWT token
- **Input**:
  - **Path Parameter**: bookingId = "b0000001-0000-0000-0000-000000000001"
  - **Form Data**: 
    - file: image.jpg (2MB, image/jpeg)
  - **Headers**: 
    ```
    Authorization: Bearer expired_or_invalid_token
    Content-Type: multipart/form-data
    ```
- **Expected Output**:
  ```json
  {
    "timestamp": "2025-10-30T10:30:00.000+00:00",
    "status": 401,
    "error": "Unauthorized",
    "message": "Invalid or expired token",
    "path": "/api/v1/customer/bookings/b0000001-0000-0000-0000-000000000001/upload-image"
  }
  ```
- **Status Code**: 401 Unauthorized

### Test Case 12: Wrong Role - Employee Token
- **Test Case ID**: TC_BOOKING_IMG_012
- **Description**: Verify EMPLOYEE role cannot upload booking images
- **Preconditions**:
  - Valid booking exists
  - Valid JWT token with EMPLOYEE role (not CUSTOMER or ADMIN)
- **Input**:
  - **Path Parameter**: bookingId = "b0000001-0000-0000-0000-000000000001"
  - **Form Data**: 
    - file: image.jpg (2MB, image/jpeg)
  - **Headers**: 
    ```
    Authorization: Bearer <employee_token>
    Content-Type: multipart/form-data
    ```
- **Expected Output**:
  ```json
  {
    "timestamp": "2025-10-30T10:30:00.000+00:00",
    "status": 403,
    "error": "Forbidden",
    "message": "Access Denied",
    "path": "/api/v1/customer/bookings/b0000001-0000-0000-0000-000000000001/upload-image"
  }
  ```
- **Status Code**: 403 Forbidden

---

## Image Format Validation

### Test Case 13: WebP Image Format
- **Test Case ID**: TC_BOOKING_IMG_013
- **Description**: Verify system accepts modern WebP image format
- **Preconditions**:
  - Valid booking exists
  - Valid CUSTOMER token
  - WebP format image
- **Input**:
  - **Path Parameter**: bookingId = "b0000001-0000-0000-0000-000000000001"
  - **Form Data**: 
    - file: modern_image.webp (1.2MB, image/webp)
  - **Headers**: 
    ```
    Authorization: Bearer <customer_token>
    Content-Type: multipart/form-data
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Tải ảnh lên thành công",
    "data": {
      "bookingId": "b0000001-0000-0000-0000-000000000001",
      "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1698653200/booking_images/webp123abc456.webp",
      "publicId": "booking_images/webp123abc456"
    }
  }
  ```
- **Status Code**: 200 OK

### Test Case 14: GIF Image Format
- **Test Case ID**: TC_BOOKING_IMG_014
- **Description**: Verify system accepts GIF image format
- **Preconditions**:
  - Valid booking exists
  - Valid CUSTOMER token
  - GIF format image
- **Input**:
  - **Path Parameter**: bookingId = "b0000001-0000-0000-0000-000000000001"
  - **Form Data**: 
    - file: animation.gif (3MB, image/gif)
  - **Headers**: 
    ```
    Authorization: Bearer <customer_token>
    Content-Type: multipart/form-data
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Tải ảnh lên thành công",
    "data": {
      "bookingId": "b0000001-0000-0000-0000-000000000001",
      "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1698653300/booking_images/gif789def012.gif",
      "publicId": "booking_images/gif789def012"
    }
  }
  ```
- **Status Code**: 200 OK

### Test Case 15: BMP Image Format
- **Test Case ID**: TC_BOOKING_IMG_015
- **Description**: Verify system accepts BMP image format
- **Preconditions**:
  - Valid booking exists
  - Valid CUSTOMER token
  - BMP format image
- **Input**:
  - **Path Parameter**: bookingId = "b0000001-0000-0000-0000-000000000001"
  - **Form Data**: 
    - file: bitmap_image.bmp (4MB, image/bmp)
  - **Headers**: 
    ```
    Authorization: Bearer <customer_token>
    Content-Type: multipart/form-data
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Tải ảnh lên thành công",
    "data": {
      "bookingId": "b0000001-0000-0000-0000-000000000001",
      "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1698653400/booking_images/bmp345ghi678.bmp",
      "publicId": "booking_images/bmp345ghi678"
    }
  }
  ```
- **Status Code**: 200 OK

---

## Cloudinary Integration Error Scenarios

### Test Case 16: Cloudinary Service Unavailable
- **Test Case ID**: TC_BOOKING_IMG_016
- **Description**: Verify graceful handling when Cloudinary service is down or unreachable
- **Preconditions**:
  - Valid booking exists
  - Valid CUSTOMER token
  - Cloudinary service is unavailable (simulated)
- **Input**:
  - **Path Parameter**: bookingId = "b0000001-0000-0000-0000-000000000001"
  - **Form Data**: 
    - file: image.jpg (2MB, image/jpeg)
  - **Headers**: 
    ```
    Authorization: Bearer <customer_token>
    Content-Type: multipart/form-data
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Đã xảy ra lỗi khi tải ảnh lên"
  }
  ```
- **Status Code**: 500 Internal Server Error

### Test Case 17: Cloudinary Upload Timeout
- **Test Case ID**: TC_BOOKING_IMG_017
- **Description**: Verify handling of Cloudinary upload timeout scenarios
- **Preconditions**:
  - Valid booking exists
  - Valid CUSTOMER token
  - Network latency causes upload timeout
- **Input**:
  - **Path Parameter**: bookingId = "b0000001-0000-0000-0000-000000000001"
  - **Form Data**: 
    - file: image.jpg (4.8MB, image/jpeg)
  - **Headers**: 
    ```
    Authorization: Bearer <customer_token>
    Content-Type: multipart/form-data
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Đã xảy ra lỗi khi tải ảnh lên"
  }
  ```
- **Status Code**: 500 Internal Server Error

---

## Edge Cases and Special Scenarios

### Test Case 18: Multiple Images Upload for Same Booking
- **Test Case ID**: TC_BOOKING_IMG_018
- **Description**: Verify customer can upload multiple images for the same booking (sequential uploads)
- **Preconditions**:
  - Valid booking exists
  - Valid CUSTOMER token
  - Previous image already uploaded for this booking
- **Input (Second Upload)**:
  - **Path Parameter**: bookingId = "b0000001-0000-0000-0000-000000000001"
  - **Form Data**: 
    - file: second_image.jpg (1.5MB, image/jpeg)
  - **Headers**: 
    ```
    Authorization: Bearer <customer_token>
    Content-Type: multipart/form-data
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Tải ảnh lên thành công",
    "data": {
      "bookingId": "b0000001-0000-0000-0000-000000000001",
      "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1698653500/booking_images/second456jkl789.jpg",
      "publicId": "booking_images/second456jkl789"
    }
  }
  ```
- **Status Code**: 200 OK
- **Note**: Each upload returns a unique imageUrl and publicId

### Test Case 19: Very Small Image File
- **Test Case ID**: TC_BOOKING_IMG_019
- **Description**: Verify system accepts very small image files (e.g., 10KB)
- **Preconditions**:
  - Valid booking exists
  - Valid CUSTOMER token
  - Very small image file
- **Input**:
  - **Path Parameter**: bookingId = "b0000001-0000-0000-0000-000000000001"
  - **Form Data**: 
    - file: tiny_image.jpg (10KB, image/jpeg)
  - **Headers**: 
    ```
    Authorization: Bearer <customer_token>
    Content-Type: multipart/form-data
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Tải ảnh lên thành công",
    "data": {
      "bookingId": "b0000001-0000-0000-0000-000000000001",
      "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1698653600/booking_images/tiny901mno234.jpg",
      "publicId": "booking_images/tiny901mno234"
    }
  }
  ```
- **Status Code**: 200 OK

### Test Case 20: Special Characters in Booking ID
- **Test Case ID**: TC_BOOKING_IMG_020
- **Description**: Verify proper URL encoding and handling of booking IDs
- **Preconditions**:
  - Valid booking exists with UUID format
  - Valid CUSTOMER token
  - Valid image file
- **Input**:
  - **Path Parameter**: bookingId = "b0000001-0000-0000-0000-000000000001"
  - **Form Data**: 
    - file: test_image.jpg (2MB, image/jpeg)
  - **Headers**: 
    ```
    Authorization: Bearer <customer_token>
    Content-Type: multipart/form-data
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Tải ảnh lên thành công",
    "data": {
      "bookingId": "b0000001-0000-0000-0000-000000000001",
      "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1698653700/booking_images/uuid567pqr890.jpg",
      "publicId": "booking_images/uuid567pqr890"
    }
  }
  ```
- **Status Code**: 200 OK

---

## Database Integration Test Scenarios

### Test Case 21: Real Booking Data Integration
- **Test Case ID**: TC_BOOKING_IMG_021
- **Description**: Verify integration with actual booking data from housekeeping_service database
- **Covered Data**:
  - **Bookings**: BK000001, BK000002, BK000003 from seed data
  - **Customers**: John Doe, Mary Jones, Jane Smith Customer
  - **Services**: Dọn dẹp theo giờ, Tổng vệ sinh, Vệ sinh máy lạnh
  - **Cloudinary Folder**: booking_images configured in application.properties
- **Validation Points**:
  - Images uploaded to correct Cloudinary folder (booking_images)
  - Booking IDs match database UUIDs
  - Authorization validates against actual customer-booking ownership
  - File metadata preserved in Cloudinary (publicId, secureUrl)

---

## Notes
- **Test Date Context**: All test cases assume current date is October 30, 2025
- **Cloudinary Integration**: 
  - Images stored in folder: `booking_images`
  - Configurable via `cloudinary.folders.booking` property
  - Returns both `secureUrl` (HTTPS URL) and `publicId` (Cloudinary identifier)
- **Supported Image Formats**: JPEG, PNG, GIF, BMP, WebP, and other standard image/* MIME types
- **File Size Validation**: 
  - Maximum: 5MB (5,242,880 bytes)
  - No minimum size restriction
- **Security**:
  - CUSTOMER role can upload images for their own bookings
  - ADMIN role can upload images for any booking
  - EMPLOYEE role cannot upload booking images
- **Upload Behavior**:
  - Each upload generates unique publicId
  - Multiple images can be uploaded for same booking (separate API calls)
  - Original filename not preserved (Cloudinary generates unique identifier)
- **Error Handling**:
  - Comprehensive validation before Cloudinary upload
  - Graceful handling of Cloudinary service failures
  - Detailed error messages for validation failures
