// config/email.js
// Sends the one-time login code.
//
// Real email goes out when SMTP is configured. When it is not, the code is
// written to the server log instead and the login continues. That fallback is
// deliberate: a missing mail account should not lock anyone out of the site,
// and it keeps the feature demonstrable before SMTP is set up.
//
// Set these on Render for real delivery (Gmail needs an App Password, not the
// account password, and only works with 2-Step Verification turned on):
//
//   SMTP_HOST=smtp.gmail.com
//   SMTP_PORT=587
//   SMTP_USER=you@gmail.com
//   SMTP_PASS=<16-character app password>
//   SMTP_FROM="SE Aware <you@gmail.com>"     (optional)

const nodemailer = require('nodemailer');

function smtpConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporter = null;
if (smtpConfigured()) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    // Without these a slow or unresponsive mail server leaves the person
    // staring at a spinner. Better to fail quickly and say so.
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

async function sendOtpEmail(toEmail, code) {
  if (!transporter) {
    console.log(`\n[email] SMTP not configured. Login code for ${toEmail}: ${code}\n`);
    return { delivered: false, mode: 'console' };
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject: 'Your SE Aware verification code',
      text: `Your verification code is ${code}. It expires in 5 minutes. `
          + `If you did not try to sign in, you can ignore this email.`,
      html: `<p>Your verification code is `
          + `<strong style="font-size:1.3em;letter-spacing:3px;">${code}</strong>.</p>`
          + `<p>It expires in 5 minutes. If you did not try to sign in, you can ignore this email.</p>`,
    });
    return { delivered: true, mode: 'smtp' };
  } catch (err) {
    // The code is already stored and valid, so losing the email is not a
    // reason to fail the login outright. Log it and let the caller decide.
    console.error('[email] send failed:', err.message);
    return { delivered: false, mode: 'failed', error: err.message };
  }
}

module.exports = { sendOtpEmail, smtpConfigured };
