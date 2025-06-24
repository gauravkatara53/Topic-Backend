import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, otp) => {
  const htmlContent = `
    <div style="max-width: 480px; margin: auto; font-family: 'Segoe UI', sans-serif; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #eee;">
      <table width="100%" style="border-collapse: collapse;">
        <tr>
          <td style="text-align: left;">
            <img src="https://topic-frontend.vercel.app/assets/mortarboard-DQ6alufg.png" alt="Topic Logo" style="height: 40px; border-radius: 6px; vertical-align: middle;" />
            <span style="font-size: 20px; font-weight: 600; color: #4f46e5; margin-left: 8px; vertical-align: middle;">Topic</span>
          </td>
        </tr>
      </table>

      <h2 style="color: #111827; text-align: center; margin-top: 30px;">🔐 Verify Your Identity</h2>
      <p style="color: #444; font-size: 15px; text-align: center;">
        Use the OTP below to complete your login. This code is valid for 10 minutes.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <span style="display: inline-block; background: linear-gradient(to right, #6366f1, #4f46e5); color: white; padding: 16px 36px; font-size: 28px; font-weight: bold; border-radius: 10px; letter-spacing: 6px;">
          ${otp}
        </span>
      </div>

      <p style="font-size: 14px; color: #6b7280; text-align: center;">
        Didn’t request this code? You can safely ignore this email.
      </p>

      <p style="margin-top: 40px; text-align: center; font-size: 12px; color: #9ca3af;">
        Sent on ${new Date().toLocaleString()} • Topic Inc.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: "🔐 Your OTP Code",
    html: htmlContent,
  });
};

export default sendEmail;
