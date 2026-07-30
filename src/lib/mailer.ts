import nodemailer from "nodemailer";

export const OTP_DELIVERY_EMAIL = "hr@redfoxacareerlink.com";

async function trySmtpSend(message: string): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user,
        pass,
      },
    });

    await transporter.sendMail({
      from:
        process.env.SMTP_FROM ||
        `"Smart HRMS" <${user}>`,
      to: OTP_DELIVERY_EMAIL,
      subject: "Admin Password Reset OTP",
      text: message,
    });

    console.log(
      `OTP email sent successfully to ${OTP_DELIVERY_EMAIL} via SMTP.`
    );

    return true;
  } catch (err) {
    console.error(
      "SMTP send failed - Falling back to console log.",
      err
    );
    return false;
  }
}

/**
 * Delivers the OTP to the HR mailbox.
 * Returns the OTP only when email could not be sent and
 * the application is not running in production.
 */
export async function sendOtpEmail(
  adminEmail: string,
  otp: string
): Promise<string | undefined> {
  const message = `[Smart HRMS] Password reset OTP for admin account "${adminEmail}": ${otp}

Delivered to ${OTP_DELIVERY_EMAIL}. Valid for 10 minutes.`;

  console.log("\n==================== OTP EMAIL ====================");
  console.log(`To: ${OTP_DELIVERY_EMAIL}`);
  console.log(message);
  console.log("==================================================\n");

  const sent = await trySmtpSend(message);

  if (sent) {
    return undefined;
  }

  return process.env.NODE_ENV === "production"
    ? undefined
    : otp;
}