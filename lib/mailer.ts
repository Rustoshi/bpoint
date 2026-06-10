import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: Number(process.env.MAILTRAP_PORT ?? 2525),
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

const FROM = `"${process.env.MAILTRAP_FROM_NAME ?? "BPoint"}" <${process.env.MAILTRAP_FROM_EMAIL ?? "no-reply@bpoint.ng"}>`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendOtpEmail(to: string, firstName: string, otp: string): Promise<void> {
  const expiryMins = process.env.OTP_EXPIRES_MINUTES ?? "10";

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `${otp} is your BPoint verification code`,
    text: `Hi ${firstName},\n\nYour BPoint email verification code is:\n\n${otp}\n\nThis code expires in ${expiryMins} minutes. Do not share it with anyone.\n\nIf you did not create a BPoint account, ignore this email.\n\n— The BPoint Team`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your BPoint email</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:#2563eb;padding:28px 32px;text-align:center;">
              <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">BPoint</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 28px;">
              <p style="margin:0 0 6px;font-size:13px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Email Verification</p>
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#0f172a;line-height:1.2;">Hi ${firstName}, verify your email</h1>
              <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.6;">
                Enter the code below in the BPoint verification page to confirm your email address.
              </p>
              <!-- OTP Block -->
              <div style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Your verification code</p>
                <p style="margin:0;font-size:40px;font-weight:900;color:#2563eb;letter-spacing:12px;font-variant-numeric:tabular-nums;">${otp}</p>
              </div>
              <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">
                ⏱ This code expires in <strong style="color:#475569;">${expiryMins} minutes</strong>.
              </p>
              <p style="margin:0 0 28px;font-size:13px;color:#94a3b8;">
                🔒 Never share this code with anyone. BPoint will never ask for your OTP.
              </p>
              <!-- CTA -->
              <a href="${APP_URL}/register/verify?email=${encodeURIComponent(to)}"
                style="display:inline-block;background:#2563eb;color:#ffffff;font-size:14px;font-weight:700;padding:13px 28px;border-radius:8px;text-decoration:none;">
                Verify My Email →
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #f1f5f9;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                If you didn't create a BPoint account, you can safely ignore this email.<br />
                &copy; ${new Date().getFullYear()} BPoint Technologies Ltd · <a href="${APP_URL}/privacy" style="color:#94a3b8;">Privacy Policy</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
}

export async function sendWelcomeEmail(to: string, firstName: string): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Welcome to BPoint, ${firstName}!`,
    text: `Hi ${firstName},\n\nYour BPoint account is now active. You can log in and start trading gift cards at ${APP_URL}/login.\n\n— The BPoint Team`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
          <tr>
            <td style="background:#2563eb;padding:28px 32px;text-align:center;">
              <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">BPoint</span>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 28px;">
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#0f172a;">Welcome aboard, ${firstName}! 🎉</h1>
              <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
                Your BPoint account is verified and ready. You can now trade gift cards, request code recovery, consignment videos, and more.
              </p>
              <a href="${APP_URL}/login"
                style="display:inline-block;background:#2563eb;color:#ffffff;font-size:14px;font-weight:700;padding:13px 28px;border-radius:8px;text-decoration:none;">
                Go to Dashboard →
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #f1f5f9;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                &copy; ${new Date().getFullYear()} BPoint Technologies Ltd · <a href="${APP_URL}/privacy" style="color:#94a3b8;">Privacy Policy</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  resetUrl: string
): Promise<void> {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Reset your BPoint password",
    text: `Hi ${firstName},\n\nYou requested a password reset for your BPoint account.\n\nClick the link below to set a new password (expires in 30 minutes):\n\n${resetUrl}\n\nIf you didn't request this, ignore this email — your password won't change.\n\n— The BPoint Team`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your BPoint password</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
          <tr>
            <td style="background:#2563eb;padding:28px 32px;text-align:center;">
              <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">BPoint</span>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 28px;">
              <p style="margin:0 0 6px;font-size:13px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Password Reset</p>
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#0f172a;line-height:1.2;">Reset your password, ${firstName}</h1>
              <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.6;">
                We received a request to reset the password on your BPoint account. Click the button below to choose a new password.
              </p>
              <a href="${resetUrl}"
                style="display:inline-block;background:#2563eb;color:#ffffff;font-size:14px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;">
                Reset My Password
              </a>
              <p style="margin:24px 0 8px;font-size:13px;color:#94a3b8;">
                This link expires in <strong style="color:#475569;">30 minutes</strong>.
              </p>
              <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">If the button above doesn't work, paste this URL into your browser:</p>
              <p style="margin:0;font-size:12px;color:#94a3b8;word-break:break-all;">
                <a href="${resetUrl}" style="color:#2563eb;">${resetUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #f1f5f9;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                If you didn't request a password reset, you can safely ignore this email.<br />
                &copy; ${new Date().getFullYear()} BPoint Technologies Ltd
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
}
