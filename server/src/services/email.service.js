const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text: text || '',
    };
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Email send error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

const sendOTPEmail = async (to, otp, name) => {
  return sendEmail({
    to,
    subject: 'Campus CIVORA AI — Email Verification OTP',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Inter, Arial, sans-serif; background:#0A0E1A; color:#fff; padding:40px;">
        <div style="max-width:480px; margin:0 auto; background:#1a1f35; border-radius:16px; padding:40px; border:1px solid rgba(0,212,255,0.2);">
          <div style="text-align:center; margin-bottom:30px;">
            <h1 style="color:#00D4FF; font-size:24px; margin:0;">Campus CIVORA AI</h1>
            <p style="color:#8892b0; margin:8px 0 0;">Amrita Vishwa Vidyapeetham</p>
          </div>
          <p style="color:#ccd6f6;">Hello <strong>${name}</strong>,</p>
          <p style="color:#8892b0;">Your One-Time Password for Campus CIVORA AI verification is:</p>
          <div style="text-align:center; margin:30px 0;">
            <span style="font-size:42px; font-weight:700; letter-spacing:12px; color:#00D4FF; background:rgba(0,212,255,0.1); padding:16px 28px; border-radius:12px; display:inline-block;">${otp}</span>
          </div>
          <p style="color:#8892b0; font-size:14px;">This OTP is valid for <strong style="color:#F59E0B;">10 minutes</strong>. Do not share it with anyone.</p>
          <hr style="border:none; border-top:1px solid rgba(255,255,255,0.1); margin:24px 0;">
          <p style="color:#636e8a; font-size:12px; text-align:center;">If you did not request this OTP, please ignore this email.</p>
        </div>
      </body>
      </html>
    `,
  });
};

const sendComplaintStatusEmail = async (to, name, complaintTitle, status, message) => {
  const statusColors = {
    assigned: '#00D4FF',
    work_in_progress: '#F59E0B',
    completed: '#10B981',
    closed: '#10B981',
    rejected: '#EF4444',
    escalated: '#F97316',
    approved: '#8B5CF6',
  };
  const color = statusColors[status] || '#00D4FF';

  return sendEmail({
    to,
    subject: `Complaint Update — ${complaintTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Inter, Arial, sans-serif; background:#0A0E1A; color:#fff; padding:40px;">
        <div style="max-width:480px; margin:0 auto; background:#1a1f35; border-radius:16px; padding:40px; border:1px solid rgba(0,212,255,0.2);">
          <h1 style="color:#00D4FF; font-size:20px;">Campus CIVORA AI</h1>
          <p style="color:#ccd6f6;">Hello <strong>${name}</strong>,</p>
          <p style="color:#8892b0;">Your complaint "<strong style="color:#fff;">${complaintTitle}</strong>" has been updated.</p>
          <div style="background:rgba(255,255,255,0.05); border-left:4px solid ${color}; padding:16px; border-radius:8px; margin:20px 0;">
            <strong style="color:${color}; text-transform:uppercase; font-size:12px; letter-spacing:1px;">Status: ${status.replace(/_/g, ' ')}</strong>
            <p style="color:#ccd6f6; margin:8px 0 0;">${message}</p>
          </div>
          <p style="color:#636e8a; font-size:12px;">Log in to Campus CIVORA AI to view full details.</p>
        </div>
      </body>
      </html>
    `,
  });
};

module.exports = { sendEmail, sendOTPEmail, sendComplaintStatusEmail };
