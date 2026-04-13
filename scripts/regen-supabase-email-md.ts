/**
 * Regenerates docs/SUPABASE_EMAIL_TEMPLATES.md from lib/notify/emailTemplates.ts
 * Run: npx tsx scripts/regen-supabase-email-md.ts
 */
import fs from "fs";
import * as ET from "../lib/notify/emailTemplates";

const c = ET.emailVerification("{{ .ConfirmationURL }}", "{{ .Email }}");
const r = ET.passwordReset("{{ .ConfirmationURL }}");
const m = ET.emailMagicLink("{{ .ConfirmationURL }}");

function fence(html: string) {
  return html.replace(/```/g, "``\u0060");
}

const md = `# Supabase Auth — Email template bodies

Paste these into **Supabase Dashboard → Authentication → Email Templates**. Keep \`{{ .ConfirmationURL }}\` (and \`{{ .Email }}\` where shown) exactly — Supabase replaces them at send time.

---

## Confirm signup

**Subject:** \`Verify your Page KillerCutz account\`

\`\`\`html
${fence(c)}
\`\`\`

---

## Reset password

**Subject:** \`Reset your Page KillerCutz password\`

\`\`\`html
${fence(r)}
\`\`\`

---

## Magic link

**Subject:** \`Your Page KillerCutz sign in link\`

\`\`\`html
${fence(m)}
\`\`\`

---

Regenerate with: \`npx tsx scripts/regen-supabase-email-md.ts\`
`;

fs.writeFileSync("docs/SUPABASE_EMAIL_TEMPLATES.md", md);
console.log("Wrote docs/SUPABASE_EMAIL_TEMPLATES.md");
