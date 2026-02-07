const WebSocket = require('ws');
const { authenticateWebSocket } = require('./socketAuth');
const { handleConnection, initializePubSubListeners } = require('./socketHandlers');

let wss = null;

/**
 * Initialize WebSocket server
 */
const initializeSocketServer = (httpServer) => {
  try {
    // Create WebSocket server
    wss = new WebSocket.Server({
      server: httpServer,
      path: '/ws',
      clientTracking: true,
    });

    // Handle new connections
    wss.on('connection', async (ws, req) => {
      try {
        // Authenticate connection
        const user = await authenticateWebSocket(ws, req);
        
        // Handle authenticated connection
        handleConnection(ws, user);
      } catch (error) {
        console.error('WebSocket authentication failed:', error.message);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Authentication failed',
        }));
        ws.close();
      }
    });

    // Initialize Pub/Sub listeners for real-time notifications
    initializePubSubListeners();

    console.log('✓ WebSocket server initialized on /ws');
    return wss;
  } catch (error) {
    console.error('✗ Failed to initialize WebSocket server:', error.message);
    return null;
  }
};

/**
 * Get WebSocket server instance
 */
const getWebSocketServer = () => {
  return wss;
};

/**
 * Close WebSocket server
 */
const closeSocketServer = async () => {
  if (wss) {
    wss.close();
    wss = null;
  }
};

module.exports = {
  initializeSocketServer,
  getWebSocketServer,
  closeSocketServer,
};

