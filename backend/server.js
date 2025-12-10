# 📊 Phân Tích Render Logs - Vietnamese Lunar Calendar

## 🎯 Lỗi Được Phát Hiện

### **Lỗi #1: Rate Limit misconfiguration** 🔴 CRITICAL

```
ValidationError: The 'X-Forwarded-For' header is set but 
the Express 'trust proxy' setting is false (default)
```

**Nguyên nhân**:
- Render dùng reverse proxy (Nginx)
- Reverse proxy thêm header `X-Forwarded-For`
- Express không tin proxy → express-rate-limit bị lỗi
- **Mỗi request từ proxy coi như từ cùng IP** → Rate limit không hoạt động đúng

**File lỗi**: `backend/server.js` line 28-31

```javascript
// ❌ HIỆN TẠI
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Quá nhiều request, vui lòng thử lại sau'
});
app.use('/api/', limiter);
```

---

### **Lỗi #2: CORS "Not allowed"** 🔴 CRITICAL

```
Error: Error: Not allowed by CORS
    at origin (/opt/render/project/src/backend/server.js:33:21)
```

**Nguyên nhân**:
- Frontend gửi request từ **Vercel URL** (không xác định)
- Backend CORS_ORIGIN chỉ accept **Render internal URL hoặc localhost**
- Frontend bị block → "Not allowed by CORS"

**File lỗi**: `backend/server.js` line 25-35

```javascript
// ❌ HIỆN TẠI - Quá hạn chế
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));  // ← LỖI TẠI ĐÂY
  },
  credentials: true
}));
```

**Frontend URL là gì?**
- Có thể: `https://your-app.vercel.app`
- Backend chỉ allow: `http://localhost:3000`
- → **CORS error**

---

## ✅ Khắc Phục

### **Bước 1: Sửa server.js**

**File**: `backend/server.js`

```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const calendarRoutes = require('./routes/calendar');
const favoritesRoutes = require('./routes/favorites');
const errorHandler = require('./middleware/errorHandler');

const app = express();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined');
}

// ✅ FIX #1: Trust proxy (dành cho Render)
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(express.json());

// ✅ FIX #2: CORS config - Accept multiple origins
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

console.log('[CONFIG] Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests without origin (mobile, desktop apps)
    if (!origin) return callback(null, true);
    
    // Allow if in whitelist
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Log rejected origins for debugging
    console.warn('[CORS] Rejected origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ FIX #3: Rate limiting with trust proxy
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,
  message: 'Quá nhiều request, vui lòng thử lại sau',
  standardHeaders: true,  // Log in RateLimit-* headers
  skip: (req) => {
    // Skip rate limit for health check
    return req.path === '/api/health';
  }
});
app.use('/api/', limiter);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/favorites', favoritesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
```

---

### **Bước 2: Cập Nhật Environment Variables trên Render**

**Dashboard Render** → Backend Service → **Environment**

```env
# Bắt buộc
MONGODB_URI=mongodb+srv://lunar_user:4IAQhx71wFh3kcnu@cluster0.b12qbqm.mongodb.net/lunar-calendar?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long

# Sửa CORS_ORIGIN để accept Frontend URL
CORS_ORIGIN=https://your-vercel-app.vercel.app,http://localhost:3000

# Production config
NODE_ENV=production

# Port (Render sẽ assign tự động, nhưng set này để clarity)
PORT=10000
```

**⚠️ SỰ CẬP: Bạn cần biết Vercel URL của mình**
- Nếu deployed: `https://lunar-calendar-app.vercel.app`
- Nếu chưa: set thêm sau khi deploy frontend

---

### **Bước 3: Deploy Lại Backend**

```bash
git add backend/server.js
git commit -m "fix: add trust proxy and improve CORS/rate-limit config"
git push origin main
```

**Render sẽ tự deploy** → Chờ ~2 phút

---

### **Bước 4: Kiểm Tra Logs**

```
Render Dashboard → Backend Service → Logs
```

Tìm:
- ✅ `Server running on port 10000`
- ✅ `MongoDB connected`
- ✅ `[CONFIG] Allowed CORS origins: [...]`
- ❌ `ValidationError` (nếu không thấy = OK)
- ❌ `Not allowed by CORS` (nếu không thấy = OK)

---

### **Bước 5: Test API**

```bash
# Test health endpoint (CORS-free)
curl https://lunar-calendar-app.onrender.com/api/health

# Kết quả mong đợi:
# {"status":"OK","timestamp":"2025-12-10T..."}
```

---

## 🔍 Giải Thích Chi Tiết

### **Tại sao cần `app.set('trust proxy', 1)`?**

```
Frontend Request
    ↓
Vercel Server
    ↓
Internet
    ↓
Render Nginx Proxy (thêm X-Forwarded-For)
    ↓
Express App (port 10000)
```

**Nếu không trust proxy**:
- Express thấy request từ Nginx (internal IP)
- Rate limit coi tất cả từ 1 IP → Block sau 100 requests
- Mọi người đều bị block chung chỉ quota

**Nếu trust proxy**:
- Express đọc `X-Forwarded-For` header
- Biết request từ IP nào thực sự → Rate limit per user

---

### **Tại sao CORS fail?**

```javascript
// Ví dụ:
CORS_ORIGIN=http://localhost:3000

Frontend từ Vercel: https://my-app.vercel.app
Backend check: https://my-app.vercel.app === http://localhost:3000?
Result: ❌ NO → "Not allowed by CORS"
```

**Giải pháp**: Thêm Vercel URL vào whitelist

```env
CORS_ORIGIN=https://my-app.vercel.app,http://localhost:3000,http://localhost:5173
```

---

## 📋 Checklist

- [ ] Sửa `backend/server.js`:
  - [ ] Thêm `app.set('trust proxy', 1)`
  - [ ] Improve CORS error logging
  - [ ] Skip rate limit cho `/health`
- [ ] Cập Render environment variables:
  - [ ] CORS_ORIGIN = Vercel URL
  - [ ] NODE_ENV = production
- [ ] Git push → Render auto-deploy
- [ ] Check logs: Không có CORS/Rate-limit errors
- [ ] Test `/api/health` endpoint
- [ ] Test app trên Vercel → Backend API

---

## 🎬 Kết Quả Mong Đợi Sau Fix

### Logs sẽ hiển thị:
```
Server running on port 10000
✅ MongoDB connected
[CONFIG] Allowed CORS origins: [
  'https://your-vercel-app.vercel.app',
  'http://localhost:3000'
]
==> Your service is live 🎉
```

### Frontend requests:
```javascript
✅ GET /api/health → 200 OK
✅ GET /api/calendar/holidays → 200 OK
✅ POST /api/auth/login → 200 OK
❌ CORS errors → Biến mất!
```

---

## 🚨 Nếu Vẫn Lỗi

### 1. **Vẫn thấy "Not allowed by CORS"**
```
→ CORS_ORIGIN env variable chưa update
→ Render chưa restart (đợi deploy xong)
→ Frontend URL sai trong CORS_ORIGIN
```

### 2. **Vẫn thấy "ValidationError: X-Forwarded-For"**
```
→ app.set('trust proxy', 1) chưa add
→ npm start chạy file cũ (clear cache)
```

### 3. **Rate limit vẫn block**
```
→ Chưa trust proxy → Mọi request từ 1 IP
→ Giải pháp: Restart service hoặc tăng rate limit max
```

---

## 💾 File Changes Summary

```diff
backend/server.js:
+ app.set('trust proxy', 1);
~ const allowedOrigins = process.env.CORS_ORIGIN
+ console.log('[CONFIG] Allowed CORS origins:', allowedOrigins);
+ skip: (req) => req.path === '/api/health'
+ allowedHeaders: ['Content-Type', 'Authorization']

Render Environment:
+ CORS_ORIGIN=https://your-vercel-app.vercel.app,http://localhost:3000
+ NODE_ENV=production
```
