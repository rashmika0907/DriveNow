const { Worker } = require('bullmq');
const emailService = require('../services/emailService');
const User = require('../models/User');
const { getRedisClient } = require('../config/redis');

let emailWorker = null;

/**
 * Start email worker
 */
const startEmailWorker = () => {
  try {
    const connection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    };

    emailWorker = new Worker(
      'email-queue',
      async (job) => {
        const { name, data } = job;

        console.log(`Processing email job: ${name}`, data);

        try {
          // Get user email if not provided
          let userEmail = data.email;
          if (!userEmail && data.userId) {
            const user = await User.findById(data.userId).select('email name');
            if (user) {
              userEmail = user.email;
              data.email = user.email;
              data.name = data.name || user.name;
            }
          }

          if (!userEmail) {
            throw new Error('User email not found');
          }

          switch (name) {
            case 'send-welcome-email':
              await emailService.sendWelcomeEmail({
                email: userEmail,
                name: data.name,
                id: data.userId,
              });
              break;

            case 'send-booking-confirmation':
              await emailService.sendBookingConfirmationEmail({
                ...data,
                userEmail,
              });
              break;

            case 'send-booking-reminder':
              await emailService.sendBookingReminderEmail({
                ...data,
                userEmail,
              });
              break;

            case 'send-rental-ending-soon':
              await emailService.sendRentalEndingSoonEmail({
                ...data,
                userEmail,
              });
              break;

            case 'send-rental-completed':
              await emailService.sendRentalCompletedEmail({
                ...data,
                userEmail,
              });
              break;

            default:
              throw new Error(`Unknown email job type: ${name}`);
          }

          console.log(`Email job completed: ${name}`);
          return { success: true };
        } catch (error) {
          console.error(`Email job failed: ${name}`, error.message);
          throw error;
        }
      },
      {
        connection,
        concurrency: 5, // Process up to 5 emails concurrently
        limiter: {
          max: 10, // Max 10 jobs
          duration: 1000, // Per second
        },
      }
    );

    emailWorker.on('completed', (job) => {
      console.log(`Email job ${job.id} completed`);
    });

    emailWorker.on('failed', (job, err) => {
      console.error(`Email job ${job?.id} failed:`, err.message);
    });

    emailWorker.on('error', (err) => {
      console.error('Email worker error:', err.message);
    });

    console.log('✓ Email worker started');
    return emailWorker;
  } catch (error) {
    console.error('✗ Failed to start email worker:', error.message);
    return null;
  }
};

/**
 * Stop email worker
 */
const stopEmailWorker = async () => {
  if (emailWorker) {
    await emailWorker.close();
    emailWorker = null;
  }
};

module.exports = {
  startEmailWorker,
  stopEmailWorker,
};

