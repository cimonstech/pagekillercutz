import * as ET from "@/lib/notify/emailTemplates";

export function buildAuthActionEmail(params: {
  action: string;
  confirmationUrl: string;
}): { subject: string; html: string } {
  const { action, confirmationUrl } = params;

  switch (action) {
    case "signup":
      return {
        subject: "Verify your Page KillerCutz account",
        html: ET.emailVerification(confirmationUrl),
      };
    case "recovery":
      return {
        subject: "Reset your Page KillerCutz password",
        html: ET.passwordReset(confirmationUrl),
      };
    case "magiclink":
      return {
        subject: "Your Page KillerCutz sign in link",
        html: ET.emailMagicLink(confirmationUrl),
      };
    case "invite":
      return {
        subject: "You're invited to Page KillerCutz",
        html: ET.emailVerification(confirmationUrl),
      };
    case "email_change":
      return {
        subject: "Confirm your new email — Page KillerCutz",
        html: ET.emailVerification(confirmationUrl),
      };
    default:
      return {
        subject: "Page KillerCutz — action required",
        html: ET.emailMagicLink(confirmationUrl),
      };
  }
}
