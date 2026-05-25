# AWS Sandbox Setup Guide for Sideline

You have an AWS Innovation Sandbox from the hackathon. This guide walks you through setting up everything using the AWS Console (the web dashboard you're already in).

**Your region: eu-north-1 (Stockholm)** — keep everything in this region.

**Your account:** 4416-8281-1990

---

## Step 1: Copy the Hackathon Data

1. Click **"CloudShell"** at the bottom-left of the AWS Console
2. Run these commands one at a time in the terminal that opens:

```bash
export CHALLENGE="Challenge 3 – A Real Time Social Match Experience"
```

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
```

```bash
aws s3 mb s3://hackathon-data-$ACCOUNT_ID --region eu-north-1
```

```bash
aws s3 cp "s3://aws-world-sports-innovation-cup-data/$CHALLENGE/" "s3://hackathon-data-$ACCOUNT_ID/$CHALLENGE/" --recursive
```

Wait for it to finish (a few minutes). This copies the challenge dataset to your account.

---

## Step 2: Create the PostgreSQL Database (RDS)

1. In the top search bar, type **RDS** and click it
2. Click the orange **"Create database"** button
3. Fill in these settings:

| Setting | Value |
|---------|-------|
| Creation method | Standard create |
| Engine | PostgreSQL |
| Engine version | Latest (16.x) |
| Templates | **Free tier** |
| DB instance identifier | `sideline-db` |
| Master username | `sideline_app` |
| Master password | Pick one, write it down! |
| Instance class | db.t3.micro |
| Storage | 20 GB (default) |
| Public access | **Yes** |
| Initial database name | `sideline` |

4. Click **"Create database"**
5. Wait 5-10 minutes until status shows **"Available"**

### Open the firewall (Security Group)

After the DB is available:
1. Click on `sideline-db` in the RDS list
2. Under "Connectivity & security", click the **security group** link (blue text)
3. Click **"Inbound rules"** tab → **"Edit inbound rules"**
4. Click **"Add rule"**:
   - Type: **PostgreSQL**
   - Source: **Anywhere-IPv4** (0.0.0.0/0)
5. Click **"Save rules"**

### Run the schema

1. Go back to RDS (search bar → RDS)
2. Left sidebar → **"Query Editor"** (or "Query Editor v2")
3. Connect to your database:
   - Instance: `sideline-db`
   - Username: `sideline_app`
   - Password: your password
   - Database name: `sideline`
4. Copy-paste the entire contents of `server/db/schema-rds.sql` into the editor
5. Click **"Run"** — you should see "Query successful" for each table

---

## Step 3: Create Cognito User Pool (Auth)

1. Search **"Cognito"** in the top bar, click it
2. Click **"Create user pool"**
3. Walk through the wizard:

**Sign-in experience:**
- Sign-in options: ✅ Email
- Click Next

**Security requirements:**
- Password policy: Custom → minimum 6 characters, uncheck uppercase/number/symbol requirements
- MFA: No MFA
- Click Next

**Sign-up experience:**
- Self-registration: Enabled
- Required attributes: email (should be pre-selected)
- Click Next

**Message delivery:**
- Email provider: Send email with Cognito
- Click Next

**App integration:**
- User pool name: `sideline-users`
- App client name: `sideline-web`
- Client secret: **Don't generate a client secret** ← important!
- Click Next

**Review → Create user pool**

### Copy your credentials

After creation:
- **User Pool ID** — shown at the top of the pool page (e.g. `eu-north-1_AbCdEfGh`)
- **Client ID** — go to "App integration" tab → scroll down to "App clients and analytics" → copy the Client ID

---

## Step 4: Create S3 Bucket for Avatars (Optional)

1. Search **"S3"** in the top bar
2. Click **"Create bucket"**
3. Settings:
   - Bucket name: `sideline-avatars-4416-8281-1990` (use your account ID to make it unique)
   - Region: eu-north-1
   - Uncheck "Block all public access"
   - Check the acknowledgment box
4. Click **"Create bucket"**

Skip this step if you want — avatars will store as data URLs in the database instead (works fine for the hackathon).

---

## Step 5: Fill in Your .env Files

### server/.env

Copy `server/.env.example` to `server/.env` and fill in:

```dotenv
PORT=4000
CORS_ORIGIN=http://localhost:5173

# AWS Cognito
COGNITO_USER_POOL_ID=eu-north-1_XXXXXXXX
COGNITO_CLIENT_ID=your_app_client_id
COGNITO_TOKEN_USE=id

# AI / live data
GEMINI_API_KEY=your_gemini_key
API_FOOTBALL_API_KEY=eb593083269728fadc3ce020593342c0
API_FOOTBALL_HOST=v3.football.api-sports.io

# RDS PostgreSQL
DB_HOST=sideline-db.xxxxxx.eu-north-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=sideline
DB_USER=sideline_app
DB_PASSWORD=your_password_here

# Optional
HCTI_USER_ID=
HCTI_API_KEY=
AWS_REGION=eu-north-1
S3_BUCKET=sideline-avatars-4416-8281-1990
```

### client/.env

Copy `client/.env.example` to `client/.env` and fill in:

```dotenv
VITE_API_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
VITE_COGNITO_USER_POOL_ID=eu-north-1_XXXXXXXX
VITE_COGNITO_CLIENT_ID=your_app_client_id
```

---

## Step 6: Start the App

```bash
# Terminal 1 — server
cd server
npm run dev

# Terminal 2 — client  
cd client
npm run dev
```

You should see in the server terminal:
```
[postgres] connected to sideline-db.xxxxxx.eu-north-1.rds.amazonaws.com
[db] running in "postgres" mode
```

If you see `[db] running in "memory" mode`, double-check DB_HOST and DB_PASSWORD in your .env.

---

## How the Database Modes Work

| Priority | When | Mode |
|----------|------|------|
| 1st | `DB_HOST` + `DB_PASSWORD` are set | **postgres** (RDS) — data persists! |
| 2nd | Nothing set | **memory** — data lost on restart |

---

## Budget Tips

- **RDS db.t3.micro** costs ~$0.02/hour. If you're not using it, you can stop the instance (RDS → select instance → Actions → Stop). Data is preserved.
- **Cognito** is free for up to 50,000 users.
- **S3** is pennies for avatar storage.
- Check your spend in the Sandbox Dashboard (not the AWS Console — go back to https://slalom-hackathon.awsapps.com/start).

---

## Where to Find Your Credentials

| What | Where to find it |
|------|-----------------|
| RDS Endpoint | RDS → Databases → sideline-db → Connectivity & security → Endpoint |
| RDS Password | Whatever you typed when creating the DB |
| Cognito User Pool ID | Cognito → User pools → sideline-users → top of page |
| Cognito Client ID | Cognito → sideline-users → App integration → App clients |
| AWS Account ID | Top-right corner of console (4416-8281-1990) |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Can't connect to RDS from local machine | Security group needs PostgreSQL rule with source 0.0.0.0/0 |
| "password authentication failed" | DB_PASSWORD in .env doesn't match what you set in RDS |
| RDS Query Editor won't connect | Make sure you're selecting the right database name (`sideline`) |
| Cognito sign-up fails | Make sure app client has NO client secret |
| "No module named..." in CloudShell | Just run the commands exactly as shown, one at a time |
| Account frozen | You hit your budget limit — check Sandbox Dashboard |
