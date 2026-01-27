# QR Check-In Feature Toggle Implementation

## Overview
This document describes the implementation of the QR check-in feature toggle functionality, which allows event organizers to disable QR code generation and displays appropriate messages on tickets when the feature is disabled.

## Changes Made

### 1. Backend Changes - `server/controllers/bookingController.js`

**Modified the booking creation response** to include the `qrCheckInEnabled` status:

```javascript
// Return booking with qrCheckIn status for frontend
const bookingResponse = booking.toObject();
bookingResponse.qrCheckInEnabled = qrEnabled;
res.status(201).json(bookingResponse);
```

**How it works:**
- The backend already checks if the `qrCheckIn` feature is enabled using the `FeatureToggle` model
- If disabled, `qrEnabled` is set to `false` and QR codes are not generated
- The `qrCodes` array remains empty when the feature is disabled
- The `qrCheckInEnabled` flag is now included in the API response so the frontend knows the feature status

**Backend Logic Flow:**
1. Check event-specific `FeatureToggle` for `qrCheckIn.enabled` status
2. Fall back to system config if feature toggle doesn't explicitly disable it
3. Default to `true` (enabled) if no configuration is found
4. Only generate QR codes if `qrEnabled === true`
5. Return `qrCheckInEnabled` flag in the booking response

### 2. Frontend Changes - `Frontend-EZ/src/components/booking/Ticket.jsx`

**Added `qrCheckInEnabled` to component props:**

```javascript
const { event, user, id, _id, seats, quantity, date, qrCodes, qrCode, ticketIds, scans, qrCheckInEnabled = true } = booking
```

**Updated the ticket back side** to conditionally render QR code or disabled message:

```javascript
{qrCheckInEnabled ? (
  // Display QR Code
  <motion.div>
    <div className="p-5 rounded-2xl shadow-lg border-2">
      <img src={qrUrl} alt="QR Code" className="w-48 h-48 object-contain" />
    </div>
  </motion.div>
) : (
  // Display Disabled Message
  <div className="p-8 rounded-2xl shadow-lg border-2 text-center">
    <svg className="w-16 h-16 mx-auto mb-4">...</svg>
    <p className="text-sm font-bold uppercase tracking-wide mb-2">
      QR Check-In Not Available
    </p>
    <p className="text-xs leading-relaxed">
      QR code check-in is not enabled for this event.<br />
      Please follow the organizer's instructions for entry.
    </p>
  </div>
)}
```

**Updated front side messages:**
- "Flip for QR code" → "Flip for ticket details" (when disabled)
- "Present QR code at entrance for verification" → "Follow organizer instructions for check-in procedure" (when disabled)
- "Present at entrance for verification" → "Check-in method as directed by organizer" (when disabled)

## User Experience

### When QR Check-In is ENABLED (Default)
- QR codes are generated for each ticket
- Ticket displays the animated QR code on the back side
- Messages guide users to present the QR code at entrance
- Standard check-in flow with QR scanning

### When QR Check-In is DISABLED
- No QR codes are generated (backend)
- Ticket back side shows a lock icon with clear message:
  - "QR Check-In Not Available"
  - "QR code check-in is not enabled for this event."
  - "Please follow the organizer's instructions for entry."
- Front side messages updated to reflect alternative check-in method
- Visual indication that QR is not required

## Testing the Feature

### To Test QR Disabled State:

1. **Navigate to Super Admin Events:**
   ```
   http://localhost:5173/super-admin/events
   ```

2. **Select an event and click "Manage Features"**

3. **Toggle OFF the "QR Check-In" feature:**
   - Disable the `qrCheckIn` toggle
   - Save changes

4. **Create a new booking for that event:**
   - Go to event details
   - Book tickets
   - Complete the booking

5. **View the ticket on Booking Success page:**
   - The ticket should show the disabled message instead of QR code
   - No QR codes should be visible
   - Messages should reflect alternative check-in method

### To Test QR Enabled State:

1. **Enable QR Check-In in Feature Toggles:**
   - Navigate to the event's feature management page
   - Turn ON the `qrCheckIn` toggle
   - Save changes

2. **Create a new booking:**
   - Book tickets for the event
   - Complete the booking

3. **View the ticket:**
   - QR codes should be visible on ticket back
   - Standard QR-related messages should appear
   - Users can flip card to see QR code

## Technical Details

### API Response Structure

**Booking Response (with QR enabled):**
```json
{
  "_id": "booking123",
  "event": {...},
  "user": {...},
  "quantity": 2,
  "qrCodes": [
    { "id": "ticket1", "image": "data:image/png;base64,..." },
    { "id": "ticket2", "image": "data:image/png;base64,..." }
  ],
  "qrCheckInEnabled": true,
  ...
}
```

**Booking Response (with QR disabled):**
```json
{
  "_id": "booking123",
  "event": {...},
  "user": {...},
  "quantity": 2,
  "qrCodes": [],
  "qrCheckInEnabled": false,
  ...
}
```

### Feature Toggle Configuration

The feature is managed through the `FeatureToggle` model:

```javascript
{
  eventId: "event123",
  features: {
    qrCheckIn: {
      enabled: false,  // true/false
      description: "QR code-based check-in at event entrance"
    },
    // ... other features
  }
}
```

## Files Modified

1. **Backend:**
   - `server/controllers/bookingController.js` - Added `qrCheckInEnabled` to response

2. **Frontend:**
   - `Frontend-EZ/src/components/booking/Ticket.jsx` - Conditional QR display and messages

## Benefits

1. **Flexibility:** Organizers can choose their preferred check-in method
2. **User Clarity:** Clear messaging when QR is not available
3. **No Confusion:** Users know what to expect at event entrance
4. **Consistent UX:** Dark mode support for disabled state
5. **Backward Compatible:** Defaults to `true` if flag is missing

## Future Enhancements

- Add custom message field in FeatureToggle for organizers to specify alternative check-in instructions
- Display alternative check-in method details (e.g., "Manual check-in at gate 3")
- Add notification to users when booking if QR is disabled
- Include QR status in booking confirmation email
