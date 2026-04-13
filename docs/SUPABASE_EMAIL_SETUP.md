# Supabase Email Setup — Page KillerCutz

## Custom SMTP via Resend

Go to: **Supabase Dashboard → Project Settings → Authentication → SMTP Settings**

Fill in:

| Field | Value |
|--------|--------|
| **Enable Custom SMTP** | ON |
| **Host** | `smtp.resend.com` |
| **Port** | `465` |
| **Username** | `resend` |
| **Password** | Your `RESEND_API_KEY` from `.env.local` (same key used by the app’s Resend SDK) |
| **Sender email** | `noreply@pagekillercutz.com` |
| **Sender name** | `Page KillerCutz` |

Click **Save**.

### Test SMTP

1. Go to **Authentication → Users**.
2. Open a user → use **Send magic link** or trigger a flow that sends mail.
3. Confirm delivery (inbox or Resend dashboard).

---

## Auth email templates (dashboard)

Go to: **Supabase Dashboard → Authentication → Email Templates**

Update each template’s **subject** and **body** as documented in:

- [`SUPABASE_EMAIL_TEMPLATES.md`](./SUPABASE_EMAIL_TEMPLATES.md)

That file contains ready-to-paste HTML for:

- **Confirm signup**
- **Reset password**
- **Magic link** (if enabled)

**Important:** Do not change Supabase’s template variables (e.g. `{{ .ConfirmationURL }}`). They are replaced when the email is sent.

To regenerate `SUPABASE_EMAIL_TEMPLATES.md` after editing `lib/notify/emailTemplates.ts`:

```bash
npx tsx scripts/regen-supabase-email-md.ts
```

---

## Application emails (Resend API)

Transactional emails sent from Next.js (`lib/notify/email.ts`) use the same **Resend** API key. Branded HTML lives in **`lib/notify/emailTemplates.ts`**. Dispatch and API routes import those templates — keep them in sync with product copy.
