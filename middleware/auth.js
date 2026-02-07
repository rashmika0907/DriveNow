const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('⚠️  WARNING: JWT_SECRET not set in environment variables!');
  console.error('   Set JWT_SECRET environment variable for production.');
  console.error('   Using fallback secret (NOT SECURE FOR PRODUCTION)');
}
const FALLBACK_SECRET = 'your-secret-key-change-in-production';
const SECRET = JWT_SECRET || FALLBACK_SECRET;

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  // For browser requests (HTML pages), check localStorage token via cookie or redirect
  // For API requests, check Authorization header
  if (!token) {
    // Check if this is an API request (has Accept: application/json or is /api/*)
    if (req.path.startsWith('/api/') || req.headers.accept?.includes('application/json')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    // For browser requests, redirect to login
    return res.redirect('/login');
  }

  jwt.verify(token, SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification error:', err.message);
      // Check if this is an API request
      if (req.path.startsWith('/api/') || req.headers.accept?.includes('application/json')) {
        return res.status(403).json({ message: 'Invalid or expired token.' });
      }
      // For browser requests, redirect to login
      return res.redirect('/login');
    }
    req.user = user;
    console.log('JWT verified successfully, user:', { userId: user.userId, email: user.email });
    next();
  });
};

const JWT_SECRET_EXPORT = SECRET;

module.exports = { authenticateToken, JWT_SECRET: JWT_SECRET_EXPORT };

