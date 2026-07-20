import { Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";

const logger = new Logger("MailTransporter");
const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);

/** Shared Nodemailer transporter with connection pooling for all outbound emails. */
export const mailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  pool: true,
  maxConnections: 3,
  maxMessages: 100,
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 20_000,
});

const isDev = process.env.NODE_ENV !== "production";
const isTest = process.env.NODE_ENV === "test" || Boolean(process.env.JEST_WORKER_ID);

if (!isTest && process.env.SMTP_USER && process.env.SMTP_PASS) {
  mailTransporter.verify().then(
    () => {
      if (isDev) logger.log("SMTP transporter verified and ready");
    },
    (error) => logger.error("SMTP transporter verification failed:", error?.message || error)
  );
}
