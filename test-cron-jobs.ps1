# Cron Jobs Test Script
# Test the manual trigger endpoints for cron jobs

$baseUrl = "http://localhost:3002/api/cron-jobs"

Write-Host "`n=== Testing Cron Jobs Endpoints ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Trigger Midnight Tasks
Write-Host "1. Testing Midnight Tasks..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Method Post -Uri "$baseUrl/midnight" -ContentType "application/json"
    if ($response.success) {
        Write-Host "   ✅ Success: $($response.message)" -ForegroundColor Green
        Write-Host "   Duration: $($response.data.duration)" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Failed: $($response.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# Test 2: Trigger Reminder Tasks
Write-Host "`n2. Testing Subscription Reminders..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Method Post -Uri "$baseUrl/reminders" -ContentType "application/json"
    if ($response.success) {
        Write-Host "   ✅ Success: $($response.message)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Failed: $($response.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# Test 3: Trigger Nightly Storage Tasks
Write-Host "`n3. Testing Nightly Storage Tasks..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Method Post -Uri "$baseUrl/nightly-storage" -ContentType "application/json"
    if ($response.success) {
        Write-Host "   ✅ Success: $($response.message)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Failed: $($response.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n====================" -ForegroundColor Cyan
Write-Host "Cron Jobs Test Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Note: These are placeholder tests. No emails will be sent" -ForegroundColor Gray
Write-Host "until you implement the data fetching from main backend API." -ForegroundColor Gray
Write-Host ""
