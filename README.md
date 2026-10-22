# 🌐 Pure Tuber Web (PoC)

Bản mẫu thử nghiệm (Proof of Concept) kiến trúc Web Streaming lấy cảm hứng từ kỹ thuật dịch ngược **Pure Tuber**, giải quyết trọn vẹn các rào cản nền tảng:

## ✨ Tính năng nổi bật
1. **Chặn 100% Quảng cáo (Ad-Free)**: Lấy luồng trực tiếp từ YouTube CDN không qua hệ thống quảng cáo Google Ads.
2. **Bypass CORS & IP-lock bằng HLS Master Proxy**:
   * Sử dụng client context iOS InnerTube để nạp HLS manifest đa chất lượng (từ 144p, 360p, 720p đến 1080p, 4K).
   * Viết lại danh sách phát phân đoạn (`.m3u8` & segments) qua proxy nội bộ bật đầy đủ header CORS.
3. **Mở khóa Thuyết minh / Lồng tiếng Tiếng Việt (Multi-audio Dubbing)**:
   * Tự động phát hiện các luồng audio `vi` (`isDubbed` / `isAutoDubbed`) như trên bản mod Pure Tuber.
4. **Phát nền (Background Play) & Picture-in-Picture (PiP)**:
   * Tích hợp **Media Session API**: hiển thị metadata bài hát, ảnh bìa thumbnail chất lượng cao và nút điều khiển trên màn hình khóa điện thoại (iOS / Android) khi tắt màn hình hoặc chuyển tab.
   * Hỗ trợ nút kích hoạt Picture-in-Picture trực tiếp trên trình duyệt.

## 🚀 Khởi chạy nhanh
```bash
cd puretube_web
bun install
bun run start
```
Truy cập: `http://localhost:3000`
