// utils/otpMailer.ts
import nodemailer from "nodemailer";

// ── 1.  Create (and pool) one SMTP transporter ────────────────────────
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465, // SSL
  secure: true,
  pool: true, // reuse connections → faster
  maxConnections: 5,
  auth: {
    user: process.env.EMAIL_USER, // e.g. noreply.topic@gmail.com
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

// Verify once on boot
transporter.verify((err) =>
  console[err ? "error" : "log"](
    err ? "❌ SMTP verification failed:" : "✅ SMTP transporter is ready.",
    err ?? ""
  )
);

// ── 2.  Export a helper that sends the one‑liner ───────────────────────
export const sendEmail = async (recipient, otp) => {
  const mailOptions = {
    from: `"Topic" <${process.env.EMAIL_USER}>`,
    to: recipient,
    subject: "Your OTP code",
    // ONE‑LINE body ↓↓↓
    text: `Your OTP is ${otp}. It is valid for 10 minutes. — Topic Inc.`,
  };

  const info = await transporter.sendMail(mailOptions);

  // Optional: quick visibility in logs
  console.log("📧 OTP sent to:", recipient);
  console.log("   Accepted:", info.accepted);
  console.log("   Response:", info.response);
};
