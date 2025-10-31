# Hệ thống Quản lý Dịch vụ Giúp Việc Gia Đình - Công ty TNHH Thành Thật

## Mục tiêu
Xây dựng hệ thống đa nền tảng (Web, Mobile) phục vụ:
- Quản lý khách hàng, nhân viên tạp vụ, dịch vụ, hóa đơn, thống kê.
- Đăng ký, tìm kiếm, tra cứu dịch vụ giúp việc.
- Quản lý và kết nối người lao động với người có nhu cầu.

## Nền tảng & Công nghệ
- **Web**: React JS 19 + Vite + TypeScript
- **Mobile App**: React Native (Expo) + TypeScript
- **API**: RESTful API chuẩn hóa
- **Dữ liệu tĩnh**: Mỗi trang 1 file JSON trong `static-data`

## Quy tắc phát triển
- Tuân thủ file detail (ưu tiên cao nhất khi có xung đột).
- Luôn trả lời & viết code review bằng tiếng Việt.
- Dữ liệu tĩnh không hard-code, chỉ lấy từ file JSON.
- FE & BE phát triển song song dựa trên API contract thống nhất.

## Quy tắc gọi API
- Nếu là Web app thì vào /api-templates/* để lấy API mẫu của dự án
- Nếu là Mobile app thì vào /api-templates/* để lấy API mẫu của dự án
- Không được sử dụng data tĩnh.

## Quy tắc code
- Nếu là Web app thì vào /fe_housekeepingservice để viết code và tuân thủ theo file react.instruction.md
- Nếu là Mobile app thì vào /femobile để viết code và tuân thủ file reactnative.instruction.md
- Phải có sự nhất quán và đồng bộ tính năng giữa fe_housekeepingservice và mobile_housekeepingservice
- Đảm bảo clean code, dễ đọc, chia nhỏ đúng cách để dễ dàng bảo trì
- Đảm bảo không có bất kỳ lỗi syntax 
- Đảm bảo không có bất kỳ lỗi nào trước khi chạy thử để test
## Thông tin quyền tác giả hiển thị
- Lê Minh Thật (That909kk)
- mthat456@gmail.com
- 0825371577
- Zalo: 0342287853 (Minh That)
- Tên ứng dụng: Home Mate
- 15 Nguyễn Đỗ Cung, Phường Tây Thạnh, Thành phố Hồ Chí Minh