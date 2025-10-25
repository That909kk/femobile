# Hướng dẫn thiết kế UI/UX ứng dụng sàn giúp việc gia đình

Tài liệu này mô tả hệ thống UI/UX thống nhất cho ứng dụng mobile (React Native + Expo + TypeScript) phục vụ sàn đặt dịch vụ giúp việc gia đình. Toàn bộ nội dung hiển thị bắt buộc được lấy từ các API hiện có trong thư mục `api-templates`. Admin không nằm trong phạm vi thiết kế.

## 1. Tổng quan sản phẩm
- **Vai trò phục vụ**: Khách hàng (đặt dịch vụ) và Nhân viên (nhận ca, quản lý lịch & thu nhập).
- **Nền tảng**: Expo Bare/Managed, React Navigation v6, Zustand/Redux Toolkit, axios có interceptor.
- **Ngôn ngữ**: Chỉ sử dụng Tiếng Việt. Nội dung động được quản lý qua `src/static-data/pages/*.json` với key `vi`.
- **Nguồn dữ liệu**: Gọi từ API thật thông qua `EXPO_PUBLIC_API_BASE_URL`; không hard-code dữ liệu mẫu ngoài JSON tĩnh cho copy.
- **Định hướng trải nghiệm**: hiện đại, tin cậy, thao tác tối giản, phù hợp người lao động 18-60 tuổi, hỗ trợ accessibility cơ bản (font dễ đọc, tương phản rõ, hit area ≥ 48px).

### 1.1 Persona trọng tâm
- **Khách hàng**: cần đặt lịch nhanh, theo dõi trạng thái đơn, thanh toán minh bạch (`Booking`, `Payment` APIs).
- **Nhân viên**: quản lý lịch cá nhân, nhận ca phù hợp kỹ năng, theo dõi thu nhập (`EmployeeSchedule`, `Assignment`, `Employee` APIs).
- **Admin**: không có UI.

### 1.2 Mục tiêu trải nghiệm
1. Tìm kiếm và đặt dịch vụ trong ≤ 3 bước, kiểm tra được chi phí trước khi xác nhận.
2. Nhân viên nhìn thấy ca ưu tiên ngay lập tức, thực hiện check-in/out dễ dàng.
3. Màu sắc và thông tin minh bạch để tạo niềm tin: hiển thị trạng thái, số tiền, liên hệ rõ ràng.

## 2. Nguyên tắc thiết kế nền tảng
### 2.1 Ngôn ngữ & nội dung
- Chỉ hiển thị Tiếng Việt, dùng giọng điệu thân thiện, chuyên nghiệp.
- Text tĩnh đặt trong JSON `vi`; không gộp `vi`/`en` cùng màn.
- Những thông điệp mặc định: “Không có dữ liệu”, “Đang tải…”, “Có lỗi xảy ra, vui lòng thử lại”.

### 2.2 Bảng màu nhận diện (navy – ngọc – beige)
- **Primary Navy** `#0F1C2D`: nền header, status bar, chữ chính trên nền sáng.
- **Highlight Teal** `#1BB5A6`: nút chính, trạng thái tích cực, icon nổi bật.
- **Warm Beige** `#F4EDE1`: nền khối nội dung, splash, card nhấn mạnh sự ấm áp.
- **Neutrals**: `#06111F` (text đậm), `#405065` (text phụ), `#92A3B5` (label), `#E8ECEF` (border), `#F8FAFB` (nền phụ).
- **Feedback**: Thành công `#0E9F6E`, Cảnh báo `#F6C343`, Lỗi `#D64545`.

### 2.3 Typography
- Font ưu tiên: “Be Vietnam Pro”; fallback iOS “SF Pro”, Android “Roboto”.
- Thang chữ: Heading 1 (28/34, SemiBold), Heading 2 (22/28, Medium), Heading 3 (18/24, Medium), Body (16/22, Regular), Caption (14/20, Regular).
- Căn trái, line-height ≥ 1.35, khoảng cách đoạn ≥ 12px.

### 2.4 Layout & thành phần
- Lưới 8px, radius 16px cho card, 12px cho button; shadow mềm (offset 0,4; blur 16; màu navy 10%).
- Icon dạng đường nét tròn, stroke 2px, sử dụng bộ đồng nhất (Feather/Phosphor).
- Button: Primary (navy text trên nền teal), Secondary (outline teal), Ghost (text navy).
- Các trạng thái (loading skeleton, empty, error) bắt buộc cho mỗi danh sách.

### 2.5 Tín nhiệm & accessibility
- Tương phản văn bản ≥ 4.5:1 trên nền beige/sáng.
- State điều hướng rõ: highlight tab active bằng nền teal 16% + icon teal.
- Form có label, placeholder, trợ giúp; báo lỗi đỏ với mô tả cụ thể.
- Hit area tối thiểu: 48x48px; spacing giữa phần tử ≥ 12px.

## 3. Kiến trúc thông tin & điều hướng
### 3.1 Cấu trúc điều hướng tổng
- Sử dụng React Navigation v6: `Stack` (root) + `BottomTab` (role) + `NativeStack` con cho chi tiết.
- Flow chính: Splash → Onboarding → Đăng nhập → Route theo role → Tab tương ứng.

```
AppRootStack
 ├─ SplashScreen
 ├─ OnboardingScreen
 ├─ AuthStack
 │   ├─ SignInScreen
 │   └─ ForgotPasswordScreen
 └─ RoleRouter (Stack ẩn)
     ├─ CustomerTabs
     │   ├─ HomeStack (CustomerHome, ServiceDetail, EmployeePreviewModal)
     │   ├─ BookingStack (BookingStepper, BookingSummary)
     │   ├─ OrdersStack (BookingList, BookingDetail)
     │   ├─ PaymentStack (PaymentMethods, PaymentHistory, PaymentResult)
     │   └─ ProfileStack (CustomerProfile, AddressManager, Settings)
     └─ EmployeeTabs
         ├─ ScheduleStack (CalendarView, UnavailabilityForm)
         ├─ AssignmentStack (AssignmentList, AssignmentDetail, CheckInOutSheet)
         ├─ EarningsStack (EarningsDashboard, PayoutHistory)
         └─ EmployeeProfileStack (EmployeeProfile, SkillManager, DocumentViewer)
```

### 3.2 Nguyên tắc điều hướng
- Tab bar riêng cho từng role, ẩn tab khác role bằng `RoleRouter` sau khi lấy `/api/v1/auth/me`.
- Modal hoặc bottom sheet cho các tác vụ nhanh (ví dụ: chọn phương thức thanh toán, xác nhận check-in).
- Back stack ngắn, không vượt quá 3 cấp; dùng breadcrumbs nhỏ khi cần.

### 3.3 Bản đồ thông tin
- **Khách hàng**: Khám phá dịch vụ → Chọn thời gian & nhân viên → Xác nhận đơn → Thanh toán → Theo dõi trạng thái → Đánh giá.
- **Nhân viên**: Tổng quan lịch → Khả dụng/không khả dụng → Xem ca sẵn sàng → Nhận/huỷ ca → Check-in/out → Theo dõi thu nhập → Cập nhật hồ sơ.

## 4. Luồng nghiệp vụ chính (API-driven)
### 4.1 Onboarding & xác thực
1. Splash gọi `GET /api/v1/auth/me` (Authentication) nếu có token → điều hướng thẳng RoleRouter.
2. Onboarding (3 slide) lấy nội dung từ `static-data/pages/onboarding.json` (key `vi`).
3. Đăng nhập: `POST /api/v1/auth/login` với `role` do người dùng chọn (CUSTOMER hoặc EMPLOYEE). Sau login lưu token vào secure storage, update state global.
4. Lấy thông tin tài khoản chi tiết:
   - Khách hàng: `GET /api/v1/customer/active` (lọc bản thân bằng ID trong token) hoặc endpoint chi tiết trong `API-TestCases-GetInfoOfUser.md`.
   - Nhân viên: `GET /api/v1/employee/{employeeId}`.
5. Tra cứu quyền: `GET /api/v1/auth/roles` (nếu cần) → map sang luồng UI tương ứng.

### 4.2 Khách hàng
#### 4.2.1 Khám phá & đặt lịch
1. Tải danh sách dịch vụ: `GET /api/v1/customer/services`.
2. Khi mở chi tiết dịch vụ, tải tuỳ chọn liên quan (CategoryService/Service Option nếu cần).
3. Lấy địa chỉ mặc định: `GET /api/v1/customer/bookings/{customerId}/default-address`.
4. Người dùng chọn ngày/giờ → gửi `POST /api/v1/customer/bookings/validate` để tính giá, kiểm tra xung đột.
5. Gợi ý nhân viên: `GET /api/v1/employee-schedule/suitable?serviceId=&bookingTime=...`.
6. Tạo đơn chính thức: `POST /api/v1/customer/bookings` (request body theo Booking API).

#### 4.2.2 Theo dõi đơn
- Danh sách: `GET /api/v1/customer/bookings/customer/{customerId}?page=&size=&sort=`.
- Chi tiết: `GET /api/v1/customer/bookings/{bookingId}` (status, lịch sử, chi tiết nhân viên được gán).
- Hiển thị trạng thái theo `status` (PENDING, AWAITING_EMPLOYEE, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED).
- Đánh giá sau khi hoàn tất: `POST /api/v1/customer/reviews` (từ Review API).

#### 4.2.3 Thanh toán minh bạch
1. Lấy phương thức: `GET /api/v1/customer/payments/methods`.
2. Tạo yêu cầu thanh toán: `POST /api/v1/customer/payments` (bookingId + methodId).
3. Hiển thị kết quả/QR nếu trả về (Payment API).
4. Lịch sử thanh toán: `GET /api/v1/customer/payments/history/{customerId}?page=&size=&sort=`.
5. Tra cứu thanh toán theo booking: `GET /api/v1/customer/payments/booking/{bookingId}` (nếu có trong API template).

#### 4.2.4 Hồ sơ & địa chỉ
- Cập nhật thông tin: `PUT /api/v1/customer/{customerId}`; upload avatar `POST /api/v1/customer/{customerId}/avatar`.
- Quản lý địa chỉ: sử dụng API Address (nếu có) hoặc Booking default address (ẩn/hiện tuỳ logic).

### 4.3 Nhân viên
#### 4.3.1 Quản lý lịch & khả dụng
- Lịch cá nhân: `GET /api/v1/employee-schedule/{employeeId}?startDate=&endDate=`.
- Khai báo bận: `POST /api/v1/employee-schedule/unavailability`.
- Danh sách nhân viên sẵn sàng (để tự soát): `GET /api/v1/employee-schedule?status=AVAILABLE&...`.

#### 4.3.2 Nhận ca & quản lý công việc
- Danh sách ca đang nắm: `GET /api/v1/employee/{employeeId}/assignments?status=`.
- Booking trống có thể nhận: `GET /api/v1/employee/available-bookings`.
- Nhận ca: `POST /api/v1/employee/booking-details/{detailId}/accept`.
- Huỷ ca (trước 2h): `POST /api/v1/employee/assignments/{assignmentId}/cancel`.

#### 4.3.3 Thực thi ca
- Check-in: `POST /api/v1/employee/assignments/{assignmentId}/check-in`.
- Check-out: `POST /api/v1/employee/assignments/{assignmentId}/check-out`.
- Hiển thị trạng thái thực hiện và log thời gian ngay trên màn chi tiết.

#### 4.3.4 Thu nhập & hồ sơ
- Tính thu nhập tạm tính: tổng `price` từ `GET /api/v1/employee/{employeeId}/assignments?status=COMPLETED`.
- Lịch sử thanh toán đến nhân viên (nếu có API Payment riêng); nếu chưa, hiển thị N/A và hướng dẫn nâng cấp.
- Cập nhật hồ sơ: `PUT /api/v1/employee/{employeeId}`, upload avatar `POST /api/v1/employee/{employeeId}/avatar`.

## 5. Thiết kế màn hình & binding dữ liệu
(Mỗi màn đều phải có trạng thái loading, empty và error.)

### 5.1 Nhóm màn hình dùng chung
**SplashScreen**
- Hiển thị logo nền navy + transition fade-in 600ms.
- Gọi `GET /api/v1/auth/me`. Thành công → RoleRouter; lỗi → Onboarding.

**OnboardingScreen**
- Carousel 3 slide (ảnh nền gradient navy→teal, illustration PNG).
- Content lấy từ `static-data/pages/onboarding.json`.
- Nút “Bắt đầu ngay” primary teal, animation parallax nhẹ.

**SignInScreen**
- Form username/password, toggle hiển thị mật khẩu.
- Validate client + server: lỗi hiển thị thông báo từ API.
- Gọi `POST /api/v1/auth/login`; loading button 500ms spinner.
- CTA phụ: “Quên mật khẩu?” → ForgotPasswordScreen.

**ForgotPasswordScreen**
- Gửi OTP qua `POST /api/v1/auth/forgot-password` (Authentication API).
- State success hiển thị bottom sheet “Kiểm tra email/SMS”.

### 5.2 Khách hàng
**CustomerHomeScreen**
- Header cá nhân hoá: tên từ `auth/me`, avatar `customer.avatar`.
- Banner khuyến nghị (promotion) nếu API cung cấp.
- Danh sách dịch vụ (card lớn) từ `GET /api/v1/customer/services`, hiển thị giá cơ bản, thời lượng.
- Section “Nhân viên nổi bật”: `GET /api/v1/employee-schedule?status=AVAILABLE&city=...` giới hạn 4 mục.

**ServiceDetailModal**
- Hiển thị mô tả, danh sách lựa chọn nâng cao (Service Option API).
- CTA “Đặt lịch ngay” đưa sang BookingStepper.

**BookingStepper (3 bước)**
1. **Thông tin dịch vụ**: chọn địa chỉ (mặc định + thêm mới), số lượng tùy chọn. Validate qua `POST /api/v1/customer/bookings/validate`.
2. **Thời gian & nhân viên**: picker lịch (calendar + time slot). Gọi `GET /api/v1/employee-schedule/suitable`. Hiển thị thẻ nhân viên (avatar, kỹ năng, rating).
3. **Xác nhận & giá**: show breakdown từ response validate (`calculatedTotalAmount`, `promotion`). CTA “Tạo đơn” gọi `POST /api/v1/customer/bookings`.
- Animation chuyển bước: slide ngang, progress indicator 1-3.

**BookingSuccessScreen**
- Hiển thị mã booking (`bookingCode`), trạng thái ban đầu từ response.
- Nút “Theo dõi đơn” → BookingDetail.

**BookingListScreen**
- Tabs filter: Tất cả, Đang xử lý (PENDING/AWAITING_EMPLOYEE), Đang thực hiện, Hoàn tất, Đã huỷ.
- Data: `GET /api/v1/customer/bookings/customer/{customerId}?status=...`.
- Empty state illustration beige nền.

**BookingDetailScreen**
- Header hiển thị trạng thái + màu tương ứng.
- Sections: Thông tin dịch vụ, Thông tin nhân viên (khi có assignment), Địa chỉ, Ghi chú.
- Timeline: hiển thị `bookingTime`, `checkIn`, `checkOut` (nếu API cung cấp trong detail).
- Nút “Thanh toán” nếu `payment.status !== PAID`.
- CTA “Đánh giá dịch vụ” mở ReviewModal sau khi `status === COMPLETED`.

**PaymentMethodsScreen**
- Dữ liệu từ `GET /api/v1/customer/payments/methods`.
- Card hiển thị logo (icon), mô tả, phí.
- Chọn method → confirm bottom sheet hiển thị tổng tiền (từ booking detail/promotion).
- Gọi `POST /api/v1/customer/payments`, xử lý các trạng thái PENDING/PAID/FAILED.

**PaymentHistoryScreen**
- Danh sách `GET /api/v1/customer/payments/history/{customerId}` có pagination endless scroll.
- Mỗi item hiển thị bookingCode, method, số tiền, status badge.

**CustomerProfileScreen**
- Thông tin cá nhân + nút “Chỉnh sửa” → form `PUT /api/v1/customer/{customerId}`.
- Ảnh đại diện: ấn mở bottom sheet chọn ảnh → upload `POST /api/v1/customer/{customerId}/avatar`.
- Quản lý địa chỉ: hiển thị default từ Booking API; CTA “Thêm mới” (nếu có endpoint).

### 5.3 Nhân viên
**EmployeeDashboardScreen**
- Header: chào tên, trạng thái (AVAILABLE/BUSY).
- Thống kê nhanh: ca hôm nay, giờ đã đặt, thu nhập tuần → tính từ assignments (lọc theo `scheduledDate`).
- Shortcut: “Xem ca trống”, “Tạo lịch bận”.

**ScheduleCalendarScreen**
- Lịch tháng với dot theo `GET /api/v1/employee-schedule/{employeeId}`.
- Chi tiết ngày: list timeSlots (status AVAILABLE/BUSY/UNAVAILABLE).
- Nút “Đánh dấu bận” mở form `POST /api/v1/employee-schedule/unavailability`.

**AvailableBookingsScreen**
- Danh sách từ `GET /api/v1/employee/available-bookings`.
- Hiển thị serviceName, thời gian, thu nhập, khoảng cách (nếu API cung cấp).
- CTA “Nhận ca” gọi `POST /api/v1/employee/booking-details/{detailId}/accept`.
- Animation: slide-in bottom sheet xác nhận, loading state 400ms.

**AssignmentListScreen**
- Tabs: Sắp tới (ASSIGNED), Đang thực hiện (IN_PROGRESS), Đã hoàn tất (COMPLETED).
- Data: `GET /api/v1/employee/{employeeId}/assignments?status=`.
- Empty state kèm CTA “Nhận ca mới”.

**AssignmentDetailScreen**
- Timeline: giờ bắt đầu, vị trí (map static image), thông tin khách (`customerName`, `address`), dịch vụ.
- Nút Check-in (enable trước giờ 15 phút) → `POST /assignments/{assignmentId}/check-in`.
- Nút Check-out → `POST /assignments/{assignmentId}/check-out`.
- Nút “Huỷ ca” hiển thị cảnh báo, gọi `POST /assignments/{assignmentId}/cancel` (chỉ nếu đủ điều kiện).

**EarningsDashboardScreen**
- Widget số dư tuần/tháng: tổng `price` của assignment COMPLETED.
- Biểu đồ thanh (sparkline) hiển thị 7 ngày gần nhất.
- CTA “Xem chi tiết” → PayoutHistory.

**PayoutHistoryScreen**
- Nếu có API thanh toán cho nhân viên, hiển thị; nếu chưa, show thông báo “Tính năng đang phát triển”.

**EmployeeProfileScreen**
- Form chỉnh sửa: `PUT /api/v1/employee/{employeeId}` (avatar, kỹ năng, mô tả).
- Upload chứng từ (nếu API Permission/Document): hiển thị placeholder.

### 5.4 Thành phần phụ trợ
- **NotificationsModal**: nhận payload từ push hoặc polling (nếu có endpoint). Hiển thị badge teal.
- **SearchEmployeeSheet**: tái sử dụng `GET /api/v1/employee-schedule?status=AVAILABLE` cho khách hoặc admin (sau này).
- **StatusBadges**: map status → màu: `PENDING` navy nhẹ, `AWAITING_EMPLOYEE` vàng, `IN_PROGRESS` teal, `COMPLETED` xanh lá, `CANCELLED` đỏ.

## 6. Tương tác & animation
- Chuyển tab: scale icon 0.9→1.0 và đổi màu trong 180ms.
- Button chính: ripple teal nhạt (Android) + opacity 85ms (iOS).
- List skeleton: shimmer gradient navy 6%.
- Modal/bottom sheet: spring nhẹ (damping 18), backdrop blur 12%.
- Check-in/out: hiển thị vòng tròn progress (lottie hoặc Animated API) 250ms.
- Refresh list sử dụng pull-to-refresh (expo-refresh-control) với spinner teal.

## 7. Hệ thống component & trạng thái
- **FormInput**: label nhỏ, helper, icon leading optional. Error text đỏ, background beige nhạt.
- **InfoCard**: header icon teal, body text navy, border radius 16.
- **ChipFilter**: outline teal, filled khi chọn; text 14px.
- **TimelineItem**: dot gradient teal, line mảnh 2px, hiển thị giờ + mô tả.
- **AvatarStack**: cho danh sách nhân viên; fallback `https://picsum.photos/200` nếu avatar null (theo hướng dẫn).
- **EmptyState**: illustration vector, heading 18, body 14, CTA secondary.
- **Toast**: dùng `react-native-toast-message` màu theo feedback palette.

## 8. Hướng dẫn triển khai & kiểm thử
- **Quản lý dữ liệu**:
  - Tạo layer service trong `src/services/*` theo resource (BookingService, PaymentService…).
  - Cache dữ liệu booking/payment bằng Zustand + persist, TTL 5 phút.
  - Sử dụng `expo-sqlite` để lưu tạm lịch sử đơn/offline (opt-in).
- **Static copy**: mỗi màn có file JSON `vi` riêng; keys dạng snake_case. Ví dụ `src/static-data/pages/booking.json`.
- **Xử lý lỗi**: mapping status code → thông điệp user-friendly (401 → yêu cầu đăng nhập, 403 → không đủ quyền, 500 → thử lại sau).
- **Kiểm thử**:
  - Lập checklist theo các test case trong `api-templates` (Booking, Payment, Assignment).
  - Viết unit test cho formatter (giá tiền, trạng thái).
  - Test end-to-end trên Android/iOS (Expo Go + build preview).
- **Hiệu năng**: batch API song song (dịch vụ + lịch) bằng `Promise.all`, dùng pagination/infinite scroll cho danh sách dài.
- **Dọn file**: xoá asset/demo không sử dụng; không tạo trang test/debug.
- **Bảo mật**: lưu token trong `expo-secure-store`, refresh token tự động qua `POST /api/v1/auth/refresh`.

## 9. Tiếp theo & mở rộng
- Khi có API đánh giá (`/api/v1/customer/reviews`), thêm module Review trong cả hai tab.
- Xây dựng analytics cơ bản (sự kiện đặt đơn thành công, check-in) với expo-tracking.
- Chuẩn bị dark mode sau khi hoàn tất bản sáng (đảm bảo palette chuyển đổi hợp lý).

Tất cả thiết kế phải được triển khai nhất quán với bảng màu navy – ngọc – beige, hoạt ảnh tinh tế và dữ liệu lấy trực tiếp từ API. Kiểm tra kỹ UI trên nhiều kích thước màn hình để đảm bảo trải nghiệm tin cậy, chuyên nghiệp và dễ dùng cho cả khách hàng lẫn người lao động.
