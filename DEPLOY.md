# Sideline — Deployment Guide

Deploy the app so you and your partner can use it from anywhere. Uses your existing AWS sandbox (eu-north-1).

---

## Architecture

```
[Phone/Laptop] → [EC2 Instance] → [RDS PostgreSQL]
                       ↕
                  [Cognito Auth]
```

- **EC2** runs both the Node server (port 4000) and serves the built client (static files)
- **RDS** is already set up and running
- **Cognito** is already configured

---

## Step 1: Launch an EC2 Instance

1. Go to **AWS Console → EC2 → Launch Instance**
2. Settings:

| Setting | Value |
|---------|-------|
| Name | `sideline-app` |
| AMI | Amazon Linux 2023 |
| Instance type | `t3.small` (or `t3.micro` for free tier) |
| Key pair | Create new → `sideline-key` → Download `.pem` file |
| Network | Allow SSH, HTTP, HTTPS from anywhere |
| Security group | Create new with these inbound rules: |

**Inbound rules for the security group:**

| Type | Port | Source |
|------|------|--------|
| SSH | 22 | My IP |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |
| Custom TCP | 4000 | 0.0.0.0/0 |

3. Click **Launch Instance**
4. Wait until status is "Running"
5. Copy the **Public IPv4 address** (e.g., `13.48.xxx.xxx`)

---

## Step 2: Connect to EC2

```bash
# On your laptop (Git Bash, Terminal, or PowerShell)
chmod 400 sideline-key.pem
ssh -i sideline-key.pem ec2-user@<YOUR_EC2_IP>
```

---

## Step 3: Install Node.js and Clone

Run these on the EC2 instance:

```bash
# Install Node 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs git

# Verify
node --version  # Should be v20.x
npm --version

# Clone your repo
git clone https://github.com/amna0x/sideline.git
cd sideline
```

---

## Step 4: Install Dependencies

```bash
cd ~/sideline/server
npm install

cd ~/sideline/client
npm install
```

---

## Step 5: Configure Environment

```bash
# Server .env
cat > ~/sideline/server/.env << 'EOF'
PORT=4000
CORS_ORIGIN=http://<YOUR_EC2_IP>:4000
NODE_ENV=production

# AWS Cognito
COGNITO_USER_POOL_ID=eu-north-1_OIzHNyguT
COGNITO_CLIENT_ID=439h5apul898inloupl6pm0jsh
COGNITO_TOKEN_USE=id

# RDS PostgreSQL
DB_HOST=sideline-db.cticy0mc4izt.eu-north-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=sideline
DB_USER=sideline_app
DB_PASSWORD=<YOUR_DB_PASSWORD>

# API keys
GEMINI_API_KEY=<YOUR_GEMINI_KEY>
API_FOOTBALL_API_KEY=<YOUR_API_FOOTBALL_KEY>
API_FOOTBALL_HOST=v3.football.api-sports.io

AWS_REGION=eu-north-1
EOF
```

```bash
# Client .env (for build)
cat > ~/sideline/client/.env << 'EOF'
VITE_API_URL=http://<YOUR_EC2_IP>:4000
VITE_SOCKET_URL=http://<YOUR_EC2_IP>:4000
VITE_COGNITO_USER_POOL_ID=eu-north-1_OIzHNyguT
VITE_COGNITO_CLIENT_ID=439h5apul898inloupl6pm0jsh
EOF
```

Replace `<YOUR_EC2_IP>` with your actual EC2 public IP in both files.

---

## Step 6: Build the Client

```bash
cd ~/sideline/client
npm run build
```

This creates `client/dist/` with the production bundle.

---

## Step 7: Serve Client from Express

Add static file serving to the server. Create this file:

```bash
cat > ~/sideline/server/static.js << 'EOF'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const clientDist = path.join(__dirname, '..', 'client', 'dist')

export function serveClient(app) {
  app.use(express.static(clientDist))
  // SPA fallback — serve index.html for all non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next()
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}
EOF
```

Then edit `~/sideline/server/index.js` — add these two lines:

```javascript
// After: const app = createApp()
import { serveClient } from './static.js'
serveClient(app)
```

Or just add them manually:
```bash
# Quick edit
nano ~/sideline/server/index.js
```

Add `import { serveClient } from './static.js'` at the top with other imports, and `serveClient(app)` after `const app = createApp()`.

---

## Step 8: Run with PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the server
cd ~/sideline/server
pm2 start index.js --name sideline

# Auto-restart on reboot
pm2 startup
pm2 save

# View logs
pm2 logs sideline
```

---

## Step 9: Test It

Open in your browser:
```
http://<YOUR_EC2_IP>:4000
```

You should see the Sideline app. Log in with your Cognito account. Share this URL with your partner.

---

## Step 10: Update Cognito Callback (if needed)

If login redirects fail, update the Cognito app client:
1. Go to **Cognito → sideline-users → App integration → sideline-web**
2. Under "Hosted UI", add your EC2 URL to:
   - Allowed callback URLs: `http://<YOUR_EC2_IP>:4000/login`
   - Allowed sign-out URLs: `http://<YOUR_EC2_IP>:4000/login`

---

## Updating the App

When you push new code:

```bash
ssh -i sideline-key.pem ec2-user@<YOUR_EC2_IP>
cd ~/sideline
git pull
cd client && npm run build && cd ..
cd server && npm install && cd ..
pm2 restart sideline
```

---

## Optional: Custom Domain + HTTPS

If you want `https://app.sideline.com` instead of a raw IP:

1. **Get a domain** (Route 53, Namecheap, etc.)
2. **Point DNS** A record to your EC2 IP
3. **Install Caddy** (auto-HTTPS):
```bash
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://copr.fedorainfracloud.org/coprs/caddy/caddy/repo/epel-8/caddy-caddy-epel-8.repo
sudo yum install -y caddy

# Caddyfile
cat > /etc/caddy/Caddyfile << 'EOF'
app.sideline.com {
  reverse_proxy localhost:4000
}
EOF

sudo systemctl enable caddy
sudo systemctl start caddy
```

Then update:
- `CORS_ORIGIN=https://app.sideline.com` in server `.env`
- `VITE_API_URL=https://app.sideline.com` in client `.env`
- Rebuild client: `cd client && npm run build`
- Restart: `pm2 restart sideline`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Can't connect to EC2 | Check security group allows your IP on port 22 |
| App loads but API fails | Check `CORS_ORIGIN` matches the URL you're visiting |
| Login doesn't work | Verify Cognito env vars match your pool |
| DB connection fails | EC2 security group must allow outbound to RDS (or RDS SG allows EC2 IP) |
| Socket disconnects | Ensure port 4000 is open in EC2 security group |
| PM2 not starting on reboot | Run `pm2 startup` and follow the printed command |

---

## Cost Estimate (AWS Sandbox)

| Service | Cost |
|---------|------|
| EC2 t3.micro | Free tier (750 hrs/month) |
| EC2 t3.small | ~$0.02/hr (~$15/month) |
| RDS (already running) | ~$0.02/hr |
| Cognito | Free (< 50k users) |
| Data transfer | Negligible for 2 users |

**Total for hackathon:** Essentially free if using t3.micro.
