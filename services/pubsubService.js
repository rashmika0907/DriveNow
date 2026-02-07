const { getRedisClient, getRedisSubscriber } = require('../config/redis');

/**
 * Publish event to Redis Pub/Sub channel
 */
const publish = (channel, data) => {
  try {
    const client = getRedisClient();
    if (!client) {
      console.warn('Redis not available, skipping publish:', channel);
      return false;
    }

    const message = JSON.stringify({
      channel,
      data,
      timestamp: new Date().toISOString(),
    });

    client.publish(channel, message);
    console.log(`Published to ${channel}:`, data);
    return true;
  } catch (error) {
    console.error('Pub/Sub publish error:', error.message);
    return false;
  }
};

/**
 * Subscribe to Redis Pub/Sub channel
 */
const subscribe = (channel, callback) => {
  try {
    const subscriber = getRedisSubscriber();
    if (!subscriber) {
      console.warn('Redis subscriber not available, cannot subscribe:', channel);
      return false;
    }

    subscriber.subscribe(channel, (err) => {
      if (err) {
        console.error(`Error subscribing to ${channel}:`, err.message);
        return false;
      }
      console.log(`Subscribed to channel: ${channel}`);
    });

    subscriber.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        try {
          const parsed = JSON.parse(message);
          callback(parsed.data, parsed);
        } catch (error) {
          console.error('Error parsing pub/sub message:', error.message);
        }
      }
    });

    return true;
  } catch (error) {
    console.error('Pub/Sub subscribe error:', error.message);
    return false;
  }
};

/**
 * Unsubscribe from channel
 */
const unsubscribe = (channel) => {
  try {
    const subscriber = getRedisSubscriber();
    if (!subscriber) {
      return false;
    }

    subscriber.unsubscribe(channel);
    console.log(`Unsubscribed from channel: ${channel}`);
    return true;
  } catch (error) {
    console.error('Pub/Sub unsubscribe error:', error.message);
    return false;
  }
};

module.exports = {
  publish,
  subscribe,
  unsubscribe,
};

