# Hướng dẫn Phát triển Frontend Web (React 19 + Vite + TypeScript)
**Vai trò:** Expert Software Engineer — *trả lời bằng Tiếng Việt.*
## Cấu trúc dự án
- `public/`  
  - File tĩnh không qua quá trình build, phục vụ trực tiếp (favicon, manifest, robots.txt).  
- `src/app/`  
  - Entry point (`main.tsx`), `App.tsx`.  
  - `router/`: Định nghĩa routes (public/private).  
  - `providers/`: Global providers (Theme, Store, QueryClient…).  
- `src/assets/`  
  - Chứa ảnh, icon, font, import trực tiếp vào component.  
  - `images/`, `icons/`, `fonts/`.  
- `src/static-data/pages/<ten-trang>.json`  
  - Dữ liệu tĩnh: label, text, button… mỗi trang một file JSON.  
  - Không hard-code nội dung trực tiếp trong component.  
- `src/features/`  
  - Chia module theo domain nghiệp vụ (auth, customers, services, invoices…).  
  - Mỗi module có thể chứa `components/`, `hooks/`, `services/`, `types.ts`.  
- `src/entities/`  
  - Định nghĩa kiểu dữ liệu, model cho domain (customer.ts, service.ts…).  
- `src/shared/`  
  - `components/`: Component UI tái sử dụng (Button, Modal, Table…).  
  - `hooks/`: Custom hooks dùng chung.  
  - `utils/`: Hàm helper xử lý logic chung.  
  - `constants/`: Hằng số dùng chung.  
  - `styles/`: CSS/SCSS module, theme.  
  - `config/`: Config app (API URL, env…).  
- `src/services/`  
  - Tập trung định nghĩa API call, chia theo resource.  
  - `httpClient.ts`: Cấu hình Axios + interceptor.  
- `src/store/`  
  - Quản lý state toàn cục (Redux Toolkit hoặc Zustand).  
- `src/types/`  
  - Kiểu TypeScript chung (ApiResponse, Pagination…).  
- `index.css`  
  - CSS global.  
- `vite-env.d.ts`  
  - TypeScript types cho Vite.  
- `.env.*`  
  - Biến môi trường cho từng môi trường (development, production).  
## Quy tắc
- Strict TypeScript (`"strict": true`)
- Không hard-code text, label, button — luôn import từ `static-data`
- Tên biến, hàm, component đặt theo camelCase (function, biến), PascalCase (component)
- Sử dụng React Query hoặc RTK Query cho API call
- UI tuân thủ design system được mô tả trong file detail
- Đảm bảo sự scale giữa các màn hình khác nhau
- Đảm bảo sự đồng bộ các tính năng với mobile_housekeepingservice
- Mỗi lần chỉ thực hiện 1 câu lệnh để import các dependencies cần thiết(sử dụng ; thay cho && )
- Đảm bảo không có bất kỳ lỗi và Problems nào trước khi chạy thử để test
- Có thể sử sử dụng tailwind css hoặc tương đương
- Khi muốn gọi API vào /api-templates/{Tên Tính Năng}/*.md để xem cấu trúc API
- Không được tự ý tạo các trang để Test, debug, demo nào khác
## API Call
- Sử dụng endpoint từ API contract đã thống nhất
- Error handling tập trung (Global error boundary)
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