const Redis = require('ioredis');

let redisClient = null;
let redisSubscriber = null;

/**
 * Connect to Redis
 */
const connectRedis = () => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const redisPassword = process.env.REDIS_PASSWORD || undefined;

    // Main Redis client for caching and pub/sub publishing
    redisClient = new Redis(redisUrl, {
      password: redisPassword,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    // Separate subscriber client for pub/sub (required by Redis)
    redisSubscriber = new Redis(redisUrl, {
      password: redisPassword,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redisClient.on('connect', () => {
      console.log('✓ Connected to Redis');
    });

    redisClient.on('error', (err) => {
      console.error('✗ Redis connection error:', err.message);
    });

    redisSubscriber.on('connect', () => {
      console.log('✓ Redis subscriber connected');
    });

    redisSubscriber.on('error', (err) => {
      console.error('✗ Redis subscriber error:', err.message);
    });

    return { redisClient, redisSubscriber };
  } catch (error) {
    console.error('✗ Failed to connect to Redis:', error.message);
    console.error('  Make sure Redis is running: redis-server');
    // Return null clients - cache operations will fail gracefully
    return { redisClient: null, redisSubscriber: null };
  }
};

/**
 * Get Redis client
 */
const getRedisClient = () => {
  if (!redisClient) {
    connectRedis();
  }
  return redisClient;
};

/**
 * Get Redis subscriber client
 */
const getRedisSubscriber = () => {
  if (!redisSubscriber) {
    connectRedis();
  }
  return redisSubscriber;
};

/**
 * Close Redis connections
 */
const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
  }
  if (redisSubscriber) {
    await redisSubscriber.quit();
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  getRedisSubscriber,
  closeRedis,
};

