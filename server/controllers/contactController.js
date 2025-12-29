import Contact from "../models/Contact.js";
import { sendReplyEmail } from "../utils/emailService.js";

// Submit contact form
export const submitContact = async (req, res) => {
  try {
    let { name, email, subject, message } = req.body;
    const userId = req.user?.id || null;
    
    // If user is logged in and didn't provide email/name, use from token
    if (userId && req.user) {
      email = email || req.user.email;
      name = name || req.user.name;
    }

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const contact = await Contact.create({
      name,
      email,
      subject,
      message,
      userId,
      status: "new",
    });

    res.status(201).json({
      message: "Contact form submitted successfully",
      contact,
    });
  } catch (error) {
    console.error("Error submitting contact:", error);
    res.status(500).json({ error: "Failed to submit contact form" });
  }
};

// Get all contact submissions (admin only)
export const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json(contacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
};

// Get single contact
export const getContact = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findById(id);

    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    // Mark as read
    contact.status = "read";
    await contact.save();

    res.status(200).json(contact);
  } catch (error) {
    console.error("Error fetching contact:", error);
    res.status(500).json({ error: "Failed to fetch contact" });
  }
};

// Reply to contact
export const replyContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    if (!reply) {
      return res.status(400).json({ error: "Reply message is required" });
    }

    const contact = await Contact.findByIdAndUpdate(
      id,
      { reply, status: "replied", replyDate: new Date() },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    // Send email notification to user
    await sendReplyEmail(contact.email, contact.name, contact.subject, reply);

    res.status(200).json({
      message: "Reply sent successfully and email notified",
      contact,
    });
  } catch (error) {
    console.error("Error replying to contact:", error);
    res.status(500).json({ error: "Failed to send reply" });
  }
};

// Delete contact
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findByIdAndDelete(id);

    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }

    res.status(200).json({ message: "Contact deleted successfully" });
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({ error: "Failed to delete contact" });
  }
};

// Get user's own messages
export const getUserMessages = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID required" });
    }

    // Get messages from this email or this userId
    const messages = await Contact.find({
      $or: [
        { email: req.user?.email },
        { userId: userId }
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching user messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};
