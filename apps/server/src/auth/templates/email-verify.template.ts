/**
 * Generates a branded HTML email for email verification.
 * Includes both a clickable verification link AND a 6-digit OTP code.
 */
export function buildEmailVerifyHtml(params: {
  userName: string;
  verifyUrl: string;
  otpCode: string;
  token: string;
}): string {
  const { userName, verifyUrl, otpCode, token } = params;
  const digits = otpCode.split("").join(" ");
  const appUrl = `bexiemart://verify-email?token=${token}`;

  return `
  <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#004CFF;font-size:24px;font-weight:800;margin:0;">BexieMart</h1>
    </div>
    <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:16px;padding:32px;text-align:center;">
      <p style="color:#1E293B;font-size:16px;margin:0 0 8px;">Hi ${userName},</p>
      <p style="color:#64748B;font-size:14px;margin:0 0 24px;">Verify your email to get started with BexieMart.</p>
      
      <a href="${verifyUrl}" style="display:inline-block;padding:14px 32px;background-color:#004CFF;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">Verify Email</a>
      
      <div style="margin:28px 0;border-top:1px solid #E2E8F0;"></div>
      
      <p style="color:#64748B;font-size:13px;margin:0 0 16px;">Or enter this code in the app:</p>
      <div style="background:#F8FAFC;border:2px dashed #004CFF;border-radius:12px;padding:20px;margin:0 auto 24px;">
        <span style="font-family:'Courier New',monospace;font-size:36px;font-weight:800;letter-spacing:8px;color:#004CFF;">${digits}</span>
      </div>
      <p style="color:#64748B;font-size:13px;margin:0;">This code expires in <strong>5 minutes</strong>.</p>
    </div>
    <div style="text-align:center;margin-top:24px;">
      <p style="color:#94A3B8;font-size:12px;margin:0;">If the button doesn't work, copy this link:<br/>
        <a href="${verifyUrl}" style="color:#004CFF;font-size:12px;">${verifyUrl}</a>
      </p>
      <p style="color:#94A3B8;font-size:12px;margin-top:8px;"><strong>Have the app installed?</strong><br/>
        <a href="${appUrl}" style="color:#94A3B8;font-size:11px;">${appUrl}</a>
      </p>
      <p style="color:#CBD5E1;font-size:11px;margin-top:16px;">© ${new Date().getFullYear()} BexieMart. All rights reserved.</p>
    </div>
  </div>`;
}
