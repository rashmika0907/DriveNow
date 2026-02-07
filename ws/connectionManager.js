/**
 * Connection Manager for WebSocket
 * Manages user connections and provides room-like functionality
 */
class ConnectionManager {
  constructor() {
    // Map of userId -> Set of WebSocket connections
    this.userConnections = new Map();
    // Map of WebSocket -> userId
    this.connectionToUser = new Map();
  }

  /**
   * Add connection for user
   */
  addConnection(userId, ws) {
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId).add(ws);
    this.connectionToUser.set(ws, userId);
  }

  /**
   * Remove connection
   */
  removeConnection(ws) {
    const userId = this.connectionToUser.get(ws);
    if (userId) {
      const connections = this.userConnections.get(userId);
      if (connections) {
        connections.delete(ws);
        if (connections.size === 0) {
          this.userConnections.delete(userId);
        }
      }
      this.connectionToUser.delete(ws);
    }
  }

  /**
   * Get all connections for a user
   */
  getUserConnections(userId) {
    return this.userConnections.get(userId) || new Set();
  }

  /**
   * Send message to all connections of a user
   */
  sendToUser(userId, message) {
    const connections = this.getUserConnections(userId);
    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
    
    connections.forEach(ws => {
      if (ws.readyState === ws.OPEN) {
        try {
          ws.send(messageStr);
        } catch (error) {
          console.error('Error sending WebSocket message:', error.message);
          this.removeConnection(ws);
        }
      } else {
        // Remove closed connections
        this.removeConnection(ws);
      }
    });
  }

  /**
   * Broadcast to all connected users
   */
  broadcast(message) {
    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
    this.userConnections.forEach((connections) => {
      connections.forEach(ws => {
        if (ws.readyState === ws.OPEN) {
          try {
            ws.send(messageStr);
          } catch (error) {
            console.error('Error broadcasting WebSocket message:', error.message);
            this.removeConnection(ws);
          }
        } else {
          this.removeConnection(ws);
        }
      });
    });
  }

  /**
   * Get total connection count
   */
  getConnectionCount() {
    let count = 0;
    this.userConnections.forEach(connections => {
      count += connections.size;
    });
    return count;
  }

  /**
   * Get user count
   */
  getUserCount() {
    return this.userConnections.size;
  }
}

module.exports = new ConnectionManager();

