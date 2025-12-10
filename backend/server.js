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

// Trust proxy for Render
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(express.json());

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

console.log('[CONFIG] Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Allow no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // Allow exact matches
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // ✅ Allow any vercel.app subdomain
    if (origin.endsWith('.vercel.app') || origin.endsWith('.vercel.dev')) {
      return callback(null, true);
    }
    
    // Allow localhost for development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    
    console.warn('[CORS] Rejected origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Quá nhiều request, vui lòng thử lại sau',
  standardHeaders: true,
  skip: (req) => req.path === '/api/health'
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
