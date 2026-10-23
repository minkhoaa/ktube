# 🌐 KTube

> **KTube** is a high-performance, ad-free YouTube web streaming platform powered by **Bun**, **Express (BFF)**, **YouTube.js (InnerTube)**, **Hls.js**, and **Preact + Vite**.

![KTube Platform](https://img.shields.io/badge/Platform-Bun-f472b6?style=flat-square&logo=bun)
![Frontend](https://img.shields.io/badge/Frontend-Preact%20%2B%20Vite-673ab7?style=flat-square&logo=preact)
![Streaming](https://img.shields.io/badge/Streaming-Hls.js-ff6b6b?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

---

## ✨ Key Features

### 🚀 1. Performance & Zero-Buffer Streaming
* **Bypass Ad Networks**: Streams video segments directly from YouTube CDN with zero advertisement interruptions.
* **HLS Master Proxy & CORS Bypass**: Automatically requests and rewrites adaptive HLS multi-bitrate streams (144p to 1080p / 4K) using iOS/VisionOS InnerTube client contexts.
* **Zero-Buffering Stream Proxy**: Uses chunked transfer and range requests to pipe video segments with sub-second TTFB.
* **Fast-Start & Hover Preload**: Video startup latency reduced to `<250ms` through speculative hover preloading and Level 0 stream priming.

### 🎬 2. Advanced Player Architecture
* **Persistent Root Player & DOM Reparenting**: The `<video>` and `Hls.js` instances live permanently at the root viewport. Video keeps playing seamlessly when switching between Watch mode and the floating Miniplayer—never reloads or re-buffers.
* **Keep-Alive View Recycling**: Instant 0ms page switching between Home, Watch, Channel, and Search views with scroll position retention.
* **Autoplay Next Countdown**: 5-second dynamic countdown overlay with SVG progress indicator when video ends.
* **Theater Mode & Ambient Mode**: Full-width cinematic theater mode and real-time canvas ambient backlighting.
* **Multi-Audio & Dubbing**: Automatic detection and selection of multi-language dubbed audio tracks (including Vietnamese dubs).
* **Closed Captions (CC)**: Real-time subtitle parsing with multi-language switching.
* **Keyboard Shortcuts**: YouTube-standard shortcuts (`k`/`Space` play/pause, `j`/`l` seek 10s, `m` mute, `f` fullscreen, `t` theater, `c` captions, `Shift+N` next video).

### 🔍 3. YouTube Experience & Discovery
* **Full Search System**: 5-column filter drawer (Upload date, Duration, Content type, Features like HD/Live/CC, Sort by), typo correction banner, and in-channel search.
* **Infinite Scroll**: Continuous feed and comment loading via `<ContinuationItem />` and YouTube continuation tokens.
* **Shorts Mode**: Vertical 9:16 scrollable short-form video player.
* **Channel Pages**: Channel profiles with banners, subscriber counts, and full video tab.

### 🛡️ 4. Privacy-First Local Library
* **100% Client-Side**: Watch history, Liked videos, Subscriptions, and Search history are stored strictly in `localStorage`.
* **Zero Tracking**: No Google login required, no telemetry, no analytics.
* **Resume Playback**: Automatically remembers and resumes video position where you left off.

---

## 🛠️ Tech Stack

* **Runtime & Package Manager**: [Bun](https://bun.sh)
* **Backend (BFF)**: Express 5, [YouTubei.js](https://github.com/LuanRT/YouTube.js)
* **Frontend**: [Preact](https://preactjs.com), [Vite](https://vite.dev), [Hls.js](https://github.com/video-dev/hls.js)
* **Styling**: Vanilla CSS with YouTube dark/light design system tokens

---

## 🚀 Quick Start

### Prerequisites
* [Bun](https://bun.sh) installed on your machine (`v1.1+` recommended)

### 1. Clone & Install
```bash
git clone https://github.com/minkhoaa/ktube.git
cd ktube
bun install
```

### 2. Build Frontend UI
```bash
bun run build:ui
```

### 3. Start Server
```bash
bun run start
```
The application will be live at:
👉 **`http://localhost:3000`**

### Development Mode
To run with hot-reloading:
```bash
# Backend watch
bun run dev

# Frontend Vite dev server (optional)
bun run dev:ui
```

---

## 🧪 Testing

Run the automated test suite:
```bash
bun test
```

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).
