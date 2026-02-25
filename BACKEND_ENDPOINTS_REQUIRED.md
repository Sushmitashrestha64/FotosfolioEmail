# Required Backend Endpoints for Cron Jobs

This email microservice's cron jobs will trigger the following endpoints on your main backend. You need to implement these endpoints in your monolithic backend (fotofolio-backend).

## Base URL Configuration
Set `MAIN_BACKEND_URL` in your `.env` file (e.g., `http://localhost:3000`)

---

## Midnight Tasks (Runs at 00:00 daily)

### 1. Process Expired Subscriptions
**Endpoint:** `POST /cron/subscriptions/process-expired`

**Purpose:** Handle subscriptions that expired today
- Query database for expired subscriptions
- Send expired subscription emails via email microservice
- Update subscription status
- Apply grace period logic

**Example Implementation:**
```typescript
// Main backend should:
// 1. Find expired subscriptions
// 2. For each subscription, call email microservice:
await axios.post('http://localhost:3002/subscription', {
  type: 'SUBSCRIPTION_EXPIRED',
  payload: {
    to: user.email,
    userName: user.name,
    graceDaysRemaining: 3
  }
});
```

---

### 2. Expire Add-On Storage
**Endpoint:** `POST /cron/storage/expire-addons`

**Purpose:** Handle expired add-on storage purchases
- Find expired add-ons
- Send expiry notification emails
- Update storage limits
- Apply grace period if needed

**Email Types to Send:**
- `ADDON_EXPIRY` (via `/storage` endpoint)

---

### 3. Send Grace Period Notifications
**Endpoint:** `POST /cron/storage/grace-period-notifications`

**Purpose:** Send final warnings to users in grace period
- Find users in grace period
- Send grace period warning emails
- Calculate days remaining

**Email Types to Send:**
- `ADDON_FINAL_GRACE` (via `/storage` endpoint)

---

### 4. Mark Subscriptions as Ended
**Endpoint:** `POST /cron/subscriptions/mark-ended`

**Purpose:** Mark subscriptions as fully ended after grace period expires
- Find subscriptions past grace period
- Update status to "ended"
- Archive subscription data
- Log end dates

---

## Morning Tasks (Runs at 09:00 daily)

### 5. Send Subscription Expiration Reminders
**Endpoint:** `POST /cron/subscriptions/send-expiration-reminders`

**Purpose:** Remind users their subscription is expiring soon (7 days before)
- Find subscriptions expiring in 7 days
- Send reminder emails
- Track notification sent

**Email Types to Send:**
- `SUBSCRIPTION_EXPIRING` (via `/subscription` endpoint)

---

## Nightly Tasks (Runs at 23:59 daily)

### 6. Update Storage Usage
**Endpoint:** `POST /cron/storage/update-usage`

**Purpose:** Update storage usage tracking
- Calculate actual storage used per user
- Update database records
- Log storage trends

---

### 7. Cleanup Reservations
**Endpoint:** `POST /cron/storage/cleanup-reservations`

**Purpose:** Remove expired storage reservations
- Find expired reservations
- Delete stale reservation records
- Free up reserved storage

---

### 8. Archive Expired Projects
**Endpoint:** `POST /cron/projects/archive-expired`

**Purpose:** Archive projects that have reached expiration
- Find projects to archive
- Move to archived status
- Update project metadata

---

### 9. Delete Expired Projects
**Endpoint:** `POST /cron/projects/delete-expired`

**Purpose:** Permanently delete projects past retention period
- Find archived projects past deletion date
- Delete project files
- Remove database records
- Log deletions

---

## Email Microservice API Reference

Your backend should call this email microservice to send emails:

### Subscription Emails
```typescript
POST http://localhost:3002/subscription
{
  "type": "SUBSCRIPTION_EXPIRED" | "SUBSCRIPTION_EXPIRING" | "SUBSCRIPTION_RENEWED",
  "payload": {
    "to": "user@example.com",
    "userName": "John",
    "graceDaysRemaining": 3,  // for EXPIRED
    "daysRemaining": 7         // for EXPIRING
  }
}
```

### Storage Emails
```typescript
POST http://localhost:3002/storage
{
  "type": "ADDON_EXPIRY" | "ADDON_FINAL_GRACE",
  "payload": {
    "to": "user@example.com",
    "userName": "John",
    "addonLimit": 50,           // GB
    "newStorageLimit": 5,       // GB
    "storageUsed": 8,           // GB
    "graceApplied": true,
    "renewLink": "https://...",
    "graceDaysRemaining": 2
  }
}
```

---

## Implementation Notes

1. **Error Handling:** All endpoints should return:
   ```json
   { "success": true, "message": "...", "processed": 10 }
   ```
   Or on error:
   ```json
   { "success": false, "message": "Error details" }
   ```

2. **Timeout:** Cron jobs have 60-second timeout for backend calls

3. **Idempotency:** Endpoints should be idempotent (safe to call multiple times)

4. **Logging:** Backend should log all cron job executions for monitoring

5. **Async Processing:** For large datasets, consider queuing email sends

6. **Testing:** Use manual trigger endpoints:
   - `POST http://localhost:3002/cron-jobs/midnight`
   - `POST http://localhost:3002/cron-jobs/reminders`
   - `POST http://localhost:3002/cron-jobs/nightly-storage`

---

## Architecture Flow

```
Cron Job (Microservice) → Backend Endpoint → Business Logic → Email Microservice → Send Email
     ↓                         ↓                    ↓                ↓                  ↓
Schedule Trigger         Query Database      Process Data    Queue Email Job     Deliver via Resend
```

**Key Points:**
- Cron jobs only trigger backend (no business logic)
- Backend handles all data queries and decisions
- Backend calls email microservice API to send emails
- Email microservice handles queuing and delivery
