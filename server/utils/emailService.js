import nodemailer from "nodemailer";
import dotenv from "dotenv";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables even when this module is imported before server.js runs dotenv.config
dotenv.config({ path: path.join(__dirname, "..", ".env"), override: true });

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const emailSender = emailUser || "k.m.easyevents@gmail.com";

// Create transporter (using Gmail or other SMTP)
const transporter = (emailUser && emailPass)
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    })
  : null;

function ensureTransporter() {
  if (!transporter) {
    throw new Error("EMAIL_USER and EMAIL_PASS must be set to send email");
  }
  return transporter;
}

export const sendReplyEmail = async (recipientEmail, name, subject, reply) => {
  try {
    const mailOptions = {
      from: emailSender,
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

    await ensureTransporter().sendMail(mailOptions);
    console.log(`Email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error("Email send failed:", error);
    return false;
  }
};

export const sendPasswordResetOtpEmail = async ({ recipientEmail, recipientName, otp, expiresInMinutes }) => {
  try {
    const mailOptions = {
      from: emailSender,
      to: recipientEmail,
      subject: "Your K&M Events password reset code",
      html: `
       <div style="margin:0;padding:18px;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;">
    <tr>
      <td style="padding:24px;">

        <!-- Header -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
          <tr>
            <td width="12" style="background:#dc2626;border-radius:999px;">&nbsp;</td>
            <td style="padding-left:10px;">
              <h2 style="margin:0;color:#111827;font-size:22px;font-weight:700;">
                Password reset verification
              </h2>
            </td>
          </tr>
        </table>

        <!-- Greeting -->
        <p style="margin:0 0 10px 0;color:#374151;font-size:14px;">
          Hi ${recipientName || "there"},
        </p>

        <!-- Message -->
        <p style="margin:0 0 16px 0;color:#374151;font-size:14px;line-height:1.6;">
          Use the one-time code below to reset your password.
          This code expires in <strong>${expiresInMinutes} minutes</strong>.
        </p>

        <!-- OTP Box -->
        <table align="center" cellpadding="0" cellspacing="0" style="margin:18px auto;">
          <tr>
            <td style="padding:14px 24px;border:1px dashed #d1d5db;border-radius:12px;background:#fef2f2;text-align:center;">
              <div style="letter-spacing:6px;font-size:26px;font-weight:700;color:#dc2626;">
                ${otp}
              </div>
            </td>
          </tr>
        </table>

        <!-- Footer Text -->
        <p style="margin:16px 0 0 0;color:#4b5563;font-size:13px;line-height:1.5;">
          If you did not request this, you can safely ignore this email.
          For your security, this code becomes invalid after one use.
        </p>

        <p style="margin-top:20px;color:#6b7280;font-size:12px;line-height:1.4;">
          Stay safe,<br>
          <strong>K&amp;M Events Security Team</strong>
        </p>

      </td>
    </tr>
  </table>
</div>

      `,
    };

    await ensureTransporter().sendMail(mailOptions);
    console.log(`Sent password reset OTP to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error("Failed to send password reset OTP:", error.message);
    return false;
  }
};

function getLogoResource() {
  const logoPath = path.join(__dirname, "..", "..", "Frontend-EZ", "public", "assets", "km-logo.png");
  if (fs.existsSync(logoPath)) {
    const buffer = fs.readFileSync(logoPath);
    return {
      src: "cid:km-logo",
      attachment: {
        filename: "km-logo.png",
        content: buffer,
        cid: "km-logo"
      }
    };
  }

  // Fallback simple SVG
  const inlineSvg = `data:image/svg+xml;base64,${Buffer.from(`
    <svg width="120" height="40" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="40" fill="#dc2626" rx="4"/>
      <text x="60" y="28" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">K&M</text>
    </svg>
  `).toString('base64')}`;

  return { src: inlineSvg, attachment: null };
}

export const sendBookingConfirmationEmail = async (bookingDetails) => {
  try {
    const {
      recipientEmail,
      recipientName,
      eventName,
      eventDate,
      eventTime,
      venue,
      ticketIds,
      ticketType,
      seats,
      quantity,
      totalAmount,
      bookingDate,
      bookingId,
      qrCodes
    } = bookingDetails;

    const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formattedBookingDate = new Date(bookingDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const hasSeats = seats && Array.isArray(seats) && seats.length > 0;

    let ticketRows = '';
    const seatHeader = hasSeats ? '<th style="padding: 12px; text-align: left; font-size: 13px; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Seat</th>' : '';
    for (let i = 0; i < quantity; i++) {
      const ticketId = ticketIds[i] || 'N/A';
      const seatCell = hasSeats ? `<td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${seats[i] ? `Seat ${seats[i]}` : 'N/A'}</td>` : '';
      ticketRows += `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${i + 1}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #dc2626;">${ticketId}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${ticketType || 'Standard'}</td>
          ${seatCell}
        </tr>
      `;
    }

    const pdfBuffers = [];
    for (let i = 0; i < quantity; i++) {
      const pdf = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      pdf.on('data', (chunk) => chunks.push(chunk));

      const pdfPromise = new Promise((resolve) => {
        pdf.on('end', () => {
          pdfBuffers.push({
            filename: `Ticket_${ticketIds[i]}.pdf`,
            content: Buffer.concat(chunks)
          });
          resolve();
        });
      });

        const contentWidth = pdf.page.width - pdf.page.margins.left - pdf.page.margins.right;
        pdf.font('Helvetica-Bold').fontSize(26).fillColor('#dc2626').text('K&M Events', pdf.page.margins.left, pdf.y, { align: 'center', width: contentWidth });
        pdf.moveDown(0.4);
        pdf.font('Helvetica').fontSize(13).fillColor('#6b7280').text('Official Event Ticket', pdf.page.margins.left, pdf.y, { align: 'center', width: contentWidth });
        pdf.moveDown(0.8);
        pdf.moveTo(pdf.page.margins.left, pdf.y).lineTo(pdf.page.width - pdf.page.margins.right, pdf.y).strokeColor('#e5e7eb').stroke();
        pdf.moveDown(1);

        pdf.font('Helvetica-Bold').fontSize(12).fillColor('#6b7280').text('Ticket ID', pdf.page.margins.left, pdf.y);
        pdf.moveDown(0.3);
        pdf.font('Helvetica-Bold').fontSize(22).fillColor('#dc2626').text(ticketIds[i], pdf.page.margins.left, pdf.y, { align: 'left' });
        pdf.moveDown(1.8);

        pdf.font('Helvetica-Bold').fontSize(14).fillColor('#111827').text('Event Details', pdf.page.margins.left, pdf.y);
        pdf.moveDown(0.4);
        pdf.font('Helvetica').fontSize(11).fillColor('#6b7280');
        const detailLabelX = pdf.page.margins.left;
        const detailValueX = detailLabelX + 110;

        pdf.text('Event:', detailLabelX, pdf.y);
        pdf.fillColor('#111827').text(eventName, detailValueX, pdf.y - 11, { width: contentWidth - 130 });
        pdf.moveDown(1.1);

        pdf.fillColor('#6b7280').text('Date & Time:', detailLabelX, pdf.y);
        pdf.fillColor('#111827').text(`${formattedDate} at ${eventTime}`, detailValueX, pdf.y - 11);
        pdf.moveDown(1.1);

        pdf.fillColor('#6b7280').text('Venue:', detailLabelX, pdf.y);
        pdf.fillColor('#111827').text(venue, detailValueX, pdf.y - 11, { width: contentWidth - 130 });
        pdf.moveDown(1.2);

        pdf.font('Helvetica-Bold').fontSize(14).fillColor('#111827').text('Ticket Details', detailLabelX, pdf.y);
        pdf.moveDown(0.4);
        pdf.font('Helvetica').fontSize(11).fillColor('#6b7280');

        pdf.text('Type:', detailLabelX, pdf.y);
        pdf.fillColor('#111827').text(ticketType || 'Standard', detailValueX, pdf.y - 11);
        pdf.moveDown(1.1);

        if (hasSeats && seats[i]) {
          pdf.fillColor('#6b7280').text('Seat:', detailLabelX, pdf.y);
          pdf.fillColor('#111827').text(`Seat ${seats[i]}`, detailValueX, pdf.y - 11);
          pdf.moveDown(1.1);
        }

        pdf.fillColor('#6b7280').text('Attendee:', detailLabelX, pdf.y);
        pdf.fillColor('#111827').text(recipientName, detailValueX, pdf.y - 11);
        pdf.moveDown(1.2);

        if (qrCodes[i] && qrCodes[i].image) {
          pdf.font('Helvetica-Bold').fontSize(13).fillColor('#111827').text('QR Code for Entry', pdf.page.margins.left, pdf.y, { align: 'center', width: contentWidth });
          pdf.moveDown(0.4);

          const qrBase64 = qrCodes[i].image.replace(/^data:image\/png;base64,/, '');
          const qrBuffer = Buffer.from(qrBase64, 'base64');
          const qrSize = 180;
          const qrX = pdf.page.margins.left + (contentWidth - qrSize) / 2;
          pdf.image(qrBuffer, qrX, pdf.y, { width: qrSize, height: qrSize });
          pdf.moveDown(10);
        }

        pdf.font('Helvetica-Bold').fontSize(12).fillColor('#111827').text('Entry Instructions', pdf.page.margins.left, pdf.y);
        pdf.moveDown(0.2);
        pdf.font('Helvetica').fontSize(10).fillColor('#666666');
        pdf.list([
          'Present this ticket at the entrance',
          'QR code will be scanned for entry',
          'Each QR code can only be used once',
          'Please arrive 30 minutes early',
          'Valid ID may be required'
        ], pdf.page.margins.left, pdf.y);
        pdf.moveDown(1.4);

        pdf.font('Helvetica').fontSize(9).fillColor('#9ca3af');
        const footerY = pdf.page.height - pdf.page.margins.bottom - 60;
        pdf.text(`Booking ID: ${bookingId}`, pdf.page.margins.left, footerY, { align: 'center', width: contentWidth });
        pdf.text(`Booked on: ${formattedBookingDate}`, pdf.page.margins.left, pdf.y, { align: 'center', width: contentWidth });
        pdf.text('© K&M Events - All rights reserved', pdf.page.margins.left, pdf.y, { align: 'center', width: contentWidth });

      pdf.end();
      await pdfPromise;
    }

    const logoRes = getLogoResource();
    const attachments = [];
    if (logoRes.attachment) attachments.push(logoRes.attachment);
    attachments.push(...pdfBuffers);

    const mailOptions = {
      from: process.env.EMAIL_USER || "k.m.easyevents@gmail.com",
      to: recipientEmail,
      subject: `Booking Confirmed: ${eventName} - K&M Events`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Confirmation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; line-height: 1.6;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 100%;">
<!-- Header with Logo -->
<tr>
  <td style="background:#ffffff; padding:14px 20px; border-bottom:1px solid #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <!-- Logo -->
        <td style="width:120px; vertical-align:middle;">
          <img 
            src="${logoRes.src}" 
            alt="K&M Events Logo" 
            style="max-width:110px; height:auto; display:block;" 
          />
        </td>

        <!-- Text -->
        <td style="vertical-align:middle; padding-left:12px;">
          <h1 style="color:#dc2626; margin:0; font-size:18px; font-weight:600; line-height:1.2;">
            Booking Confirmed
          </h1>
          <p style="color:#9f1239; margin:2px 0 0 0; font-size:12px;">
            Your tickets are ready
          </p>
        </td>
      </tr>
    </table>
  </td>
</tr>


                  <!-- Greeting -->
                  <tr>
                    <td style="padding: 30px 30px 20px 30px;">
                      <p style="margin: 0; font-size: 16px; color: #111827;">Hello <strong>${recipientName}</strong>,</p>
                      <p style="margin: 15px 0 0 0; font-size: 16px; color: #374151;">Thank you for booking with K&M Events! Your payment has been confirmed and your tickets are ready.</p>
                    </td>
                  </tr>

                  <!-- Event Details -->
                  <tr>
                    <td style="padding: 20px 30px;">
                      <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; border-radius: 4px;">
                        <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #111827;">Event Details</h2>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 120px;">Event Name:</td>
                            <td style="padding: 8px 0; color: #111827; font-weight: 600; font-size: 14px;">${eventName}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date & Time:</td>
                            <td style="padding: 8px 0; color: #111827; font-weight: 600; font-size: 14px;">${formattedDate} at ${eventTime}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Venue:</td>
                            <td style="padding: 8px 0; color: #111827; font-weight: 600; font-size: 14px;">${venue}</td>
                          </tr>
                        </table>
                      </div>
                    </td>
                  </tr>

                  <!-- Ticket Details -->
                  <tr>
                    <td style="padding: 20px 30px;">
                      <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #111827;">Ticket Details</h2>
                      <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden;">
                        <thead>
                          <tr style="background-color: #f9fafb;">
                            <th style="padding: 12px; text-align: left; font-size: 13px; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb;">#</th>
                            <th style="padding: 12px; text-align: left; font-size: 13px; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Ticket ID</th>
                            <th style="padding: 12px; text-align: left; font-size: 13px; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Type</th>
                            ${seatHeader}
                          </tr>
                        </thead>
                        <tbody style="font-size: 14px; color: #374151;">
                          ${ticketRows}
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  <!-- Payment Summary -->
                  <tr>
                    <td style="padding: 20px 30px;">
                      <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #111827;">Payment Summary</h2>
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 15px; border-radius: 4px;">
                        <tr>
                          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Quantity:</td>
                          <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right; font-size: 14px;">${quantity} ticket${quantity > 1 ? 's' : ''}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Amount Paid:</td>
                          <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right; font-size: 14px;">₹${totalAmount.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Payment Status:</td>
                          <td style="padding: 8px 0; text-align: right;"><span style="background-color: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600;">CONFIRMED</span></td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Booking Date:</td>
                          <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right; font-size: 14px;">${formattedBookingDate}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Booking ID:</td>
                          <td style="padding: 8px 0; color: #111827; font-weight: 600; text-align: right; font-size: 14px;">#${bookingId}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Entry Instructions -->
                  <tr>
                    <td style="padding: 20px 30px;">
                      <div style="background-color: #fffbeb; border: 1px solid #fcd34d; padding: 20px; border-radius: 4px;">
                        <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #111827;">Important Entry Instructions</h2>
                        <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px;">
                          <li style="margin-bottom: 10px;">Please arrive at least 30 minutes before the event starts</li>
                          <li style="margin-bottom: 10px;">Show your PDF ticket or QR code at the entrance for scanning</li>
                          <li style="margin-bottom: 10px;">Each QR code can only be scanned once for entry</li>
                          <li style="margin-bottom: 10px;">A valid ID may be required for verification</li>
                          <li style="margin-bottom: 10px;">Tickets are non-refundable and non-transferable</li>
                        </ul>
                      </div>
                    </td>
                  </tr>

                  <!-- Attachment Note -->
                  <tr>
                    <td style="padding: 20px 30px;">
                      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px;">
                        <p style="margin: 0; font-size: 14px; color: #1e40af;"><strong>📎 Your PDF ticket${quantity > 1 ? 's are' : ' is'} attached to this email.</strong> Please save ${quantity > 1 ? 'them' : 'it'} or show ${quantity > 1 ? 'them' : 'it'} on your mobile device at the venue.</p>
                      </div>
                    </td>
                  </tr>

                  <!-- Support -->
                  <tr>
                    <td style="padding: 20px 30px;">
                      <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">Need help? Contact our support team:</p>
                      <p style="margin: 0; font-size: 14px;">
                        <strong style="color: #111827;">Email:</strong> <a href="mailto:k.m.easyevents@gmail.com" style="color: #dc2626; text-decoration: none;">k.m.easyevents@gmail.com</a><br/>
                        <strong style="color: #111827;">Website:</strong> <a href="http://localhost:5173" style="color: #dc2626; text-decoration: none;">K&M Events</a>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 10px 0; font-size: 16px; color: #111827; font-weight: 600;">Thank you for choosing K&M Events!</p>
                      <p style="margin: 0; font-size: 13px; color: #6b7280;">We look forward to seeing you at the event.</p>
                      <p style="margin: 20px 0 0 0; font-size: 12px; color: #9ca3af;">
                        © ${new Date().getFullYear()} K&M Events. All rights reserved.<br/>
                        This is an automated confirmation email. Please do not reply.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      attachments
    };

    await transporter.sendMail(mailOptions);
    console.log(`Booking confirmation email sent to ${recipientEmail} with ${pdfBuffers.length} PDF ticket(s)`);
    return true;
  } catch (error) {
    console.error("Booking confirmation email failed:", error);
    return false;
  }
};

/**
 * Send weather alert email to user who booked tickets
 */
export const sendWeatherAlertEmail = async (bookingDetails, weatherAlert) => {
  try {
    const weatherIcon = {
      warning: "⚠️",
      caution: "⚡",
      info: "ℹ️",
    }[weatherAlert.type] || "📍";

    const mailOptions = {
      from: emailSender,
      to: bookingDetails.user.email,
      subject: `${weatherIcon} Weather Alert for Your Event: ${bookingDetails.event.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 3px solid #ff9800; padding-bottom: 10px;">
            ${weatherIcon} Weather Alert Notification
          </h2>
          
          <p style="font-size: 16px; color: #333;">
            Hello <strong>${bookingDetails.user.name}</strong>,
          </p>
          
          <p style="font-size: 14px; color: #666;">
            We've detected <strong>${weatherAlert.type.toUpperCase()}</strong> weather conditions for your upcoming event. Please review the details below:
          </p>

          <!-- Event Details Card -->
          <div style="background-color: #f9f9f9; border-left: 5px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #333;">📅 Event Details</h3>
            <table style="width: 100%; font-size: 14px; color: #666;">
              <tr>
                <td style="padding: 5px 0;"><strong>Event Name:</strong></td>
                <td style="padding: 5px 0;">${bookingDetails.event.name}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;"><strong>Location:</strong></td>
                <td style="padding: 5px 0;">📍 ${bookingDetails.event.location}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;"><strong>Date & Time:</strong></td>
                <td style="padding: 5px 0;">📅 ${new Date(bookingDetails.event.date).toLocaleDateString("en-US", { 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric" 
                })} at ${bookingDetails.event.time || "TBD"}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;"><strong>Tickets Booked:</strong></td>
                <td style="padding: 5px 0;">🎫 ${bookingDetails.quantity} ticket(s)</td>
              </tr>
            </table>
          </div>

          <!-- Weather Alert Card -->
          <div style="background-color: ${weatherAlert.type === 'warning' ? '#ffebee' : weatherAlert.type === 'caution' ? '#fff3e0' : '#e3f2fd'}; border-left: 5px solid ${weatherAlert.type === 'warning' ? '#ff4444' : weatherAlert.type === 'caution' ? '#ff9800' : '#2196f3'}; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #333;">⛈️ Weather Alert</h3>
            <p style="margin: 0 0 15px 0; color: #666; line-height: 1.6;">
              ${weatherAlert.message}
            </p>
            
            <table style="width: 100%; font-size: 14px; color: #666;">
              <tr>
                <td style="padding: 5px 0;"><strong>Condition:</strong></td>
                <td style="padding: 5px 0;">${weatherAlert.condition}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;"><strong>🌡️ Temperature:</strong></td>
                <td style="padding: 5px 0;">${weatherAlert.temperature}°C (Feels like ${weatherAlert.feelsLike || weatherAlert.temperature}°C)</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;"><strong>💧 Humidity:</strong></td>
                <td style="padding: 5px 0;">${weatherAlert.humidity}%</td>
              </tr>
              <tr>
                <td style="padding: 5px 0;"><strong>💨 Wind Speed:</strong></td>
                <td style="padding: 5px 0;">${weatherAlert.windSpeed} km/h</td>
              </tr>
              ${weatherAlert.rainfall > 0 ? `<tr>
                <td style="padding: 5px 0;"><strong>🌧️ Rainfall:</strong></td>
                <td style="padding: 5px 0;">${weatherAlert.rainfall}mm</td>
              </tr>` : ''}
            </table>
          </div>

          <!-- Action Required Section -->
          <div style="background-color: #f0f0f0; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; color: #333;">✅ What You Can Do</h3>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #666; line-height: 1.8;">
              <li>Check your booking details for any updates from the event organizer</li>
              <li>Prepare appropriate clothing and gear for the weather conditions</li>
              <li>Consider alternative transportation if needed</li>
              <li>Keep an eye on event updates for any schedule changes</li>
              <li>Contact the event organizer if you have questions or concerns</li>
            </ul>
          </div>

          <!-- Call to Action -->
          <div style="text-align: center; margin: 20px 0;">
            <a href="http://localhost:3000/my-bookings" style="background: #2196f3; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; font-weight: bold; display: inline-block;">
              View Your Bookings
            </a>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #ddd; margin-top: 20px; padding-top: 15px; font-size: 12px; color: #999; text-align: center;">
            <p>This is an automated weather alert notification.</p>
            <p>For more information, visit: <a href="http://localhost:3000" style="color: #2196f3; text-decoration: none;">K&M Events</a></p>
            <p>&copy; ${new Date().getFullYear()} K&M Events. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await ensureTransporter().sendMail(mailOptions);
    console.log("✅ Weather alert email sent to:", bookingDetails.user.email);
    return true;
  } catch (error) {
    console.error("❌ Error sending weather alert email:", error);
    return false;
  }
};

export default transporter;
