const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Initialize email transporter
 */
const initializeEmailService = () => {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log('✓ Email service initialized');
    return transporter;
  } catch (error) {
    console.error('✗ Failed to initialize email service:', error.message);
    return null;
  }
};

/**
 * Send email
 */
const sendEmail = async (to, subject, html, text = null) => {
  try {
    if (!transporter) {
      transporter = initializeEmailService();
    }

    if (!transporter) {
      throw new Error('Email service not initialized');
    }

    const mailOptions = {
      from: `"DriveNow" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error.message);
    throw error;
  }
};

/**
 * Send welcome email
 */
const sendWelcomeEmail = async (userData) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #c084fc 0%, #f472b6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 24px; background: #c084fc; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to DriveNow!</h1>
        </div>
        <div class="content">
          <h2>Hello ${userData.name}!</h2>
          <p>Thank you for joining DriveNow. We're excited to have you on board!</p>
          <p>You can now browse our wide selection of cars and start booking your next rental.</p>
          <a href="${process.env.APP_URL || 'http://localhost:3000'}/browse" class="button">Browse Cars</a>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">If you have any questions, feel free to contact our support team.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(
    userData.email,
    'Welcome to DriveNow!',
    html
  );
};

/**
 * Send booking confirmation email
 */
const sendBookingConfirmationEmail = async (bookingData) => {
  const { carDetails, bookingDetails } = bookingData;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #c084fc 0%, #f472b6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .booking-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Booking Confirmed!</h1>
        </div>
        <div class="content">
          <h2>Your booking has been confirmed</h2>
          <div class="booking-details">
            <div class="detail-row">
              <span class="detail-label">Car:</span>
              <span>${carDetails.make} ${carDetails.model} ${carDetails.year}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Start Date:</span>
              <span>${new Date(bookingDetails.startDate).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">End Date:</span>
              <span>${new Date(bookingDetails.endDate).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Total Price:</span>
              <span>₹${bookingDetails.totalPrice.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <p>We look forward to serving you!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(
    bookingData.userEmail || 'user@example.com', // Should be passed from job data
    'Booking Confirmation - DriveNow',
    html
  );
};

/**
 * Send booking reminder email
 */
const sendBookingReminderEmail = async (bookingData) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <body>
      <h2>Reminder: Your rental starts soon!</h2>
      <p>Your rental for ${bookingData.carDetails.make} ${bookingData.carDetails.model} starts on ${new Date(bookingData.startDate).toLocaleDateString()}.</p>
      <p>Please make sure to pick up your car on time.</p>
    </body>
    </html>
  `;

  return sendEmail(
    bookingData.userEmail || 'user@example.com',
    'Rental Reminder - DriveNow',
    html
  );
};

/**
 * Send rental ending soon email
 */
const sendRentalEndingSoonEmail = async (rentalData) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <body>
      <h2>Reminder: Your rental ends soon</h2>
      <p>Your rental for ${rentalData.carDetails.make} ${rentalData.carDetails.model} ends on ${new Date(rentalData.endDate).toLocaleDateString()}.</p>
      <p>Please return the car on time.</p>
    </body>
    </html>
  `;

  return sendEmail(
    rentalData.userEmail || 'user@example.com',
    'Rental Ending Soon - DriveNow',
    html
  );
};

/**
 * Send rental completed email
 */
const sendRentalCompletedEmail = async (rentalData) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <body>
      <h2>Thank you for using DriveNow!</h2>
      <p>Your rental has been completed. We hope you enjoyed your experience.</p>
      <p>Total amount: ₹${rentalData.totalPrice.toLocaleString('en-IN')}</p>
      <p>We look forward to serving you again!</p>
    </body>
    </html>
  `;

  return sendEmail(
    rentalData.userEmail || 'user@example.com',
    'Rental Completed - DriveNow',
    html
  );
};

module.exports = {
  initializeEmailService,
  sendEmail,
  sendWelcomeEmail,
  sendBookingConfirmationEmail,
  sendBookingReminderEmail,
  sendRentalEndingSoonEmail,
  sendRentalCompletedEmail,
};

