/** Generates a branded HTML email body for OTP verification codes. */
export function buildOtpEmailHtml(params: {
  code: string;
  userName?: string;
  phoneNumber?: string;
}): string {
  const { code, userName, phoneNumber } = params;
  const greeting = userName ? `Hi ${userName},` : "Hi there,";
  const digits = code.split("").join(" ");
  const phoneNote = phoneNumber
    ? `<p style="color:#64748B;font-size:13px;margin-top:8px;">This code was also sent to <strong>${phoneNumber}</strong> via SMS.</p>`
    : "";

  return `
  <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#004CFF;font-size:24px;font-weight:800;margin:0;">BexieMart</h1>
    </div>
    <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:16px;padding:32px;text-align:center;">
      <p style="color:#1E293B;font-size:16px;margin:0 0 8px;">${greeting}</p>
      <p style="color:#64748B;font-size:14px;margin:0 0 24px;">Your verification code is:</p>
      <div style="background:#F8FAFC;border:2px dashed #004CFF;border-radius:12px;padding:20px;margin:0 auto 24px;">
        <span style="font-family:'Courier New',monospace;font-size:36px;font-weight:800;letter-spacing:8px;color:#004CFF;">${digits}</span>
      </div>
      <p style="color:#64748B;font-size:13px;margin:0;">This code expires in <strong>5 minutes</strong>.</p>
      ${phoneNote}
    </div>
    <div style="text-align:center;margin-top:24px;">
      <p style="color:#94A3B8;font-size:12px;margin:0;">If you didn't request this code, you can safely ignore this email.</p>
      <p style="color:#CBD5E1;font-size:11px;margin-top:16px;">© ${new Date().getFullYear()} BexieMart. All rights reserved.</p>
    </div>
  </div>`;
}
