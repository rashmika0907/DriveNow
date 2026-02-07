require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { initializeQueues } = require('./config/queues');
const { startWorkers } = require('./workers');
const { initializeSocketServer } = require('./ws/socketServer');
const { initializeEmailService } = require('./services/emailService');
const viewRoutes = require('./routes/viewRoutes');
const apiRoutes = require('./routes/apiRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database
connectDB();

// Initialize Redis
connectRedis();

// Initialize email service
initializeEmailService();

// Initialize queues
initializeQueues();

// Start workers
startWorkers();

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Disable caching for all static files
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  lastModified: false,
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
}));

app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/', viewRoutes);
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

// 404 handler (only for non-API routes)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  res.status(404).render('home', { error: 'Page not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  
  // Initialize WebSocket server after HTTP server starts
  initializeSocketServer(server);
});
