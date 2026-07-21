import { Logger } from "@nestjs/common";
import { Resend } from "resend";

const logger = new Logger("MailTransporter");

const isTest = process.env.NODE_ENV === "test" || Boolean(process.env.JEST_WORKER_ID);

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Shared mail transport.  Uses Resend HTTP API (works on platforms that block
 * outbound SMTP like Render free tier).  Exposes a sendMail() method compatible
 * with the Nodemailer call-sites already in the codebase.
 */
export const mailTransporter = {
  async sendMail(options: { from: string; to: string; subject: string; html: string }) {
    if (!resend) {
      logger.warn("RESEND_API_KEY not set — email not sent");
      return { messageId: "skipped-no-key" };
    }

    const result = await resend.emails.send({
      from: options.from,
      to: [options.to],
      subject: options.subject,
      html: options.html,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return { messageId: result.data?.id ?? "unknown" };
  },

  async verify() {
    if (!resend) throw new Error("RESEND_API_KEY not set");
    // Resend doesn't have a verify endpoint — just confirm the key is set.
    return true;
  },
};

if (!isTest && resend) {
  mailTransporter.verify().then(
    () => logger.log("Resend email transport verified and ready"),
    (error: any) => logger.error("Resend transport verification failed:", error?.message || error)
  );
}
