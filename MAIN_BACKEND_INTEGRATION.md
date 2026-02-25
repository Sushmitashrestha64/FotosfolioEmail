# Main Backend Integration Guide

This guide explains how to queue emails directly from your main backend to the email microservice using BullMQ queues.

## Architecture Overview

```
┌─────────────────────────────────┐
│     Main Backend (Producer)     │
│                                 │
│  1. Create BullMQ Queue Client  │
│  2. Call queue.add() to enqueue │
│                                 │
└────────────┬────────────────────┘
             │
             ↓ (writes to Redis)
      ┌──────────────┐
      │    Redis     │
      │  (Shared)    │
      └──────┬───────┘
             │
             ↓ (reads from Redis)
┌────────────────────────────────┐
│  Email Microservice (Consumer) │
│                                │
│  1. BullMQ Workers running     │
│  2. Process jobs automatically │
│  3. Send emails via Resend     │
│                                │
└────────────────────────────────┘
```

**No HTTP calls between services!** Both connect to the same Redis instance.

---

## Prerequisites

- Main backend must have access to the **same Redis instance** as the email microservice
- Install `bullmq` in your main backend: `npm install bullmq`

---

## Step 1: Configure Redis Connection

### Main Backend `.env`
```env
# Must match email microservice Redis configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password_here
```

### Verify Email Microservice Uses Same Redis
Check `FotosfolioEmail/.env` has identical Redis settings.

---

## Step 2: Create Email Queue Service

Create `src/email/email-queue.service.ts` in your **main backend**:

```typescript
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

@Injectable()
export class EmailQueueService implements OnModuleInit {
  private readonly logger = new Logger(EmailQueueService.name);
  private queues: Map<string, Queue> = new Map();

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    // Redis connection (must match email microservice)
    const connection = {
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD', ''),
    };

    // Create queue clients for each category
    // Queue names MUST match email microservice: "{category}-emails"
    const categories = ['account', 'subscription', 'security', 'project', 'payment', 'storage'];
    
    categories.forEach(category => {
      const queueName = `${category}-emails`;
      const queue = new Queue(queueName, { connection });
      this.queues.set(category, queue);
      this.logger.log(`✓ Connected to ${queueName} queue`);
    });

    this.logger.log('🎉 Email queue service initialized');
  }

  /**
   * Add email job to queue
   * @param category - Email category (account, subscription, etc.)
   * @param type - Email type (ACCOUNT_CREATED, SUBSCRIPTION_EXPIRED, etc.)
   * @param payload - Email data (to, username, etc.)
   */
  async queueEmail(category: string, type: string, payload: any): Promise<void> {
    const queue = this.queues.get(category);
    
    if (!queue) {
      throw new Error(`Unknown email category: ${category}`);
    }

    // Job structure must match email microservice expectation
    await queue.add(type, {
      type,
      payload,
    });

    this.logger.log(`📧 Queued ${type} email to ${payload.to}`);
  }

  // Convenience methods for each category
  async queueAccountEmail(type: string, payload: any) {
    return this.queueEmail('account', type, payload);
  }

  async queueSubscriptionEmail(type: string, payload: any) {
    return this.queueEmail('subscription', type, payload);
  }

  async queueSecurityEmail(type: string, payload: any) {
    return this.queueEmail('security', type, payload);
  }

  async queueStorageEmail(type: string, payload: any) {
    return this.queueEmail('storage', type, payload);
  }

  async queuePaymentEmail(type: string, payload: any) {
    return this.queueEmail('payment', type, payload);
  }

  async queueProjectEmail(type: string, payload: any) {
    return this.queueEmail('project', type, payload);
  }
}
```

---

## Step 3: Create Email Module

Create `src/email/email.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { EmailQueueService } from './email-queue.service';

@Module({
  providers: [EmailQueueService],
  exports: [EmailQueueService], // Export so other modules can use it
})
export class EmailModule {}
```

---

## Step 4: Import Email Module

In your `app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EmailModule, // Add this
    // ... your other modules
  ],
})
export class AppModule {}
```

---

## Step 5: Use in Your Services

### Example: User Registration

```typescript
import { Injectable } from '@nestjs/common';
import { EmailQueueService } from '../email/email-queue.service';

@Injectable()
export class UsersService {
  constructor(private readonly emailQueue: EmailQueueService) {}

  async createUser(data: CreateUserDto) {
    // Create user in database
    const user = await this.userRepository.create(data);

    // Queue welcome email
    await this.emailQueue.queueAccountEmail('ACCOUNT_CREATED', {
      to: user.email,
      username: user.name,
    });

    return user;
  }
}
```

### Example: Password Reset

```typescript
async requestPasswordReset(email: string) {
  const user = await this.findByEmail(email);
  const resetToken = this.generateResetToken();

  // Save token to database
  await this.saveResetToken(user.id, resetToken);

  // Queue password reset email
  await this.emailQueue.queueAccountEmail('PASSWORD_RESET', {
    to: user.email,
    username: user.name,
    resetLink: `https://fotosfolio.com/reset-password?token=${resetToken}`,
  });
}
```

### Example: Subscription Expiry (Cron Job)

```typescript
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EmailQueueService } from '../email/email-queue.service';

@Injectable()
export class SubscriptionCronService {
  constructor(
    private readonly subscriptionRepo: SubscriptionRepository,
    private readonly emailQueue: EmailQueueService,
  ) {}

  @Cron('0 0 * * *') // Run at midnight
  async processExpiredSubscriptions() {
    const expiredSubs = await this.subscriptionRepo.findExpiredToday();

    for (const sub of expiredSubs) {
      // Update database
      await this.subscriptionRepo.markAsExpired(sub.id);

      // Queue email
      await this.emailQueue.queueSubscriptionEmail('SUBSCRIPTION_EXPIRED', {
        to: sub.user.email,
        userName: sub.user.name,
        graceDaysRemaining: 3,
      });
    }
  }

  @Cron('0 9 * * *') // Run at 9 AM
  async sendExpirationReminders() {
    const expiringIn7Days = await this.subscriptionRepo.findExpiringIn(7);

    for (const sub of expiringIn7Days) {
      await this.emailQueue.queueSubscriptionEmail('SUBSCRIPTION_EXPIRING', {
        to: sub.user.email,
        userName: sub.user.name,
        daysRemaining: 7,
        renewalUrl: `https://fotosfolio.com/subscription/renew`,
      });
    }
  }
}
```

---

## Available Email Types

### Account Emails (`account` category)
```typescript
await emailQueue.queueAccountEmail('ACCOUNT_CREATED', { to, username });
await emailQueue.queueAccountEmail('ACCOUNT_ACTIVATION', { to, userName, activationLink });
await emailQueue.queueAccountEmail('PASSWORD_RESET', { to, username, resetLink });
await emailQueue.queueAccountEmail('PASSWORD_RESET_SUCCESS', { to, username });
await emailQueue.queueAccountEmail('EMAIL_VERIFICATION', { to, userName, otpCode });
await emailQueue.queueAccountEmail('PASSWORD_CHANGED', { to, username });
await emailQueue.queueAccountEmail('ACCOUNT_DELETED', { to, username });
await emailQueue.queueAccountEmail('TWO_FACTOR_CODE', { to, userName, otpCode });
await emailQueue.queueAccountEmail('CONTACT_FORM', { contact: ContactDto });
```

### Subscription Emails (`subscription` category)
```typescript
await emailQueue.queueSubscriptionEmail('SUBSCRIPTION_STARTED', { to, userName, planName, startDate, endDate });
await emailQueue.queueSubscriptionEmail('SUBSCRIPTION_RENEWED', { to, userName, planName, renewalDate, nextBillingDate });
await emailQueue.queueSubscriptionEmail('SUBSCRIPTION_CANCELLED', { to, userName, planName, endDate });
await emailQueue.queueSubscriptionEmail('SUBSCRIPTION_EXPIRING', { to, userName, daysRemaining, renewalUrl });
await emailQueue.queueSubscriptionEmail('SUBSCRIPTION_EXPIRED', { to, userName, graceDaysRemaining });
await emailQueue.queueSubscriptionEmail('PLAN_UPGRADED', { to, userName, oldPlan, newPlan });
await emailQueue.queueSubscriptionEmail('PLAN_DOWNGRADED', { to, userName, oldPlan, newPlan });
```

### Security Emails (`security` category)
```typescript
await emailQueue.queueSecurityEmail('LOGIN_ALERT', { to, userName, loginTime, ipAddress, location });
await emailQueue.queueSecurityEmail('NEW_IP_LOGIN', { to, userName, ipAddress, location, device });
await emailQueue.queueSecurityEmail('SUSPICIOUS_ACTIVITY', { to, userName, activityDescription });
await emailQueue.queueSecurityEmail('GOOGLE_ACCOUNT_DISCONNECTED', { to, userName });
await emailQueue.queueSecurityEmail('TWO_FA_DISABLED', { to, userName });
await emailQueue.queueSecurityEmail('PASSKEY_ENABLED', { to, userName });
await emailQueue.queueSecurityEmail('PASSKEY_DISABLED', { to, userName });
```

### Project Emails (`project` category)
```typescript
await emailQueue.queueProjectEmail('PROJECT_SHARED', { to, userName, projectName, sharedBy });
await emailQueue.queueProjectEmail('PROJECT_INVITATION', { to, invitedBy, projectName, acceptUrl });
await emailQueue.queueProjectEmail('PROJECT_TRANSFER', { to, projectName, newOwner });
await emailQueue.queueProjectEmail('ACCESS_REQUEST', { to, requesterName, projectName, approveUrl });
await emailQueue.queueProjectEmail('GALLERY_SHARED', { to, galleryName, sharedBy });
await emailQueue.queueProjectEmail('FOLDER_SHARED', { to, folderName, sharedBy });
```

### Payment Emails (`payment` category)
```typescript
await emailQueue.queuePaymentEmail('PAYMENT_SUCCESS', { to, userName, amount, transactionId, receiptUrl });
await emailQueue.queuePaymentEmail('PAYMENT_FAILED', { to, userName, amount, reason, retryUrl });
await emailQueue.queuePaymentEmail('PAYMENT_REJECTION', { to, userName, reason });
await emailQueue.queuePaymentEmail('REFUND_PROCESSED', { to, userName, amount, transactionId });
```

### Storage Emails (`storage` category)
```typescript
await emailQueue.queueStorageEmail('STORAGE_WARNING', { to, userName, usedStorage, totalStorage, percentageUsed });
await emailQueue.queueStorageEmail('STORAGE_FULL', { to, userName, upgradeUrl });
await emailQueue.queueStorageEmail('ADDON_EXPIRY', { to, userName, addOnName, expiryDate, graceDaysRemaining });
await emailQueue.queueStorageEmail('ADDON_FINAL_GRACE', { to, userName, addOnName, daysRemaining });
```

---

## Testing

### 1. Verify Redis Connection
Both services should log successful connection to Redis on startup.

**Main Backend log:**
```
[EmailQueueService] ✓ Connected to account-emails queue
[EmailQueueService] ✓ Connected to subscription-emails queue
...
[EmailQueueService] 🎉 Email queue service initialized
```

**Email Microservice log:**
```
[WorkerPoolService] ✓ Worker pool created for account (concurrency: 2)
[WorkerPoolService] ✓ Worker pool created for subscription (concurrency: 2)
...
[WorkerPoolService] 🎉 All 6 worker pools initialized successfully
```

### 2. Queue a Test Email

```typescript
// In any service
await this.emailQueue.queueAccountEmail('ACCOUNT_CREATED', {
  to: 'test@example.com',
  username: 'TestUser',
});
```

**Expected logs:**

**Main Backend:**
```
[EmailQueueService] 📧 Queued ACCOUNT_CREATED email to test@example.com
```

**Email Microservice:**
```
[WorkerPoolService] 📧 Processing ACCOUNT_CREATED email (Job ID: 1)
[EmailSenderService] 📧 Sending ACCOUNT_CREATED email to test@example.com
[EmailSenderService] ✅ Email sent successfully to test@example.com (ID: abc123)
[WorkerPoolService] ✅ [account] Job 1 completed successfully
```

### 3. Check Queue Stats

You can still use the email microservice HTTP endpoints for monitoring:

```bash
# Check queue stats
curl http://localhost:3000/api/emails/stats?category=account

# Check email usage
curl http://localhost:3000/api/emails/usage
```

---

## Troubleshooting

### Problem: Jobs not being processed

**Check:**
1. Both services connected to same Redis instance
2. Queue names match exactly: `{category}-emails`
3. Email microservice workers are running
4. Redis is accessible from both services

### Problem: Jobs failing

**Check email microservice logs:**
```bash
# Look for error messages
docker logs email-microservice

# Or if running locally
npm run start:dev
```

### Problem: Rate limiting errors

The email microservice automatically handles rate limits with:
- 500ms delay between paginated API calls
- 5-minute cache for email counts
- Automatic retry on failures

---

## Benefits of This Approach

✅ **No HTTP overhead** - Direct queue writes  
✅ **Faster** - No network latency between services  
✅ **More reliable** - Redis persistence, automatic retries  
✅ **Scalable** - Can scale email workers independently  
✅ **Decoupled** - Services communicate via queue, not direct calls  
✅ **Automatic retries** - BullMQ handles failed jobs  
✅ **Job persistence** - Jobs survive crashes  

---

## Production Considerations

1. **Redis High Availability**: Use Redis Cluster or Sentinel for production
2. **Monitoring**: Set up BullMQ Board or Bull Dashboard for queue monitoring
3. **Alerting**: Monitor failed job counts and alert on anomalies
4. **Scaling**: Scale email microservice workers based on queue depth
5. **Dead Letter Queue**: Configure max retries and dead letter handling

---

## Need Help?

- Check email microservice logs for processing errors
- Verify Redis connection from both services
- Ensure payload structure matches expected format (see Available Email Types section)
- Use HTTP endpoints for testing individual emails during development
