# Hướng dẫn Phát triển Mobile App (React Native Expo + TypeScript)
**Vai trò:** Expert Software Engineer — *trả lời bằng Tiếng Việt.*  
## Cấu trúc dự án
- `assets/`  
  - Chứa hình ảnh, icon, font, file âm thanh hoặc video.  
  - Không chứa dữ liệu JSON (dữ liệu tĩnh nằm trong `static-data`).  
- `src/app/`  
  - Entry point, cấu hình Navigation Container, Providers (Theme, Store…).  
- `src/screens/`  
  - Mỗi màn hình ứng dụng được đặt trong thư mục riêng.  
  - Ví dụ: `HomeScreen/`, `LoginScreen/`, `ProfileScreen/`.  
- `src/components/`  
  - Component UI tái sử dụng: Button, Card, Modal, Input…  
- `src/static-data/pages/<ten-trang>.json`  
  - Dữ liệu tĩnh: label, text, button… mỗi màn hình một file JSON.  
  - Không hard-code nội dung trực tiếp trong component.  
- `src/services/`  
  - API call tập trung, chia theo resource.  
  - `httpClient.ts`: Cấu hình Axios + interceptor.  
- `src/store/`  
  - Quản lý state toàn cục (Redux Toolkit hoặc Zustand).  
- `src/hooks/`  
  - Custom hooks dùng chung: useAuth, useFetch…  
- `src/utils/`  
  - Hàm helper xử lý logic chung.  
- `src/constants/`  
  - Hằng số dùng chung: API_URL, COLORS, ROUTES…  
- `src/types/`  
  - Kiểu TypeScript chung: ApiResponse, Pagination…  
- `app.json`  
  - Cấu hình Expo (tên app, icon, splash screen…).  
- `.env.*`  
  - Biến môi trường cho từng môi trường (development, production).  
## Quy tắc
- Không hard-code text — import từ file JSON tương ứng
- Dùng React Navigation v6
- State management: Zustand hoặc Redux Toolkit
- API call: axios + interceptor
- Hỗ trợ đa ngôn ngữ (i18n) nếu mở rộng
- Đảm bảo đồng bộ giữa Android và IOS
- Đảm bảo tính đồng bộ của các chức năng với fe_housekeepingservice
- Query cache + `expo-sqlite` (nếu cần dữ liệu cục bộ).
- Mỗi lần chỉ thực hiện 1 câu lệnh để import các dependencies cần thiết(sử dụng ; thay cho && )
- Đảm bảo không có bất kỳ lỗi và Problems nào trước khi chạy thử để test 
- Đảm bảo scale trên các màn hình IOS và Android
- Khi muốn gọi API vào /api-templates/{Tên Tính Năng}/*.md để xem cấu trúc API
- Không cần Xử lí role ADMIN
- Nếu có hình ảnh từ API thì ưu tiên xài trước và nếu không thì có thể sử dụng https://picsum.photos/200
- Không được tự ý tạo các trang để Test, debug, demo nào khác
- Sử dụng EXPO_PUBLIC_API_BASE_URL từ file .env
- Đảm bảo scale trên tất cả loại màn hình IOS và Android
## Static-data JSON (quy ước)
```json
{
  "vi": {
    "title": "Trang dịch vụ",
    "actions": { "book": "Đặt dịch vụ", "consult": "Tư vấn" },
    "messages": { "empty": "Không có dữ liệu" }
  },
  "en": { "title": "Services Page", "actions": { "book": "Book" } }
}
