# API-TestCases-OtherAuthenticationEndpoints.md

## Overview
This document describes the test cases for the other authentication endpoints of the Authentication API:
- **Get Active Sessions**: `GET /api/v1/auth/sessions`
- **Refresh Token**: `POST /api/v1/auth/refresh-token`
- **Logout**: `POST /api/v1/auth/logout`
- **Validate Token**: `GET /api/v1/auth/validate-token`

**Base URL**: `/api/v1/auth`

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

## GET /sessions - Get Active Sessions Test Cases

### Test Case 1: Successfully Get Active Sessions
- **Test Case ID**: TC_SESSIONS_001
- **Description**: Verify that authenticated user can retrieve their active sessions count.
- **Preconditions**:
  - User is logged in with valid access token.
  - User has active sessions on different devices.
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <valid_access_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "data": {
      "webSessions": 1,
      "mobileSessions": 0
    }
  }
  ```
- **Status Code**: `200 OK`

- **Actual Output**:
  ```json
  {
    "success": true,
    "data": {
      "webSessions": 1,
      "mobileSessions": 0
    }
  }
  ```
- **Status Code**: `200 OK`

### Test Case 2: Get Sessions Without Authorization Header
- **Test Case ID**: TC_SESSIONS_002
- **Description**: Verify that request fails when Authorization header is missing.
- **Preconditions**: None
- **Input**: No Authorization header
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Authorization header is required"
  }
  ```
- **Status Code**: `400 Bad Request`

- **Actual Output**:
  ```json
  {
    "success": false,
    "message": "Authorization header is required"
  }
  ```
- **Status Code**: `400 Bad Request`

### Test Case 3: Get Sessions With Invalid Token Format
- **Test Case ID**: TC_SESSIONS_003
- **Description**: Verify that request fails when Authorization header has invalid format.
- **Preconditions**: None
- **Input**:
  - **Headers**: 
    ```
    Authorization: InvalidToken
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Authorization header is required"
  }
  ```
- **Status Code**: `400 Bad Request`

- **Actual Output**:
  ```json
  {
    "success": false,
    "message": "Authorization header is required"
  }
  ```
- **Status Code**: `400 Bad Request`

### Test Case 4: Get Sessions With Expired/Invalid Token
- **Test Case ID**: TC_SESSIONS_004
- **Description**: Verify that request fails when token is expired or invalid.
- **Preconditions**: User has an expired or invalid token
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <expired_or_invalid_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Failed to get active sessions"
  }
  ```
- **Status Code**: `500 Internal Server Error`

---

## POST /refresh-token - Refresh Token Test Cases

### Test Case 5: Successfully Refresh Token
- **Test Case ID**: TC_REFRESH_001
- **Description**: Verify that valid refresh token can generate new token pair.
- **Preconditions**:
  - User has valid access token and refresh token.
  - Refresh token exists in Redis with user information.
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <valid_access_token>
    ```
  - **Body**:
    ```json
    {
      "refreshToken": "<valid_refresh_token>"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Làm mới token thành công",
    "data": {
      "accessToken": "<new_access_token>",
      "refreshToken": "<new_refresh_token>",
      "expireIn": 3600,
      "deviceType": "WEB"
    }
  }
  ```
- **Status Code**: `200 OK`

### Test Case 6: Refresh Token Without Authorization Header
- **Test Case ID**: TC_REFRESH_002
- **Description**: Verify that refresh token request fails without Authorization header.
- **Preconditions**: None
- **Input**:
  - **Body**:
    ```json
    {
      "refreshToken": "<valid_refresh_token>"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Authorization header is required"
  }
  ```
- **Status Code**: `400 Bad Request`

### Test Case 7: Refresh Token With Invalid Refresh Token
- **Test Case ID**: TC_REFRESH_003
- **Description**: Verify that invalid refresh token is rejected.
- **Preconditions**: None
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <valid_access_token>
    ```
  - **Body**:
    ```json
    {
      "refreshToken": "invalid_refresh_token"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Invalid refresh token"
  }
  ```
- **Status Code**: `401 Unauthorized`

### Test Case 8: Refresh Token With Expired Refresh Token
- **Test Case ID**: TC_REFRESH_004
- **Description**: Verify that expired refresh token is rejected.
- **Preconditions**: User has an expired refresh token
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <valid_access_token>
    ```
  - **Body**:
    ```json
    {
      "refreshToken": "<expired_refresh_token>"
    }
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Invalid refresh token"
  }
  ```
- **Status Code**: `401 Unauthorized`

### Test Case 9: Refresh Token With Missing Refresh Token Field
- **Test Case ID**: TC_REFRESH_005
- **Description**: Verify that request fails when refreshToken field is missing.
- **Preconditions**: None
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <valid_access_token>
    ```
  - **Body**:
    ```json
    {}
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Token refresh failed"
  }
  ```
- **Status Code**: `401 Unauthorized`

---

## POST /logout - Logout Test Cases

### Test Case 10: Successfully Logout From Current Device
- **Test Case ID**: TC_LOGOUT_001
- **Description**: Verify that user can logout from current device successfully.
- **Preconditions**:
  - User is logged in with valid access token.
  - User session exists in Redis.
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <valid_access_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Đăng xuất thành công",
    "deviceType": "WEB"
  }
  ```
- **Status Code**: `200 OK`

### Test Case 11: Successfully Logout From All Devices
- **Test Case ID**: TC_LOGOUT_002
- **Description**: Verify that user can logout from all devices.
- **Preconditions**:
  - User is logged in with valid access token.
  - User has multiple active sessions across different devices.
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <valid_access_token>
    ```
  - **Query Parameters**: 
    ```
    deviceType=ALL
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Logged out from all devices successfully"
  }
  ```
- **Status Code**: `200 OK`

### Test Case 12: Logout Without Authorization Header
- **Test Case ID**: TC_LOGOUT_003
- **Description**: Verify that logout request fails without Authorization header.
- **Preconditions**: None
- **Input**: No Authorization header
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Authorization header is required"
  }
  ```
- **Status Code**: `400 Bad Request`

### Test Case 13: Logout With Invalid Token Format
- **Test Case ID**: TC_LOGOUT_004
- **Description**: Verify that logout request fails with invalid token format.
- **Preconditions**: None
- **Input**:
  - **Headers**: 
    ```
    Authorization: InvalidFormat
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Authorization header is required"
  }
  ```
- **Status Code**: `400 Bad Request`

### Test Case 14: Logout With Already Logged Out Token
- **Test Case ID**: TC_LOGOUT_005
- **Description**: Verify that logout still succeeds even if token is already invalidated.
- **Preconditions**: User token is already logged out or expired
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <already_logged_out_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Already logged out"
  }
  ```
- **Status Code**: `200 OK`

### Test Case 15: Logout With Specific Device Type Parameter
- **Test Case ID**: TC_LOGOUT_006
- **Description**: Verify that logout works with specific deviceType parameter.
- **Preconditions**:
  - User is logged in with valid access token.
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <valid_access_token>
    ```
  - **Query Parameters**: 
    ```
    deviceType=MOBILE
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Đăng xuất thành công",
    "deviceType": "WEB"
  }
  ```
- **Status Code**: `200 OK`

---

## GET /validate-token - Validate Token Test Cases

### Test Case 16: Successfully Validate Valid Token
- **Test Case ID**: TC_VALIDATE_001
- **Description**: Verify that valid token passes validation.
- **Preconditions**:
  - User has valid access token.
  - Token exists in Redis and is not expired.
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <valid_access_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": true,
    "message": "Token hợp lệ",
    "valid": true
  }
  ```
- **Status Code**: `200 OK`

### Test Case 17: Validate Token Without Authorization Header
- **Test Case ID**: TC_VALIDATE_002
- **Description**: Verify that validation fails without Authorization header.
- **Preconditions**: None
- **Input**: No Authorization header
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Authorization header is required"
  }
  ```
- **Status Code**: `400 Bad Request`

### Test Case 18: Validate Token With Invalid Token Format
- **Test Case ID**: TC_VALIDATE_003
- **Description**: Verify that validation fails with invalid token format.
- **Preconditions**: None
- **Input**:
  - **Headers**: 
    ```
    Authorization: InvalidTokenFormat
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Authorization header is required"
  }
  ```
- **Status Code**: `400 Bad Request`

### Test Case 19: Validate Expired Token
- **Test Case ID**: TC_VALIDATE_004
- **Description**: Verify that expired token fails validation.
- **Preconditions**: User has an expired access token
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <expired_access_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Token không hợp lệ",
    "valid": false
  }
  ```
- **Status Code**: `401 Unauthorized`

### Test Case 20: Validate Invalid/Malformed Token
- **Test Case ID**: TC_VALIDATE_005
- **Description**: Verify that invalid or malformed token fails validation.
- **Preconditions**: None
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer invalid.jwt.token
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Token không hợp lệ",
    "valid": false
  }
  ```
- **Status Code**: `401 Unauthorized`

### Test Case 21: Validate Token Not in Redis
- **Test Case ID**: TC_VALIDATE_006
- **Description**: Verify that token not stored in Redis fails validation.
- **Preconditions**: Token is valid JWT but not stored in Redis (logged out)
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <valid_jwt_but_not_in_redis>
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Token không hợp lệ",
    "valid": false
  }
  ```
- **Status Code**: `401 Unauthorized`

---

## Edge Cases and Error Scenarios

### Test Case 22: Network/Redis Connection Error
- **Test Case ID**: TC_ERROR_001
- **Description**: Verify API behavior when Redis connection fails.
- **Preconditions**: Redis service is unavailable or connection is lost
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <valid_access_token>
    ```
- **Expected Output**:
  ```json
  {
    "success": false,
    "message": "Failed to get active sessions"
  }
  ```
- **Status Code**: `500 Internal Server Error`

### Test Case 23: Concurrent Session Management
- **Test Case ID**: TC_CONCURRENT_001
- **Description**: Verify that concurrent logout requests are handled properly.
- **Preconditions**: User has multiple active sessions
- **Input**: Multiple simultaneous logout requests with same token
- **Expected Output**: All requests should return successful logout response
- **Status Code**: `200 OK`

### Test Case 24: Large Token Payload
- **Test Case ID**: TC_EDGE_001
- **Description**: Verify system handles unusually large token payloads.
- **Preconditions**: None
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <extremely_long_token_string>
    ```
- **Expected Output**: Appropriate error response for invalid token
- **Status Code**: `401 Unauthorized`

---

## Performance Test Scenarios

### Test Case 25: High Volume Token Validation
- **Test Case ID**: TC_PERF_001
- **Description**: Verify system performance under high volume of token validation requests.
- **Preconditions**: System is under normal load
- **Input**: 1000 concurrent validate-token requests
- **Expected Output**: All requests should complete within acceptable time limits
- **Status Code**: `200 OK` or `401 Unauthorized` (based on token validity)

### Test Case 26: Session Cleanup Performance
- **Test Case ID**: TC_PERF_002
- **Description**: Verify performance when cleaning up multiple user sessions.
- **Preconditions**: User has 10+ active sessions across different devices
- **Input**: Logout request with deviceType=ALL
- **Expected Output**: All sessions cleaned up efficiently
- **Status Code**: `200 OK`

---

## Security Test Scenarios

### Test Case 27: Token Injection Attack
- **Test Case ID**: TC_SEC_001
- **Description**: Verify system is protected against token injection attacks.
- **Preconditions**: None
- **Input**:
  - **Headers**: 
    ```
    Authorization: Bearer <token_with_sql_injection_attempt>
    ```
- **Expected Output**: Request safely rejected without security breach
- **Status Code**: `401 Unauthorized`

### Test Case 28: Cross-Device Session Hijacking
- **Test Case ID**: TC_SEC_002
- **Description**: Verify that token from one device cannot be used to access sessions from another device.
- **Preconditions**: User has sessions on both WEB and MOBILE
- **Input**: Attempt to use WEB token to access MOBILE session data
- **Expected Output**: Only appropriate device sessions are returned
- **Status Code**: `200 OK` (with correct device-specific data)

---

## Integration Test Scenarios

### Test Case 29: Full Authentication Flow
- **Test Case ID**: TC_INTEGRATION_001
- **Description**: Verify complete authentication flow: login → validate → refresh → logout.
- **Preconditions**: Valid user account exists
- **Steps**:
  1. Login with valid credentials
  2. Validate received access token
  3. Refresh token using refresh token
  4. Validate new access token
  5. Logout from current device
  6. Attempt to validate logged out token
- **Expected Results**: Each step should work as expected, final validation should fail

### Test Case 30: Multi-Device Authentication Flow
- **Test Case ID**: TC_INTEGRATION_002
- **Description**: Verify authentication flow across multiple devices.
- **Preconditions**: Valid user account exists
- **Steps**:
  1. Login from WEB device
  2. Login from MOBILE device
  3. Check active sessions (should show both)
  4. Logout from WEB only
  5. Check active sessions (should show MOBILE only)
  6. Logout from all devices
  7. Check active sessions (should show none)
- **Expected Results**: Each step should work correctly with proper session management

---

## Notes
- All test cases should be executed in a controlled test environment.
- Redis should be properly configured and accessible for session management tests.
- JWT tokens should be generated with proper expiration times for testing.
- Network connectivity and Redis availability should be verified before running tests.
- Security tests should be conducted with appropriate safeguards in place.
