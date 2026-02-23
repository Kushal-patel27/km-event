# 🧪 Calendar Integration - Testing Guide

## Testing the Calendar Integration Feature

### Prerequisites
- K&M Events application running
- Email service configured (Gmail SMTP)
- Test user account created
- Active event with available tickets

---

## Test Scenario 1: Complete Booking Flow

### Steps:
1. **Login as a regular user**
2. **Browse available events**
3. **Select an event and book tickets**
4. **Complete payment**
5. **Check email inbox for booking confirmation**

### Expected Results:
✅ Email received with subject: "Booking Confirmed: [Event Name] - K&M Events"  
✅ Email contains "📅 Add to Your Calendar" section  
✅ Four calendar buttons visible:
   - 📅 Google Calendar (Blue button)
   - 📧 Outlook (Dark blue button)
   - 🟣 Yahoo (Purple button)
   - 🍎 Apple Calendar (Black button)  
✅ .ics file attached to email (event.ics)

---

## Test Scenario 2: Google Calendar Integration

### Steps:
1. Open booking confirmation email
2. Click "📅 Google Calendar" button

### Expected Results:
✅ Opens Google Calendar in new tab/window  
✅ Event details pre-filled:
   - Title: Event name
   - Date: Correct event date
   - Time: Correct event time
   - Location: Event venue
   - Description: "Your ticket booking for [Event]. Booking ID: [ID]"  
✅ Can click "Save" to add to calendar

---

## Test Scenario 3: Outlook Calendar Integration

### Steps:
1. Open booking confirmation email
2. Click "📧 Outlook" button

### Expected Results:
✅ Opens Outlook Calendar (outlook.live.com) in new tab/window  
✅ Event details pre-filled correctly  
✅ Can save event to Outlook calendar

---

## Test Scenario 4: Yahoo Calendar Integration

### Steps:
1. Open booking confirmation email
2. Click "🟣 Yahoo" button

### Expected Results:
✅ Opens Yahoo Calendar in new tab/window  
✅ Event details pre-filled correctly  
✅ Can save event to Yahoo calendar

---

## Test Scenario 5: Apple Calendar / iCal File

### Steps:
1. Open booking confirmation email
2. **Option A**: Click "🍎 Apple Calendar" button
3. **Option B**: Download attached event.ics file
4. Open/Import the file

### Expected Results:
✅ Calendar app opens (macOS Calendar, iOS Calendar, or default app)  
✅ Event details displayed correctly  
✅ Can confirm and add to calendar

---

## Test Scenario 6: Mobile Email Client

### Steps:
1. Open booking confirmation email on mobile device (iOS/Android)
2. View calendar buttons section
3. Try clicking appropriate button (Google for Android, Apple for iOS)

### Expected Results:
✅ Email displays correctly on mobile  
✅ Buttons are tappable and properly sized  
✅ Calendar app opens with event details  
✅ .ics file attachment is downloadable

---

## Test Scenario 7: Email Client Compatibility

Test the email in multiple email clients:

### Gmail Web
- ✅ All buttons display
- ✅ Buttons are clickable
- ✅ Attachment visible

### Outlook Web
- ✅ All buttons display
- ✅ Buttons are clickable
- ✅ Attachment visible

### Yahoo Mail
- ✅ All buttons display
- ✅ Buttons are clickable
- ✅ Attachment visible

### Apple Mail (macOS/iOS)
- ✅ All buttons display
- ✅ Buttons are tappable
- ✅ Attachment visible and openable

### Mobile Gmail App
- ✅ Responsive layout
- ✅ Buttons work
- ✅ Can download .ics

---

## Verification Checklist

### Email Content
- [ ] Calendar section appears between "Attachment Note" and "Support" sections
- [ ] Section header: "📅 Add to Your Calendar"
- [ ] Descriptive text present
- [ ] 4 buttons in 2x2 grid layout
- [ ] Buttons have appropriate colors
- [ ] Tip about .ics file shown

### Calendar Links
- [ ] Google Calendar link includes all event details
- [ ] Outlook Calendar link includes all event details
- [ ] Yahoo Calendar link includes all event details
- [ ] Apple Calendar link downloads .ics content

### .ics File Attachment
- [ ] File named "event.ics"
- [ ] File opens in calendar applications
- [ ] Event title correct
- [ ] Event date/time correct
- [ ] Event location correct
- [ ] Event description includes booking ID

### Event Details Accuracy
- [ ] Event name matches booking
- [ ] Date is correct
- [ ] Time is correct (including timezone)
- [ ] Venue/location is correct
- [ ] Duration is reasonable (default 3 hours)

### User Experience
- [ ] Buttons are clearly labeled
- [ ] Colors are distinguishable
- [ ] Layout is clean and professional
- [ ] Mobile-friendly design
- [ ] Consistent with overall email theme

---

## Sample Email Output

```
┌─────────────────────────────────────────────────┐
│         K&M Events - Booking Confirmed          │
├─────────────────────────────────────────────────┤
│ Hello John Doe,                                 │
│                                                 │
│ Thank you for booking with K&M Events!          │
│ ...                                             │
│ [Event Details Section]                         │
│ [Ticket Details Section]                        │
│ [Payment Summary Section]                       │
│ [Entry Instructions Section]                    │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 📅 Add to Your Calendar                     │ │
│ │                                             │ │
│ │ Don't miss the event! Add it to your        │ │
│ │ calendar with one click:                    │ │
│ │                                             │ │
│ │ [📅 Google Calendar] [📧 Outlook]           │ │
│ │ [🟣 Yahoo]          [🍎 Apple Calendar]     │ │
│ │                                             │ │
│ │ 💡 Tip: Download the .ics file attached to  │ │
│ │ import into any calendar app!               │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [Support Section]                               │
│ [Footer]                                        │
│                                                 │
│ Attachments:                                    │
│ 📎 Ticket_XXX.pdf                               │
│ 📎 event.ics                                    │
└─────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Issue: Calendar buttons not clickable
**Solution**: Check email client's security settings. Try downloading .ics file instead.

### Issue: Wrong timezone displayed
**Solution**: Verify event time in database. Check Asia/Kolkata timezone is correct for your events.

### Issue: .ics file not attached
**Solution**: Check email service logs. Verify `calendarLinks.ical` is being generated correctly.

### Issue: Event duration too short/long
**Solution**: Adjust the default 3-hour duration in `emailService.js` line:
```javascript
endDate: new Date(eventDateTime.getTime() + 3 * 60 * 60 * 1000)
```

### Issue: Email layout broken
**Solution**: Test in multiple email clients. Ensure HTML table structure is intact.

---

## Test Data Example

```javascript
// Sample booking details for testing
{
  recipientEmail: "test@example.com",
  recipientName: "John Doe",
  eventName: "K&M New Year Gala 2025",
  eventDate: "2025-01-15",
  eventTime: "19:00:00",
  venue: "Grand Palace Convention Center, Mumbai",
  ticketIds: ["TKT001", "TKT002"],
  ticketType: "VIP",
  seats: ["A1", "A2"],
  quantity: 2,
  totalAmount: 2500,
  bookingDate: new Date(),
  bookingId: "BK12345",
  qrCodes: [...]
}
```

---

## Performance Testing

### Metrics to Monitor:
- Email generation time (should be < 500ms)
- Calendar link generation time (should be < 10ms)
- Email sending time (depends on SMTP)
- Total booking confirmation time (should be < 2 seconds)

### Load Testing:
- Test with 10 simultaneous bookings
- Test with 50 simultaneous bookings
- Monitor memory usage
- Check for any bottlenecks

---

## Success Criteria

✅ All calendar buttons work across major email clients  
✅ .ics file attachment is valid and openable  
✅ Event details are accurate in all calendar services  
✅ Mobile email clients display buttons correctly  
✅ No errors in server logs during email sending  
✅ Users can successfully add events to their calendars  
✅ Email layout is professional and on-brand

---

## Automated Testing (Future)

Consider implementing:
- Unit tests for calendar link generation
- Integration tests for email sending
- End-to-end tests for booking flow
- Email rendering tests (e.g., using Litmus)

---

## Feedback Collection

After testing, collect user feedback on:
- Ease of use
- Calendar service preferences
- Mobile experience
- Any issues encountered
- Suggestions for improvement

---

**Last Updated**: January 2025  
**Test Version**: 1.0  
**Status**: Ready for Testing
