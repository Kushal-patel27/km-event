#!/usr/bin/env node

/**
 * Weather Notification Test Script
 * Tests the weather alert email notification system
 * 
 * Usage: node test-weather-notifications.js <eventId>
 */

import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:5000';

async function testWeatherNotification(eventId) {
  if (!eventId) {
    console.log('❌ Error: Event ID is required');
    console.log('Usage: node test-weather-notifications.js <eventId>');
    process.exit(1);
  }

  console.log('🧪 Starting Weather Notification Test');
  console.log('========================================');
  console.log(`API URL: ${API_URL}`);
  console.log(`Event ID: ${eventId}`);
  console.log('');

  try {
    // Test 1: Heavy Rain Warning
    console.log('📧 Test 1: Sending HEAVY RAIN WARNING...');
    const test1 = await axios.post(`${API_URL}/api/weather/test/notify/${eventId}`, {
      type: 'warning',
      message: '🌧️ Heavy rainfall expected. Carry an umbrella and be prepared for wet conditions!',
      condition: 'Heavy Rain',
      temperature: 22,
      humidity: 92,
      windSpeed: 35,
      rainfall: 15.5,
    });
    console.log('✅ Heavy Rain Test Result:');
    console.log(`   - Status: ${test1.data.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`   - Notified: ${test1.data.result.notified} bookers`);
    if (test1.data.result.failed > 0) {
      console.log(`   - Failed: ${test1.data.result.failed}`);
    }
    console.log('');

    // Test 2: Extreme Heat Caution
    console.log('📧 Test 2: Sending EXTREME HEAT CAUTION...');
    const test2 = await axios.post(`${API_URL}/api/weather/test/notify/${eventId}`, {
      type: 'caution',
      message: '☀️ High temperature. Please drink plenty of water and seek shade when possible.',
      condition: 'Clear',
      temperature: 38,
      humidity: 45,
      windSpeed: 15,
      rainfall: 0,
    });
    console.log('✅ Extreme Heat Test Result:');
    console.log(`   - Status: ${test2.data.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`   - Notified: ${test2.data.result.notified} bookers`);
    if (test2.data.result.failed > 0) {
      console.log(`   - Failed: ${test2.data.result.failed}`);
    }
    console.log('');

    // Test 3: Strong Wind Warning
    console.log('📧 Test 3: Sending STRONG WIND WARNING...');
    const test3 = await axios.post(`${API_URL}/api/weather/test/notify/${eventId}`, {
      type: 'warning',
      message: '💨 Strong wind warning! Be cautious during the event. Secure loose items and be aware of flying objects.',
      condition: 'Clouds',
      temperature: 25,
      humidity: 70,
      windSpeed: 55,
      rainfall: 2,
    });
    console.log('✅ Strong Wind Test Result:');
    console.log(`   - Status: ${test3.data.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`   - Notified: ${test3.data.result.notified} bookers`);
    if (test3.data.result.failed > 0) {
      console.log(`   - Failed: ${test3.data.result.failed}`);
    }
    console.log('');

    // Test 4: Thunderstorm Warning
    console.log('📧 Test 4: Sending THUNDERSTORM WARNING...');
    const test4 = await axios.post(`${API_URL}/api/weather/test/notify/${eventId}`, {
      type: 'warning',
      message: '⚡ Severe weather warning! Thunderstorm or tornado expected. Please take shelter immediately.',
      condition: 'Thunderstorm',
      temperature: 20,
      humidity: 88,
      windSpeed: 60,
      rainfall: 25,
    });
    console.log('✅ Thunderstorm Test Result:');
    console.log(`   - Status: ${test4.data.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`   - Notified: ${test4.data.result.notified} bookers`);
    if (test4.data.result.failed > 0) {
      console.log(`   - Failed: ${test4.data.result.failed}`);
    }
    console.log('');

    // Summary
    console.log('========================================');
    console.log('📊 Test Summary:');
    const totalNotified = test1.data.result.notified + test2.data.result.notified + test3.data.result.notified + test4.data.result.notified;
    console.log(`✅ Total notifications sent: ${totalNotified}`);
    console.log('');
    console.log('📧 Check your email inbox for test notifications!');
    console.log('');
    console.log('✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else if (error.request) {
      console.error('No response from server. Make sure the backend is running on:', API_URL);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

// Get event ID from command line arguments
const eventId = process.argv[2];
testWeatherNotification(eventId);
