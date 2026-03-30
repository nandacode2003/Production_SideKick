const axios = require('axios');

const send = async (to, subject, html) => {
  await axios.post('https://api.brevo.com/v3/smtp/email', {
    sender: { name: 'SideKick', email: process.env.EMAIL_USER },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  }, {
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
  });
};

const wrap = (body) => `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:24px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:28px;letter-spacing:1px">🤝 SideKick</h1>
  </div>
  <div style="padding:32px">${body}</div>
  <div style="background:#f9fafb;padding:16px;text-align:center;font-size:12px;color:#9ca3af">
    If you didn't request this, ignore this email. © SideKick
  </div>
</div>`;

exports.sendOTPEmail = (email, otp) =>
  send(email, 'SideKick — Your Verification Code', wrap(`
    <p style="color:#374151;font-size:16px">Your verification code is:</p>
    <div style="background:#f3f4f6;border-radius:8px;padding:24px;text-align:center;margin:16px 0">
      <span style="font-size:40px;font-weight:bold;letter-spacing:8px;color:#7c3aed">${otp}</span>
    </div>
    <p style="color:#6b7280;font-size:14px">This code expires in <strong>10 minutes</strong>.</p>`));

exports.sendWelcomeEmail = (email, name) =>
  send(email, 'Welcome to SideKick! 🎉', wrap(`
    <h2 style="color:#7c3aed">Hey ${name}, welcome aboard! 🎉</h2>
    <p style="color:#374151">Your account is verified. Complete your profile to start finding your SideKick.</p>
    <p style="color:#6b7280;font-size:14px"><em>"Never go alone. Find your SideKick."</em></p>`));

exports.sendMatchNotificationEmail = (email, matchName, matchInterests) =>
  send(email, '🎉 You have a new match on SideKick!', wrap(`
    <h2 style="color:#7c3aed">You've got a match!</h2>
    <p style="color:#374151"><strong>${matchName}</strong> wants to be your SideKick.</p>
    <p style="color:#6b7280">Common interests: <strong>${(matchInterests || []).join(', ')}</strong></p>
    <p style="color:#374151">Log in to accept or decline the request.</p>`));

exports.sendMatchAcceptedEmail = (email, matchName) =>
  send(email, '✅ Match accepted on SideKick!', wrap(`
    <h2 style="color:#7c3aed">Great news!</h2>
    <p style="color:#374151"><strong>${matchName}</strong> accepted your match request. Start chatting now!</p>`));

exports.sendEventJoinedEmail = (email, eventTitle, eventDate, eventLocation) =>
  send(email, `✅ You joined: ${eventTitle}`, wrap(`
    <h2 style="color:#7c3aed">You're in! 🎊</h2>
    <p style="color:#374151">You've joined <strong>${eventTitle}</strong>.</p>
    <p style="color:#6b7280">📅 ${new Date(eventDate).toDateString()}<br>📍 ${eventLocation}</p>
    <p style="color:#374151">Stay safe and have fun!</p>`));

exports.sendSafetyCircleEmail = (contactEmail, userName, eventTitle, eventLocation, checkInLink) =>
  send(contactEmail, `🔔 ${userName} is heading to an event`, wrap(`
    <h2 style="color:#7c3aed">Safety Check-in Alert</h2>
    <p style="color:#374151"><strong>${userName}</strong> is attending <strong>${eventTitle}</strong>.</p>
    <p style="color:#6b7280">📍 Location: ${eventLocation}</p>
    <a href="${checkInLink}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">View Check-in</a>`));

exports.sendSafetyAlertEmail = (contactEmail, userName) =>
  send(contactEmail, `⚠️ Safety Alert: ${userName} hasn't checked in`, wrap(`
    <h2 style="color:#dc2626">⚠️ Safety Alert</h2>
    <p style="color:#374151"><strong>${userName}</strong> hasn't confirmed they're safe after their event.</p>
    <p style="color:#374151">You may want to reach out to them directly.</p>`));
