# 🏦 Hướng Dẫn Thanh Toán Chuyển Khoản Ngân Hàng

## 📋 Tổng Quan

Hệ thống thanh toán chuyển khoản ngân hàng đã được tích hợp hoàn chỉnh vào dự án Vexe. Khách hàng có thể chuyển khoản để thanh toán vé, và admin có thể xác nhận các thanh toán thông qua dashboard.

---

## 🚀 Cách Hoạt Động

### Quy Trình Khách Hàng:
1. **Tìm kiếm và chọn chuyến xe**
2. **Chọn loại xe và ghế** (3 bước)
3. **Tới trang Checkout**
4. **Chọn phương thức thanh toán**: "🏦 Chuyển khoản"
5. **Nhấn "Xác nhận thanh toán"**
6. **Nhận thông tin chuyển khoản**:
   - Số tài khoản ngân hàng
   - Tên tài khoản
   - Nội dung chuyển
   - Số tiền cần chuyển
7. **Thực hiện chuyển khoản tại ngân hàng hoặc app ngân hàng**
8. **Admin xác nhận** → Booking được kích hoạt

---

## 🔧 Configuration

### 1. Backend .env
```bash
# Bank Transfer Payment Configuration
BANK_ACCOUNT_NAME=VEX TRANSPORT CO.
BANK_ACCOUNT_NUMBER=1234567890123
BANK_NAME=Vietcombank
BANK_BRANCH=Chi nhánh Hà Nội
BANK_CODE=970436
```

**Cập nhật thông tin ngân hàng thực tế của bạn vào đây!**

### 2. Database Schema
Các bảng mới được tạo:
- **payments** - Lưu trữ thông tin thanh toán
- **bookings** - Thêm trường `paymentMethod` và `paymentStatus`

---

## 📱 API Endpoints

### Công Khai (Public)
```
GET  /api/payments/bank-info
```
Lấy thông tin tài khoản ngân hàng

**Response:**
```json
{
  "data": {
    "accountName": "VEX TRANSPORT CO.",
    "accountNumber": "1234567890123",
    "bankName": "Vietcombank",
    "bankBranch": "Chi nhánh Hà Nội",
    "bankCode": "970436"
  }
}
```

---

### Người Dùng (Requires Auth)
```
POST /api/payments/bank-transfer
```
Tạo payment record cho chuyển khoản

**Request:**
```json
{
  "bookingId": "uuid",
  "amount": 150000,
  "bankTransferNote": "Booking ABC123 - Bus Ticket"
}
```

**Response:**
```json
{
  "payment": {
    "id": "payment-uuid",
    "bookingId": "booking-uuid",
    "amount": 150000,
    "status": "pending",
    "createdAt": "2024-01-15T10:00:00Z"
  },
  "instructions": {
    "text": "Vui lòng chuyển khoản...",
    "bankInfo": {...},
    "transferNote": "Booking ABC - Bus Ticket"
  }
}
```

---

```
GET /api/payments/:paymentId
```
Lấy chi tiết thanh toán

**Response:**
```json
{
  "payment": {
    "id": "payment-uuid",
    "bookingId": "booking-uuid",
    "amount": 150000,
    "status": "pending",
    "bankTransferDate": null,
    "bankSenderName": null,
    "verifiedAt": null
  }
}
```

---

### Admin (Requires Auth + Admin Role)
```
GET /api/payments/admin/pending
```
Lấy danh sách chuyển khoản chờ xác nhận

**Response:**
```json
{
  "count": 5,
  "payments": [
    {
      "id": "payment-uuid",
      "bookingId": "booking-uuid",
      "amount": 150000,
      "status": "pending",
      "user": {
        "email": "user@example.com",
        "fullName": "Nguyễn Văn A",
        "phone": "0912345678"
      },
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

```
POST /api/payments/admin/:paymentId/verify
```
Xác nhận chuyển khoản

**Request:**
```json
{
  "bankSenderName": "NGUYEN VAN A",
  "bankSenderAccount": "9876543210",
  "transactionRef": "250115ABCD1234",
  "bankTransferDate": "2024-01-15",
  "bankTransferTime": "14:30",
  "verificationNote": "Đã kiểm tra sổ ghi chép"
}
```

**Response:**
```json
{
  "message": "Payment verified successfully",
  "payment": {
    "id": "payment-uuid",
    "status": "verified",
    "verifiedAt": "2024-01-15T14:35:00Z"
  }
}
```

---

```
POST /api/payments/admin/:paymentId/reject
```
Từ chối chuyển khoản

**Request:**
```json
{
  "reason": "Số tiền không khớp"
}
```

---

## 🎨 Frontend Components

### 1. Checkout Page
**File:** `src/pages/Checkout.jsx`

- Chọn phương thức thanh toán
- Hiển thị thông tin ngân hàng khi chọn "Chuyển khoản"
- Tạo payment record
- Hiển thị success screen với hướng dẫn

**Features:**
- Copy số tài khoản bằng 1 click
- Hiển thị mã thanh toán
- Timer xác nhận 24h

---

### 2. Admin Payment Management
**File:** `src/pages/AdminPaymentManagement.jsx`
**Route:** `/admin/payments`

- Danh sách chuyển khoản chờ xác nhận
- Modal chi tiết thanh toán
- Form nhập thông tin xác nhận
- Nút verify/reject

---

## 🔐 Database Models

### Payment Model
```javascript
{
  id: UUID (primary key),
  bookingId: UUID (foreign key → Booking),
  userId: UUID (foreign key → User),
  paymentMethod: ENUM('bank_transfer', 'wallet', 'cash_at_station'),
  amount: BIGINT (in VND),
  status: ENUM('pending', 'verified', 'failed'),
  
  // Bank transfer specific
  transactionRef: STRING,
  bankTransferDate: DATE,
  bankTransferTime: STRING,
  bankSenderName: STRING,
  bankSenderAccount: STRING,
  bankTransferNote: TEXT,
  
  // Verification
  verifiedBy: UUID (admin user id),
  verifiedAt: DATE,
  verificationNote: TEXT,
  
  metadata: JSON,
  createdAt: DATE,
  updatedAt: DATE
}
```

### Booking Model (Updated)
```javascript
{
  ...existing fields,
  paymentMethod: ENUM('bank_transfer', 'wallet', 'cash_at_station'),
  paymentStatus: ENUM('pending', 'paid', 'failed')
}
```

---

## 📊 Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      KHÁCH HÀNG                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
          ┌───────────────────────┐
          │  Checkout Page        │
          │ - Chọn "Chuyển khoản" │
          │ - Review order        │
          └────────┬──────────────┘
                   │
                   ↓
      ┌────────────────────────────┐
      │  POST /payments/bank-transfer
      │  Tạo payment record       │
      │  Status: pending          │
      └────────┬───────────────────┘
               │
               ↓
    ┌──────────────────────────┐
    │  Hiển thị Success Screen │
    │  - Thông tin NH          │
    │  - Số tiền               │
    │  - Nội dung chuyển       │
    │  - Payment ID            │
    └──────────┬───────────────┘
               │
               ↓ (Khách hàng chuyển khoản)
        ┌──────────────────┐
        │   NGÂN HÀNG      │
        └────────┬─────────┘
                 │
                 ↓ (Admin kiểm tra)
    ┌────────────────────────────┐
    │      ADMIN DASHBOARD       │
    │  /admin/payments           │
    │  - Danh sách pending       │
    │  - Nhập thông tin xác nhận │
    └────────┬───────────────────┘
             │
      ┌──────┴────────┐
      ↓               ↓
   VERIFY          REJECT
      │               │
      ↓               ↓
  Status:          Status:
  verified         failed
      │               │
      ↓               ↓
  Booking.        Booking.
  paymentStatus   paymentStatus
  = paid          = failed
```

---

## 🧪 Testing

### Test Case 1: User creates booking and bank transfer payment
```bash
# 1. Login
POST /api/auth/login
{
  "email": "user@test.com",
  "password": "password123"
}

# 2. Create booking
POST /api/bookings
{
  "tripId": "trip-123",
  "items": [...],
  "total": 150000,
  "paymentMethod": "bank_transfer"
}

# 3. Create bank transfer payment
POST /api/payments/bank-transfer
{
  "bookingId": "booking-123",
  "amount": 150000,
  "bankTransferNote": "..."
}
# Response: payment created with status "pending"
```

### Test Case 2: Admin verifies payment
```bash
# 1. Get pending payments
GET /api/payments/admin/pending

# 2. Verify payment
POST /api/payments/admin/payment-123/verify
{
  "bankSenderName": "NGUYEN VAN A",
  "transactionRef": "250115ABC123",
  "bankTransferDate": "2024-01-15"
}
# Response: payment status = "verified"
# Booking status = "paid"
```

---

## 🚀 Deployment Checklist

- [ ] Update bank account info in .env
- [ ] Run database migrations (Payment table)
- [ ] Test payment flow locally
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Verify bank info is correct
- [ ] Test with real bookings
- [ ] Notify admins about new payment verification page

---

## 📞 Support & Troubleshooting

### Issue: Payment status doesn't update
**Solution:** Check if admin verified the payment. Status should change from "pending" to "verified".

### Issue: Bank info not showing
**Solution:** Check .env variables are set correctly:
```bash
BANK_ACCOUNT_NAME=...
BANK_ACCOUNT_NUMBER=...
BANK_NAME=...
```

### Issue: Can't access admin payments page
**Solution:** User must have `role: 'admin'` in database.

---

## 🔄 Future Enhancements

1. **Auto-verification** using bank API integration
2. **SMS notifications** when payment is verified
3. **Email confirmations** with receipt
4. **Refund handling** for failed bookings
5. **Multiple bank accounts** support
6. **Transaction reconciliation** report
7. **Payment history export**

---

## 📚 Related Files

- Backend:
  - `src/models/Payment.js` - Payment model
  - `src/controllers/payment.js` - Payment controller
  - `src/routes/payment.js` - Payment routes
  - `.env` - Bank configuration

- Frontend:
  - `src/services/paymentApi.js` - Payment API service
  - `src/pages/Checkout.jsx` - Checkout page
  - `src/pages/AdminPaymentManagement.jsx` - Admin dashboard

---

**Version:** 1.0  
**Last Updated:** 2024-01-15  
**Author:** Development Team
