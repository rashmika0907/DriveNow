const connectionManager = require('./connectionManager');
const pubsubService = require('../services/pubsubService');

/**
 * Handle WebSocket connection
 */
const handleConnection = (ws, user) => {
  const userId = user.userId;

  // Add connection to manager
  connectionManager.addConnection(userId, ws);

  console.log(`WebSocket connected: User ${userId} (Total: ${connectionManager.getConnectionCount()})`);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'WebSocket connection established',
    userId: userId,
  }));

  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      // Handle ping/pong for keepalive
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
        return;
      }

      // Handle other message types here
      console.log('WebSocket message from user', userId, ':', data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error.message);
    }
  });

  // Handle connection close
  ws.on('close', () => {
    connectionManager.removeConnection(ws);
    console.log(`WebSocket disconnected: User ${userId} (Total: ${connectionManager.getConnectionCount()})`);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error.message);
    connectionManager.removeConnection(ws);
  });
};

/**
 * Initialize Pub/Sub listeners for WebSocket notifications
 */
const initializePubSubListeners = () => {
  // Listen for booking created events
  pubsubService.subscribe('booking:created', (data) => {
    const { userId, rentalId, carId, totalPrice } = data;
    
    connectionManager.sendToUser(userId, JSON.stringify({
      type: 'booking:confirmed',
      data: {
        rentalId,
        carId,
        totalPrice,
        message: 'Your booking has been confirmed!',
      },
    }));
  });

  // Listen for booking status changed events
  pubsubService.subscribe('booking:status:changed', (data) => {
    const { userId, rentalId, oldStatus, newStatus } = data;
    
    connectionManager.sendToUser(userId, JSON.stringify({
      type: 'booking:status:updated',
      data: {
        rentalId,
        oldStatus,
        newStatus,
        message: `Your booking status has changed to ${newStatus}`,
      },
    }));
  });

  // Listen for user profile updated events
  pubsubService.subscribe('user:profile:updated', (data) => {
    const { userId, updatedFields } = data;
    
    connectionManager.sendToUser(userId, JSON.stringify({
      type: 'profile:updated',
      data: {
        updatedFields,
        message: 'Your profile has been updated',
      },
    }));
  });

  console.log('✓ Pub/Sub listeners initialized for WebSocket notifications');
};

module.exports = {
  handleConnection,
  initializePubSubListeners,
};

