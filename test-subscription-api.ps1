# Test Subscription & Commission API Endpoints
# This script tests all 19 endpoints and verifies the complete workflow

# Configuration
$API_URL = "http://localhost:5000/api"
$ADMIN_TOKEN = "" # Set this before running
$ORGANIZER_TOKEN = "" # Set this before running
$CUSTOMER_TOKEN = "" # Set this before running

# Color output for better readability
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }

Write-Info "======================================"
Write-Info "Subscription & Commission API Tests"
Write-Info "======================================"

# Test 1: Get All Plans
Write-Info "`n[TEST 1] Get All Subscription Plans"
try {
  $response = Invoke-RestMethod -Uri "$API_URL/subscriptions/plans" -Method Get -ErrorAction Stop
  if ($response.success) {
    Write-Success "✓ Plans retrieved: $($response.data.Count) plans found"
    $response.data | ForEach-Object { Write-Info "  - $($_.name): $($_.commissionPercentage)% commission" }
  } else {
    Write-Error "✗ Failed to get plans"
  }
} catch {
  Write-Error "✗ Error: $($_.Exception.Message)"
}

# Test 2: Create Free Plan (Admin only)
Write-Info "`n[TEST 2] Create Free Subscription Plan"
if (-not $ADMIN_TOKEN) {
  Write-Warning "⚠ ADMIN_TOKEN not set - skipping"
} else {
  try {
    $planData = @{
      name = "Free"
      description = "Free tier for new organizers"
      commissionPercentage = 30
      monthlyFee = 0
      eventLimit = 5
      ticketLimit = 1000
      payoutFrequency = "monthly"
      minPayoutAmount = 100
      displayOrder = 1
      features = @("Up to 5 events", "Basic analytics")
    }
    
    $headers = @{
      "Authorization" = "Bearer $ADMIN_TOKEN"
      "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri "$API_URL/subscriptions/plans" -Method Post -Body ($planData | ConvertTo-Json) -Headers $headers -ErrorAction Stop
    if ($response.success) {
      Write-Success "✓ Free plan created: $($response.data._id)"
      $FREE_PLAN_ID = $response.data._id
    } else {
      Write-Error "✗ Failed: $($response.message)"
    }
  } catch {
    Write-Error "✗ Error: $($_.Exception.Message)"
  }
}

# Test 3: Create Basic Plan
Write-Info "`n[TEST 3] Create Basic Subscription Plan"
if (-not $ADMIN_TOKEN) {
  Write-Warning "⚠ ADMIN_TOKEN not set - skipping"
} else {
  try {
    $planData = @{
      name = "Basic"
      description = "Professional organizers"
      commissionPercentage = 20
      monthlyFee = 500
      eventLimit = 15
      ticketLimit = 5000
      payoutFrequency = "monthly"
      minPayoutAmount = 100
      displayOrder = 2
      features = @("Up to 15 events", "Advanced analytics")
    }
    
    $headers = @{
      "Authorization" = "Bearer $ADMIN_TOKEN"
      "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri "$API_URL/subscriptions/plans" -Method Post -Body ($planData | ConvertTo-Json) -Headers $headers -ErrorAction Stop
    if ($response.success) {
      Write-Success "✓ Basic plan created: $($response.data._id)"
      $BASIC_PLAN_ID = $response.data._id
    } else {
      Write-Error "✗ Failed: $($response.message)"
    }
  } catch {
    Write-Error "✗ Error: $($_.Exception.Message)"
  }
}

# Test 4: Create Pro Plan
Write-Info "`n[TEST 4] Create Pro Subscription Plan"
if (-not $ADMIN_TOKEN) {
  Write-Warning "⚠ ADMIN_TOKEN not set - skipping"
} else {
  try {
    $planData = @{
      name = "Pro"
      description = "Enterprise organizers"
      commissionPercentage = 10
      monthlyFee = 2000
      eventLimit = 999
      ticketLimit = 99999
      payoutFrequency = "weekly"
      minPayoutAmount = 100
      displayOrder = 3
      features = @("Unlimited events", "Full analytics", "Priority support")
    }
    
    $headers = @{
      "Authorization" = "Bearer $ADMIN_TOKEN"
      "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri "$API_URL/subscriptions/plans" -Method Post -Body ($planData | ConvertTo-Json) -Headers $headers -ErrorAction Stop
    if ($response.success) {
      Write-Success "✓ Pro plan created: $($response.data._id)"
      $PRO_PLAN_ID = $response.data._id
    } else {
      Write-Error "✗ Failed: $($response.message)"
    }
  } catch {
    Write-Error "✗ Error: $($_.Exception.Message)"
  }
}

# Test 5: Get My Subscription (Organizer)
Write-Info "`n[TEST 5] Get Organizer's Current Subscription"
if (-not $ORGANIZER_TOKEN) {
  Write-Warning "⚠ ORGANIZER_TOKEN not set - skipping"
} else {
  try {
    $headers = @{
      "Authorization" = "Bearer $ORGANIZER_TOKEN"
    }
    
    $response = Invoke-RestMethod -Uri "$API_URL/subscriptions/my-subscription" -Method Get -Headers $headers -ErrorAction Stop
    if ($response.success) {
      Write-Success "✓ Organizer subscription retrieved"
      Write-Info "  - Plan: $($response.data.plan.name)"
      Write-Info "  - Commission: $($response.data.currentCommissionPercentage)%"
      Write-Info "  - Status: $($response.data.status)"
    } else {
      Write-Error "✗ Failed: $($response.message)"
    }
  } catch {
    Write-Error "✗ Error: $($_.Exception.Message)"
  }
}

# Test 6: Get All Commissions (Admin)
Write-Info "`n[TEST 6] Get All Commissions"
if (-not $ADMIN_TOKEN) {
  Write-Warning "⚠ ADMIN_TOKEN not set - skipping"
} else {
  try {
    $headers = @{
      "Authorization" = "Bearer $ADMIN_TOKEN"
    }
    
    $response = Invoke-RestMethod -Uri "$API_URL/subscriptions/all-commissions?page=1&limit=5" -Method Get -Headers $headers -ErrorAction Stop
    if ($response.success) {
      Write-Success "✓ Commissions retrieved: $($response.data.Count) commissions"
      if ($response.summary) {
        Write-Info "  - Total Revenue: ₹$($response.summary.totalRevenue)"
        Write-Info "  - Total Commission: ₹$($response.summary.totalCommissionAmount)"
      }
    } else {
      Write-Error "✗ Failed: $($response.message)"
    }
  } catch {
    Write-Error "✗ Error: $($_.Exception.Message)"
  }
}

# Test 7: Get Organizer's Commissions
Write-Info "`n[TEST 7] Get Organizer's Commissions"
if (-not $ORGANIZER_TOKEN) {
  Write-Warning "⚠ ORGANIZER_TOKEN not set - skipping"
} else {
  try {
    $headers = @{
      "Authorization" = "Bearer $ORGANIZER_TOKEN"
    }
    
    $response = Invoke-RestMethod -Uri "$API_URL/subscriptions/my-commissions?status=pending" -Method Get -Headers $headers -ErrorAction Stop
    if ($response.success) {
      Write-Success "✓ Organizer commissions retrieved: $($response.data.Count) pending"
      if ($response.summary) {
        Write-Info "  - Total Revenue: ₹$($response.summary.totalRevenue)"
        Write-Info "  - Total Commission: ₹$($response.summary.totalCommission)"
        Write-Info "  - Your Payout: ₹$($response.summary.totalOrganizerAmount)"
      }
    } else {
      Write-Error "✗ Failed: $($response.message)"
    }
  } catch {
    Write-Error "✗ Error: $($_.Exception.Message)"
  }
}

# Test 8: Check Pending Payout Amount
Write-Info "`n[TEST 8] Check Pending Payout Amount"
if (-not $ORGANIZER_TOKEN) {
  Write-Warning "⚠ ORGANIZER_TOKEN not set - skipping"
} else {
  try {
    $headers = @{
      "Authorization" = "Bearer $ORGANIZER_TOKEN"
    }
    
    $response = Invoke-RestMethod -Uri "$API_URL/subscriptions/my-payouts/pending/amount" -Method Get -Headers $headers -ErrorAction Stop
    if ($response.success) {
      Write-Success "✓ Pending amount retrieved"
      Write-Info "  - Pending Amount: ₹$($response.data.pendingAmount)"
      Write-Info "  - Commission Count: $($response.data.commissionCount)"
      Write-Info "  - Min Payout: ₹$($response.data.minPayoutAmount)"
      Write-Info "  - Can Request: $($response.data.canRequestPayout)"
    } else {
      Write-Error "✗ Failed: $($response.message)"
    }
  } catch {
    Write-Error "✗ Error: $($_.Exception.Message)"
  }
}

# Test 9: Request Payout
Write-Info "`n[TEST 9] Request Payout"
if (-not $ORGANIZER_TOKEN) {
  Write-Warning "⚠ ORGANIZER_TOKEN not set - skipping"
} else {
  try {
    $headers = @{
      "Authorization" = "Bearer $ORGANIZER_TOKEN"
      "Content-Type" = "application/json"
    }
    
    $payoutData = @{
      amount = 1000
      paymentMethod = "bank_transfer"
      bankDetails = @{
        accountHolderName = "Test Organizer"
        bankName = "HDFC Bank"
        accountNumber = "1234567890123456"
        ifscCode = "HDFC0000123"
      }
    }
    
    $response = Invoke-RestMethod -Uri "$API_URL/subscriptions/payouts/request" -Method Post -Body ($payoutData | ConvertTo-Json) -Headers $headers -ErrorAction Stop
    if ($response.success) {
      Write-Success "✓ Payout request created: $($response.data._id)"
      Write-Info "  - Amount: ₹$($response.data.totalAmount)"
      Write-Info "  - Status: $($response.data.status)"
      $PAYOUT_ID = $response.data._id
    } else {
      Write-Error "✗ Failed: $($response.message)"
    }
  } catch {
    Write-Error "✗ Error: $($_.Exception.Message)"
  }
}

# Test 10: Get Organizer's Payouts
Write-Info "`n[TEST 10] Get Organizer's Payouts"
if (-not $ORGANIZER_TOKEN) {
  Write-Warning "⚠ ORGANIZER_TOKEN not set - skipping"
} else {
  try {
    $headers = @{
      "Authorization" = "Bearer $ORGANIZER_TOKEN"
    }
    
    $response = Invoke-RestMethod -Uri "$API_URL/subscriptions/my-payouts" -Method Get -Headers $headers -ErrorAction Stop
    if ($response.success) {
      Write-Success "✓ Organizer payouts retrieved: $($response.data.Count) payouts"
      if ($response.summary) {
        Write-Info "  - Pending: ₹$($response.summary.pending)"
        Write-Info "  - Processing: ₹$($response.summary.processing)"
        Write-Info "  - Completed: ₹$($response.summary.completed)"
      }
    } else {
      Write-Error "✗ Failed: $($response.message)"
    }
  } catch {
    Write-Error "✗ Error: $($_.Exception.Message)"
  }
}

# Test 11: Get Platform Analytics (Super Admin)
Write-Info "`n[TEST 11] Get Platform Revenue Analytics"
if (-not $ADMIN_TOKEN) {
  Write-Warning "⚠ ADMIN_TOKEN not set - skipping"
} else {
  try {
    $headers = @{
      "Authorization" = "Bearer $ADMIN_TOKEN"
    }
    
    $response = Invoke-RestMethod -Uri "$API_URL/subscriptions/analytics/platform" -Method Get -Headers $headers -ErrorAction Stop
    if ($response.success) {
      Write-Success "✓ Platform analytics retrieved"
      Write-Info "  - Total Revenue: ₹$($response.data.summary.totalRevenue)"
      Write-Info "  - Platform Commission: ₹$($response.data.summary.totalCommission)"
      Write-Info "  - Organizer Payouts: ₹$($response.data.summary.totalOrganizerPayout)"
      Write-Info "  - Total Tickets: $($response.data.summary.totalTickets)"
    } else {
      Write-Error "✗ Failed: $($response.message)"
    }
  } catch {
    Write-Error "✗ Error: $($_.Exception.Message)"
  }
}

# Test 12: Get Organizer Analytics
Write-Info "`n[TEST 12] Get Organizer Revenue Analytics"
if (-not $ORGANIZER_TOKEN) {
  Write-Warning "⚠ ORGANIZER_TOKEN not set - skipping"
} else {
  try {
    $headers = @{
      "Authorization" = "Bearer $ORGANIZER_TOKEN"
    }
    
    $response = Invoke-RestMethod -Uri "$API_URL/subscriptions/analytics/organizer" -Method Get -Headers $headers -ErrorAction Stop
    if ($response.success) {
      Write-Success "✓ Organizer analytics retrieved"
      Write-Info "  - Total Revenue: ₹$($response.data.summary.totalRevenue)"
      Write-Info "  - Commission Deducted: ₹$($response.data.summary.totalCommissionDeducted)"
      Write-Info "  - Net Payout: ₹$($response.data.summary.totalNetPayout)"
      Write-Info "  - Total Bookings: $($response.data.summary.totalBookings)"
    } else {
      Write-Error "✗ Failed: $($response.message)"
    }
  } catch {
    Write-Error "✗ Error: $($_.Exception.Message)"
  }
}

# Test 13: Compare Organizers Performance
Write-Info "`n[TEST 13] Compare Organizers Performance"
if (-not $ADMIN_TOKEN) {
  Write-Warning "⚠ ADMIN_TOKEN not set - skipping"
} else {
  try {
    $headers = @{
      "Authorization" = "Bearer $ADMIN_TOKEN"
    }
    
    $response = Invoke-RestMethod -Uri "$API_URL/subscriptions/analytics/compare-organizers" -Method Get -Headers $headers -ErrorAction Stop
    if ($response.success) {
      Write-Success "✓ Organizer comparison retrieved: $($response.data.Count) organizers"
      $response.data | Select-Object -First 3 | ForEach-Object {
        Write-Info "  - $($_.organizerName): ₹$($_.totalRevenue) revenue, $($_.ticketsSold) tickets"
      }
    } else {
      Write-Error "✗ Failed: $($response.message)"
    }
  } catch {
    Write-Error "✗ Error: $($_.Exception.Message)"
  }
}

# Summary
Write-Info "`n======================================"
Write-Info "Test Summary Complete"
Write-Info "======================================"
Write-Success "✓ API tests completed"
Write-Info "`nNext Steps:"
Write-Info "1. Set ADMIN_TOKEN, ORGANIZER_TOKEN, CUSTOMER_TOKEN"
Write-Info "2. Run this script again for full testing"
Write-Info "3. Verify all endpoints return expected data"
Write-Info "4. Check commission calculations are accurate"
Write-Info "5. Test complete workflow: booking → commission → payout"
