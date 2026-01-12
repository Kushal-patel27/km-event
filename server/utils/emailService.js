import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export default transporter;
