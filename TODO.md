# TODO

## Seat selection flow (xe dường nằm / xe ngồi)
- [ ] Tạo 3 trang mới:
  - [ ] `src/pages/SelectVehicleType.jsx` (chọn xe dường nằm / xe ngồi)
  - [ ] `src/pages/SelectVehicleVariant.jsx` (bước 2: “chọn loại xe rồi” - demo lựa chọn; tách UI theo yêu cầu 3 bước)
  - [ ] `src/pages/SelectSeat.jsx` (hiển thị lưới chỗ ngồi hoặc danh sách chỗ nằm và chọn số ghế = qty)
- [ ] Tích hợp routing trong `src/App.jsx` cho luồng:
  - [ ] chọn chuyến -> `/trip/:tripId/select-vehicle-type`
  - [ ] -> `/trip/:tripId/select-vehicle-variant`
  - [ ] -> `/trip/:tripId/select-seat`
- [ ] Tạo state lưu lựa chọn ghế theo từng trip trong App (hoặc localStorage) để dùng khi vào checkout.
- [ ] Cập nhật `src/pages/Checkout.jsx` + `src/utils/bookingsStorage.js` để lưu thêm:
  - [ ] `vehicleType`
  - [ ] `seatType`
  - [ ] `selectedSeats` (mảng)
- [ ] Cập nhật UI nơi “chọn chuyến” để chuyển sang bước chọn ghế thay vì trực tiếp checkout.
- [ ] Test luồng end-to-end, đảm bảo booking lưu ghế/chỗ ngồi/nằm.

