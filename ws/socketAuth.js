const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');
const url = require('url');

/**
 * Authenticate WebSocket connection
 * Extracts JWT token from query string or initial message
 */
const authenticateWebSocket = (ws, req) => {
  return new Promise((resolve, reject) => {
    try {
      // Try to get token from query string
      const parsedUrl = url.parse(req.url, true);
      const token = parsedUrl.query.token;

      if (token) {
        // Verify token
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
          if (err) {
            reject(new Error('Invalid or expired token'));
          } else {
            resolve(decoded);
          }
        });
      } else {
        // Wait for token in first message
        const messageHandler = (message) => {
          try {
            const data = JSON.parse(message.toString());
            if (data.type === 'auth' && data.token) {
              jwt.verify(data.token, JWT_SECRET, (err, decoded) => {
                ws.removeListener('message', messageHandler);
                if (err) {
                  reject(new Error('Invalid or expired token'));
                } else {
                  resolve(decoded);
                }
              });
            } else {
              ws.removeListener('message', messageHandler);
              reject(new Error('Authentication required'));
            }
          } catch (error) {
            ws.removeListener('message', messageHandler);
            reject(new Error('Invalid authentication message'));
          }
        };

        ws.once('message', messageHandler);

        // Timeout after 5 seconds
        setTimeout(() => {
          ws.removeListener('message', messageHandler);
          reject(new Error('Authentication timeout'));
        }, 5000);
      }
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  authenticateWebSocket,
};

