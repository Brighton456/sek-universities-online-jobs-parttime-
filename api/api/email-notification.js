    // api/email-notification.js
    // This Vercel Serverless Function handles sending email notifications
    // for website visits and user logins.

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
    // This transporter will be reused for multiple email sending operations
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
        // Parse the JSON request body
        const { event, timestamp, page, userAgent, clientIp, userId, loginType } = req.body;

        // Log the received payload for debugging
        console.log('Received payload:', { event, timestamp, page, userAgent, clientIp, userId, loginType });

        // Construct the email subject and body based on the event type
        let subject = `Website Visit Notification: ${event} on ${page}`;
        let body = `
          Hello,

          A new website event has been recorded.

          Event Type: ${event}
          Timestamp: ${timestamp}
          Page Visited: ${page}
          User Agent: ${userAgent}
          Client IP: ${clientIp}
        `;

        if (event === 'user_login') {
          subject = `User Login Notification: ${loginType} for User ID ${userId}`;
          body += `
          User ID: ${userId}
          Login Type: ${loginType}
          `;
        }

        body += `
          This notification was sent from your Vercel Serverless Function.
        `;

        // Define the email options
        const mailOptions = {
          from: EMAIL_USER,     // Sender address (must be the same as EMAIL_USER)
          to: RECIPIENT_EMAIL,  // Recipient address
          subject: subject,     // Email subject
          text: body,           // Plain text body
          // html: '<p>HTML version of the body</p>' // Optional: HTML body
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
    
