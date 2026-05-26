
=============================================================================
    CHUẨN BỊ BACKEND CHO DỰ ÁN VEXERE CLONE
=============================================================================

HIỆN TRẠNG:
- Frontend: React + Vite (hoàn thành)
- Dữ liệu: Lưu trữ trên localStorage (demo tạm thời)
- Cần: Backend API để thay thế localStorage

=============================================================================
1. CHỌN CÔNG NGHỆ
=============================================================================

TÙY CHỌN A: Node.js + Express (KHUYÊN DÙNG)
✓ Ưu: JavaScript, dễ tích hợp với React
✓ Cộng đồng lớn, nhiều thư viện
✓ Nhanh, lightweight
✓ Phù hợp với dự án vừa

Công nghệ:
- Express.js (framework web)
- MongoDB hoặc PostgreSQL (database)
- JWT (xác thực)
- Mongoose/TypeORM (ORM)

TÙY CHỌN B: Python + Django/FastAPI
✓ Ưu: Dễ học, code sạch
✓ ORM mạnh mẽ (Django ORM)
✓ Security tốt

TÙY CHỌN C: Java + Spring Boot
✓ Ưu: Performant, enterprise-grade
✓ Nhưng phức tạp cho dự án vừa

=> KHUYÊN DÙNG: Node.js + Express + MongoDB (hoặc PostgreSQL)

=============================================================================
2. API ENDPOINTS CẦN THIẾT
=============================================================================

A. XÁC THỰC (Auth)
─────────────────────────────────────────────────────────────────────────
POST   /api/auth/register          → Đăng ký tài khoản
POST   /api/auth/login             → Đăng nhập (trả JWT token)
POST   /api/auth/logout            → Đăng xuất
POST   /api/auth/refresh-token     → Làm mới token
POST   /api/auth/forgot-password   → Quên mật khẩu
POST   /api/auth/reset-password    → Đặt lại mật khẩu

B. NGƯỜI DÙNG (User)
─────────────────────────────────────────────────────────────────────────
GET    /api/users/profile          → Lấy thông tin tài khoản
PUT    /api/users/profile          → Cập nhật thông tin tài khoản
GET    /api/users/:id              → Lấy thông tin user (admin)

C. CHUYẾN ĐI (Trips)
─────────────────────────────────────────────────────────────────────────
GET    /api/trips                  → Danh sách chuyến đi (có filter)
GET    /api/trips/:tripId          → Chi tiết chuyến đi
GET    /api/trips/search           → Tìm kiếm chuyến đi
POST   /api/trips                  → Tạo chuyến đi (admin)
PUT    /api/trips/:tripId          → Cập nhật chuyến đi (admin)
DELETE /api/trips/:tripId          → Xóa chuyến đi (admin)

D. GHẾ (Seats)
─────────────────────────────────────────────────────────────────────────
GET    /api/trips/:tripId/seats    → Lấy danh sách ghế chuyến đi
GET    /api/seats/:seatId/price    → Lấy giá ghế theo vị trí

E. ĐẶT VÉ (Bookings)
─────────────────────────────────────────────────────────────────────────
POST   /api/bookings               → Tạo đặt vé
GET    /api/bookings/:bookingId    → Chi tiết đặt vé
GET    /api/users/:userId/bookings → Danh sách vé của user
PUT    /api/bookings/:bookingId    → Cập nhật trạng thái vé
POST   /api/bookings/:bookingId/cancel      → Hủy vé
POST   /api/bookings/:bookingId/exchange    → Đổi vé
GET    /api/bookings              → Danh sách toàn bộ vé (admin)

F. THANH TOÁN (Payments)
─────────────────────────────────────────────────────────────────────────
POST   /api/payments               → Khởi tạo thanh toán
POST   /api/payments/callback      → Callback từ payment gateway
GET    /api/payments/:paymentId    → Chi tiết thanh toán

G. VÍ (Wallet)
─────────────────────────────────────────────────────────────────────────
GET    /api/wallet/balance         → Số dư ví
GET    /api/wallet/history         → Lịch sử giao dịch
POST   /api/wallet/topup           → Nạp tiền vào ví
POST   /api/wallet/withdraw        → Rút tiền từ ví

H. CÁC NHÀ CUNG CẤP (Carriers)
─────────────────────────────────────────────────────────────────────────
GET    /api/carriers               → Danh sách nhà cung cấp
POST   /api/carriers               → Tạo nhà cung cấp (admin)
PUT    /api/carriers/:carrierId    → Cập nhật nhà cung cấp (admin)
DELETE /api/carriers/:carrierId    → Xóa nhà cung cấp (admin)

I. QUẢN LÝ (Admin)
─────────────────────────────────────────────────────────────────────────
GET    /api/admin/dashboard        → Thống kê dashboard
GET    /api/admin/users            → Danh sách user
GET    /api/admin/bookings         → Toàn bộ đơn đặt vé

=============================================================================
3. DATABASE SCHEMA (MongoDB)
=============================================================================

User
├── _id (ObjectId)
├── email (String, unique)
├── password (String, hashed)
├── fullName (String)
├── phone (String)
├── avatar (String)
├── role (enum: 'user', 'admin', 'carrier')
├── createdAt (Date)
├── updatedAt (Date)

Trip
├── _id (ObjectId)
├── carrierId (ObjectId → Carrier)
├── from (String)
├── to (String)
├── departure (String) // HH:mm
├── arrival (String)
├── duration (String) // XhYm
├── date (Date)
├── bus (String) // Tên xe
├── seats (Number)
├── seatsLayout (Array) // [0-99] = trạng thái ghế
├── price (Number)
├── rating (Number)
├── reviews (Number)
├── image (String)
├── createdAt (Date)

Booking
├── _id (ObjectId)
├── userId (ObjectId → User)
├── tripId (ObjectId → Trip)
├── items (Array) // [{tripId, price, qty, seatLabels, ...}]
├── total (Number)
├── paymentStatus (enum: 'pending', 'paid', 'failed')
├── cancelStatus (enum: 'active', 'canceled')
├── canceledAt (Date)
├── cancelReason (String)
├── exchanges (Array) // [{at, fromItems, toItems, fee, ...}]
├── history (Array) // [{at, type, meta}]
├── createdAt (Date)

Payment
├── _id (ObjectId)
├── bookingId (ObjectId → Booking)
├── userId (ObjectId → User)
├── amount (Number)
├── method (String) // 'credit_card', 'bank_transfer', etc
├── status (enum: 'pending', 'success', 'failed')
├── transactionId (String)
├── createdAt (Date)

Wallet
├── _id (ObjectId)
├── userId (ObjectId → User)
├── balance (Number)
├── history (Array) // [{at, type, amount, reason, ...}]
├── updatedAt (Date)

Carrier
├── _id (ObjectId)
├── name (String)
├── email (String)
├── phone (String)
├── rating (Number)
├── reviews (Number)
├── createdAt (Date)

=============================================================================
4. CƠ SỐ DỮ LIỆU - CHỌN LỰA
=============================================================================

MONGODB (NoSQL - KHUYÊN DÙNG)
✓ Linh hoạt, scaling dễ
✓ Phù hợp với JavaScript
✓ Atlas miễn phí

POSTGRESQL (SQL)
✓ Mạnh, transaction tốt
✓ Open source
✓ Nếu cần SQL

CHỌN: MongoDB hoặc PostgreSQL tuỳ yêu cầu

=============================================================================
5. XÁC THỰC & BẢO MẬT
=============================================================================

A. JWT (JSON Web Tokens)
- Access token (15-30 phút)
- Refresh token (7 ngày)
- Header: Authorization: Bearer <token>

B. Password hashing
- Sử dụng bcrypt
- Không lưu plaintext

C. Validation
- Input validation (express-validator)
- Rate limiting (express-rate-limit)
- CORS (cross-origin)

D. HTTPS
- SSL certificate
- TLS encryption

=============================================================================
6. MIDDLEWARE CẦN THIẾT
=============================================================================

✓ Authentication middleware (kiểm tra JWT)
✓ Authorization middleware (kiểm tra role)
✓ Error handling middleware
✓ Logging middleware
✓ CORS middleware
✓ Request validation middleware
✓ Rate limiting middleware

=============================================================================
7. CẦU NỐI FRONTEND ↔ BACKEND
=============================================================================

Frontend (hiện tại dùng localStorage):
- Tạo API client (Axios hoặc fetch)
- Cập nhật tất cả function từ:
  - tripsStorage.js → API /api/trips
  - bookingsStorage.js → API /api/bookings
  - walletStorage.js → API /api/wallet
  - (Auth đã sẵn có qua AuthContext)

Backend sẽ thay thế tất cả localStorage bằng database

=============================================================================
8. DEPLOYMENT
=============================================================================

Backend options:
- Heroku (dễ, free tier bị cắt)
- Railway.app (tiền)
- Render.com (tiền)
- DigitalOcean (VPS, rẻ)
- AWS (cloud, phức tạp)

Database:
- MongoDB Atlas (cloud, free tier 512MB)
- PostgreSQL: Railway, Render

=============================================================================
9. TIMELINE ĐỀ XUẤT
=============================================================================

Tuần 1:
- Chọn công nghệ + thiết lập project
- Tạo project Node.js + Express
- Cấu hình database (MongoDB/PostgreSQL)

Tuần 2:
- API xác thực (register, login)
- JWT middleware
- Database models

Tuần 3:
- API Trips (CRUD)
- API Bookings (create, cancel, exchange)
- API Payments

Tuần 4:
- API Wallet
- Admin endpoints
- Testing

Tuần 5:
- Deploy backend
- Test với frontend
- Bug fixes

=============================================================================
10. CÔNG CỤ & THƯ VIỆN KHUYÊN DÙNG
=============================================================================

Framework:
- express (web framework)
- cors (cross-origin)
- dotenv (biến môi trường)

Database:
- mongoose (MongoDB ORM)
- pg (PostgreSQL driver)

Validation:
- joi hoặc express-validator

Xác thực:
- jsonwebtoken (JWT)
- bcryptjs (password hashing)

Utilities:
- axios (HTTP client)
- multer (file upload)
- winston (logging)

Testing:
- jest (unit tests)
- supertest (API tests)

=============================================================================
11. GỌI Ý TIẾP THEO
=============================================================================

1. Quyết định công nghệ: Node.js hay Python?
2. Quyết định database: MongoDB hay PostgreSQL?
3. Tạo thư mục backend riêng hoặc cùng project?
4. Thiết lập environment variables
5. Tạo file structure backend

BẠN MUỐN CHÚNG TÔI BẮT ĐẦU VỚI CÁI NÀO TRƯỚC?
- Node.js + Express + MongoDB?
- Python + FastAPI + PostgreSQL?
- Hoặc khác?

=============================================================================
