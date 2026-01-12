import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateTicketPDF(ticketData) {
  const {
    recipientName,
    eventName,
    eventDate,
    eventTime,
    venue,
    ticketId,
    ticketType,
    seat,
    bookingId,
    bookingDate,
    qrCode
  } = ticketData;

  const pdf = new PDFDocument({ size: 'A4', margin: 50 });
  const chunks = [];

  pdf.on('data', (chunk) => chunks.push(chunk));

  const pdfPromise = new Promise((resolve) => {
    pdf.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });

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

  const contentWidth = pdf.page.width - pdf.page.margins.left - pdf.page.margins.right;
  
  pdf.font('Helvetica-Bold').fontSize(26).fillColor('#dc2626').text('K&M Events', pdf.page.margins.left, pdf.y, { align: 'center', width: contentWidth });
  pdf.moveDown(0.4);
  pdf.font('Helvetica').fontSize(13).fillColor('#6b7280').text('Official Event Ticket', pdf.page.margins.left, pdf.y, { align: 'center', width: contentWidth });
  pdf.moveDown(0.8);
  pdf.moveTo(pdf.page.margins.left, pdf.y).lineTo(pdf.page.width - pdf.page.margins.right, pdf.y).strokeColor('#e5e7eb').stroke();
  pdf.moveDown(1);

  pdf.font('Helvetica-Bold').fontSize(12).fillColor('#6b7280').text('Ticket ID', pdf.page.margins.left, pdf.y);
  pdf.moveDown(0.3);
  pdf.font('Helvetica-Bold').fontSize(22).fillColor('#dc2626').text(ticketId, pdf.page.margins.left, pdf.y, { align: 'left' });
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

  if (seat) {
    pdf.fillColor('#6b7280').text('Seat:', detailLabelX, pdf.y);
    pdf.fillColor('#111827').text(`Seat ${seat}`, detailValueX, pdf.y - 11);
    pdf.moveDown(1.1);
  }

  pdf.fillColor('#6b7280').text('Attendee:', detailLabelX, pdf.y);
  pdf.fillColor('#111827').text(recipientName, detailValueX, pdf.y - 11);
  pdf.moveDown(1.2);

  if (qrCode) {
    pdf.font('Helvetica-Bold').fontSize(13).fillColor('#111827').text('QR Code for Entry', pdf.page.margins.left, pdf.y, { align: 'center', width: contentWidth });
    pdf.moveDown(0.4);

    const qrBase64 = qrCode.replace(/^data:image\/png;base64,/, '');
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
  return await pdfPromise;
}
