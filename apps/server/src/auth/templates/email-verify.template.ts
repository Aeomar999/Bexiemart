/**
 * Generates an agency-grade, visually stunning HTML email for email verification.
 * Includes both a prominent clickable verification button AND a segmented 6-digit OTP code bezel.
 */
export function buildEmailVerifyHtml(params: {
  userName: string;
  verifyUrl: string;
  otpCode: string;
  token: string;
}): string {
  const { userName, verifyUrl, otpCode, token } = params;
  const c = otpCode.split("");
  const appUrl = `bexiemart://verify-email?token=${token}`;

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verify Your BexieMart Account</title>
  </head>
  <body style="margin:0;padding:0;background-color:#F1F5F9;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
    <div style="max-width:520px;margin:0 auto;padding:48px 20px;">
      <!-- Logo Header -->
      <div style="text-align:center;margin-bottom:32px;">
        <div style="display:inline-block;background:#004CFF;border-radius:12px;width:40px;height:40px;line-height:40px;text-align:center;color:#FFFFFF;font-weight:900;font-size:20px;vertical-align:middle;margin-right:8px;box-shadow:0 4px 12px rgba(0,76,255,0.25);">B</div>
        <span style="color:#0F172A;font-size:24px;font-weight:800;letter-spacing:-0.5px;vertical-align:middle;">BexieMart</span>
      </div>

      <!-- Main Card -->
      <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:24px;padding:40px 32px;text-align:center;box-shadow:0 10px 25px -5px rgba(0,0,0,0.05),0 8px 10px -6px rgba(0,0,0,0.01);">
        <h2 style="color:#0F172A;font-size:22px;font-weight:800;margin:0 0 12px;letter-spacing:-0.5px;">Welcome to BexieMart</h2>
        <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 28px;">
          Hi ${userName},<br />
          We're thrilled to have you! Please confirm your email address to unlock your full shopping experience.
        </p>
        
        <!-- Primary Action Button -->
        <div style="margin-bottom:36px;">
          <a href="${verifyUrl}" style="display:inline-block;padding:16px 36px;background:#004CFF;color:#FFFFFF;text-decoration:none;border-radius:14px;font-weight:700;font-size:16px;box-shadow:0 6px 20px rgba(0,76,255,0.3);letter-spacing:0.2px;">Verify Email Address</a>
        </div>
        
        <!-- Divider -->
        <div style="position:relative;margin:32px 0;text-align:center;">
          <div style="height:1px;background:#E2E8F0;width:100%;"></div>
          <span style="position:absolute;top:-10px;left:50%;margin-left:-65px;background:#FFFFFF;padding:0 12px;color:#94A3B8;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Or verify via code</span>
        </div>
        
        <p style="color:#64748B;font-size:13px;margin:0 0 20px;">Enter this verification code directly in your app:</p>

        <!-- Segmented Hardware OTP Bezel Table -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto 20px;border-collapse:separate;">
          <tr>
            <!-- Segment 1 (Digits 1-3) -->
            <td style="width:46px;height:56px;background:#F8FAFC;border:1.5px solid #CBD5E1;border-radius:14px;text-align:center;vertical-align:middle;font-family:'Courier New',Courier,monospace;font-size:26px;font-weight:800;color:#0F172A;box-shadow:0 2px 4px rgba(0,0,0,0.02);">${c[0] || ""}</td>
            <td style="width:8px;"></td>
            <td style="width:46px;height:56px;background:#F8FAFC;border:1.5px solid #CBD5E1;border-radius:14px;text-align:center;vertical-align:middle;font-family:'Courier New',Courier,monospace;font-size:26px;font-weight:800;color:#0F172A;box-shadow:0 2px 4px rgba(0,0,0,0.02);">${c[1] || ""}</td>
            <td style="width:8px;"></td>
            <td style="width:46px;height:56px;background:#F8FAFC;border:1.5px solid #CBD5E1;border-radius:14px;text-align:center;vertical-align:middle;font-family:'Courier New',Courier,monospace;font-size:26px;font-weight:800;color:#0F172A;box-shadow:0 2px 4px rgba(0,0,0,0.02);">${c[2] || ""}</td>
            
            <!-- Separator -->
            <td style="width:28px;text-align:center;vertical-align:middle;color:#94A3B8;font-size:22px;font-weight:800;">&ndash;</td>
            
            <!-- Segment 2 (Digits 4-6) -->
            <td style="width:46px;height:56px;background:#F8FAFC;border:1.5px solid #CBD5E1;border-radius:14px;text-align:center;vertical-align:middle;font-family:'Courier New',Courier,monospace;font-size:26px;font-weight:800;color:#0F172A;box-shadow:0 2px 4px rgba(0,0,0,0.02);">${c[3] || ""}</td>
            <td style="width:8px;"></td>
            <td style="width:46px;height:56px;background:#F8FAFC;border:1.5px solid #CBD5E1;border-radius:14px;text-align:center;vertical-align:middle;font-family:'Courier New',Courier,monospace;font-size:26px;font-weight:800;color:#0F172A;box-shadow:0 2px 4px rgba(0,0,0,0.02);">${c[4] || ""}</td>
            <td style="width:8px;"></td>
            <td style="width:46px;height:56px;background:#F8FAFC;border:1.5px solid #CBD5E1;border-radius:14px;text-align:center;vertical-align:middle;font-family:'Courier New',Courier,monospace;font-size:26px;font-weight:800;color:#0F172A;box-shadow:0 2px 4px rgba(0,0,0,0.02);">${c[5] || ""}</td>
          </tr>
        </table>

        <!-- Expiration Pill -->
        <div style="display:inline-block;background:#FEF2F2;border:1px solid #FECACA;border-radius:9999px;padding:6px 16px;">
          <span style="color:#DC2626;font-size:12px;font-weight:600;letter-spacing:0.3px;">Code expires in 5 minutes</span>
        </div>
      </div>

      <!-- Footer -->
      <div style="text-align:center;margin-top:32px;padding:0 16px;">
        <p style="color:#64748B;font-size:12px;line-height:1.6;margin:0 0 12px;">
          If the button above doesn't work, copy and paste this URL into your browser:<br/>
          <a href="${verifyUrl}" style="color:#004CFF;word-break:break-all;text-decoration:underline;">${verifyUrl}</a>
        </p>
        <p style="color:#64748B;font-size:12px;margin:0 0 20px;">
          <strong>On your mobile device?</strong> <a href="${appUrl}" style="color:#004CFF;text-decoration:none;font-weight:600;">Open directly in BexieMart app &rarr;</a>
        </p>
        <div style="height:1px;background:#E2E8F0;margin:24px auto;width:60px;"></div>
        <p style="color:#94A3B8;font-size:11px;margin:0;">
          © ${new Date().getFullYear()} BexieMart Technologies. All rights reserved.<br />
          Secure Hybrid Authentication System
        </p>
      </div>
    </div>
  </body>
  </html>`;
}
