const crypto = require('crypto');
const { getRedisClient } = require('../config/redis');

/**
 * Generate cache key from request
 */
const generateCacheKey = (req) => {
  const path = req.path;
  const query = req.query;
  
  // Create hash of query params for consistent keys
  const queryString = Object.keys(query)
    .sort()
    .map(key => `${key}=${query[key]}`)
    .join('&');
  
  const queryHash = queryString 
    ? crypto.createHash('md5').update(queryString).digest('hex').substring(0, 8)
    : 'all';
  
  return `${path}:${queryHash}`;
};

/**
 * Generate cache key for specific resource
 */
const generateResourceKey = (prefix, identifier) => {
  return `${prefix}:${identifier}`;
};

/**
 * Get value from cache
 */
const get = async (key) => {
  try {
    const client = getRedisClient();
    if (!client) {
      return null; // Redis not available, fail gracefully
    }

    const cached = await client.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  } catch (error) {
    console.error('Cache get error:', error.message);
    return null; // Fail gracefully
  }
};

/**
 * Set value in cache with TTL
 */
const set = async (key, value, ttl = 300) => {
  try {
    const client = getRedisClient();
    if (!client) {
      return false; // Redis not available, fail gracefully
    }

    await client.setex(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Cache set error:', error.message);
    return false; // Fail gracefully
  }
};

/**
 * Delete cache key
 */
const del = async (key) => {
  try {
    const client = getRedisClient();
    if (!client) {
      return false;
    }

    await client.del(key);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error.message);
    return false;
  }
};

/**
 * Invalidate cache by pattern
 */
const invalidatePattern = async (pattern) => {
  try {
    const client = getRedisClient();
    if (!client) {
      return false;
    }

    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
    return true;
  } catch (error) {
    console.error('Cache invalidate pattern error:', error.message);
    return false;
  }
};

/**
 * Invalidate multiple keys
 */
const invalidate = async (...keys) => {
  try {
    const client = getRedisClient();
    if (!client) {
      return false;
    }

    if (keys.length > 0) {
      await client.del(...keys);
    }
    return true;
  } catch (error) {
    console.error('Cache invalidate error:', error.message);
    return false;
  }
};

module.exports = {
  generateCacheKey,
  generateResourceKey,
  get,
  set,
  del,
  invalidate,
  invalidatePattern,
};

