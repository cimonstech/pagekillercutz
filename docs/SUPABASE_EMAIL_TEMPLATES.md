# Supabase Auth — Email template bodies

Paste these into **Supabase Dashboard → Authentication → Email Templates**. Keep `{{ .ConfirmationURL }}` (and `{{ .Email }}` where shown) exactly — Supabase replaces them at send time.

---

## Confirm signup

**Subject:** `Verify your Page KillerCutz account`

```html

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Page KillerCutz</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #080810;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      background: #080810;
      padding: 40px 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      padding-bottom: 32px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      margin-bottom: 32px;
    }
    .brand {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.15em;
      color: #ffffff;
      text-transform: uppercase;
    }
    .brand span {
      color: #00BFFF;
    }
    .card {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 16px;
    }
    .card-cyan {
      border-left: 3px solid #00BFFF;
    }
    .card-gold {
      border-left: 3px solid #F5A623;
    }
    .card-red {
      border-left: 3px solid #FF4560;
    }
    h1 {
      font-size: 28px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.02em;
      line-height: 1.2;
      margin-bottom: 8px;
    }
    h2 {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 12px;
    }
    p {
      font-size: 14px;
      color: #A0A8C0;
      line-height: 1.7;
      margin-bottom: 16px;
    }
    .label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #5A6080;
      margin-bottom: 4px;
      font-family: 'Courier New', monospace;
    }
    .value {
      font-size: 14px;
      color: #ffffff;
    }
    .event-id {
      font-family: 'Courier New', monospace;
      font-size: 22px;
      font-weight: 700;
      color: #00BFFF;
      letter-spacing: 0.05em;
    }
    .detail-row {
      display: flex;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.10em;
      text-transform: uppercase;
      color: #5A6080;
      width: 120px;
      flex-shrink: 0;
      font-family: 'Courier New', monospace;
      padding-top: 2px;
    }
    .detail-value {
      font-size: 14px;
      color: #ffffff;
      flex: 1;
    }
    .btn {
      display: inline-block;
      background: #00BFFF;
      color: #000000 !important;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 999px;
      margin-top: 8px;
    }
    .btn-outline {
      display: inline-block;
      background: transparent;
      color: #00BFFF !important;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 999px;
      border: 1px solid #00BFFF;
      margin-top: 8px;
    }
    .btn-gold {
      background: #F5A623;
      color: #000000 !important;
    }
    .momo-number {
      font-family: 'Courier New', monospace;
      font-size: 18px;
      color: #00BFFF;
      font-weight: 700;
      letter-spacing: 0.05em;
    }
    .divider {
      border: none;
      border-top: 1px solid rgba(255,255,255,0.06);
      margin: 24px 0;
    }
    .footer {
      text-align: center;
      padding-top: 32px;
      border-top: 1px solid rgba(255,255,255,0.06);
      margin-top: 32px;
    }
    .footer p {
      font-size: 11px;
      color: #5A6080;
      line-height: 1.6;
    }
    .footer a {
      color: #5A6080;
      text-decoration: none;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.10em;
      text-transform: uppercase;
      font-family: 'Courier New', monospace;
    }
    .badge-cyan {
      background: rgba(0,191,255,0.12);
      border: 1px solid rgba(0,191,255,0.30);
      color: #00BFFF;
    }
    .badge-gold {
      background: rgba(245,166,35,0.12);
      border: 1px solid rgba(245,166,35,0.30);
      color: #F5A623;
    }
    .badge-green {
      background: rgba(34,197,94,0.12);
      border: 1px solid rgba(34,197,94,0.30);
      color: #22c55e;
    }
    .checklist-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 6px 0;
    }
    .check-icon {
      color: #00BFFF;
      font-size: 14px;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .check-text {
      font-size: 13px;
      color: #A0A8C0;
    }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;overflow:hidden;color:#080810;">Verify your Page KillerCutz account</div>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div style="margin-bottom:12px">
          <div style="
            display:inline-block;
            width:44px;height:44px;
            background:rgba(0,191,255,0.10);
            border:1px solid rgba(0,191,255,0.25);
            border-radius:12px;
          "></div>
        </div>
        <div class="brand">
          PAGE <span>KILLER</span>CUTZ
        </div>
      </div>
      
    <div class="card">
      <p class="label">Account Verification</p>
      <h1>Verify Your Email</h1>
      <p>
        Hi {{ .Email }},
        welcome to Page KillerCutz.
        Click the button below to verify your
        email address and activate your account.
      </p>
      <p>
        Once verified, you can log in to your
        Playlist Portal and start curating
        your event music.
      </p>
      <div style="text-align:center;margin-top:24px;">
        <a href="{{ .ConfirmationURL }}" class="btn">
          Verify Email Address →
        </a>
      </div>
      <hr class="divider">
      <p style="font-size:12px;color:#5A6080;
        text-align:center;">
        This link expires in 24 hours.<br>
        If you didn't create this account,
        you can safely ignore this email.
      </p>
    </div>
    
      <div class="footer">
        <p>
          Page KillerCutz · Accra, Ghana<br>
          <a href="https://pagekillercutz.com">
            pagekillercutz.com
          </a>
          &nbsp;·&nbsp;
          <a href="https://pagekillercutz.com/contact">
            Contact
          </a>
        </p>
        <p style="margin-top:8px;">
          You received this email because you
          have a booking or account with
          Page KillerCutz.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
```

---

## Reset password

**Subject:** `Reset your Page KillerCutz password`

```html

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Page KillerCutz</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #080810;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      background: #080810;
      padding: 40px 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      padding-bottom: 32px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      margin-bottom: 32px;
    }
    .brand {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.15em;
      color: #ffffff;
      text-transform: uppercase;
    }
    .brand span {
      color: #00BFFF;
    }
    .card {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 16px;
    }
    .card-cyan {
      border-left: 3px solid #00BFFF;
    }
    .card-gold {
      border-left: 3px solid #F5A623;
    }
    .card-red {
      border-left: 3px solid #FF4560;
    }
    h1 {
      font-size: 28px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.02em;
      line-height: 1.2;
      margin-bottom: 8px;
    }
    h2 {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 12px;
    }
    p {
      font-size: 14px;
      color: #A0A8C0;
      line-height: 1.7;
      margin-bottom: 16px;
    }
    .label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #5A6080;
      margin-bottom: 4px;
      font-family: 'Courier New', monospace;
    }
    .value {
      font-size: 14px;
      color: #ffffff;
    }
    .event-id {
      font-family: 'Courier New', monospace;
      font-size: 22px;
      font-weight: 700;
      color: #00BFFF;
      letter-spacing: 0.05em;
    }
    .detail-row {
      display: flex;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.10em;
      text-transform: uppercase;
      color: #5A6080;
      width: 120px;
      flex-shrink: 0;
      font-family: 'Courier New', monospace;
      padding-top: 2px;
    }
    .detail-value {
      font-size: 14px;
      color: #ffffff;
      flex: 1;
    }
    .btn {
      display: inline-block;
      background: #00BFFF;
      color: #000000 !important;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 999px;
      margin-top: 8px;
    }
    .btn-outline {
      display: inline-block;
      background: transparent;
      color: #00BFFF !important;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 999px;
      border: 1px solid #00BFFF;
      margin-top: 8px;
    }
    .btn-gold {
      background: #F5A623;
      color: #000000 !important;
    }
    .momo-number {
      font-family: 'Courier New', monospace;
      font-size: 18px;
      color: #00BFFF;
      font-weight: 700;
      letter-spacing: 0.05em;
    }
    .divider {
      border: none;
      border-top: 1px solid rgba(255,255,255,0.06);
      margin: 24px 0;
    }
    .footer {
      text-align: center;
      padding-top: 32px;
      border-top: 1px solid rgba(255,255,255,0.06);
      margin-top: 32px;
    }
    .footer p {
      font-size: 11px;
      color: #5A6080;
      line-height: 1.6;
    }
    .footer a {
      color: #5A6080;
      text-decoration: none;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.10em;
      text-transform: uppercase;
      font-family: 'Courier New', monospace;
    }
    .badge-cyan {
      background: rgba(0,191,255,0.12);
      border: 1px solid rgba(0,191,255,0.30);
      color: #00BFFF;
    }
    .badge-gold {
      background: rgba(245,166,35,0.12);
      border: 1px solid rgba(245,166,35,0.30);
      color: #F5A623;
    }
    .badge-green {
      background: rgba(34,197,94,0.12);
      border: 1px solid rgba(34,197,94,0.30);
      color: #22c55e;
    }
    .checklist-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 6px 0;
    }
    .check-icon {
      color: #00BFFF;
      font-size: 14px;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .check-text {
      font-size: 13px;
      color: #A0A8C0;
    }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;overflow:hidden;color:#080810;">Reset your Page KillerCutz password</div>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div style="margin-bottom:12px">
          <div style="
            display:inline-block;
            width:44px;height:44px;
            background:rgba(0,191,255,0.10);
            border:1px solid rgba(0,191,255,0.25);
            border-radius:12px;
          "></div>
        </div>
        <div class="brand">
          PAGE <span>KILLER</span>CUTZ
        </div>
      </div>
      
    <div class="card">
      <p class="label">Password Reset</p>
      <h1>Reset Your Password</h1>
      <p>
        Hi there,
        we received a request to reset your
        Page KillerCutz password.
        Click the button below to set a
        new password.
      </p>
      <div style="text-align:center;margin-top:24px;">
        <a href="{{ .ConfirmationURL }}" class="btn">
          Reset Password →
        </a>
      </div>
      <hr class="divider">
      <p style="font-size:12px;color:#5A6080;
        text-align:center;">
        This link expires in 1 hour.<br>
        If you didn't request a password reset,
        you can safely ignore this email.<br>
        Your password will not be changed.
      </p>
    </div>
    
      <div class="footer">
        <p>
          Page KillerCutz · Accra, Ghana<br>
          <a href="https://pagekillercutz.com">
            pagekillercutz.com
          </a>
          &nbsp;·&nbsp;
          <a href="https://pagekillercutz.com/contact">
            Contact
          </a>
        </p>
        <p style="margin-top:8px;">
          You received this email because you
          have a booking or account with
          Page KillerCutz.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
```

---

## Magic link

**Subject:** `Your Page KillerCutz sign in link`

```html

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Page KillerCutz</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #080810;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      background: #080810;
      padding: 40px 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      padding-bottom: 32px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      margin-bottom: 32px;
    }
    .brand {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.15em;
      color: #ffffff;
      text-transform: uppercase;
    }
    .brand span {
      color: #00BFFF;
    }
    .card {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 16px;
    }
    .card-cyan {
      border-left: 3px solid #00BFFF;
    }
    .card-gold {
      border-left: 3px solid #F5A623;
    }
    .card-red {
      border-left: 3px solid #FF4560;
    }
    h1 {
      font-size: 28px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.02em;
      line-height: 1.2;
      margin-bottom: 8px;
    }
    h2 {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 12px;
    }
    p {
      font-size: 14px;
      color: #A0A8C0;
      line-height: 1.7;
      margin-bottom: 16px;
    }
    .label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #5A6080;
      margin-bottom: 4px;
      font-family: 'Courier New', monospace;
    }
    .value {
      font-size: 14px;
      color: #ffffff;
    }
    .event-id {
      font-family: 'Courier New', monospace;
      font-size: 22px;
      font-weight: 700;
      color: #00BFFF;
      letter-spacing: 0.05em;
    }
    .detail-row {
      display: flex;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.10em;
      text-transform: uppercase;
      color: #5A6080;
      width: 120px;
      flex-shrink: 0;
      font-family: 'Courier New', monospace;
      padding-top: 2px;
    }
    .detail-value {
      font-size: 14px;
      color: #ffffff;
      flex: 1;
    }
    .btn {
      display: inline-block;
      background: #00BFFF;
      color: #000000 !important;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 999px;
      margin-top: 8px;
    }
    .btn-outline {
      display: inline-block;
      background: transparent;
      color: #00BFFF !important;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 999px;
      border: 1px solid #00BFFF;
      margin-top: 8px;
    }
    .btn-gold {
      background: #F5A623;
      color: #000000 !important;
    }
    .momo-number {
      font-family: 'Courier New', monospace;
      font-size: 18px;
      color: #00BFFF;
      font-weight: 700;
      letter-spacing: 0.05em;
    }
    .divider {
      border: none;
      border-top: 1px solid rgba(255,255,255,0.06);
      margin: 24px 0;
    }
    .footer {
      text-align: center;
      padding-top: 32px;
      border-top: 1px solid rgba(255,255,255,0.06);
      margin-top: 32px;
    }
    .footer p {
      font-size: 11px;
      color: #5A6080;
      line-height: 1.6;
    }
    .footer a {
      color: #5A6080;
      text-decoration: none;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.10em;
      text-transform: uppercase;
      font-family: 'Courier New', monospace;
    }
    .badge-cyan {
      background: rgba(0,191,255,0.12);
      border: 1px solid rgba(0,191,255,0.30);
      color: #00BFFF;
    }
    .badge-gold {
      background: rgba(245,166,35,0.12);
      border: 1px solid rgba(245,166,35,0.30);
      color: #F5A623;
    }
    .badge-green {
      background: rgba(34,197,94,0.12);
      border: 1px solid rgba(34,197,94,0.30);
      color: #22c55e;
    }
    .checklist-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 6px 0;
    }
    .check-icon {
      color: #00BFFF;
      font-size: 14px;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .check-text {
      font-size: 13px;
      color: #A0A8C0;
    }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;overflow:hidden;color:#080810;">Your Page KillerCutz sign in link</div>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div style="margin-bottom:12px">
          <div style="
            display:inline-block;
            width:44px;height:44px;
            background:rgba(0,191,255,0.10);
            border:1px solid rgba(0,191,255,0.25);
            border-radius:12px;
          "></div>
        </div>
        <div class="brand">
          PAGE <span>KILLER</span>CUTZ
        </div>
      </div>
      
    <div class="card">
      <p class="label">Sign In</p>
      <h1>Your Sign-In Link</h1>
      <p>
        Hi there,
        click the button below to sign in to your Page KillerCutz account.
      </p>
      <div style="text-align:center;margin-top:24px;">
        <a href="{{ .ConfirmationURL }}" class="btn">
          Sign In →
        </a>
      </div>
      <hr class="divider">
      <p style="font-size:12px;color:#5A6080;
        text-align:center;">
        This link expires soon.<br>
        If you didn't request this email, you can safely ignore it.
      </p>
    </div>
    
      <div class="footer">
        <p>
          Page KillerCutz · Accra, Ghana<br>
          <a href="https://pagekillercutz.com">
            pagekillercutz.com
          </a>
          &nbsp;·&nbsp;
          <a href="https://pagekillercutz.com/contact">
            Contact
          </a>
        </p>
        <p style="margin-top:8px;">
          You received this email because you
          have a booking or account with
          Page KillerCutz.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
```

---

Regenerate with: `npx tsx scripts/regen-supabase-email-md.ts`
