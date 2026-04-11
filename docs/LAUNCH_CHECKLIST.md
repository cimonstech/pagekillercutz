# Page KillerCutz Launch Checklist

## Before deploying

### Code
- [ ] `npm run build` passes with zero errors
- [ ] All TypeScript errors resolved
- [ ] No console.log with sensitive data
- [ ] All API routes return proper error responses
- [ ] Middleware protects `/admin` and `/client` routes
- [ ] `.env.local` and `.env.production` not in git

### Supabase
- [ ] `schema.sql` run in SQL Editor
- [ ] All 5 storage buckets created
- [ ] RLS policies applied to all tables
- [ ] Auth redirect URLs configured
- [ ] First super admin record inserted
- [ ] Supabase URL and keys in `.env.local`

### Integrations
- [ ] Fish Africa API key obtained and tested
- [ ] Resend API key obtained and domain verified
- [ ] `POST /api/notify/test` returns success for SMS
- [ ] `POST /api/notify/test` returns success for email
- [ ] DJ phone number correct in env vars
- [ ] DJ email correct in env vars

### VPS
- [ ] Node.js 20.x installed
- [ ] PM2 installed globally
- [ ] Nginx installed and configured
- [ ] SSL certificate obtained via Certbot
- [ ] `.env.local` filled with production values
- [ ] `npm run build` runs successfully on VPS
- [ ] PM2 starts app and shows online status
- [ ] `pm2 startup` command run and saved
- [ ] Nginx config passes `nginx -t` check

### DNS
- [ ] A record for pagekillercutz.com -> VPS IP
- [ ] A record for www.pagekillercutz.com -> VPS IP
- [ ] DNS propagated (check with `nslookup`)

### Testing
- [ ] Homepage loads at https://pagekillercutz.com
- [ ] Booking form submits and creates real record
- [ ] Confirmation SMS received on DJ phone
- [ ] Confirmation email received in DJ inbox
- [ ] Client receives confirmation SMS and email
- [ ] Playlist portal login works
- [ ] Playlist saves to Supabase
- [ ] Merch store loads products from Supabase
- [ ] Admin dashboard loads real data
- [ ] Admin can lock a playlist
- [ ] Playlist lock SMS/email fires correctly
- [ ] Order tracking works with real order number
- [ ] 404 page shows on invalid routes
- [ ] Maintenance page can be toggled from admin

## After deploying
- [ ] Set up a simple uptime monitor (UptimeRobot free tier works well)
- [ ] Monitor `https://pagekillercutz.com`
- [ ] Alert DJ email when site goes down
- [ ] Set a reminder to renew SSL (Certbot auto-renews but verify it is set up)
- [ ] Back up `.env.local` to a secure password manager
- [ ] Document VPS SSH credentials securely
