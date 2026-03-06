# Default Event Templates Seeding Guide

## 📋 Overview

This guide explains how to populate your database with 14 pre-configured default event templates covering all categories in the K&M Events platform.

## 🎯 Template Categories

The seed script creates one default template for each of the following 14 categories:

1. **Concert** - Live Music Concert
2. **Conference** - Professional Conference
3. **Wedding** - Dream Wedding Celebration
4. **Workshop** - Skill Development Workshop
5. **Seminar** - Industry Seminar
6. **Festival** - Cultural Festival
7. **Sports** - Sports Championship
8. **Exhibition** - Art & Design Exhibition
9. **Networking** - Professional Networking Event
10. **Meetup** - Community Meetup
11. **Webinar** - Online Webinar
12. **Party** - Celebration Party
13. **Fundraiser** - Charity Fundraiser
14. **Other** - Special Event

## 🚀 How to Seed Templates

### Step 1: Navigate to Server Directory

```bash
cd server
```

### Step 2: Run the Seed Script

```bash
npm run seed:templates
```

### What Happens:
- ✅ Connects to MongoDB
- ✅ Checks for existing templates
- ✅ Creates 14 default templates (if database is empty)
- ✅ Displays summary of created templates
- ✅ Shows premium vs. free template count

### Output Example:

```
✓ Connected to MongoDB

✅ Successfully created 14 default templates!

Created templates:
  1. Live Music Concert (concert)
  2. Professional Conference (conference)
  3. Dream Wedding Celebration (wedding)
  4. Skill Development Workshop (workshop)
  5. Industry Seminar (seminar)
  6. Cultural Festival (festival)
  7. Sports Championship (sports)
  8. Art & Design Exhibition (exhibition)
  9. Professional Networking Event (networking)
  10. Community Meetup (meetup)
  11. Online Webinar (webinar)
  12. Celebration Party (party)
  13. Charity Fundraiser (fundraiser)
  14. Special Event (other)

📋 Template Summary:
  - Total: 14
  - Premium: 2
  - Free: 12
  - Categories: 14

🎯 Next Steps:
  1. Access admin panel: http://localhost:5173/admin/templates
  2. View created templates
  3. Clone templates to create events
  4. Customize templates as needed

✓ Database connection closed
```

## 🗑️ Clearing Templates

If you want to remove all templates and start fresh:

```bash
npm run clear:templates
```

**Warning:** This deletes ALL templates from the database. Use with caution!

## 🔒 Safety Features

The seed script includes safety checks:

1. **Existing Data Check**: If templates already exist, the script will:
   - Display count of existing templates
   - Warn you about potential data loss
   - Exit without making changes
   - Provide options for manual action

2. **System User**: Templates are created with a system user ID (`000000000000000000000000`)

## 📊 Template Details

### Premium Templates (2):
- **Professional Conference** - ₹5,000 | 200 capacity | 8 hours
- **Dream Wedding Celebration** - ₹150,000 | 300 capacity | 6 hours

### Free Templates (12):
- **Live Music Concert** - ₹1,500 | 500 capacity
- **Skill Development Workshop** - ₹2,000 | 50 capacity
- **Industry Seminar** - ₹1,000 | 100 capacity
- **Cultural Festival** - ₹500 | 2,000 capacity
- **Sports Championship** - ₹800 | 1,000 capacity
- **Art & Design Exhibition** - ₹300 | 150 capacity
- **Professional Networking Event** - ₹1,500 | 80 capacity
- **Community Meetup** - FREE | 50 capacity
- **Online Webinar** - ₹500 | 500 capacity
- **Celebration Party** - ₹2,000 | 150 capacity
- **Charity Fundraiser** - ₹2,500 | 200 capacity
- **Special Event** - ₹1,000 | 100 capacity

## 🎨 Template Features

Each template includes:
- ✅ **Name** - Descriptive template name
- ✅ **Category** - One of 14 categories
- ✅ **Description** - Detailed event description (150-250 words)
- ✅ **Banner Image** - High-quality Unsplash image (1200px wide)
- ✅ **Preview Image** - Thumbnail version (400px wide)
- ✅ **Default Price** - Suggested ticket price in INR
- ✅ **Currency** - INR
- ✅ **Capacity** - Recommended maximum attendees
- ✅ **Duration** - Event length in hours and minutes
- ✅ **Premium Flag** - Designates special/premium templates
- ✅ **Tags** - 3-4 relevant tags for filtering
- ✅ **Custom Fields** - Category-specific metadata

### Custom Fields Examples:

**Concert:**
- Venue type: Concert Hall
- Audio setup: Professional PA System
- Seating: Standing and Reserved Seating

**Conference:**
- Includes: Lunch, Coffee Breaks, Materials
- Format: In-person
- Certificates: Participation Certificate Provided

**Wedding:**
- Includes: Catering, Decoration, Photography
- Venue type: Banquet Hall
- Services: Full Wedding Planning Support

## 🔧 Customizing Templates

After seeding, you can:

1. **Edit via Admin Panel**:
   - Go to http://localhost:5173/admin/templates
   - Click "Edit" on any template
   - Modify fields as needed
   - Save changes

2. **Edit Script Directly**:
   - Open `server/scripts/seedTemplates.js`
   - Modify the `defaultTemplates` array
   - Re-run seed script (clear first if needed)

## 📝 Manual Database Seeding

If you prefer manual control, use MongoDB Compass or mongo shell:

```javascript
// In MongoDB Compass or mongo shell
use your_database_name;

db.eventtemplates.insertOne({
  name: "My Custom Template",
  category: "concert",
  defaultDescription: "Description here...",
  defaultBanner: "https://example.com/banner.jpg",
  previewImage: "https://example.com/preview.jpg",
  defaultPrice: 1000,
  defaultCurrency: "INR",
  defaultCapacity: 100,
  defaultDuration: { hours: 3, minutes: 0 },
  isPremium: false,
  isActive: true,
  tags: ["tag1", "tag2"],
  customFields: {},
  createdBy: ObjectId("000000000000000000000000"),
  createdAt: new Date(),
  updatedAt: new Date()
});
```

## 🎯 Using Seeded Templates

Once templates are seeded:

1. **Admin Access**: 
   - Login as admin
   - Navigate to `/admin/templates`
   - View all 14 default templates

2. **Create Events**:
   - Click "Clone to Event" on any template
   - Template data pre-fills event form
   - Customize as needed
   - Save new event

3. **Template Analytics**:
   - Each template tracks usage count
   - View last used date
   - Monitor which templates are most popular

## 🚨 Troubleshooting

### Error: Cannot find module 'EventTemplate'
**Solution**: Ensure you're in the `server` directory and the model file exists at `models/EventTemplate.js`

### Error: MONGO_URI not found
**Solution**: Check your `.env` file in the server directory contains `MONGO_URI`

### Templates Not Showing in Admin Panel
**Solution**: 
1. Check database connection
2. Verify templates were created: `db.eventtemplates.countDocuments()`
3. Ensure admin user has proper permissions
4. Clear browser cache and refresh

### Want to Re-seed Different Templates
**Solution**:
1. Run `npm run clear:templates` to delete all
2. Modify `seedTemplates.js` if needed
3. Run `npm run seed:templates` again

## 📚 Related Documentation

- [EVENT_TEMPLATES_MODULE_GUIDE.md](../EVENT_TEMPLATES_MODULE_GUIDE.md) - Complete API reference
- [EVENT_TEMPLATES_INSTALLATION.md](../EVENT_TEMPLATES_INSTALLATION.md) - Setup guide
- [MODULE_SUGGESTIONS.md](../MODULE_SUGGESTIONS.md) - Feature status

## ✅ Verification Checklist

After seeding, verify:
- [ ] 14 templates created in database
- [ ] Templates visible in admin panel
- [ ] Can clone templates to create events
- [ ] Images display correctly
- [ ] Custom fields populated
- [ ] Usage count starts at 0
- [ ] Premium templates marked correctly

---

**Happy templating! 🎉**

For questions or issues, check the main documentation or contact the development team.
