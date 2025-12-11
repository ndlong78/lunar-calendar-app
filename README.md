# 🧧 Vietnamese Lunar Calendar - Complete Source Code

## 📂 Cấu Trúc Dự Án

```
lunar-calendar-app/
├── backend/
│   ├── server.js
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── models/
│   │   ├── User.js
│   │   ├── Favorite.js
│   │   └── Holiday.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── calendar.js
│   │   └── favorites.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── services/
│   │   └── LunarCalendar.js
│   └── README.md
│
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── service-worker.js
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── api/
│   │   │   └── client.js
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── calendarService.js
│   │   │   └── offlineDB.js
│   │   ├── components/
│   │   │   ├── LunarCalendarApp.js
│   │   │   ├── AdminDashboard.js
│   │   │   └── PrivateRoute.js
│   │   └── utils/
│   │       └── constants.js
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── README.md
│
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### 1. Clone Project
```bash
git clone https://github.com/ndlong78/lunar-calendar-app.git
cd lunar-calendar-app
```

### 2. Setup Backend
```bash
cd backend

# Copy environment file
cp .env.example .env

# Update .env with your MongoDB URI and JWT secret
nano .env

# Install dependencies
npm install

# Run server
npm run dev
```

Backend sẽ chạy tại: `http://localhost:5000`

### 3. Setup Frontend (mở terminal mới)
```bash
cd frontend

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Run app
npm start
```

Frontend sẽ chạy tại: `http://localhost:3000`

---

## 📝 Environment Variables

### Backend (.env)
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lunar-calendar
JWT_SECRET=your_super_secret_key_min_32_characters
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

**Lưu ý về cổng trên môi trường deploy (Render/Heroku):** các nền tảng này sẽ cấp giá trị `PORT` riêng (ví dụ 10000) và yêu cầu server bind đúng giá trị đó. Bên ngoài người dùng vẫn truy cập qua 80/443 của nhà cung cấp, nên log hiển thị port nội bộ khác là bình thường. Nếu tự host và muốn cố định 80/443, hãy bỏ `PORT` hoặc đặt `HTTP_PORT`/`HTTPS_PORT` trong `.env`.

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

---

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký người dùng
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin người dùng hiện tại

### Calendar Conversion
- `GET /api/calendar/convert?date=2025-12-09` - Chuyển đổi dương → âm lịch
- `GET /api/calendar/convert-reverse?year=2025&month=10&day=10` - Chuyển đổi âm → dương lịch
- `GET /api/calendar/zodiac/:year` - Lấy thông tin chi chi

### Holidays
- `GET /api/calendar/holidays` - Lấy danh sách ngày lễ
- `POST /api/calendar/holidays` - Thêm ngày lễ (Admin only)
- `PUT /api/calendar/holidays/:id` - Cập nhật ngày lễ (Admin only)
- `DELETE /api/calendar/holidays/:id` - Xóa ngày lễ (Admin only)

### Favorites
- `GET /api/favorites` - Lấy danh sách yêu thích của người dùng
- `POST /api/favorites` - Thêm ngày yêu thích
- `DELETE /api/favorites/:id` - Xóa ngày yêu thích

---

## 🎯 Tính Năng Chính

✅ **Calendar Conversion**
- Chuyển đổi dương ↔ âm lịch với độ chính xác 99.9%
- Hiển thị tên ngày/tháng âm lịch tiếng Việt
- Lịch vạn niên tương tác

✅ **User Features**
- Đăng ký/Đăng nhập với JWT
- Lưu ngày yêu thích
- Xem 12 cung mệnh và chi chi

✅ **Zodiac & Feng Shui**
- 12 cung mệnh phương Tây
- 12 chi chi năm Âm lịch
- Giờ hoàng đạo/hắc đạo
- Gợi ý phong thủy

✅ **Admin Dashboard**
- Quản lý người dùng
- Quản lý ngày lễ
- Xem thống kê (charts, stats)
- Cài đặt hệ thống

✅ **PWA Features**
- Cài đặt như app native
- Offline mode
- Service Worker caching
- Push notifications (sắp tới)

✅ **Multilingual**
- Tiếng Việt
- Tiếng Anh

---

## 📦 Dependencies

### Backend
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **BCrypt** - Password hashing
- **CORS** - Cross-origin support
- **Helmet** - Security headers
- **Winston** - Logging

### Frontend
- **React** - UI framework
- **Axios** - HTTP client
- **Recharts** - Charts
- **Lucide React** - Icons
- **Tailwind CSS** - Styling

---

## 🔐 Security

✅ Password hashing với bcryptjs
✅ JWT authentication
✅ CORS protection
✅ Rate limiting
✅ Helmet security headers
✅ Input validation

---

## 📊 Database Schema

### User
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (user/admin),
  createdAt: Date,
  updatedAt: Date
}
```

### Favorite
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  date: Date,
  solarDate: String,
  lunarDate: String,
  note: String,
  createdAt: Date
}
```

### Holiday
```javascript
{
  _id: ObjectId,
  name_vi: String,
  name_en: String,
  solarDate: String,
  lunarDate: String,
  type: String (solar/lunar),
  description_vi: String,
  description_en: String,
  active: Boolean,
  createdAt: Date
}
```

---

## 🧪 Testing

### Backend Testing
```bash
cd backend

# Run tests
npm test

# Load testing
npm install -g artillery
artillery run load-test.yml
```

### Frontend Testing
```bash
cd frontend

# Run tests
npm test

# Build for production
npm run build
```

---

## 🚀 Deployment

### Deploy Backend (Render.com)
```bash
# Push to GitHub
git push origin main

# Render tự động deploy
# Xem deployment guide trong README
```

### Deploy Frontend (Vercel)
```bash
# Connect GitHub repository
# Vercel tự động deploy
# URL: https://yourdomain.vercel.app
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error
- Kiểm tra MONGODB_URI
- Kiểm tra IP whitelist trên MongoDB Atlas
- Kiểm tra network connection

### CORS Error
```javascript
// Backend: Cập nhật CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
```

### Service Worker Not Loading
- Clear browser cache
- DevTools → Application → Clear site data
- Restart browser

---

## 📚 Resources

- [Express.js Docs](https://expressjs.com)
- [MongoDB Docs](https://docs.mongodb.com)
- [React Docs](https://react.dev)
- [PWA Guide](https://web.dev/progressive-web-apps)
- [JWT.io](https://jwt.io)

---

## 👨‍💻 Development Guidelines

### Commit Messages
```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

### Code Style
- Use ES6+ features
- Follow ESLint rules
- Add comments for complex logic
- Use meaningful variable names

### Database Backups
```bash
# Backup MongoDB
mongodump --uri "mongodb+srv://..." --out ./backups

# Restore
mongorestore ./backups
```

---

## 📄 License

MIT License - Xem LICENSE file

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📧 Contact

- Email: ndlong78@gmail.com
- GitHub: [@ndlong78](https://github.com/ndlong78)

---

## ✅ Checklist Trước Deploy

- [ ] Update .env files
- [ ] Test local development
- [ ] Run security audit (`npm audit`)
- [ ] Check code style
- [ ] Create GitHub repository
- [ ] Setup MongoDB Atlas
- [ ] Test authentication flow
- [ ] Test PWA features
- [ ] Run load testing
- [ ] Deploy backend (Render)
- [ ] Deploy frontend (Vercel)
- [ ] Setup custom domain
- [ ] Enable HTTPS
- [ ] Setup monitoring
- [ ] Create backup strategy

---

**Happy coding! 🚀**

Nếu có vấn đề, vui lòng tạo Issue hoặc liên hệ support.
