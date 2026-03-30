const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || process.env.GMAIL_USER,
    pass: process.env.EMAIL_PASS || process.env.GMAIL_PASS,
  },
});

const base = (content) => `
  <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;background:#0F0B21;color:#F1F0F7;border-radius:16px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#7C3AED,#2DD4BF);padding:24px;text-align:center">
      <h1 style="margin:0;font-size:22px;font-weight:800;color:white">🤝 SideKick</h1>
    </div>
    <div style="padding:28px">${content}</div>
    <div style="padding:16px;text-align:center;color:#6E6893;font-size:12px;border-top:1px solid #2D2653">
      SideKick — Find Your Companion
    </div>
  </div>
`;

const btn = (text, url) =>
  `<a href="${url}" style="display:inline-block;margin-top:20px;padding:12px 28px;background:linear-gradient(135deg,#7C3AED,#2DD4BF);color:white;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px">${text}</a>`;

const APP_URL = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000';

const send = async (to, subject, html) => {
  const from = process.env.EMAIL_USER || process.env.GMAIL_USER;
  if (!from) { console.warn('⚠️ Email not configured (EMAIL_USER missing)'); return; }
  await transporter.sendMail({ from: `"SideKick" <${from}>`, to, subject, html });
};

exports.sendOTPEmail = async (email, otp, name = 'there') => {
  try {
    await send(email, 'Your SideKick OTP Code',
      base(`<h2 style="color:#F1F0F7;margin-top:0">Verify your account</h2>
        <p style="color:#A8A3C7">Hi <b style="color:#F1F0F7">${name}</b>,</p>
        <p style="color:#A8A3C7">Your OTP is:</p>
        <div style="text-align:center;margin:20px 0">
          <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#2DD4BF">${otp}</span>
        </div>
        <p style="color:#A8A3C7;font-size:13px">Valid for 10 minutes. Do not share this code.</p>`));
  } catch (err) { console.warn('⚠️ OTP email failed:', err.message); }
};

exports.sendWelcomeEmail = async (email, name) => {
  try {
    await send(email, 'Welcome to SideKick! 🎉',
      base(`<h2 style="color:#F1F0F7;margin-top:0">Welcome, ${name}!</h2>
        <p style="color:#A8A3C7">Your account is verified. Start finding your SideKick!</p>
        ${btn('Get Started', APP_URL)}`));
  } catch (err) { console.warn('⚠️ Welcome email failed:', err.message); }
};

exports.sendMatchNotificationEmail = async (receiverEmail, requesterName, matchedInterests = []) => {
  try {
    await send(receiverEmail, `${requesterName} wants to be your SideKick! 🤝`,
      base(`<h2 style="color:#F1F0F7;margin-top:0">New Companion Request!</h2>
        <p style="color:#A8A3C7"><b style="color:#2DD4BF">${requesterName}</b> has sent you a companion request.</p>
        ${matchedInterests.length ? `<p style="color:#A8A3C7">Shared interests: <b style="color:#F1F0F7">${matchedInterests.join(', ')}</b></p>` : ''}
        ${btn('View Request', `${APP_URL}/dashboard`)}`));
  } catch (err) { console.warn('⚠️ Match notification email failed:', err.message); }
};

exports.sendMatchAcceptedEmail = async (requesterEmail, acceptorName) => {
  try {
    await send(requesterEmail, `${acceptorName} accepted your request! 🎉`,
      base(`<h2 style="color:#F1F0F7;margin-top:0">You've got a new SideKick!</h2>
        <p style="color:#A8A3C7"><b style="color:#2DD4BF">${acceptorName}</b> accepted your companion request.</p>
        ${btn('Start Chatting', `${APP_URL}/chats`)}`));
  } catch (err) { console.warn('⚠️ Match accepted email failed:', err.message); }
};

// Aliases for after-version compatibility
exports.sendMatchRequestEmail = exports.sendMatchNotificationEmail;
