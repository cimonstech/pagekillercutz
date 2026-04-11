# Page KillerCutz - VPS Setup Guide
## Hostinger VPS (Ubuntu)

### 1. Initial server setup
Connect to the VPS via SSH:
`ssh root@your-vps-ip`

Update system:
`sudo apt update && sudo apt upgrade -y`

Install Node.js 20.x:
`curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -`
`sudo apt install -y nodejs`

Verify:
`node -v`  # Should be 20.x
`npm -v`

Install PM2 globally:
`npm install -g pm2`

Install Nginx:
`sudo apt install -y nginx`

Install Certbot for SSL:
`sudo apt install -y certbot python3-certbot-nginx`

### 2. Clone the project
`mkdir -p /var/www`
`cd /var/www`
`git clone https://github.com/your-username/killercutz.git killercutz`
`cd killercutz`

### 3. Set up environment variables
`cp .env.production.example .env.local`
`nano .env.local`

Fill in all real values.

### 4. Install and build
`npm ci`
`npm run build`

### 5. Set up PM2
`pm2 start ecosystem.config.js --env production`
`pm2 save`
`pm2 startup`

Run the command that PM2 outputs.

### 6. Configure Nginx
`sudo cp nginx/killercutz.conf /etc/nginx/sites-available/killercutz`
`sudo ln -s /etc/nginx/sites-available/killercutz /etc/nginx/sites-enabled/`
`sudo nginx -t`
`sudo systemctl reload nginx`

### 7. Set up SSL with Certbot
`sudo certbot --nginx -d pagekillercutz.com -d www.pagekillercutz.com`
`sudo systemctl reload nginx`

### 8. Verify everything is running
`pm2 status`
`pm2 logs killercutz --lines 50`
`curl http://localhost:3000`

### Useful PM2 commands
`pm2 logs killercutz`          # Live logs
`pm2 restart killercutz`       # Restart app
`pm2 stop killercutz`          # Stop app
`pm2 monit`                    # Real-time monitor
`pm2 logs killercutz --err`    # Error logs only

### Deployment (after first setup)
`cd /var/www/killercutz`
`bash scripts/deploy.sh`
