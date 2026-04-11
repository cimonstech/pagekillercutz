# Supabase Setup Guide

## 1. Run the database schema
Go to Supabase Dashboard -> SQL Editor.
Copy the contents of `supabase/schema.sql`.
Run it.

## 2. Create Storage Buckets
Go to Supabase Dashboard -> Storage -> New Bucket.

Create these buckets:

Bucket: `music-audio`
- Public: NO (private - use signed URLs)
- File size limit: 500MB
- Allowed MIME types: audio/mpeg, audio/wav, audio/flac

Bucket: `music-covers`
- Public: YES
- File size limit: 5MB
- Allowed MIME types: image/jpeg, image/png, image/webp

Bucket: `event-media`
- Public: YES
- File size limit: 50MB
- Allowed MIME types: image/jpeg, image/png, image/webp, video/mp4, video/quicktime

Bucket: `merch-images`
- Public: YES
- File size limit: 5MB
- Allowed MIME types: image/jpeg, image/png, image/webp

Bucket: `scratch-videos`
- Public: YES
- File size limit: 2000MB
- Allowed MIME types: video/mp4, video/quicktime

## 3. Storage RLS Policies
For each public bucket, add:
- Name: Public read access
- Operation: SELECT
- Target roles: anon, authenticated
- Policy: true

For service role write access on all buckets:
- Name: Service role write
- Operation: INSERT, UPDATE, DELETE
- Target roles: service_role
- Policy: true

## 4. Supabase Auth settings
Go to Authentication -> Settings:
- Site URL: `https://pagekillercutz.com`
- Redirect URLs:
  - `https://pagekillercutz.com/verify-email?status=verified`
  - `https://pagekillercutz.com/reset-password?step=3`
  - `http://localhost:3000/verify-email?status=verified`
  - `http://localhost:3000/reset-password?step=3`

Email templates -> Confirm signup:
- Subject: Verify your Page KillerCutz account
- Customize the body to match the brand

## 5. Create the first Super Admin
After running the schema, manually insert the first super admin record:

```sql
INSERT INTO admins (email, role, status)
VALUES ('your@email.com', 'super_admin', 'active');
```

Then sign up with that email via the app to create the Supabase Auth account.
