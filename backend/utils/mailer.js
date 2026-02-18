/**
 * Email notification utility using Nodemailer.
 *
 * Requires env vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 *   ADMIN_NOTIFICATION_EMAIL (recipient for admin alerts)
 *   ADMIN_URL (base URL of the admin panel, e.g. https://radeo.in)
 *
 * All functions are non-blocking — callers should .catch() errors
 * rather than awaiting if the email is non-critical.
 */

const nodemailer = require('nodemailer');
const { log } = require('./logger');

let transporter = null;

/**
 * Lazily initialise the SMTP transport (only created once).
 */
function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    log.warn('SMTP not configured — email notifications disabled');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

/**
 * Send an email to the admin when a new contact form message is received.
 *
 * @param {Object} message - The saved ContactMessage document
 * @param {string} message.name
 * @param {string} message.email
 * @param {string} message.subject
 * @param {string} message.message
 */
async function sendAdminContactNotification(message) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail) return;

  const transport = getTransporter();
  if (!transport) return;

  const adminUrl = process.env.ADMIN_URL || 'https://radeo.in';

  await transport.sendMail({
    from: `"RADEO Store" <${process.env.SMTP_USER}>`,
    to: adminEmail,
    subject: `New Contact Message: ${message.subject || '(no subject)'}`,
    html: `
      <h2>New message from ${message.name}</h2>
      <p><strong>Email:</strong> ${message.email}</p>
      <p><strong>Subject:</strong> ${message.subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message.message}</p>
      <br/>
      <a href="${adminUrl}/admin/contact">View in Admin Panel</a>
    `,
  });
}

module.exports = {
  getTransporter,
  sendAdminContactNotification,
};
