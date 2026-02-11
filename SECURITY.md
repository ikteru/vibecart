# VibeCart Security Guide

This document outlines security practices, configurations, and procedures for maintaining a secure VibeCart deployment.

## Table of Contents

1. [Security Checklist](#security-checklist)
2. [Secret Management](#secret-management)
3. [Secret Rotation Procedures](#secret-rotation-procedures)
4. [RLS Policy Verification](#rls-policy-verification)
5. [Rate Limiting Configuration](#rate-limiting-configuration)
6. [Security Headers Explanation](#security-headers-explanation)
7. [Authentication Security](#authentication-security)
8. [Data Protection](#data-protection)
9. [Incident Response](#incident-response)

---

## Security Checklist

Use this checklist when deploying to production or conducting security audits.

### Environment & Configuration

- [ ] All environment variables use cryptographically secure random values
- [ ] No secrets committed to version control
- [ ] `.env.local` is in `.gitignore`
- [ ] Service role key never exposed to client-side code
- [ ] Production uses HTTPS only (HSTS enabled)
- [ ] Debug mode disabled in production (`NODE_ENV=production`)

### Authentication & Authorization

- [ ] RLS enabled on all database tables
- [ ] RLS policies verified for correctness
- [ ] Session tokens have appropriate expiration
- [ ] Password policy enforced (if using email auth)
- [ ] OAuth redirect URIs explicitly configured
- [ ] API keys have IP/domain restrictions where possible

### Data Protection

- [ ] Encryption keys are 256-bit (64 hex characters)
- [ ] Sensitive tokens encrypted at rest (Instagram, WhatsApp)
- [ ] PII masked in logs
- [ ] Database backups encrypted
- [ ] File uploads validated (type, size)
- [ ] Storage paths user-scoped for RLS

### API Security

- [ ] Rate limiting configured
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection (CSP headers)
- [ ] CSRF protection enabled
- [ ] Webhook signatures verified

### External Services

- [ ] Meta app in production mode (not development)
- [ ] Twilio account has usage alerts
- [ ] Supabase API keys rotated recently
- [ ] Third-party service access reviewed quarterly

---

## Secret Management

### Required Secrets

| Secret | Length/Format | Generation Command | Storage |
|--------|---------------|-------------------|---------|
| `INSTAGRAM_TOKEN_ENCRYPTION_KEY` | 64 hex chars | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | Environment variable |
| `WHATSAPP_TOKEN_ENCRYPTION_KEY` | 64 hex chars | Same as above | Environment variable |
| `WHATSAPP_VERIFY_TOKEN` | 64+ chars | Same as above | Environment variable + Meta Console |
| `WEBHOOK_API_KEY` | 64+ chars with prefix | `node -e "console.log('vk_' + require('crypto').randomBytes(32).toString('hex'))"` | Environment variable |
| `SUPABASE_SERVICE_ROLE_KEY` | Provided by Supabase | N/A | Environment variable only |
| `TWILIO_AUTH_TOKEN` | Provided by Twilio | N/A | Environment variable + Twilio Console |

### Secret Storage Best Practices

#### Local Development
- Use `.env.local` (never commit to Git)
- Use different credentials than production
- Enable auto-confirm for SMS in development (`SMS_AUTOCONFIRM=true`)

#### Production

**Vercel:**
- Use Project Settings → Environment Variables
- Mark sensitive values as "Secret"

**Railway:**
- Use Variables tab
- Enable encryption for sensitive values

**AWS:**
- Use AWS Secrets Manager or Parameter Store
- Reference in ECS task definition

**Self-Hosted:**
- Use Docker secrets or external vault
- Restrict file permissions: `chmod 600 .env`
- Never log environment variables

### Encryption Implementation

VibeCart uses AES-256-GCM for token encryption:

```typescript
// src/infrastructure/utils/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export function encryptToken(token: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY!, 'hex'),
    iv
  );
  
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}
```

---

## Secret Rotation Procedures

### Rotation Schedule

| Secret Type | Rotation Frequency | Automated |
|-------------|-------------------|-----------|
| API Keys (Supabase, Twilio) | Every 90 days | No |
| Encryption Keys | Every 180 days | No |
| OAuth Client Secrets | Every 180 days | No |
| Webhook Verification Tokens | Every 90 days | No |
| Service Role Keys | Every 90 days | No |

### Key Rotation Procedure

#### 1. Encryption Key Rotation (Instagram/WhatsApp)

**⚠️ Warning**: This requires decrypting and re-encrypting all stored tokens. Schedule during maintenance window.

```bash
# 1. Generate new key
NEW_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# 2. Create migration script
# See: scripts/rotate-encryption-key.ts

# 3. Backup database
supabase db dump --data-only > backup_pre_rotation.sql

# 4. Run rotation script
npx tsx scripts/rotate-encryption-key.ts --old-key $OLD_KEY --new-key $NEW_KEY

# 5. Update environment variable
# INSTAGRAM_TOKEN_ENCRYPTION_KEY=$NEW_KEY

# 6. Restart application

# 7. Verify functionality
# - Test Instagram connection
# - Test WhatsApp connection

# 8. Delete old key after 24 hours of monitoring
```

#### 2. Supabase Service Role Key Rotation

1. Go to Supabase Dashboard → Project Settings → API
2. Click "Rotate service role key"
3. Copy new key
4. Update environment variable
5. Restart application
6. Verify API functionality
7. Remove old key (automatically invalidated by Supabase)

#### 3. Meta App Secret Rotation

1. Go to Meta Developers → Your App → Settings → Basic
2. Click "Reset" next to App Secret
3. Copy new secret
4. Update `INSTAGRAM_APP_SECRET` and/or `WHATSAPP_APP_SECRET`
5. Restart application
6. Test OAuth flows

#### 4. Twilio Credentials Rotation

1. Go to Twilio Console → Settings → API Keys
2. Create new API Key
3. Update `TWILIO_AUTH_TOKEN`
4. Update Supabase Auth Twilio configuration
5. Test SMS delivery
6. Delete old API key after 24 hours

### Emergency Rotation

If a secret is compromised:

1. **Immediate** (within 5 minutes):
   - Rotate the compromised secret
   - Update environment variables
   - Restart application

2. **Short-term** (within 1 hour):
   - Audit access logs for unauthorized usage
   - Review affected user accounts
   - Check for data exfiltration

3. **Follow-up** (within 24 hours):
   - Post-incident review
   - Update security procedures
   - Notify affected users if required by policy

---

## RLS Policy Verification

### Understanding RLS

Row Level Security (RLS) ensures users can only access their own data. VibeCart uses RLS extensively:

```
User Request → Server Action → Repository → Supabase
                                   ↓
                            RLS Policy Check
                                   ↓
                        Allow/Deny based on policy
```

### Current RLS Policies

#### Sellers Table

```sql
-- Anyone can view seller profiles (public shops)
CREATE POLICY "Public read sellers"
  ON sellers FOR SELECT USING (true);

-- Users can only modify their own seller profile
CREATE POLICY "Users create own seller"
  ON sellers FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own seller"
  ON sellers FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own seller"
  ON sellers FOR DELETE USING (auth.uid() = user_id);
```

#### Products Table

```sql
-- Anyone can view active products
CREATE POLICY "Public read active products"
  ON products FOR SELECT USING (is_active = true);

-- Sellers can view all their products (including inactive)
CREATE POLICY "Sellers read own products"
  ON products FOR SELECT USING (
    seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
  );

-- Sellers can only modify their own products
CREATE POLICY "Sellers create products"
  ON products FOR INSERT WITH CHECK (
    seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
  );

CREATE POLICY "Sellers update own products"
  ON products FOR UPDATE USING (
    seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
  );

CREATE POLICY "Sellers delete own products"
  ON products FOR DELETE USING (
    seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
  );
```

### Verifying RLS Policies

Run these queries to audit your RLS configuration:

```sql
-- Check RLS is enabled on all tables
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- List all policies
SELECT 
  tablename,
  policyname,
  permissive,
  roles::text,
  cmd as operation,
  qual as using_expression,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test RLS as specific user (run in Supabase SQL Editor)
SET ROLE authenticated;
SET request.jwt.claim.sub = 'test-user-uuid';

-- This should only return user's own data
SELECT * FROM sellers;
SELECT * FROM products;

RESET ROLE;
```

### Admin Client Usage

The service role key bypasses RLS. Use with caution:

```typescript
// ✅ CORRECT: Verify auth before using admin client
const user = await getCurrentUser();
if (!user) {
  return { success: false, error: 'Unauthorized' };
}

const adminClient = createAdminClient();
// Safe to use admin client - auth verified

// ❌ WRONG: Using admin client without auth check
const adminClient = createAdminClient();
await adminClient.from('sellers').update({...}); // Dangerous!
```

### When to Use Admin Client

| Scenario | Use Admin Client? | Reason |
|----------|------------------|--------|
| Server actions (writes) | ✅ Yes | JWT not passed to RLS in server actions |
| Storage uploads | ✅ Yes | Same JWT issue for storage.objects |
| Public/anonymous ops | ✅ Yes | No auth context (e.g., public checkout) |
| Client-side reads | ❌ No | Normal RLS works for authenticated reads |
| Webhook processing | ✅ Yes | No user context available |

---

## Rate Limiting Configuration

### Current Rate Limits

VibeCart implements rate limiting at multiple layers:

#### 1. API Route Rate Limiting (Next.js Middleware)

Add to `src/middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiter (use Redis in production)
const rateLimit = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,     // requests per window
};

export function middleware(request: NextRequest) {
  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip ?? 'anonymous';
    const now = Date.now();
    
    const record = rateLimit.get(ip);
    if (!record || now > record.resetTime) {
      rateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    } else if (record.count >= RATE_LIMIT.maxRequests) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    } else {
      record.count++;
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
```

#### 2. Supabase Rate Limits

Supabase automatically rate limits API requests:

| Plan | Requests per minute | Database connections |
|------|--------------------:|---------------------:|
| Free | 60,000 | 10 |
| Pro | 300,000 | 60 |
| Team | 600,000 | 120 |

Configure in `supabase/config.toml` or Dashboard.

#### 3. Webhook Rate Limits

WhatsApp Cloud API webhook rate limits:

- **Delivery receipts**: No specific limit, but implement idempotency
- **Incoming messages**: Handle bursts with queue
- **Status updates**: Process asynchronously

#### 4. Recommended Production Rate Limits

```typescript
// Per-endpoint rate limits
const ENDPOINT_LIMITS = {
  '/api/auth': { windowMs: 15 * 60 * 1000, max: 5 },      // 5 attempts per 15 min
  '/api/orders': { windowMs: 60 * 1000, max: 10 },        // 10 orders per minute
  '/api/webhooks/whatsapp': { windowMs: 60 * 1000, max: 1000 }, // Webhook bursts
  'default': { windowMs: 60 * 1000, max: 60 },            // General API
};
```

### Distributed Rate Limiting (Production)

For multi-instance deployments, use Redis:

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
});

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const { success, limit, reset, remaining } = await ratelimit.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        }
      }
    );
  }
  
  return NextResponse.next();
}
```

---

## Security Headers Explanation

VibeCart configures these security headers in `next.config.js`:

### Content Security Policy (CSP)

```javascript
{
  key: 'Content-Security-Policy',
  value: "default-src 'self'; " +
         "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
         "style-src 'self' 'unsafe-inline'; " +
         "img-src 'self' data: https: blob:; " +
         "font-src 'self'; " +
         "connect-src 'self' https:; " +
         "media-src 'self'; " +
         "object-src 'none'; " +
         "frame-ancestors 'self'; " +
         "base-uri 'self'; " +
         "form-action 'self';"
}
```

| Directive | Purpose |
|-----------|---------|
| `default-src 'self'` | Only load resources from same origin by default |
| `script-src 'unsafe-inline' 'unsafe-eval'` | Required for Next.js (consider nonce in future) |
| `img-src https:` | Allow images from any HTTPS source (for Instagram) |
| `connect-src https:` | Allow API calls to HTTPS endpoints (Supabase) |
| `object-src 'none'` | Disable Flash/Java plugins |
| `frame-ancestors 'self'` | Prevent clickjacking |

### Strict Transport Security (HSTS)

```javascript
{
  key: 'Strict-Transport-Security',
  value: 'max-age=63072000; includeSubDomains; preload'
}
```

- `max-age=63072000`: Cache for 2 years
- `includeSubDomains`: Apply to all subdomains
- `preload`: Eligible for browser HSTS preload list

### X-Frame-Options

```javascript
{
  key: 'X-Frame-Options',
  value: 'SAMEORIGIN'
}
```

Prevents the site from being embedded in iframes on other domains (clickjacking protection).

### X-Content-Type-Options

```javascript
{
  key: 'X-Content-Type-Options',
  value: 'nosniff'
}
```

Prevents browsers from MIME-sniffing responses away from declared content type.

### Referrer Policy

```javascript
{
  key: 'Referrer-Policy',
  value: 'strict-origin-when-cross-origin'
}
```

Controls referrer information sent with requests:
- Same origin: Full URL
- Cross-origin: Only origin (no path)

### Permissions Policy

```javascript
{
  key: 'Permissions-Policy',
  value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
}
```

Disables browser features that aren't needed:
- Camera/microphone access
- Geolocation
- FLoC (Federated Learning of Cohorts)

### Verifying Headers

Test your security headers:

```bash
# Check headers
curl -I https://your-domain.com

# Use security scanner
npx security-headers https://your-domain.com

# Online tools
# https://securityheaders.com
# https://observatory.mozilla.org
```

---

## Authentication Security

### Session Management

- Sessions stored in HTTP-only cookies
- JWT tokens expire after 1 hour (configurable in Supabase)
- Refresh tokens rotated on use
- Session invalidated on password change

### OAuth Security

1. **State Parameter**: Always use state parameter to prevent CSRF
2. **PKCE**: Used for PKCE flow (mobile apps)
3. **Redirect Validation**: Only allow configured redirect URIs
4. **Token Storage**: Encrypted at rest

### Password Security (Email Auth)

If using email/password authentication:

- Minimum password length: 8 characters
- Passwords hashed with bcrypt (handled by Supabase Auth)
- Rate limiting on login attempts
- Brute force protection enabled

### Phone Authentication

- OTP codes expire after 5 minutes
- Rate limited to prevent SMS pumping
- Consider Twilio Verify for additional fraud protection

---

## Data Protection

### PII Handling

Personally Identifiable Information in VibeCart:

| Data | Storage | Encryption | Log Masking |
|------|---------|------------|-------------|
| Email addresses | Supabase Auth | Encrypted at rest | Partial |
| Phone numbers | Supabase Auth | Encrypted at rest | Masked |
| WhatsApp tokens | Database | AES-256-GCM | Never logged |
| Instagram tokens | Database | AES-256-GCM | Never logged |
| Order details | Database | RLS protected | Masked |

### Log Masking

```typescript
// Mask phone numbers in logs
function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 6) return '***';
  return `${phone.slice(0, 3)}***${phone.slice(-5)}`;
}

// Usage
console.log('Order from:', maskPhoneNumber(customerPhone));
```

### Data Retention

Configure data retention policies:

```sql
-- Auto-delete old activity logs (example)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM activity_logs
  WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Run daily via pg_cron (install extension first)
SELECT cron.schedule('cleanup-logs', '0 0 * * *', 'SELECT cleanup_old_logs()');
```

---

## Incident Response

### Security Incident Types

| Severity | Examples | Response Time |
|----------|----------|---------------|
| Critical | Data breach, admin compromise | 15 minutes |
| High | Unauthorized access, API abuse | 1 hour |
| Medium | Failed login attempts, suspicious activity | 24 hours |
| Low | Policy violations, minor issues | 1 week |

### Incident Response Playbook

#### Data Breach Suspected

1. **Contain** (0-15 min):
   - Revoke compromised credentials
   - Rotate all related secrets
   - Enable maintenance mode if needed

2. **Assess** (15-60 min):
   - Review access logs
   - Identify affected data/users
   - Determine breach scope

3. **Recover** (1-24 hours):
   - Restore from clean backup if needed
   - Force password resets for affected users
   - Review and patch vulnerability

4. **Communicate** (24-72 hours):
   - Notify affected users
   - File required reports (GDPR, etc.)
   - Post-incident review

### Contact Information

Maintain an incident response contact list:

| Role | Contact | Responsibility |
|------|---------|---------------|
| Security Lead | security@example.com | Incident commander |
| DevOps | devops@example.com | Infrastructure response |
| Legal | legal@example.com | Regulatory compliance |
| Meta Support | [Dev Support](https://developers.facebook.com/support) | OAuth issues |
| Supabase Support | support@supabase.com | Database issues |

---

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/security)
- [Next.js Security](https://nextjs.org/docs/security)
- [Meta Security Best Practices](https://developers.facebook.com/docs/security/)

---

*Last updated: 2026-02-11*
