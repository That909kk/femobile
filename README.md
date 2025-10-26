# Mobile Housekeeping Service App

Ứng dụng di động quản lý dịch vụ dọn dẹp nhà cửa được xây dựng bằng React Native và Expo.

## 📋 Mục lục

- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt](#cài-đặt)
- [Cấu hình](#cấu-hình)
- [Chạy ứng dụng](#chạy-ứng-dụng)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Tính năng chính](#tính-năng-chính)
- [API Documentation](#api-documentation)

## 🔧 Yêu cầu hệ thống

Trước khi bắt đầu, hãy đảm bảo bạn đã cài đặt các công cụ sau:

- **Node.js** (phiên bản 18.x trở lên)
- **npm** hoặc **yarn**
- **Expo CLI** (sẽ được cài tự động)
- **Git**
- **Back-end** https://github.com/HKThanh/BE-HouseKeepingService

### Để chạy trên thiết bị thực:
- **Expo Go App** - Tải từ App Store (iOS) hoặc Google Play (Android)

### Để chạy trên emulator/simulator:
- **Android Studio** (cho Android Emulator)
- **Xcode** (cho iOS Simulator - chỉ dành cho macOS)



## 📦 Cài đặt

### Bước 1: Clone repository

```bash
git clone https://github.com/That909kk/femobile.git
cd mobile
```

### Bước 2: Di chuyển vào thư mục dự án

```bash
cd femobile
```

### Bước 3: Cài đặt dependencies

Sử dụng npm:
```bash
npm install
```

Hoặc sử dụng yarn:
```bash
yarn install
```

## ⚙️ Cấu hình

### Bước 1: Tạo file môi trường

Copy file `.env.example` thành `.env`:

**Windows PowerShell:**
```powershell
Copy-Item .env.example .env
```

**Linux/macOS:**
```bash
cp .env.example .env
```

### Bước 2: Cấu hình biến môi trường

Mở file `.env` và cập nhật các giá trị sau:

```bash
# URL của API backend
EXPO_PUBLIC_API_BASE_URL=http://your-api-url.com/api

# URL của WebSocket server (nếu có)
EXPO_PUBLIC_WEBSOCKET_URL=ws://your-websocket-url.com

# API Address Kit (đã có sẵn)
EXPO_ADDRESS_KIT_API=https://production.cas.so/address-kit/2025-07-01
```

**Lưu ý:** Thay thế `http://your-api-url.com/api` bằng URL thực tế của backend API của bạn.

## 🚀 Chạy ứng dụng

### Chạy ở chế độ development

Clone BE từ : https://github.com/HKThanh/BE-HouseKeepingService

```bash
cd BE-HouseKeepingService
```
```bash
docker compose up -d 
```

Trong thư mục `femobile`, chạy lệnh:

```bash
npm start
```

Hoặc:

```bash
npx expo start
```

### Các tùy chọn chạy khác:

#### 1. Chạy trên Android Emulator:
```bash
npm run android
```

#### 2. Chạy trên iOS Simulator (chỉ macOS):
```bash
npm run ios
```

#### 3. Chạy trên web browser:
```bash
npm run web
```

### Chạy trên thiết bị thực

1. Cài đặt **Expo Go** từ App Store hoặc Google Play
2. Chạy lệnh `npm start` hoặc `npx expo start`
3. Quét mã QR hiển thị trong terminal bằng:
   - **iOS**: Ứng dụng Camera
   - **Android**: Ứng dụng Expo Go

## 📁 Cấu trúc dự án

```
femobile/
├── src/
│   ├── app/                    # Điều hướng chính của ứng dụng
│   │   ├── App.tsx            # Component App chính
│   │   ├── AppNavigator.tsx   # Cấu hình navigation
│   │   └── MainTabNavigator.tsx
│   │
│   ├── screens/               # Các màn hình
│   │   ├── auth/             # Màn hình xác thực
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   ├── ForgotPasswordScreen.tsx
│   │   │   ├── ResetPasswordScreen.tsx
│   │   │   ├── VerifyOTPScreen.tsx
│   │   │   └── RoleSelectionScreen.tsx
│   │   │
│   │   └── main/             # Màn hình chính
│   │       ├── ProfileScreen.tsx
│   │       ├── customer/     # Màn hình khách hàng
│   │       │   ├── CustomerHomeScreen.tsx
│   │       │   ├── BookingScreen.tsx
│   │       │   └── OrdersScreen.tsx
│   │       │
│   │       └── employee/     # Màn hình nhân viên
│   │           ├── EmployeeDashboard.tsx
│   │           ├── RequestsScreen.tsx
│   │           └── ScheduleScreen.tsx
│   │
│   ├── components/           # Các component tái sử dụng
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Checkbox.tsx
│   │   ├── AddressPicker.tsx
│   │   ├── LanguageSwitcher.tsx
│   │   └── ServiceDetailView.tsx
│   │
│   ├── services/             # API services
│   │   ├── authService.ts
│   │   ├── bookingService.ts
│   │   ├── categoryService.ts
│   │   ├── paymentService.ts
│   │   ├── httpClient.ts
│   │   └── tokenManager.ts
│   │
│   ├── hooks/                # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useLanguage.ts
│   │   ├── useUserInfo.ts
│   │   └── useTokenValidation.ts
│   │
│   ├── store/                # State management (Zustand)
│   │   └── authStore.ts
│   │
│   ├── contexts/             # React contexts
│   │   └── LanguageContext.tsx
│   │
│   ├── types/                # TypeScript types
│   │   ├── auth.ts
│   │   ├── booking.ts
│   │   └── service.ts
│   │
│   └── static-data/          # Dữ liệu tĩnh
│       ├── terms_conditions.json
│       └── pages/            # Nội dung trang tĩnh
│
├── assets/                   # Tài nguyên (fonts, images)
├── .env                      # Biến môi trường (không commit)
├── .env.example             # Mẫu biến môi trường
├── app.json                 # Cấu hình Expo
├── package.json             # Dependencies
└── tsconfig.json            # Cấu hình TypeScript
```

## ✨ Tính năng chính

### Cho Khách hàng:
- ✅ Đăng ký và đăng nhập
- ✅ Xác thực OTP
- ✅ Đặt dịch vụ dọn dẹp
- ✅ Chọn địa điểm và thời gian
- ✅ Chọn nhân viên
- ✅ Thanh toán
- ✅ Xem lịch sử đơn hàng
- ✅ Đánh giá dịch vụ
- ✅ Quản lý hồ sơ cá nhân

### Cho Nhân viên:
- ✅ Đăng ký và xác thực
- ✅ Xem lịch làm việc
- ✅ Nhận yêu cầu đặt dịch vụ
- ✅ Quản lý công việc được giao
- ✅ Cập nhật trạng thái công việc

### Tính năng chung:
- 🌐 Hỗ trợ đa ngôn ngữ (Tiếng Việt, English)
- 🔐 Xác thực JWT
- 📍 Tích hợp bản đồ
- 🎨 Giao diện thân thiện, responsive
- ⚡ Performance tối ưu

## 📚 API Documentation

Tài liệu API test cases được lưu trong thư mục `api-templates/`:

- **Authentication**: Đăng nhập, đăng ký, OTP, mật khẩu
- **Booking**: Quản lý đặt dịch vụ
- **Service**: Quản lý dịch vụ và tính toán
- **Employee**: Quản lý nhân viên và lịch làm việc
- **Payment**: Thanh toán
- **Review**: Đánh giá dịch vụ
- **Admin**: Quản trị hệ thống

## 🐛 Xử lý sự cố

### Lỗi: "Metro bundler not found"
```bash
npm install --global expo-cli
npx expo start --clear
```

### Lỗi: "Unable to resolve module"
```bash
# Xóa cache và cài lại
rm -rf node_modules
npm install
npx expo start --clear
```

### Lỗi kết nối API:
- Kiểm tra file `.env` đã được cấu hình đúng
- Đảm bảo backend API đang chạy
- Kiểm tra URL trong `EXPO_PUBLIC_API_BASE_URL`

### Lỗi trên Android:
```bash
# Clear Android build cache
cd android
./gradlew clean
cd ..
npm run android
```

## 🔒 Bảo mật

- **Không commit file `.env`** - File này chứa thông tin nhạy cảm
- Token được lưu an toàn trong `expo-secure-store`
- API requests sử dụng HTTPS trong production
- Xác thực JWT cho mọi request được bảo vệ

## 👥 Đóng góp

Nếu bạn muốn đóng góp cho dự án:

1. Fork repository
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📝 License

Dự án này thuộc quyền sở hữu của [That909kk].

## 📞 Liên hệ
- **Email**: mthat456@gmail.com
- **GitHub**: [@That909kk](https://github.com/That909kk)
- **Repository**: [femobile](https://github.com/That909kk/femobile)

---

**Phát triển bởi**: Nhóm 102-Lê Minh Thật-KLTN-HK1 2025-2026 FIT IUH

**Ngày cập nhật**: October 2025
