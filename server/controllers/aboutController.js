import About from "../models/About.js";

// Get about page content
export const getAbout = async (req, res) => {
  try {
    let about = await About.findOne();

    // If no about data exists, return default data
    if (!about) {
      const defaultAbout = {
        mission:
          "At K&M Events, we believe that live experiences bring people together and create lasting memories.",
        description:
          "We connect passionate event organizers with enthusiastic attendees through our innovative ticketing platform.",
        vision: "To revolutionize the event ticketing industry with technology and customer focus.",
        values: ["Innovation", "Trust", "Community", "Excellence"],
        stats: {
          activeUsers: 10000,
          eventsListed: 500,
          ticketsSold: 50000,
          satisfactionRate: 98,
        },
        socialLinks: {
          facebook: "https://facebook.com/kmevents",
          twitter: "https://twitter.com/kmevents",
          instagram: "https://instagram.com/kmevents",
          linkedin: "https://linkedin.com/company/kmevents",
        },
        contactInfo: {
          email: "support@kmevents.com",
          phone: "+1 (555) 123-4567",
          address: "123 Event Street, New York, NY 10001",
          businessHours: "Monday - Friday: 9:00 AM - 6:00 PM",
        },
      };

      res.status(200).json(defaultAbout);
    } else {
      res.status(200).json(about);
    }
  } catch (error) {
    console.error("Error fetching about:", error);
    res.status(500).json({ error: "Failed to fetch about page" });
  }
};

// Update about page (admin only)
export const updateAbout = async (req, res) => {
  try {
    const {
      mission,
      description,
      vision,
      values,
      stats,
      socialLinks,
      contactInfo,
    } = req.body;

    let about = await About.findOne();

    if (!about) {
      about = new About({
        mission,
        description,
        vision,
        values,
        stats,
        socialLinks,
        contactInfo,
        updatedBy: req.user.id,
      });
    } else {
      if (mission) about.mission = mission;
      if (description) about.description = description;
      if (vision) about.vision = vision;
      if (values) about.values = values;
      if (stats) about.stats = { ...about.stats, ...stats };
      if (socialLinks) about.socialLinks = { ...about.socialLinks, ...socialLinks };
      if (contactInfo) about.contactInfo = { ...about.contactInfo, ...contactInfo };
      about.updatedBy = req.user.id;
    }

    await about.save();

    res.status(200).json({
      message: "About page updated successfully",
      about,
    });
  } catch (error) {
    console.error("Error updating about:", error);
    res.status(500).json({ error: "Failed to update about page" });
  }
};

// Get about stats
export const getAboutStats = async (req, res) => {
  try {
    const about = await About.findOne();

    if (!about) {
      return res.status(200).json({
        activeUsers: 10000,
        eventsListed: 500,
        ticketsSold: 50000,
        satisfactionRate: 98,
      });
    }

    res.status(200).json(about.stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};
