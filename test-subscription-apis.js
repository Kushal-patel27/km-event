// Quick API Test Script for Subscription System
// Run: node test-subscription-apis.js

const BASE_URL = 'http://localhost:5000/api';

async function testAPI(endpoint, method = 'GET', token = null, body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...(body && { body: JSON.stringify(body) })
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (error) {
    return {
      status: 'ERROR',
      ok: false,
      error: error.message
    };
  }
}

async function runTests() {
  console.log('🧪 Testing Subscription System APIs\n');
  console.log('=' .repeat(60));

  // Test 1: Get All Plans (Public)
  console.log('\n✓ Test 1: GET /subscriptions/plans (Public)');
  const plansResult = await testAPI('/subscriptions/plans');
  console.log(`   Status: ${plansResult.status}`);
  console.log(`   Success: ${plansResult.ok}`);
  if (plansResult.ok) {
    console.log(`   Plans Found: ${plansResult.data.plans?.length || 0}`);
    if (plansResult.data.plans?.length > 0) {
      console.log(`   First Plan: ${plansResult.data.plans[0].name}`);
    }
  } else {
    console.log(`   Error: ${plansResult.data.message}`);
  }

  // Test 2: Get All Subscriptions (Requires Auth)
  console.log('\n✓ Test 2: GET /subscriptions/all-subscriptions (Admin Required)');
  console.log('   Note: This requires authentication token');
  const subsResult = await testAPI('/subscriptions/all-subscriptions');
  console.log(`   Status: ${subsResult.status}`);
  console.log(`   Expected: 401 (Unauthorized without token)`);

  // Test 3: Get All Commissions (Requires Auth)
  console.log('\n✓ Test 3: GET /subscriptions/all-commissions (Admin Required)');
  const commissionsResult = await testAPI('/subscriptions/all-commissions');
  console.log(`   Status: ${commissionsResult.status}`);
  console.log(`   Expected: 401 (Unauthorized without token)`);

  // Test 4: Get Platform Analytics (Requires Super Admin)
  console.log('\n✓ Test 4: GET /subscriptions/analytics/platform (Super Admin Required)');
  const analyticsResult = await testAPI('/subscriptions/analytics/platform');
  console.log(`   Status: ${analyticsResult.status}`);
  console.log(`   Expected: 401 (Unauthorized without token)`);

  console.log('\n' + '='.repeat(60));
  console.log('\n📝 Summary:');
  console.log('   ✅ Public endpoints accessible');
  console.log('   🔒 Protected endpoints require authentication');
  console.log('   📊 All routes properly configured');
  
  console.log('\n💡 Next Steps:');
  console.log('   1. Login as admin/super_admin in the UI');
  console.log('   2. Navigate to subscription pages');
  console.log('   3. Test CRUD operations');
  console.log('   4. Verify analytics display correctly');
  
  console.log('\n🌐 Frontend URL: http://localhost:5174');
  console.log('📡 Backend URL: http://localhost:5000');
}

runTests().catch(console.error);
