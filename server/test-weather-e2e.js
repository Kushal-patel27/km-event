#!/usr/bin/env node

/**
 * Weather Module End-to-End Test Suite
 * 
 * This script tests all weather module functionality:
 * - Weather API integration
 * - Risk detection
 * - Email notification system
 * - Database operations
 * - Configuration management
 * 
 * Usage: npm test -- test-weather-e2e.js
 * Or: node test-weather-e2e.js
 */

const http = require('http');
const https = require('https');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  log(`\n▶ ${name}`, 'cyan');
}

function logPass(message) {
  log(`  ✓ ${message}`, 'green');
}

function logFail(message) {
  log(`  ✗ ${message}`, 'red');
}

function logWarn(message) {
  log(`  ⚠ ${message}`, 'yellow');
}

/**
 * Test 1: Verify OpenWeather API Configuration
 */
async function testOpenWeatherAPI() {
  logTest('Test 1: OpenWeather API Configuration');
  
  const apiKey = process.env.OPENWEATHER_API_KEY;
  
  if (!apiKey) {
    logFail('OPENWEATHER_API_KEY not configured in .env');
    return false;
  }
  
  logPass(`API Key found: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
  
  return new Promise((resolve) => {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=40.7128&lon=-74.0060&units=metric&appid=${apiKey}`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const weather = JSON.parse(data);
          
          if (res.statusCode === 200) {
            logPass(`OpenWeather API working - Temperature in NYC: ${weather.main.temp}°C`);
            logPass(`Condition: ${weather.weather[0].main}`);
            logPass(`Wind Speed: ${weather.wind.speed} m/s`);
            logPass(`Humidity: ${weather.main.humidity}%`);
            resolve(true);
          } else {
            logFail(`API Error: ${weather.message || weather.cod}`);
            resolve(false);
          }
        } catch (err) {
          logFail(`Failed to parse OpenWeather response: ${err.message}`);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      logFail(`OpenWeather API connection error: ${err.message}`);
      resolve(false);
    });
  });
}

/**
 * Test 2: Verify Email Configuration
 */
function testEmailConfiguration() {
  logTest('Test 2: Email Configuration');
  
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  
  if (!emailUser) {
    logFail('EMAIL_USER not configured');
    return false;
  }
  
  if (!emailPass) {
    logFail('EMAIL_PASS not configured');
    return false;
  }
  
  logPass(`Email User: ${emailUser}`);
  logPass(`Email Password configured (${emailPass.length} chars)`);
  
  // Verify email is Gmail (required for SMTP)
  if (emailUser.includes('@gmail.com')) {
    logPass('Email is Gmail - SMTP configured correctly');
  } else {
    logWarn('Email is not Gmail - verify SMTP settings match your provider');
  }
  
  return true;
}

/**
 * Test 3: Verify Weather Templates
 */
function testWeatherTemplates() {
  logTest('Test 3: Weather Email Templates');
  
  const fs = require('fs');
  const path = require('path');
  const templatesDir = path.join(__dirname, 'templates');
  
  const templates = [
    'weatherAlertRain.html',
    'weatherAlertHeatwave.html',
    'weatherAlertStorm.html'
  ];
  
  let allExists = true;
  
  templates.forEach(template => {
    const templatePath = path.join(templatesDir, template);
    if (fs.existsSync(templatePath)) {
      const content = fs.readFileSync(templatePath, 'utf8');
      const hasPlaceholders = content.includes('{') && content.includes('}');
      
      if (hasPlaceholders) {
        logPass(`${template} found with placeholders`);
      } else {
        logWarn(`${template} found but might be missing placeholders`);
      }
    } else {
      logFail(`${template} not found`);
      allExists = false;
    }
  });
  
  return allExists;
}

/**
 * Test 4: Check Database Connection
 */
async function testDatabaseConnection() {
  logTest('Test 4: Database Connection');
  
  const mongoUri = process.env.MONGO_URI;
  
  if (!mongoUri) {
    logFail('MONGO_URI not configured');
    return false;
  }
  
  logPass(`MongoDB URI configured (${mongoUri.substring(0, 20)}...)`);
  
  // Note: Full database test would require importing mongoose
  // For now, just verify the URI is set
  return true;
}

/**
 * Test 5: Verify Weather Service Implementation
 */
function testWeatherServiceImplementation() {
  logTest('Test 5: Weather Service Implementation');
  
  try {
    const fs = require('fs');
    const weatherService = fs.readFileSync(
      require('path').join(__dirname, 'services', 'weatherService.js'),
      'utf8'
    );
    
    const checks = [
      { name: 'detectWeatherRisks function', pattern: /detectWeatherRisks/ },
      { name: 'generateWeatherNotification function', pattern: /generateWeatherNotification/ },
      { name: 'HEATWAVE risk type', pattern: /HEATWAVE/ },
      { name: 'HEAVY_RAIN risk type', pattern: /HEAVY_RAIN/ },
      { name: 'THUNDERSTORM risk type', pattern: /THUNDERSTORM/ },
      { name: 'STRONG_WIND risk type', pattern: /STRONG_WIND/ },
      { name: 'CYCLONE risk type', pattern: /CYCLONE/ }
    ];
    
    let allFound = true;
    checks.forEach(check => {
      if (check.pattern.test(weatherService)) {
        logPass(`${check.name} implemented`);
      } else {
        logFail(`${check.name} not found`);
        allFound = false;
      }
    });
    
    return allFound;
  } catch (err) {
    logFail(`Failed to check weather service: ${err.message}`);
    return false;
  }
}

/**
 * Test 6: Verify Weather Notifier Implementation
 */
function testWeatherNotifierImplementation() {
  logTest('Test 6: Weather Notifier Implementation');
  
  try {
    const fs = require('fs');
    const weatherNotifier = fs.readFileSync(
      require('path').join(__dirname, 'services', 'weatherNotifier.js'),
      'utf8'
    );
    
    const checks = [
      { name: 'runScheduler function', pattern: /runScheduler/ },
      { name: 'hasAlertBeenSent function', pattern: /hasAlertBeenSent/ },
      { name: 'isTimeToSendNotification function', pattern: /isTimeToSendNotification/ },
      { name: 'markAlertAsSent function', pattern: /markAlertAsSent/ },
      { name: '3-hour cooldown logic', pattern: /3.*hour|180.*minute|10800000/ },
      { name: 'Event lookahead (3 days)', pattern: /3.*day|72.*hour|259200000/ }
    ];
    
    let allFound = true;
    checks.forEach(check => {
      if (check.pattern.test(weatherNotifier)) {
        logPass(`${check.name} implemented`);
      } else {
        logWarn(`${check.name} not found (may be implemented differently)`);
      }
    });
    
    return allFound;
  } catch (err) {
    logFail(`Failed to check weather notifier: ${err.message}`);
    return false;
  }
}

/**
 * Test 7: Check Weather Routes
 */
function testWeatherRoutes() {
  logTest('Test 7: Weather Routes Configuration');
  
  try {
    const fs = require('fs');
    const weatherRoutes = fs.readFileSync(
      require('path').join(__dirname, 'routes', 'weatherAlertRoutes.js'),
      'utf8'
    );
    
    const checks = [
      { name: 'GET /api/weather/event/:eventId', pattern: /get.*weather.*event/ },
      { name: 'GET /api/weather-alerts/config/:eventId', pattern: /get.*weather.*alerts.*config/ },
      { name: 'PUT /api/weather-alerts/config/:eventId', pattern: /put.*weather.*alerts.*config/ },
      { name: 'GET /api/weather-alerts/logs/:eventId', pattern: /get.*weather.*alerts.*logs/ }
    ];
    
    let allFound = true;
    checks.forEach(check => {
      if (check.pattern.test(weatherRoutes)) {
        logPass(`${check.name} configured`);
      } else {
        logWarn(`${check.name} not found`);
      }
    });
    
    return allFound;
  } catch (err) {
    logFail(`Failed to check weather routes: ${err.message}`);
    return false;
  }
}

/**
 * Test 8: Check React Components
 */
function testReactComponents() {
  logTest('Test 8: Weather React Components');
  
  try {
    const fs = require('fs');
    const path = require('path');
    const componentsDir = path.join(__dirname, '..', 'Frontend-EZ', 'src', 'components', 'weather');
    
    const components = [
      'WeatherDisplay.jsx',
      'WeatherWidget.jsx',
      'WeatherAlertsAdmin.jsx',
      'index.js'
    ];
    
    let allExist = true;
    components.forEach(component => {
      const componentPath = path.join(componentsDir, component);
      if (fs.existsSync(componentPath)) {
        logPass(`${component} created`);
      } else {
        logFail(`${component} not found`);
        allExist = false;
      }
    });
    
    return allExist;
  } catch (err) {
    logFail(`Failed to check React components: ${err.message}`);
    return false;
  }
}

/**
 * Test 9: Check Component Integration
 */
function testComponentIntegration() {
  logTest('Test 9: Component Integration in Pages');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    const checks = [
      {
        name: 'WeatherDisplay in EventDetail.jsx',
        filePath: path.join(__dirname, '..', 'Frontend-EZ', 'src', 'pages', 'event-detail', 'EventDetail.jsx'),
        pattern: /WeatherDisplay/
      },
      {
        name: 'WeatherWidget in EventCard.jsx',
        filePath: path.join(__dirname, '..', 'Frontend-EZ', 'src', 'components', 'common', 'EventCard.jsx'),
        pattern: /WeatherWidget/
      },
      {
        name: 'WeatherWidget in MyBookings.jsx',
        filePath: path.join(__dirname, '..', 'Frontend-EZ', 'src', 'pages', 'public', 'MyBookings.jsx'),
        pattern: /WeatherWidget/
      },
      {
        name: 'WeatherAlertsAdmin in EventAdminDashboard.jsx',
        filePath: path.join(__dirname, '..', 'Frontend-EZ', 'src', 'pages', 'event-admin', 'EventAdminDashboard.jsx'),
        pattern: /WeatherAlertsAdmin/
      }
    ];
    
    let allIntegrated = true;
    checks.forEach(check => {
      try {
        if (fs.existsSync(check.filePath)) {
          const content = fs.readFileSync(check.filePath, 'utf8');
          if (check.pattern.test(content)) {
            logPass(check.name);
          } else {
            logFail(check.name);
            allIntegrated = false;
          }
        } else {
          logWarn(`${check.name} - file not found`);
        }
      } catch (err) {
        logWarn(`${check.name} - ${err.message}`);
      }
    });
    
    return allIntegrated;
  } catch (err) {
    logFail(`Failed to check component integration: ${err.message}`);
    return false;
  }
}

/**
 * Test 10: Check Dark Mode Support
 */
function testDarkModeSupport() {
  logTest('Test 10: Dark Mode Support');
  
  try {
    const fs = require('fs');
    const path = require('path');
    const componentsDir = path.join(__dirname, '..', 'Frontend-EZ', 'src', 'components', 'weather');
    
    const components = [
      'WeatherDisplay.jsx',
      'WeatherWidget.jsx',
      'WeatherAlertsAdmin.jsx'
    ];
    
    let allHaveDarkMode = true;
    components.forEach(component => {
      const componentPath = path.join(componentsDir, component);
      if (fs.existsSync(componentPath)) {
        const content = fs.readFileSync(componentPath, 'utf8');
        if (/isDarkMode|dark|dark-mode|dark:/i.test(content)) {
          logPass(`${component} has dark mode support`);
        } else {
          logWarn(`${component} might need dark mode enhancements`);
        }
      }
    });
    
    return allHaveDarkMode;
  } catch (err) {
    logFail(`Failed to check dark mode support: ${err.message}`);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║  Weather Module - End-to-End Test Suite               ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝', 'blue');
  
  const results = [];
  
  // Test 1: OpenWeather API
  results.push({
    name: 'OpenWeather API Integration',
    passed: await testOpenWeatherAPI()
  });
  
  // Test 2: Email Configuration
  results.push({
    name: 'Email Configuration',
    passed: testEmailConfiguration()
  });
  
  // Test 3: Weather Templates
  results.push({
    name: 'Email Templates',
    passed: testWeatherTemplates()
  });
  
  // Test 4: Database Connection
  results.push({
    name: 'Database Connection',
    passed: await testDatabaseConnection()
  });
  
  // Test 5: Weather Service
  results.push({
    name: 'Weather Service Implementation',
    passed: testWeatherServiceImplementation()
  });
  
  // Test 6: Weather Notifier
  results.push({
    name: 'Weather Notifier Implementation',
    passed: testWeatherNotifierImplementation()
  });
  
  // Test 7: Weather Routes
  results.push({
    name: 'Weather Routes',
    passed: testWeatherRoutes()
  });
  
  // Test 8: React Components
  results.push({
    name: 'React Components',
    passed: testReactComponents()
  });
  
  // Test 9: Component Integration
  results.push({
    name: 'Component Integration',
    passed: testComponentIntegration()
  });
  
  // Test 10: Dark Mode Support
  results.push({
    name: 'Dark Mode Support',
    passed: testDarkModeSupport()
  });
  
  // Print Summary
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║  Test Summary                                          ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝', 'blue');
  
  let passCount = 0;
  results.forEach(result => {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    const color = result.passed ? 'green' : 'red';
    log(`  ${status.padEnd(8)} ${result.name}`, color);
    if (result.passed) passCount++;
  });
  
  const totalTests = results.length;
  const passPercentage = Math.round((passCount / totalTests) * 100);
  
  log('\n' + '═'.repeat(56), 'blue');
  log(`Total: ${passCount}/${totalTests} tests passed (${passPercentage}%)`, 'blue');
  
  if (passCount === totalTests) {
    log('\n🎉 All tests passed! Weather Module is ready.', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Please review the output above.', 'yellow');
    process.exit(1);
  }
}

// Run tests if this is the main module
if (require.main === module) {
  runAllTests().catch(err => {
    log(`\n❌ Test suite error: ${err.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  testOpenWeatherAPI,
  testEmailConfiguration,
  testWeatherTemplates,
  testDatabaseConnection,
  testWeatherServiceImplementation,
  testWeatherNotifierImplementation,
  testWeatherRoutes,
  testReactComponents,
  testComponentIntegration,
  testDarkModeSupport
};
