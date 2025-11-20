POST http://localhost:8080/api/v1/auth/login

Input:
```json
{
  "username": "john_doe",
  "password": "123456789",
  "role": "CUSTOMER",
  "deviceType": "WEB"
}
```

Output:
```json
{
    "message": "Đăng nhập thành công",
    "data": {
        "expireIn": 3600,
        "data": {
            "customerId": "c1000001-0000-0000-0000-000000000001",
            "accountId": "a1000001-0000-0000-0000-000000000001",
            "username": "john_doe",
            "avatar": "https://picsum.photos/200",
            "fullName": "John Doe",
            "email": "john.doe@example.com",
            "phoneNumber": "0901234567",
            "isMale": true,
            "status": "ACTIVE",
            "address": "123 Lê Trọng Tấn, Phường Tây Thạnh, Thành phố Hồ Chí Minh"
        },
        "accessToken": "eyJhbGciOiJIUzM4NCJ9.eyJyb2xlIjoiQ1VTVE9NRVIiLCJzdWIiOiJqb2huX2RvZSIsImlhdCI6MTc2MjM1NDg4MSwiZXhwIjoxNzYyMzU4NDgxfQ.E1RzmA806fx8mPo_7fhdGopc12KSmFLPzbITYJV5JgH8s3lAqaq-g9i6PwP484gJ",
        "deviceType": "WEB",
        "refreshToken": "eyJhbGciOiJIUzM4NCJ9.eyJyb2xlIjoiQ1VTVE9NRVIiLCJzdWIiOiJqb2huX2RvZSIsImlhdCI6MTc2MjM1NDg4MSwiZXhwIjoxNzYyNDQxMjgxfQ.tTpZHK3CFxOjs3YxBX_peuLyVfaJad_rQfez7a3pBEGcUQybveDadR5UcWd_UrkN",
        "role": "CUSTOMER"
    },
    "success": true
}
```

POST http://localhost:8080/api/v1/auth/login

Input:
```json
{
  "username": "jane_smith",
  "password": "123456789",
  "role": "EMPLOYEE",
  "deviceType": "WEB"
}
```

Output:
```json
{
    "message": "Đăng nhập thành công",
    "data": {
        "expireIn": 3600,
        "data": {
            "employeeId": "e1000001-0000-0000-0000-000000000001",
            "accountId": "a1000001-0000-0000-0000-000000000002",
            "username": "jane_smith",
            "avatar": "https://picsum.photos/200",
            "fullName": "Jane Smith",
            "email": "jane.smith@example.com",
            "phoneNumber": "0912345678",
            "isMale": false,
            "status": "ACTIVE",
            "address": "2024-01-15"
        },
        "accessToken": "eyJhbGciOiJIUzM4NCJ9.eyJyb2xlIjoiRU1QTE9ZRUUiLCJzdWIiOiJqYW5lX3NtaXRoIiwiaWF0IjoxNzYyMzU0OTk0LCJleHAiOjE3NjIzNTg1OTR9.WfsXbr_5T8zo-E1jq_A-GJyCBO6KUGDLgqyzfSnIBvjEQ1REmaWtoYrJ2ZShvZST",
        "deviceType": "WEB",
        "refreshToken": "eyJhbGciOiJIUzM4NCJ9.eyJyb2xlIjoiRU1QTE9ZRUUiLCJzdWIiOiJqYW5lX3NtaXRoIiwiaWF0IjoxNzYyMzU0OTk0LCJleHAiOjE3NjI0NDEzOTR9.gaGIQH10wWOHBNlSN84d1mxdkxj7QPLUY6aY7mmBH3AQ67CjQZTHDYFToPwCGTQl",
        "role": "EMPLOYEE"
    },
    "success": true
}
```

POST http://localhost:8080/api/v1/auth/login

Input:
```json
{
  "username": "admin_1",
  "password": "123456789",
  "role": "ADMIN",
  "deviceType": "WEB"
}
```

Output:
```json
{
    "message": "Đăng nhập thành công",
    "data": {
        "expireIn": 3600,
        "data": {
            "adminId": "ad100001-0000-0000-0000-000000000001",
            "accountId": "a1000001-0000-0000-0000-000000000003",
            "username": "admin_1",
            "fullName": "Admin One",
            "isMale": true,
            "department": "Management",
            "contactInfo": "admin1@example.com",
            "hireDate": "2023-03-01"
        },
        "accessToken": "eyJhbGciOiJIUzM4NCJ9.eyJyb2xlIjoiQURNSU4iLCJzdWIiOiJhZG1pbl8xIiwiaWF0IjoxNzYyMzU1MDE1LCJleHAiOjE3NjIzNTg2MTV9.BOnGgPOlpvkrLue4WNlgeyj8pgY5vGDGYqvKxhIsGnPkZY3o-khOxZH7LsZvgRap",
        "deviceType": "WEB",
        "refreshToken": "eyJhbGciOiJIUzM4NCJ9.eyJyb2xlIjoiQURNSU4iLCJzdWIiOiJhZG1pbl8xIiwiaWF0IjoxNzYyMzU1MDE1LCJleHAiOjE3NjI0NDE0MTV9.R-AG1ng6OhkYrbLV0u_f_6x8hExm6rx3Sg6QIWKpsXUAFvinsvg_xu9UOudqzq_c",
        "role": "ADMIN"
    },
    "success": true
}
```