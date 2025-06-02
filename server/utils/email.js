const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Send email verification
const sendVerificationEmail = async (email, token, name) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: email,
    subject: 'Verify Your New Email Address',
    html: `
      <h1>Hello ${name}!</h1>
      <p>Please click the link below to verify your new email address:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't request this change, please ignore this email.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Send contact form confirmation
const sendContactConfirmation = async (email, { name, referenceId, subject }) => {
  const statusUrl = `${process.env.FRONTEND_URL}/contact-status/${referenceId}`;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: email,
    subject: 'Contact Form Submission Received',
    html: `
      <h1>Hello ${name}!</h1>
      <p>Thank you for contacting us. We have received your message regarding:</p>
      <p><strong>${subject}</strong></p>
      <p>Your reference ID is: <strong>${referenceId}</strong></p>
      <p>You can check the status of your inquiry at any time using this link:</p>
      <a href="${statusUrl}">${statusUrl}</a>
      <p>We will respond to your message as soon as possible.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail,
  sendContactConfirmation
}; 