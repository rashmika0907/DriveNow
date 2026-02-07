const cacheService = require('../services/cacheService');

/**
 * Cache middleware
 * Caches GET request responses with configurable TTL
 */
const cacheMiddleware = (ttl = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const cacheKey = cacheService.generateCacheKey(req);
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        // Set cache hit header for debugging
        res.set('X-Cache', 'HIT');
        return res.json(cached);
      }

      // Store original json method
      const originalJson = res.json.bind(res);
      
      // Override json method to cache response
      res.json = function(data) {
        // Cache the response
        cacheService.set(cacheKey, data, ttl).catch(err => {
          console.error('Failed to cache response:', err.message);
        });
        
        // Set cache miss header
        res.set('X-Cache', 'MISS');
        
        // Call original json method
        return originalJson(data);
      };

      next();
    } catch (error) {
      // If caching fails, continue without cache
      console.error('Cache middleware error:', error.message);
      next();
    }
  };
};

/**
 * Cache middleware for specific resource (e.g., user profile)
 */
const cacheResourceMiddleware = (prefix, ttl = 300) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Get identifier from params or user
      const identifier = req.params.id || req.user?.userId;
      if (!identifier) {
        return next();
      }

      const cacheKey = cacheService.generateResourceKey(prefix, identifier);
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        res.set('X-Cache', 'HIT');
        return res.json(cached);
      }

      const originalJson = res.json.bind(res);
      
      res.json = function(data) {
        cacheService.set(cacheKey, data, ttl).catch(err => {
          console.error('Failed to cache resource:', err.message);
        });
        res.set('X-Cache', 'MISS');
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache resource middleware error:', error.message);
      next();
    }
  };
};

module.exports = {
  cacheMiddleware,
  cacheResourceMiddleware,
};

