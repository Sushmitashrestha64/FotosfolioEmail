# Cron Jobs Module

This module provides scheduled task execution for the email microservice. It triggers backend endpoints at specified times to handle subscription expirations, storage management, and project cleanup.

## Architecture

```
Cron Scheduler → Backend API → Business Logic → Email Microservice
(This Service)   (Main Backend)  (Query + Process)  (Send Emails)
```

**Key Principle:** This cron service ONLY triggers backend endpoints. All business logic, database queries, and email sending decisions happen in the main backend.

## Configuration

Set in `.env`:
```env
MAIN_BACKEND_URL=http://localhost:3000
```

## Scheduled Tasks

### Midnight Tasks (00:00 daily)
Triggers backend endpoints for:
- Process expired subscriptions → `/cron/subscriptions/process-expired`
- Expire add-on storage → `/cron/storage/expire-addons`
- Send grace period notifications → `/cron/storage/grace-period-notifications`
- Mark subscriptions as ended → `/cron/subscriptions/mark-ended`

### Morning Tasks (09:00 daily)
Triggers backend endpoint for:
- Send subscription expiration reminders → `/cron/subscriptions/send-expiration-reminders`

### Nightly Tasks (23:59 daily)
Triggers backend endpoints for:
- Update storage usage → `/cron/storage/update-usage`
- Cleanup reservations → `/cron/storage/cleanup-reservations`
- Archive expired projects → `/cron/projects/archive-expired`
- Delete expired projects → `/cron/projects/delete-expired`

## Manual Triggers (Testing)

For development and testing, you can manually trigger cron jobs:

```bash
# Trigger midnight tasks
curl -X POST http://localhost:3002/cron-jobs/midnight

# Trigger subscription reminders
curl -X POST http://localhost:3002/cron-jobs/reminders

# Trigger nightly tasks
curl -X POST http://localhost:3002/cron-jobs/nightly-storage
```

Or use the PowerShell test script:
```powershell
.\test-cron-jobs.ps1
```

## Backend Requirements

The main backend must implement all required endpoints. See [BACKEND_ENDPOINTS_REQUIRED.md](../../BACKEND_ENDPOINTS_REQUIRED.md) for complete specifications.

Each backend endpoint should:
1. Query the database for relevant data
2. Process business logic
3. Call email microservice API to send emails
4. Return success/failure response

## Error Handling

- **Backend Unavailable:** Logs warning and continues
- **Endpoint Errors:** Logs error with details, individual tasks may fail without stopping others
- **Timeout:** 60 seconds per backend request

## Monitoring

All cron executions are logged with:
- Start/end timestamps
- Duration
- Results per task
- Errors and warnings

Check logs for cron job status:
```
[Cron] Starting midnight tasks at 2026-02-25T00:00:00.000Z
[API] Calling POST http://localhost:3000/cron/subscriptions/process-expired
[API] ✅ /cron/subscriptions/process-expired completed successfully
[Cron] ✅ Midnight tasks completed. Duration: 2.5s
```

## Development

To disable cron jobs during development, comment out the schedule decorators in `cron-jobs.service.ts`:

```typescript
// @Cron('0 0 * * *')  // Disabled
async runMidnightTasks() {
  // ...
}
```

Or use manual triggers instead of waiting for scheduled execution.
