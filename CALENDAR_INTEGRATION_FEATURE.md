# 📅 Calendar Integration Feature

## Overview
The Calendar Integration feature allows users to automatically add booked events to their preferred calendar application directly from the booking confirmation email. This improves the user experience by reducing the chance of missing events.

## ✨ Features

### 1. **Multi-Platform Calendar Support**
   - **Google Calendar** - Direct link to add event
   - **Apple Calendar** - Data URI for iOS/macOS Calendar app
   - **Outlook Calendar** - Link for Outlook.com and Outlook apps
   - **Yahoo Calendar** - Direct link to Yahoo Calendar
   - **iCal/ICS File** - Universal .ics file attachment

### 2. **Email Integration**
   - Calendar buttons displayed in booking confirmation emails
   - Attractive, styled buttons for each calendar service
   - .ics file automatically attached to every booking confirmation
   - Mobile-responsive design

### 3. **Event Details Included**
   - Event name/title
   - Event date and time
   - Venue/location
   - Event description with booking ID
   - Default 3-hour event duration
   - Timezone support (Asia/Kolkata)

## 📂 File Structure

```
server/
├── utils/
│   ├── calendarUtils.js        # Calendar link generation utilities
│   └── emailService.js          # Updated with calendar buttons
```

## 🔧 Implementation Details

### calendarUtils.js
Contains utility functions to generate calendar links for different platforms:

```javascript
// Main functions:
- generateGoogleCalendarLink()   // Google Calendar URL
- generateAppleCalendarLink()    // Apple Calendar data URI
- generateOutlookCalendarLink()  // Outlook.com URL
- generateYahooCalendarLink()    // Yahoo Calendar URL
- generateICalContent()          // iCal/ICS file content (RFC 5545)
- generateAllCalendarLinks()     // Returns all formats
```

### emailService.js Updates

#### 1. Import Calendar Utilities
```javascript
import { generateAllCalendarLinks } from "./calendarUtils.js";
```

#### 2. Generate Calendar Links
```javascript
const eventDateTime = new Date(`${eventDate}T${eventTime}`);
const calendarLinks = generateAllCalendarLinks({
  title: eventName,
  description: `Your ticket booking for ${eventName}. Booking ID: ${bookingId}`,
  location: venue,
  startTime: eventDateTime,
  endTime: new Date(eventDateTime.getTime() + 3 * 60 * 60 * 1000), // 3 hours
  timeZone: 'Asia/Kolkata'
});
```

#### 3. Add Calendar Section to Email Template
Displays 4 styled buttons (Google, Outlook, Yahoo, Apple) with direct links to add the event.

#### 4. Attach .ics File
```javascript
attachments.push({
  filename: 'event.ics',
  content: calendarLinks.ical,
  contentType: 'text/calendar'
});
```

## 🎨 Email Design

### Calendar Buttons Section
- **Header**: "📅 Add to Your Calendar"
- **Subtext**: "Don't miss the event! Add it to your calendar with one click:"
- **Button Layout**: 2x2 grid
  - Row 1: Google Calendar (Blue) | Outlook (Dark Blue)
  - Row 2: Yahoo (Purple) | Apple Calendar (Black)
- **Tip**: Information about attached .ics file

### Button Styling
- Rounded corners (6px border-radius)
- Consistent padding (12px 24px)
- Color-coded per platform
- Minimum width for uniformity
- Hover-friendly for desktop clients

## 📋 Usage

### For Users
1. **Receive booking confirmation email**
2. **Click desired calendar button** in email
3. **Event automatically opens** in selected calendar app
4. **Confirm/save** the event

**Alternative**: Download the attached `event.ics` file and import it into any calendar application.

### For Developers
No changes needed to existing booking flow. Calendar integration is automatically included in all booking confirmation emails sent via `sendBookingConfirmationEmail()`.

## 🧪 Testing

### Test Scenarios
1. **Book an event** through the platform
2. **Check booking confirmation email**:
   - ✅ Calendar section displays correctly
   - ✅ All 4 buttons are present and styled
   - ✅ .ics file is attached
3. **Click each calendar button**:
   - ✅ Google Calendar opens with pre-filled event
   - ✅ Outlook Calendar opens with pre-filled event
   - ✅ Yahoo Calendar opens with pre-filled event
   - ✅ Apple Calendar downloads/opens .ics
4. **Download .ics file**:
   - ✅ File opens in default calendar app
   - ✅ Event details are correct

### Browser Compatibility
- ✅ Gmail web client
- ✅ Outlook web client
- ✅ Yahoo Mail web client
- ✅ Apple Mail (macOS/iOS)
- ✅ Mobile email clients

## 🌐 Calendar Link Formats

### Google Calendar
```
https://calendar.google.com/calendar/render?action=TEMPLATE
&text=Event+Name
&dates=20240101T100000Z/20240101T130000Z
&details=Description
&location=Venue
```

### Outlook
```
https://outlook.live.com/calendar/0/deeplink/compose?
subject=Event+Name
&startdt=2024-01-01T10:00:00Z
&enddt=2024-01-01T13:00:00Z
&body=Description
&location=Venue
```

### Yahoo
```
https://calendar.yahoo.com/?v=60&
title=Event+Name
&st=20240101T100000Z
&et=20240101T130000Z
&desc=Description
&in_loc=Venue
```

### Apple Calendar / iCal
Data URI containing RFC 5545 compliant iCalendar content:
```
data:text/calendar;charset=utf-8,BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
...
END:VEVENT
END:VCALENDAR
```

## 🔒 Security Considerations

1. **URL Encoding**: All parameters are properly URL-encoded
2. **Data Validation**: Event details are sanitized before encoding
3. **No Sensitive Data**: Only public event information is included
4. **Standard Protocols**: Uses RFC 5545 for iCal format

## 📱 Mobile Support

- **iOS**: Apple Calendar button opens in native Calendar app
- **Android**: Google Calendar button opens in Google Calendar app
- **Universal**: .ics file attachment works on all platforms

## 🎯 Benefits

### For Users
- ✅ One-click event addition to calendar
- ✅ No manual entry of event details
- ✅ Reduced chance of missing events
- ✅ Multi-platform support
- ✅ Works on mobile and desktop

### For Business
- ✅ Improved user experience
- ✅ Reduced no-shows
- ✅ Professional booking confirmations
- ✅ Competitive advantage
- ✅ Better customer engagement

## 🔄 Future Enhancements

### Potential Features
1. **Custom Event Duration**: Allow organizers to set event duration
2. **Reminders**: Add automatic reminders (15 min, 1 hour, 1 day before)
3. **Recurring Events**: Support for repeating events
4. **Timezone Detection**: Automatic user timezone detection
5. **Calendar Subscription**: Subscribe to all booked events
6. **Additional Calendars**: 
   - Microsoft Teams
   - Zoom Calendar
   - Office 365
7. **Analytics**: Track which calendar services are most popular

## 📞 Support

### Common Issues

**Q: Calendar button doesn't work?**
A: Download the attached .ics file and import it manually.

**Q: Event shows wrong time?**
A: Check your calendar app's timezone settings.

**Q: Can't find .ics file?**
A: Check email attachments or spam/junk folder.

**Q: Event not adding automatically?**
A: Some email clients may block direct calendar links. Use the .ics file instead.

## 📝 Technical Notes

### Dependencies
- No additional npm packages required
- Uses native JavaScript Date and string manipulation
- Compatible with ES6 modules

### Performance
- Calendar links generated on-demand
- Minimal overhead (~1ms per email)
- No external API calls

### Maintenance
- Update timezone as needed in `emailService.js`
- Adjust default event duration if required
- Monitor calendar platform URL changes

## ✅ Completion Checklist

- [x] Created `calendarUtils.js` with all calendar link generators
- [x] Updated `emailService.js` with calendar integration
- [x] Added calendar buttons section to email template
- [x] Attached .ics file to booking confirmation emails
- [x] Tested with multiple calendar platforms
- [x] Mobile-responsive email design
- [x] Documentation created

---

**Implementation Date**: January 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready
