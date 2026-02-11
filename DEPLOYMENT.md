# VibeCart Production Deployment Guide

This guide covers deploying VibeCart to production environments. Follow each section carefully to ensure a secure and reliable deployment.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Variables Setup](#environment-variables-setup)
3. [Supabase Production Setup](#supabase-production-setup)
4. [Meta Developer App Setup](#meta-developer-app-setup)
5. [Twilio SMS Setup](#twilio-sms-setup)
6. [Docker Build Instructions](#docker-build-instructions)
7. [Deployment Platform Options](#deployment-platform-options)
8. [Post-Deployment Verification](#post-deployment-verification)

---

## Pre-Deployment Checklist

### Code Quality

- [ ] All TypeScript errors resolved (`npm run type-check`)
- [ ] All tests passing (`npm run test:unit`)
- [ ] No ESLint warnings (`npm run lint`)
- [ ] Production build succeeds (`npm run build`)
- [ ] Environment variables documented and validated

### Security

- [ ] All secrets generated with cryptographically secure random values
- [ ] Encryption keys are 64-character hex strings (32 bytes)
- [ ] No hardcoded secrets in codebase
- [ ] RLS policies reviewed and tested
- [ ] API keys have appropriate restrictions
- [ ] CORS origins configured correctly

### Infrastructure

- [ ] Domain name registered and configured
- [ ] SSL certificate available (Let's Encrypt or commercial)
- [ ] Database backup strategy defined
- [ ] Log aggregation configured
- [ ] Monitoring and alerting set up

### External Services

- [ ] Supabase project created
- [ ] Meta Developer app created and approved
- [ ] Twilio account configured (if using SMS)
- [ ] Google OAuth credentials created (if using Google sign-in)
- [ ] Gemini API key obtained (if using AI features)

---

## Environment Variables Setup

### Required Variables

Copy `.env.example` to `.env.local` and fill in all required values:

```bash
cp .env.example .env.local
```

### Generating Secure Secrets

Run these commands to generate secure secrets:

```bash
# Generate 64-character hex encryption key (for Instagram/WhatsApp tokens)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate webhook verification token
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate API key for legacy webhooks
node -e "console.log('vk_' + require('crypto').randomBytes(32).toString('hex'))"
```

### Production Environment Variables

```bash
# ==========================================
# REQUIRED: Core Application
# ==========================================

# Supabase Cloud (Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# Application URLs
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_DEFAULT_LOCALE=ar-MA

# ==========================================
# REQUIRED: Security
# ==========================================

# Generate with: node -e "console.log('vk_' + require('crypto').randomBytes(32).toString('hex'))"
WEBHOOK_API_KEY=vk_...

# ==========================================
# REQUIRED: Instagram Integration
# ==========================================

INSTAGRAM_APP_ID=your-instagram-app-id
INSTAGRAM_APP_SECRET=your-instagram-app-secret
INSTAGRAM_REDIRECT_URI=https://your-domain.com/api/auth/instagram/callback
# Generate 64-char hex: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
INSTAGRAM_TOKEN_ENCRYPTION_KEY=your-64-char-hex-key

# ==========================================
# REQUIRED: WhatsApp Integration
# ==========================================

WHATSAPP_APP_ID=your-whatsapp-app-id
WHATSAPP_APP_SECRET=your-whatsapp-app-secret
WHATSAPP_REDIRECT_URI=https://your-domain.com/api/auth/whatsapp/callback
# Generate 64-char hex: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
WHATSAPP_TOKEN_ENCRYPTION_KEY=your-64-char-hex-key
# Generate secure token for webhook verification
WHATSAPP_VERIFY_TOKEN=your-verify-token

# ==========================================
# OPTIONAL: SMS Authentication
# ==========================================

# Set to false for production (requires Twilio)
SMS_AUTOCONFIRM=false
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_MESSAGE_SERVICE_SID=your-twilio-messaging-service-sid

# ==========================================
# OPTIONAL: Google OAuth
# ==========================================

GOOGLE_OAUTH_ENABLED=true
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# ==========================================
# OPTIONAL: AI Features
# ==========================================

GEMINI_API_KEY=your-gemini-api-key
```

---

## Supabase Production Setup

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose organization and project name
4. Select region closest to your users (e.g., `eu-west-3` for Europe)
5. Set secure database password (save this!)
6. Wait for project provisioning

### 2. Get API Credentials

1. Go to Project Settings → API
2. Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy `service_role secret` key → `SUPABASE_SERVICE_ROLE_KEY`

**⚠️ Security Warning**: Never expose the service role key in client-side code.

### 3. Run Database Migrations

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations to production
supabase db push
```

### 4. Configure Auth Settings

1. Go to Authentication → Settings
2. Configure Site URL: `https://your-domain.com`
3. Add Redirect URLs:
   - `https://your-domain.com/auth/callback`
   - `https://your-domain.com/api/auth/instagram/callback`
   - `https://your-domain.com/api/auth/whatsapp/callback`
4. Enable Phone Auth (if using SMS):
   - Toggle "Enable Phone Provider"
   - Configure Twilio credentials

### 5. Configure Email Templates (Optional)

1. Go to Authentication → Email Templates
2. Customize templates for your brand
3. Configure SMTP if not using Supabase's default

### 6. Verify RLS Policies

Run this SQL in the SQL Editor to verify RLS is properly configured:

```sql
-- Check RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('sellers', 'products', 'orders', 'order_items', 'instagram_tokens', 'whatsapp_tokens');

-- Check policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## Meta Developer App Setup

### Instagram Basic Display API

1. Go to [Meta Developers](https://developers.facebook.com)
2. Create new app → Select "Other" → Select "Business"
3. Add "Instagram Basic Display" product
4. Configure OAuth settings:
   - Valid OAuth Redirect URIs: `https://your-domain.com/api/auth/instagram/callback`
   - Deauthorize Callback URL: `https://your-domain.com/api/auth/instagram/disconnect`
   - Data Deletion Request URL: `https://your-domain.com/legal/data-deletion`
5. Add Instagram Testers (for development):
   - Go to Roles → Instagram Testers
   - Add Instagram accounts for testing
   - Testers must accept invitation in Instagram app

6. Copy credentials:
   - App Dashboard → Settings → Basic
   - App ID → `INSTAGRAM_APP_ID`
   - App Secret → `INSTAGRAM_APP_SECRET`

### WhatsApp Business API

1. In the same Meta app, add "WhatsApp" product
2. Set up WhatsApp Business Platform:
   - Go to WhatsApp → Getting Started
   - Create or select WhatsApp Business Account
   - Add phone number (requires verification)
3. Configure webhook:
   - Go to WhatsApp → Configuration
   - Callback URL: `https://your-domain.com/api/webhooks/whatsapp`
   - Verify Token: Set to match `WHATSAPP_VERIFY_TOKEN`
   - Subscribe to: `messages` webhook fields
4. Copy credentials:
   - App ID → `WHATSAPP_APP_ID` (can reuse Instagram app)
   - App Secret → `WHATSAPP_APP_SECRET`
   - Phone Number ID (from WhatsApp → Getting Started)
   - Access Token (generate permanent token)

### App Review (Required for Production)

For production use beyond test accounts:

1. Go to App Review → Permissions and Features
2. Request `instagram_basic` permission
3. Request `whatsapp_business_management` permission
4. Submit for review with:
   - Screen recording showing integration
   - Privacy policy URL
   - Data deletion URL
   - App icon and description

---

## Twilio SMS Setup

Only required if using phone authentication in production.

### 1. Create Twilio Account

1. Sign up at [Twilio](https://www.twilio.com)
2. Verify your email and phone number
3. Get Account SID and Auth Token from Console Dashboard

### 2. Configure Messaging Service

1. Go to Messaging → Try it out → Send an SMS
2. Or create a Messaging Service:
   - Go to Messaging → Services → Create Messaging Service
   - Add phone numbers to the service
3. Copy Messaging Service SID (starts with `MG`)

### 3. Configure Supabase

1. Go to Supabase → Authentication → Providers → Phone
2. Enable Phone provider
3. Configure Twilio:
   - Account SID → `TWILIO_ACCOUNT_SID`
   - Auth Token → `TWILIO_AUTH_TOKEN`
   - Message Service SID → `TWILIO_MESSAGE_SERVICE_SID`
4. Set `SMS_AUTOCONFIRM=false` in environment variables

### 4. Test SMS Delivery

1. Use a test phone number
2. Sign up with phone authentication
3. Verify SMS is received with OTP

---

## Docker Build Instructions

### Local Production Build Test

```bash
# Build production image
docker build -t vibecart:latest --target runner .

# Run production container locally
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  -e SUPABASE_SERVICE_ROLE_KEY=your-service-key \
  -e NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  -e INSTAGRAM_TOKEN_ENCRYPTION_KEY=your-key \
  -e WHATSAPP_TOKEN_ENCRYPTION_KEY=your-key \
  vibecart:latest
```

### Multi-Stage Build Details

The Dockerfile uses multi-stage builds:

1. **deps**: Install npm dependencies
2. **dev**: Development environment with hot reload
3. **builder**: Build the Next.js application
4. **runner**: Production-optimized image

### Production Image Optimization

The production image:
- Uses Node.js 20 Alpine (minimal size)
- Runs as non-root user (`nextjs`)
- Includes only necessary files (`.next/standalone`, `public`)
- Disables Next.js telemetry
- Optimized for security and size

### Pushing to Registry

```bash
# Tag for your registry
docker tag vibecart:latest your-registry/vibecart:v1.0.0
docker tag vibecart:latest your-registry/vibecart:latest

# Push to registry
docker push your-registry/vibecart:v1.0.0
docker push your-registry/vibecart:latest
```

---

## Deployment Platform Options

### Option 1: Vercel (Recommended for Next.js)

**Pros:**
- Native Next.js optimization
- Automatic preview deployments
- Built-in analytics
- Global CDN

**Steps:**

1. Connect repository to Vercel
2. Configure environment variables in Vercel Dashboard
3. Set build command: `npm run build`
4. Set output directory: `.next`
5. Add required headers in `next.config.js` (already configured)
6. Deploy

**Important Notes:**
- Server Actions are fully supported
- Edge runtime available for API routes
- Configure `AWS_REGION` if needed for data residency

### Option 2: Railway

**Pros:**
- Simple Docker deployments
- Automatic HTTPS
- Easy environment variable management
- Managed databases available

**Steps:**

1. Create new project in Railway
2. Connect GitHub repository
3. Configure environment variables
4. Deploy

**railway.json** (optional):
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "node server.js",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Option 3: AWS ECS (Fargate)

**Pros:**
- Full control over infrastructure
- Scalable and reliable
- Integration with AWS services

**Architecture:**
- ECS Fargate for container orchestration
- Application Load Balancer
- CloudFront CDN (optional)
- Secrets Manager for sensitive data

**Steps:**

1. Push Docker image to ECR
2. Create ECS Task Definition
3. Create ECS Service
4. Configure Application Load Balancer
5. Set up auto-scaling policies

**Task Definition Example:**
```json
{
  "family": "vibecart",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [{
    "name": "vibecart",
    "image": "your-ecr-repo/vibecart:latest",
    "portMappings": [{"containerPort": 3000}],
    "environment": [
      {"name": "NODE_ENV", "value": "production"}
    ],
    "secrets": [
      {"name": "NEXT_PUBLIC_SUPABASE_URL", "valueFrom": "arn:aws:secretsmanager:..."}
    ],
    "healthCheck": {
      "command": ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"],
      "interval": 30,
      "timeout": 5,
      "retries": 3
    }
  }]
}
```

### Option 4: Self-Hosted (VPS/Dedicated Server)

**Requirements:**
- Docker and Docker Compose installed
- Reverse proxy (nginx/traefik) for SSL
- SSL certificates (Let's Encrypt)

**docker-compose.prod.yml:**
```yaml
version: '3.8'

services:
  app:
    image: vibecart:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
      - INSTAGRAM_TOKEN_ENCRYPTION_KEY=${INSTAGRAM_TOKEN_ENCRYPTION_KEY}
      - WHATSAPP_TOKEN_ENCRYPTION_KEY=${WHATSAPP_TOKEN_ENCRYPTION_KEY}
      - WHATSAPP_VERIFY_TOKEN=${WHATSAPP_VERIFY_TOKEN}
      - WEBHOOK_API_KEY=${WEBHOOK_API_KEY}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**Deployment:**
```bash
# Copy compose file and .env to server
scp docker-compose.prod.yml .env user@server:/opt/vibecart/

# On server
cd /opt/vibecart
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

---

## Post-Deployment Verification

### Health Checks

Verify these endpoints respond correctly:

```bash
# Basic health check
curl https://your-domain.com/api/health
# Expected: {"status":"healthy","timestamp":"..."}

# Readiness check (includes database connectivity)
curl https://your-domain.com/api/ready
# Expected: {"status":"ready","checks":{"database":"connected"}}

# Robots.txt
curl https://your-domain.com/robots.txt

# Sitemap
curl https://your-domain.com/sitemap.xml
```

### Authentication Flow

- [ ] User can sign up with email
- [ ] User can sign up with phone (if enabled)
- [ ] User can sign in with Google (if enabled)
- [ ] Session persists across page reloads
- [ ] Logout works correctly

### Core Functionality

- [ ] Seller can create profile
- [ ] Seller can add products
- [ ] Seller can connect Instagram account
- [ ] Seller can connect WhatsApp Business
- [ ] Customer can browse products
- [ ] Customer can place order
- [ ] Order notifications sent via WhatsApp
- [ ] Customer can confirm order via WhatsApp reply

### Security Verification

- [ ] HTTPS enforced (HSTS header present)
- [ ] Security headers configured:
  ```bash
  curl -I https://your-domain.com
  # Check for: X-Frame-Options, X-Content-Type-Options, CSP, etc.
  ```
- [ ] RLS policies prevent unauthorized data access
- [ ] API rate limiting functional
- [ ] No sensitive data in client-side bundles

### Webhook Verification

1. **WhatsApp Webhook:**
   ```bash
   curl "https://your-domain.com/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test123"
   # Expected: test123
   ```

2. **Instagram Callback:**
   - Attempt OAuth flow
   - Verify callback URL works

### Monitoring Setup

Configure these for production monitoring:

1. **Error Tracking:** Sentry, LogRocket, or similar
2. **Analytics:** Vercel Analytics, Google Analytics
3. **Uptime Monitoring:** UptimeRobot, Pingdom
4. **Database Monitoring:** Supabase Dashboard

### Backup Verification

1. Verify Supabase automated backups are enabled
2. Test restore procedure in staging environment
3. Document RTO (Recovery Time Objective) and RPO (Recovery Point Objective)

---

## Troubleshooting

### Common Issues

**Build fails with "Module not found"**
- Run `npm ci` to ensure clean install
- Check for case sensitivity issues in imports

**Database connection errors**
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check IP allowlist in Supabase settings
- Ensure database migrations ran successfully

**WhatsApp webhook not receiving messages**
- Verify callback URL is accessible from internet
- Check `WHATSAPP_VERIFY_TOKEN` matches Meta configuration
- Ensure SSL certificate is valid

**Instagram OAuth fails**
- Verify redirect URI exactly matches Meta configuration (including https://)
- Check `INSTAGRAM_REDIRECT_URI` environment variable
- Ensure app is in development mode or approved

**CORS errors**
- Verify `NEXT_PUBLIC_APP_URL` matches actual domain
- Check redirect URLs in Supabase auth settings

### Getting Help

- Review [SECURITY.md](./SECURITY.md) for security-related issues
- Check application logs in deployment platform
- Review Supabase logs in Supabase Dashboard
- Enable debug logging temporarily: `DEBUG=vibecart:*`

---

## Maintenance

### Regular Tasks

- **Weekly:** Review error logs and security alerts
- **Monthly:** Rotate API keys and review access
- **Quarterly:** Security audit and dependency updates

### Deployment Updates

1. Test changes in staging environment
2. Create database backup before deployment
3. Deploy during low-traffic hours
4. Monitor error rates after deployment
5. Have rollback plan ready

---

*Last updated: 2026-02-11*
