const connectionManager = require('../ws/connectionManager');

/**
 * Send notification to user via WebSocket
 */
const notifyUser = (userId, eventType, data) => {
  const message = {
    type: eventType,
    data: {
      ...data,
      timestamp: new Date().toISOString(),
    },
  };

  connectionManager.sendToUser(userId, JSON.stringify(message));
  console.log(`Notification sent to user ${userId}: ${eventType}`);
};

/**
 * Broadcast notification to all connected users
 */
const broadcast = (eventType, data) => {
  const message = {
    type: eventType,
    data: {
      ...data,
      timestamp: new Date().toISOString(),
    },
  };

  connectionManager.broadcast(JSON.stringify(message));
  console.log(`Broadcast notification: ${eventType}`);
};

module.exports = {
  notifyUser,
  broadcast,
};

