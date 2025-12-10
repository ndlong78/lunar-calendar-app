# Code Review - Lunar Calendar App

## Mức độ tổng quát
Backend sử dụng Express + Mongoose với các route cho auth, chuyển đổi lịch và quản lý ngày yêu thích. Code khá gọn nhưng còn nhiều chỗ thiếu validation và xử lý lỗi có thể gây crash hoặc trả về dữ liệu sai.

## Vấn đề chính (cần ưu tiên)
1. **`/api/calendar/convert` không kiểm tra định dạng ngày**: chỉ tách chuỗi bằng `-` và đưa vào `solarToLunar`, nên khi `date` sai định dạng hoặc không tồn tại sẽ tạo `NaN` và có thể trả về kết quả không hợp lệ hoặc ném lỗi runtime. Thêm validation ISO (YYYY-MM-DD) và trả 400 khi không hợp lệ.【F:backend/routes/calendar.js†L11-L35】
2. **`/api/calendar/convert-reverse` không xử lý trường hợp chuyển đổi thất bại**: `LunarCalendar.lunarToSolar` có thể trả về `null` khi thông tin tháng nhuận không khớp, nhưng route luôn truy cập thuộc tính của kết quả → crash 500. Cần kiểm tra `solar === null` và trả 400 với thông báo rõ ràng.【F:backend/routes/calendar.js†L37-L78】【F:backend/services/LunarCalendar.js†L108-L153】
3. **Tính toán con giáp có thể trả về `undefined` cho năm âm hoặc năm rất lớn**: công thức `(lunarYear - 2000) % 12` có thể ra giá trị âm; khi dùng với toán tử `%` của JS, chỉ số mảng âm → `undefined`. Nên chuẩn hóa bằng `(lunarYear - 2000 + 1200) % 12` hoặc tương tự để luôn dương.【F:backend/services/LunarCalendar.js†L153-L162】
4. **CRUD ngày nghỉ thiếu kiểm tra dữ liệu**: API `/api/calendar/holidays` nhận body rồi lưu thẳng vào Mongo mà không kiểm tra định dạng ngày, loại lịch, hay giới hạn trường; dễ lưu dữ liệu bẩn hoặc lỗi 500 do ValidationError. Cần thêm schema validation (Joi/Zod) hoặc logic kiểm tra thủ công trước khi lưu/cập nhật.【F:backend/routes/calendar.js†L80-L119】
5. **API favorites nhận `date`/`solarDate`/`lunarDate` không kiểm tra**: `new Date(date)` với chuỗi tùy ý sẽ thành `Invalid Date` và vẫn được lưu, dẫn tới dữ liệu không dùng được. Nên validate date và giới hạn độ dài ghi chú `note`.【F:backend/routes/favorites.js†L14-L38】

## Cải tiến & refactor đề xuất
- Thêm middleware validation cho từng route (Joi/celebrate hoặc express-validator) để chuẩn hóa input và trả lỗi 400 thay vì crash 500.
- Chuẩn hóa response error: tránh leak `err.message` trong production, log đầy đủ nhưng trả thông điệp chung.
- Thêm `NODE_ENV`-aware CORS/rate limit config và log khi bị chặn để dễ debug.
- Bổ sung unit test cho `LunarCalendar.getZodiacAnimal`, `solarToLunar`, `lunarToSolar` với các edge case (năm âm, tháng nhuận sai, ngày không hợp lệ).
- Thêm integration test cho auth + favorites flow (đăng ký → login → lưu/đọc/xóa favorite) với MongoDB in-memory để tránh ghi dữ liệu thật.

## Ghi chú khác
- Các file JS thiếu newline cuối file; nên thêm để tuân thủ POSIX và tránh diff noise.
