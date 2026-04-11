import { getPublicSiteUrl } from "./site-url";

function layout(title: string, body: string): string {
  const site = getPublicSiteUrl();
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;background:#08080f;font-family:system-ui,-apple-system,sans-serif;color:#e8eaed;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:rgba(255,255,255,0.05);border-radius:16px;border:1px solid rgba(255,255,255,0.08);padding:32px;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#00bfff;">Page KillerCutz</p>
          <h1 style="margin:0 0 20px;font-size:22px;font-weight:600;color:#fff;">${title}</h1>
          ${body}
          <p style="margin:28px 0 0;font-size:12px;color:#9aa0a6;">If you didn&apos;t request this, you can ignore this email.<br/><a href="${site}" style="color:#00bfff;">${site}</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildAuthActionEmail(params: {
  action: string;
  confirmationUrl: string;
}): { subject: string; html: string } {
  const { action, confirmationUrl } = params;
  const cta = `<a href="${confirmationUrl}" style="display:inline-block;margin-top:8px;padding:14px 28px;background:linear-gradient(135deg,#8fd6ff,#00bfff);color:#000;font-weight:700;text-decoration:none;border-radius:8px;">Continue</a>`;

  switch (action) {
    case "signup":
      return {
        subject: "Confirm your Page KillerCutz account",
        html: layout(
          "Confirm your email",
          `<p style="margin:0 0 16px;line-height:1.6;color:#bcc8d1;">Thanks for signing up. Click below to verify your email and activate your account.</p>${cta}<p style="margin:20px 0 0;font-size:12px;word-break:break-all;color:#6b7280;">${confirmationUrl}</p>`,
        ),
      };
    case "recovery":
      return {
        subject: "Reset your Page KillerCutz password",
        html: layout(
          "Reset your password",
          `<p style="margin:0 0 16px;line-height:1.6;color:#bcc8d1;">We received a request to reset your password. Use the button below to choose a new one.</p>${cta}<p style="margin:20px 0 0;font-size:12px;word-break:break-all;color:#6b7280;">${confirmationUrl}</p>`,
        ),
      };
    case "magiclink":
      return {
        subject: "Your Page KillerCutz sign-in link",
        html: layout(
          "Sign in",
          `<p style="margin:0 0 16px;line-height:1.6;color:#bcc8d1;">Click below to sign in to your account.</p>${cta}`,
        ),
      };
    case "invite":
      return {
        subject: "You’re invited to Page KillerCutz",
        html: layout(
          "Accept your invite",
          `<p style="margin:0 0 16px;line-height:1.6;color:#bcc8d1;">You’ve been invited. Click below to get started.</p>${cta}`,
        ),
      };
    case "email_change":
      return {
        subject: "Confirm your new email — Page KillerCutz",
        html: layout(
          "Confirm email change",
          `<p style="margin:0 0 16px;line-height:1.6;color:#bcc8d1;">Confirm this address to complete your email update.</p>${cta}`,
        ),
      };
    default:
      return {
        subject: "Page KillerCutz — action required",
        html: layout(
          "Action required",
          `<p style="margin:0 0 16px;line-height:1.6;color:#bcc8d1;">Please complete this step for your account.</p>${cta}`,
        ),
      };
  }
}
