const { getEmailQueue } = require('../config/queues');

/**
 * Add welcome email job to queue
 */
const addWelcomeEmailJob = (userData) => {
  const queue = getEmailQueue();
  if (!queue) {
    console.warn('Email queue not available, skipping welcome email');
    return null;
  }

  return queue.add('send-welcome-email', {
    userId: userData.id,
    email: userData.email,
    name: userData.name,
  }, {
    priority: 1,
  });
};

/**
 * Add booking confirmation email job to queue
 */
const addBookingConfirmationJob = (bookingData) => {
  const queue = getEmailQueue();
  if (!queue) {
    console.warn('Email queue not available, skipping booking confirmation email');
    return null;
  }

  return queue.add('send-booking-confirmation', {
    userId: bookingData.userId,
    rentalId: bookingData.rentalId,
    carDetails: bookingData.carDetails,
    bookingDetails: bookingData.bookingDetails,
  }, {
    priority: 2,
  });
};

/**
 * Add booking reminder email job to queue
 */
const addBookingReminderJob = (bookingData, reminderTime) => {
  const queue = getEmailQueue();
  if (!queue) {
    return null;
  }

  const delay = reminderTime.getTime() - Date.now();
  if (delay <= 0) {
    return null; // Time has passed
  }

  return queue.add('send-booking-reminder', {
    userId: bookingData.userId,
    rentalId: bookingData.rentalId,
    carDetails: bookingData.carDetails,
    startDate: bookingData.startDate,
  }, {
    delay,
    priority: 3,
  });
};

/**
 * Add rental ending soon email job to queue
 */
const addRentalEndingSoonJob = (rentalData, reminderTime) => {
  const queue = getEmailQueue();
  if (!queue) {
    return null;
  }

  const delay = reminderTime.getTime() - Date.now();
  if (delay <= 0) {
    return null;
  }

  return queue.add('send-rental-ending-soon', {
    userId: rentalData.userId,
    rentalId: rentalData.rentalId,
    carDetails: rentalData.carDetails,
    endDate: rentalData.endDate,
  }, {
    delay,
    priority: 3,
  });
};

/**
 * Add rental completed email job to queue
 */
const addRentalCompletedJob = (rentalData) => {
  const queue = getEmailQueue();
  if (!queue) {
    console.warn('Email queue not available, skipping rental completed email');
    return null;
  }

  return queue.add('send-rental-completed', {
    userId: rentalData.userId,
    rentalId: rentalData.rentalId,
    carDetails: rentalData.carDetails,
    totalPrice: rentalData.totalPrice,
  }, {
    priority: 2,
  });
};

module.exports = {
  addWelcomeEmailJob,
  addBookingConfirmationJob,
  addBookingReminderJob,
  addRentalEndingSoonJob,
  addRentalCompletedJob,
};

