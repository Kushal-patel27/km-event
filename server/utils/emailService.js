import nodemailer from "nodemailer";

// Create transporter (using Gmail or other SMTP)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "k.m.easyevents@gmail.com",
    pass: process.env.EMAIL_PASS || "your-app-password",
  },
});

export const sendReplyEmail = async (recipientEmail, name, subject, reply) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || "k.m.easyevents@gmail.com",
      to: recipientEmail,
      subject: `Re: ${subject} - K&M Events Support`,
      html: `
        <h2>Hello ${name},</h2>
        <p>We have replied to your message:</p>
        <div style="border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; background-color: #f9fafb;">
          <strong>Original Subject:</strong> ${subject}
          <br/><br/>
          <strong>Our Reply:</strong>
          <p>${reply}</p>
        </div>
        <p>You can also view this reply in your K&M Events dashboard under Messages.</p>
        <hr/>
        <p style="font-size: 12px; color: #666;">
          Best regards,<br/>
          K&M Events Support Team<br/>
          <a href="http://localhost:5173">Visit our website</a>
        </p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error("Email send failed:", error);
    return false;
  }
};

export default transporter;
