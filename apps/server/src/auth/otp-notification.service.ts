import { Logger } from "@nestjs/common";
import { mailTransporter } from "./mail-transporter";
import { buildOtpEmailHtml } from "./templates/otp-email.template";

export interface OtpDeliveryResult {
  smsSuccess: boolean;
  emailSuccess: boolean;
  smsError?: string;
  emailError?: string;
}

interface SendOtpDualChannelParams {
  phoneNumber: string;
  code: string;
  email?: string | null;
  userName?: string | null;
}

const logger = new Logger("OtpNotificationService");

/**
 * Sends an OTP code via Arkesel SMS gateway.
 * Returns true on success, false on failure (never throws).
 */
export async function sendOtpViaSms(phoneNumber: string, code: string): Promise<boolean> {
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    console.log(
      `\n\n=== SMS GATEWAY ===\nTo: ${phoneNumber}\nMessage: Your BexieMart verification code is: ${code}\n===================\n\n`
    );
  }

  if (!process.env.ARKESEL_API_KEY) {
    logger.warn("ARKESEL_API_KEY not set — SMS not sent to real provider");
    return isDev; // In dev, treat console log as "success"
  }

  try {
    const response = await fetch("https://sms.arkesel.com/api/v2/sms/send", {
      method: "POST",
      headers: {
        "api-key": process.env.ARKESEL_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: process.env.ARKESEL_SENDER_ID || "BexieMart",
        message: `Your BexieMart verification code is: ${code}`,
        recipients: [phoneNumber],
      }),
    });

    const data = await response.json();
    if (!response.ok || data.status === "error") {
      logger.error(`Arkesel SMS failed: ${JSON.stringify(data)}`);
      return false;
    }

    logger.log(`Arkesel SMS sent successfully to ${phoneNumber}`);
    return true;
  } catch (error) {
    logger.error(`Arkesel SMS error: ${error instanceof Error ? error.message : error}`);
    return false;
  }
}

/**
 * Sends an OTP code via email using the shared Nodemailer transporter.
 * Returns true on success, false on failure (never throws).
 */
export async function sendOtpViaEmail(
  email: string,
  code: string,
  userName?: string | null,
  phoneNumber?: string
): Promise<boolean> {
  try {
    const html = buildOtpEmailHtml({
      code,
      userName: userName ?? undefined,
      phoneNumber,
    });

    const info = await mailTransporter.sendMail({
      from: process.env.EMAIL_FROM || "BexieMart <onboarding@bexiemart.com>",
      to: email,
      subject: "Your BexieMart verification code",
      html,
    });

    logger.log(`OTP email sent to ${email}: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`OTP email error for ${email}: ${error instanceof Error ? error.message : error}`);
    return false;
  }
}

/**
 * Sends OTP via both SMS and email simultaneously using Promise.allSettled.
 * Returns the delivery result for each channel.
 * At least one channel must succeed; otherwise the caller should throw.
 */
export async function sendOtpDualChannel(
  params: SendOtpDualChannelParams
): Promise<OtpDeliveryResult> {
  const { phoneNumber, code, email, userName } = params;

  const smsPromise = sendOtpViaSms(phoneNumber, code);
  const emailPromise = email
    ? sendOtpViaEmail(email, code, userName, phoneNumber)
    : Promise.resolve(false);

  const [smsResult, emailResult] = await Promise.allSettled([smsPromise, emailPromise]);

  const smsSuccess = smsResult.status === "fulfilled" && smsResult.value === true;
  const emailSuccess = emailResult.status === "fulfilled" && emailResult.value === true;

  const result: OtpDeliveryResult = {
    smsSuccess,
    emailSuccess,
    smsError: smsResult.status === "rejected" ? String(smsResult.reason) : undefined,
    emailError: emailResult.status === "rejected" ? String(emailResult.reason) : undefined,
  };

  logger.log(
    `OTP dual-channel delivery: SMS=${smsSuccess}, Email=${emailSuccess} (phone=${phoneNumber})`
  );

  return result;
}
