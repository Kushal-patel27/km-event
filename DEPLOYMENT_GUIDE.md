# Razorpay Integration Checklist & Deployment Guide

## ✅ Implementation Checklist

### Backend Files
- [x] Payment model (`server/models/Payment.js`)
- [x] Payment controller (`server/controllers/paymentController.js`)
- [x] Analytics controller (`server/controllers/analyticsController.js`)
- [x] Payment routes (`server/routes/paymentRoutes.js`)
- [x] Analytics routes (`server/routes/analyticsRoutes.js`)
- [x] Payment utilities (`server/utils/paymentUtils.js`)
- [x] Enhanced email service (`server/utils/emailService.js`)
- [x] Updated Booking model
- [x] Updated Server.js with routes
- [x] Updated package.json with dependencies

### Frontend Files
- [x] Razorpay Checkout component (`Frontend-EZ/src/components/RazorpayCheckout.jsx`)
- [x] Updated MyBookings page with payment UI

### Configuration
- [x] .env file updated with Razorpay credentials
- [x] Webhook endpoint configuration

### Documentation
- [x] RAZORPAY_INTEGRATION.md (comprehensive)
- [x] RAZORPAY_QUICK_START.md (quick setup)
- [x] This file (deployment guide)

## 🔧 Pre-Deployment Setup

### 1. Environment Configuration
```bash
# server/.env
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### 2. Dependencies Installation
```bash
cd server
npm install
# Verify packages: razorpay, pdfkit, existing packages
npm list razorpay
npm list pdfkit
```

### 3. Database Preparation
```bash
# No migration needed - Payment model auto-creates
# Booking model updated fields are optional (backward compatible)
```

### 4. Razorpay Dashboard Configuration

#### Get Credentials
1. Login to https://dashboard.razorpay.com
2. Click Account → Settings → API Keys
3. Copy Key ID and Key Secret
4. Save WEBHOOK_SECRET from Webhooks section

#### Configure Webhook
1. Go to Webhooks section
2. Add new webhook with URL: `https://yourdomain.com/api/payments/webhook`
3. Select events:
   - payment.authorized
   - payment.captured
   - payment.failed
   - refund.created
   - refund.processed
4. Copy Webhook Secret

#### Set API Key Restrictions (Optional but Recommended)
1. Settings → API Keys
2. IP Whitelist: Add your server IP
3. Permissions: Ensure "Payments" and "Refunds" are enabled

### 5. Testing in Sandbox

Test with these credentials (if in sandbox mode):
- **Key ID**: rzp_test_XXXXX
- **Key Secret**: Sandbox secret
- **Test Card**: 4111111111111111
- **Expiry**: Any future date (e.g., 12/25)
- **CVV**: Any 3 digits (e.g., 999)

## 🚀 Deployment Steps

### Step 1: Backend Deployment
```bash
# Install dependencies
cd server
npm install

# Verify Razorpay package
npm list razorpay
npm list pdfkit

# Set environment variables on production server
export RAZORPAY_KEY_ID=your_live_key_id
export RAZORPAY_KEY_SECRET=your_live_key_secret
export RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Start server
npm run dev  # or npm start for production
```

### Step 2: Verify Backend Endpoints

```bash
# Health check
curl http://localhost:5000/

# Create test booking first, then:

# Create order
curl -X POST http://localhost:5000/api/payments/order \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{"bookingId": "booking_id"}'

# Expected response:
# { "success": true, "orderId": "order_id", "key": "...", ... }

# Get payment status
curl http://localhost:5000/api/payments/status/booking_id \
  -H "Authorization: Bearer your_token"
```

### Step 3: Frontend Deployment
```bash
# Build frontend
cd Frontend-EZ
npm run build

# The Razorpay SDK loads automatically via CDN
# No additional configuration needed
```

### Step 4: Webhook Configuration on Live Server
1. Go to Razorpay Dashboard → Webhooks
2. Update webhook URL to live domain: `https://yourdomain.com/api/payments/webhook`
3. Test webhook in dashboard:
   - Send test payload
   - Verify 200 response
   - Check server logs for processing

### Step 5: SSL/TLS Verification
```bash
# Ensure HTTPS is enabled
# Razorpay requires HTTPS for webhooks in production

# Test SSL
curl -I https://yourdomain.com/api/payments/webhook
```

## 🧪 Post-Deployment Testing

### Integration Tests

#### Test 1: Create Payment Order
```bash
Request: POST /api/payments/order
Body: { "bookingId": "test_booking_id" }
Expected: 200 OK with orderId and Razorpay key
```

#### Test 2: Verify Payment
```bash
Request: POST /api/payments/verify
Body: {
  "razorpayOrderId": "order_123",
  "razorpayPaymentId": "pay_456",
  "razorpaySignature": "signature",
  "bookingId": "booking_789"
}
Expected: 200 OK with verified payment
```

#### Test 3: Check Analytics
```bash
Request: GET /api/analytics/payments/analytics
Expected: 200 OK with revenue data
```

#### Test 4: Test Refund
```bash
Request: POST /api/payments/refund
Body: { "bookingId": "test_booking" }
Expected: 200 OK with refund initiated
```

### E2E Flow Test
1. Create event + booking
2. Navigate to My Bookings
3. Click "Pay Now"
4. Enter test card details
5. Complete payment
6. Verify:
   - Payment status shows "Confirmed"
   - QR codes generated
   - Email received
   - Analytics updated

### Webhook Test
1. In Razorpay Dashboard, go to Webhooks
2. Select your webhook → Test
3. Send test payment.captured event
4. Check server logs for processing
5. Verify no "duplicate" logs

## 📊 Monitoring Checklist

### Application Metrics
- [ ] Payment creation success rate (target: >99%)
- [ ] Payment verification speed (<1s)
- [ ] Webhook processing latency (<500ms)
- [ ] Email delivery success rate (>95%)
- [ ] QR code generation success (>99%)

### Error Monitoring
- [ ] Failed payment logs
- [ ] Webhook errors
- [ ] Database connection issues
- [ ] Email delivery failures
- [ ] Rate limit violations

### Security Monitoring
- [ ] Signature verification failures
- [ ] Duplicate payment attempts
- [ ] Unauthorized refund requests
- [ ] Webhook IP validation
- [ ] API rate limits

## 🔍 Troubleshooting

### Common Issues

#### 1. "Razorpay is not defined"
**Cause**: SDK not loaded
**Fix**: 
- Check internet connection
- Clear browser cache
- Verify no CSP blocking scripts
- Check browser console for errors

#### 2. "Payment verification failed"
**Cause**: Invalid signature
**Fix**:
- Verify RAZORPAY_KEY_SECRET is correct
- Check signature calculation
- Ensure no whitespace in secrets

#### 3. "Webhook not processing"
**Cause**: Multiple possibilities
**Fix**:
- Verify webhook URL is public (test with curl)
- Check RAZORPAY_WEBHOOK_SECRET matches
- Ensure server logs for processing attempts
- Test webhook in Razorpay dashboard
- Check firewall/security groups

#### 4. "QR codes not generating"
**Cause**: qrcode package issue
**Fix**:
```bash
npm install qrcode --save
npm list qrcode
```

#### 5. "Email not sending"
**Cause**: SMTP configuration
**Fix**:
- Verify EMAIL_USER and EMAIL_PASS in .env
- Check Gmail app password (not regular password)
- Verify 2FA enabled on email account
- Check server logs for SMTP errors

### Debug Mode
Enable detailed logging:
```javascript
// In paymentController.js
const DEBUG = process.env.DEBUG === 'true';

if (DEBUG) console.log('Payment details:', payment);
```

## 📈 Performance Optimization

### Database Optimization
```javascript
// Indexes are auto-created by model
// Verify:
db.payments.getIndexes()
```

### Caching Strategy
```javascript
// Consider caching analytics data
// Example: Cache for 5 minutes
const ANALYTICS_CACHE_TIME = 5 * 60 * 1000;
```

### Rate Limiting
```javascript
// Implement in routes
import rateLimit from 'express-rate-limit';

const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many payment requests'
});

router.post('/order', paymentLimiter, createOrder);
```

## 🔐 Security Hardening

### Additional Measures (Recommended)

1. **Enable IP Whitelisting**
   ```bash
   # In Razorpay dashboard
   Settings → API Keys → IP Whitelist
   ```

2. **Use Webhook IP Validation**
   ```javascript
   const RAZORPAY_WEBHOOK_IPS = ['1.2.3.4', ...];
   
   if (!RAZORPAY_WEBHOOK_IPS.includes(req.ip)) {
     return res.status(403).json({ error: 'Unauthorized' });
   }
   ```

3. **Encrypt Sensitive Data**
   ```bash
   npm install crypto
   # Store encrypted payment details in database
   ```

4. **Implement CSRF Protection**
   ```bash
   npm install csrf
   ```

5. **Use HTTPS Only**
   ```javascript
   app.use((req, res, next) => {
     if (!req.secure && process.env.NODE_ENV === 'production') {
       return res.redirect(`https://${req.headers.host}${req.url}`);
     }
     next();
   });
   ```

## 📋 Compliance Checklist

- [ ] PCI DSS Compliance (Razorpay handles)
- [ ] GDPR Compliance (Data storage)
- [ ] Tax/GST calculations
- [ ] Invoice generation
- [ ] Data retention policies
- [ ] Audit logging enabled
- [ ] Privacy policy updated
- [ ] Terms updated

## 🆘 Support Contacts

**Razorpay Support**: https://razorpay.com/support
- Email: support@razorpay.com
- Phone: +91-20-6645-0300

**Your Team Support**:
- Admin: support@kmevents.com
- Dev: dev-team@kmevents.com

## 📅 Post-Launch Tasks

- [ ] Monitor payment metrics daily
- [ ] Review webhook logs
- [ ] Check error logs
- [ ] Verify email delivery
- [ ] Monitor database performance
- [ ] Review security logs
- [ ] Get user feedback
- [ ] Plan V2 features

## 🎉 Launch Checklist

- [ ] Backend deployed and running
- [ ] Frontend deployed with new component
- [ ] Razorpay credentials configured
- [ ] Webhooks configured and tested
- [ ] Email service working
- [ ] Database properly indexed
- [ ] SSL/TLS enabled
- [ ] Monitoring and alerts set up
- [ ] Documentation complete
- [ ] Team trained on system
- [ ] Backup strategy in place
- [ ] Disaster recovery plan ready

## 🚀 You're Ready!

Once all items are checked, your payment system is production-ready with:
- Secure Razorpay integration
- Automatic ticket generation
- Email confirmations
- Complete analytics
- Refund management
- Admin controls

Go live and start accepting payments!
