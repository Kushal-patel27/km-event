import NotificationTemplate from "../models/NotificationTemplate.js";

const defaultTemplates = [
  {
    name: "Event Launch Announcement",
    subject: "🎉 New Event Alert - Don't Miss Out!",
    title: "Exciting New Event Just Launched",
    messageType: "announcement",
    html: `
      <p style="margin:0 0 12px 0;color:#374151;font-size:14px;">
        We're thrilled to announce a brand new event that you won't want to miss!
      </p>
      <div style="background:#eff6ff;border-left:4px solid #2563eb;padding:16px;margin:16px 0;border-radius:6px;">
        <h3 style="margin:0 0 8px 0;color:#1e40af;font-size:16px;font-weight:700;">Event Highlights</h3>
        <ul style="margin:0;padding-left:20px;color:#374151;">
          <li>Live performances and entertainment</li>
          <li>Meet and greet opportunities</li>
          <li>Exclusive merchandise</li>
          <li>Early bird discounts available</li>
        </ul>
      </div>
      <p style="margin:12px 0 0 0;color:#374151;font-size:14px;">
        <strong>Book your tickets now</strong> and be part of an unforgettable experience!
      </p>
    `,
  },
  {
    name: "Limited Time Offer",
    subject: "⏰ Flash Sale - 30% Off All Tickets!",
    title: "Limited Time: Save Big on Your Next Event",
    messageType: "offer",
    html: `
      <div style="text-align:center;background:linear-gradient(135deg,#fff7ed 0%,#fed7aa 100%);border-radius:12px;padding:20px;margin:0 0 16px 0;">
        <h2 style="margin:0 0 8px 0;color:#f97316;font-size:28px;font-weight:900;">30% OFF</h2>
        <p style="margin:0;color:#9a3412;font-size:14px;font-weight:600;">ALL EVENT TICKETS</p>
      </div>
      <p style="margin:0 0 12px 0;color:#374151;font-size:14px;">
        For a limited time only, enjoy <strong>30% off</strong> on all event tickets. This exclusive offer won't last long!
      </p>
      <div style="background:#fef2f2;border:1px dashed #f87171;padding:14px;margin:16px 0;border-radius:8px;text-align:center;">
        <p style="margin:0 0 6px 0;color:#991b1b;font-size:12px;font-weight:600;">USE PROMO CODE</p>
        <p style="margin:0;color:#dc2626;font-size:20px;font-weight:800;letter-spacing:2px;">FLASH30</p>
      </div>
      <p style="margin:12px 0 0 0;color:#6b7280;font-size:13px;text-align:center;">
        ⏰ Offer expires in 48 hours. Terms and conditions apply.
      </p>
    `,
  },
  {
    name: "Event Reminder",
    subject: "📅 Reminder: Your Event is Coming Up Soon!",
    title: "Don't Forget - Your Event is Almost Here",
    messageType: "update",
    html: `
      <p style="margin:0 0 12px 0;color:#374151;font-size:14px;">
        This is a friendly reminder that your upcoming event is just around the corner!
      </p>
      <div style="background:#ecfdf3;border:2px solid #16a34a;padding:16px;margin:16px 0;border-radius:8px;">
        <h3 style="margin:0 0 12px 0;color:#15803d;font-size:16px;font-weight:700;">Event Details</h3>
        <table style="width:100%;color:#374151;font-size:14px;">
          <tr>
            <td style="padding:4px 0;"><strong>Date:</strong></td>
            <td style="padding:4px 0;">Saturday, March 15, 2026</td>
          </tr>
          <tr>
            <td style="padding:4px 0;"><strong>Time:</strong></td>
            <td style="padding:4px 0;">7:00 PM onwards</td>
          </tr>
          <tr>
            <td style="padding:4px 0;"><strong>Venue:</strong></td>
            <td style="padding:4px 0;">City Convention Center</td>
          </tr>
        </table>
      </div>
      <p style="margin:12px 0 0 0;color:#374151;font-size:14px;">
        Make sure to arrive 30 minutes early for smooth entry. See you there!
      </p>
    `,
  },
  {
    name: "System Maintenance Notice",
    subject: "⚠️ Scheduled Maintenance - Platform Update",
    title: "Important: Scheduled System Maintenance",
    messageType: "update",
    html: `
      <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;margin:0 0 16px 0;border-radius:6px;">
        <p style="margin:0;color:#92400e;font-size:14px;font-weight:600;">
          ⚠️ Scheduled Maintenance Alert
        </p>
      </div>
      <p style="margin:0 0 12px 0;color:#374151;font-size:14px;">
        We will be performing scheduled maintenance to improve our platform and bring you new features.
      </p>
      <div style="background:#f3f4f6;border-radius:8px;padding:14px;margin:16px 0;">
        <p style="margin:0 0 8px 0;color:#1f2937;font-size:13px;"><strong>Maintenance Window:</strong></p>
        <p style="margin:0 0 4px 0;color:#4b5563;font-size:13px;">📅 Sunday, January 28, 2026</p>
        <p style="margin:0;color:#4b5563;font-size:13px;">⏰ 2:00 AM - 6:00 AM (IST)</p>
      </div>
      <p style="margin:12px 0 0 0;color:#374151;font-size:14px;">
        During this time, the platform may be temporarily unavailable. We apologize for any inconvenience.
      </p>
    `,
  },
  {
    name: "Booking Confirmation",
    subject: "✅ Booking Confirmed - Your Tickets Are Ready!",
    title: "Your Booking is Confirmed",
    messageType: "announcement",
    html: `
      <div style="text-align:center;background:#dcfce7;border-radius:12px;padding:20px;margin:0 0 16px 0;">
        <div style="background:#22c55e;width:60px;height:60px;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;">
          <span style="font-size:32px;color:white;">✓</span>
        </div>
        <h2 style="margin:0 0 4px 0;color:#15803d;font-size:20px;font-weight:800;">Booking Confirmed!</h2>
        <p style="margin:0;color:#166534;font-size:14px;">Your tickets have been successfully booked</p>
      </div>
      <p style="margin:0 0 12px 0;color:#374151;font-size:14px;">
        Thank you for your booking! Your tickets are ready and have been sent to your email.
      </p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0;">
        <h4 style="margin:0 0 8px 0;color:#1f2937;font-size:14px;font-weight:700;">Next Steps:</h4>
        <ul style="margin:0;padding-left:20px;color:#4b5563;font-size:13px;">
          <li>Download your tickets from the app</li>
          <li>Show QR code at the venue entrance</li>
          <li>Arrive 30 minutes before the event</li>
        </ul>
      </div>
    `,
  },
  {
    name: "Newsletter Update",
    subject: "📰 What's New at K&M Events - Monthly Update",
    title: "Your Monthly Event Roundup",
    messageType: "custom",
    html: `
      <p style="margin:0 0 12px 0;color:#374151;font-size:14px;">
        Welcome to your monthly roundup of exciting events and updates from K&M Events!
      </p>
      <div style="background:#fefce8;border-radius:10px;padding:18px;margin:16px 0;">
        <h3 style="margin:0 0 12px 0;color:#854d0e;font-size:16px;font-weight:700;">🎯 This Month's Highlights</h3>
        <div style="background:white;border-radius:8px;padding:12px;margin:8px 0;">
          <h4 style="margin:0 0 6px 0;color:#1f2937;font-size:14px;font-weight:600;">Featured Events</h4>
          <p style="margin:0;color:#6b7280;font-size:13px;">10+ new events added this week</p>
        </div>
        <div style="background:white;border-radius:8px;padding:12px;margin:8px 0;">
          <h4 style="margin:0 0 6px 0;color:#1f2937;font-size:14px;font-weight:600;">Platform Updates</h4>
          <p style="margin:0;color:#6b7280;font-size:13px;">Enhanced mobile experience and faster checkout</p>
        </div>
      </div>
      <p style="margin:12px 0 0 0;color:#374151;font-size:14px;">
        Stay tuned for more exciting updates. Happy event browsing!
      </p>
    `,
  },
];

export const seedNotificationTemplates = async () => {
  try {
    const existingCount = await NotificationTemplate.countDocuments();
    if (existingCount > 0) {
      console.log(`✓ ${existingCount} notification templates already exist. Skipping seed.`);
      return;
    }

    const createdTemplates = await NotificationTemplate.insertMany(
      defaultTemplates.map((tpl) => ({
        ...tpl,
        createdBy: {
          name: "System",
          email: "system@kmevents.com",
        },
      }))
    );

    console.log(`✓ Seeded ${createdTemplates.length} notification templates successfully!`);
  } catch (error) {
    console.error("✗ Error seeding notification templates:", error);
  }
};
