const { Queue } = require('bullmq');
const { getRedisClient } = require('./redis');

let emailQueue = null;
let paymentQueue = null;

/**
 * Initialize all queues
 */
const initializeQueues = () => {
  try {
    const connection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    };

    // Email queue
    emailQueue = new Queue('email-queue', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
          count: 1000, // Keep max 1000 completed jobs
        },
        removeOnFail: {
          age: 24 * 3600, // Keep failed jobs for 24 hours
        },
      },
    });

    console.log('✓ Email queue initialized');

    // Payment queue (for future use)
    paymentQueue = new Queue('payment-queue', {
      connection,
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          age: 3600,
          count: 1000,
        },
        removeOnFail: {
          age: 24 * 3600,
        },
      },
    });

    console.log('✓ Payment queue initialized');

    return { emailQueue, paymentQueue };
  } catch (error) {
    console.error('✗ Failed to initialize queues:', error.message);
    return { emailQueue: null, paymentQueue: null };
  }
};

/**
 * Get email queue
 */
const getEmailQueue = () => {
  if (!emailQueue) {
    initializeQueues();
  }
  return emailQueue;
};

/**
 * Get payment queue
 */
const getPaymentQueue = () => {
  if (!paymentQueue) {
    initializeQueues();
  }
  return paymentQueue;
};

/**
 * Close all queues
 */
const closeQueues = async () => {
  if (emailQueue) {
    await emailQueue.close();
  }
  if (paymentQueue) {
    await paymentQueue.close();
  }
};

module.exports = {
  initializeQueues,
  getEmailQueue,
  getPaymentQueue,
  closeQueues,
};

