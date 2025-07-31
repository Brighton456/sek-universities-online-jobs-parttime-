// api/email-notification.js
// This Vercel Serverless Function handles sending email notifications
// for website visits with enhanced user information.

// Import the Nodemailer library for sending emails
const nodemailer = require('nodemailer');

// Retrieve email credentials and recipient from Vercel Environment Variables
// These variables must be set in your Vercel project settings for security.
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS; // Use an app-specific password for Gmail
const EMAIL_HOST = process.env.EMAIL_HOST; // e.g., 'smtp.gmail.com'
const EMAIL_PORT = process.env.EMAIL_PORT; // e.g., '587'
const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL; // The email to send notifications to

// Create a Nodemailer transporter using SMTP
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: false, // Use 'true' if port is 465 (SMTPS), 'false' for 587 (STARTTLS)
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  // Optional: Add logging for debugging in development
  // logger: true,
  // debug: true
});

/**
 * Main handler for the Vercel Serverless Function.
 * This function is triggered by incoming HTTP requests.
 * It expects a POST request with a JSON body containing notification data.
 *
 * @param {object} req The HTTP request object.
 * @param {object} res The HTTP response object.
 */
module.exports = async (req, res) => {
  // Set CORS headers to allow requests from any origin (your Vercel frontend)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle OPTIONS preflight request for CORS
  if (req.method === 'OPTIONS') {
    res.status(204).end(); // No content for preflight success
    return;
  }

  // Ensure it's a POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed. Only POST requests are accepted.' });
  }

  // Basic validation for environment variables
  if (!EMAIL_USER || !EMAIL_PASS || !EMAIL_HOST || !EMAIL_PORT || !RECIPIENT_EMAIL) {
    console.error("Missing environment variables for email sending.");
    return res.status(500).json({ status: 'error', message: 'Server configuration error: Email credentials missing.' });
  }

  try {
    // Parse the JSON request body with new fields
    const { 
        eventType, 
        timestamp, 
        page, 
        userId, 
        userAgent, 
        clientIp, 
        referrer, 
        screenResolution, 
        browserLanguage, 
        platform 
    } = req.body;

    // Log the received payload for debugging
    console.log('Received payload:', { eventType, timestamp, page, userId, userAgent, clientIp, referrer, screenResolution, browserLanguage, platform });

    let subject = '';
    let eventDescription = '';

    if (eventType === 'first_time_website_visit') {
        subject = `NEW Visitor Alert: First-Time Visit to SEKU Hub!`;
        eventDescription = `A new, first-time visitor has landed on your SEKU Opportunities Hub website.`;
    } else if (eventType === 'returning_website_visit') {
        subject = `Returning Visitor: SEKU Hub Activity Detected`;
        eventDescription = `A returning visitor has accessed your SEKU Opportunities Hub website.`;
    } else {
        subject = `Website Activity: ${eventType || 'Unknown Event'}`;
        eventDescription = `An event of type '${eventType || 'Unknown'}' occurred on your website.`;
    }

    // Construct the detailed email body
    const body = `
      Hello,

      ${eventDescription}

      --- Visit Details ---
      Timestamp: ${timestamp}
      Page Visited: ${page}
      User ID (Firebase Anonymous): ${userId}
      Client IP: ${clientIp}
      Referrer: ${referrer}
      Screen Resolution: ${screenResolution}
      Browser Language: ${browserLanguage}
      Platform: ${platform}
      User Agent: ${userAgent}

      This notification was sent from your Vercel Serverless Function.
    `;

    // Define the email options
    const mailOptions = {
      from: EMAIL_USER,     // Sender address (must be the same as EMAIL_USER)
      to: RECIPIENT_EMAIL,  // Recipient address
      subject: subject,     // Email subject
      text: body,           // Plain text body
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    console.log("Email sent successfully to:", RECIPIENT_EMAIL);
    return res.status(200).json({ status: 'success', message: 'Email notification sent successfully.' });

  } catch (error) {
    console.error('Error sending email notification:', error);
    // Provide a generic error message to the client for security
    return res.status(500).json({ status: 'error', message: 'Failed to send email notification. Please check server logs for details.' });
  }
};
