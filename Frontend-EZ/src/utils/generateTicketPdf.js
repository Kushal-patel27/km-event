import { jsPDF } from 'jspdf'

// Professional color palette
const colors = {
  primary: '#d72757', // Deeper rose for professional look
  secondary: '#1f2937', // Dark for headers
  textPrimary: '#1f2937',
  textSecondary: '#4b5563',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  bgLight: '#f9fafb',
  bgCard: '#ffffff',
  accent: '#059669',
  warning: '#dc2626',
  info: '#2563eb'
}

// Margins and spacing
const margins = {
  page: 12,
  card: 6,
  section: 4
}

// Helper functions
const toNumber = (value) => {
  if (value === null || value === undefined) return null
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '')
    const num = parseFloat(cleaned)
    return Number.isNaN(num) ? null : num
  }
  return null
}

const formatCurrency = (value) => {
  const num = toNumber(value)
  if (num === null) return '—'
  return `INR ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatDateTime = (dateValue) => {
  if (!dateValue) return '—'
  const dt = new Date(dateValue)
  if (Number.isNaN(dt.getTime())) return '—'
  return dt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

// Convert hex color to RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0]
}

// Draw a professional card with content
const drawCard = (pdf, x, y, width, height, title, rows, options = {}) => {
  const { bgColor = colors.bgCard, borderColor = colors.border, titleColor = colors.primary } = options

  // Card background with shadow effect
  pdf.setFillColor(245, 245, 245)
  pdf.roundedRect(x + 0.5, y + 0.5, width - 1, height - 1, 4, 4, 'F')

  // Main card
  const borderRgb = hexToRgb(borderColor)
  pdf.setDrawColor(...borderRgb)
  pdf.setLineWidth(0.75)
  pdf.setFillColor(255, 255, 255)
  pdf.roundedRect(x, y, width, height, 4, 4, 'FD')

  let cursorY = y + 8

  // Title with colored underline
  if (title) {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(12)
    const titleRgb = hexToRgb(titleColor)
    pdf.setTextColor(...titleRgb)
    pdf.text(title, x + 8, cursorY)
    
    // Colored line under title
    pdf.setDrawColor(...titleRgb)
    pdf.setLineWidth(1.5)
    pdf.line(x + 8, cursorY + 2, x + 35, cursorY + 2)
    
    cursorY += 10
  }

  // Simple table rows with proper spacing
  pdf.setFontSize(9.5)
  const labelColX = x + 8
  const valueColX = x + width * 0.35

  rows.forEach((row, idx) => {
    // Alternating background
    if (idx % 2 === 0) {
      pdf.setFillColor(249, 250, 251)
      pdf.rect(x + 4, cursorY - 3.5, width - 8, 9, 'F')
    }

    // Label
    const [mutedR, mutedG, mutedB] = hexToRgb(colors.textMuted)
    pdf.setTextColor(mutedR, mutedG, mutedB)
    pdf.setFont('helvetica', 'normal')
    pdf.text(String(row.label || ''), labelColX, cursorY)

    // Value
    const [primaryR, primaryG, primaryB] = hexToRgb(colors.textPrimary)
    pdf.setTextColor(primaryR, primaryG, primaryB)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    const valueText = String(row.value || '—')
    pdf.text(valueText, valueColX, cursorY)
    pdf.setFontSize(9.5)

    cursorY += 9
  })

  return cursorY - y
}

// Fetch QR code as data URL
const getQrDataUrl = async (ticket) => {
  try {
    if (ticket.qrImage) return ticket.qrImage
    const qrPayload = {
      ticketId: ticket.ticketId,
      bid: ticket.qrId,
      uid: ticket.user?.id,
      evt: ticket.event?._id || ticket.event?.id
    }
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(JSON.stringify(qrPayload))}`
    const res = await fetch(qrUrl)
    const blob = await res.blob()
    return await new Promise(resolve => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  } catch (e) {
    console.error('QR fetch error:', e)
    return null
  }
}

// Generate a single ticket page
const generateTicketPage = async (pdf, { ticket, booking, event, pageWidth, pageHeight }) => {
  try {
    const margin = margins.page
    const contentX = margin
    const contentWidth = pageWidth - margin * 2

    // Extract and normalize all data with proper fallbacks
    const attendee = booking?.attendee || booking?.user || {}
    
    // Handle ticket type - could be string or object
    let ticketType = 'General'
    if (booking?.ticketType) {
      if (typeof booking.ticketType === 'object' && booking.ticketType.name) {
        ticketType = booking.ticketType.name
      } else if (typeof booking.ticketType === 'string') {
        ticketType = booking.ticketType
      }
    } else if (booking?.ticketTypeName) {
      ticketType = booking.ticketTypeName
    } else if (booking?.type) {
      ticketType = booking.type
    }
    
    const paymentStatus = (booking?.paymentStatus || booking?.status || 'Confirmed').toUpperCase()
    const amount = booking?.totalAmount || booking?.total || booking?.amountPaid || 0
    const eventData = booking?.event || event || {}
    
    // Ensure all required fields exist
    const eventTitle = eventData?.title || eventData?.name || 'Event'
    const eventType = eventData?.type || eventData?.category || 'General'
    const eventDate = eventData?.date || eventData?.startDate || eventData?.dateTime || new Date().toISOString()
    const eventLocation = eventData?.location || eventData?.venue || eventData?.address || 'Venue TBA'
    const eventWebsite = eventData?.website || 'www.kmevents.com'
    const eventEmail = eventData?.supportEmail || eventData?.contactEmail || 'support@kmevents.com'

    let cursorY = margin

    // ========== HEADER SECTION ==========
    // Professional header with gradient effect simulation
    const [primaryR, primaryG, primaryB] = hexToRgb(colors.primary)
    pdf.setFillColor(primaryR, primaryG, primaryB)
    pdf.rect(0, 0, pageWidth, 28, 'F')

    // White text on colored background
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(16)
    pdf.setTextColor(255, 255, 255)
    pdf.text('KM EVENTS', contentX + 6, 12)

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(255, 255, 255)
    pdf.text('Professional Event Management', contentX + 6, 19)

    // Ticket badge on right
    pdf.setFillColor(255, 255, 255)
    pdf.roundedRect(contentX + contentWidth - 32, 8, 26, 12, 2, 2, 'F')
    pdf.setFontSize(8)
    pdf.setTextColor(primaryR, primaryG, primaryB)
    pdf.setFont('helvetica', 'bold')
    pdf.text('E-TICKET', contentX + contentWidth - 19, 17, { align: 'center' })

    cursorY = 32

    // ========== EVENT DETAILS SECTION ==========
    const eventRows = [
      { label: 'Event Name', value: String(eventTitle) },
      { label: 'Event Type', value: String(eventType) },
      { label: 'Date & Time', value: String(formatDateTime(eventDate)) },
      { label: 'Venue Location', value: String(eventLocation) }
    ]

    drawCard(pdf, contentX, cursorY, contentWidth, 46, 'Event Details', eventRows)
    cursorY += 50

    // ========== TWO-COLUMN SECTION (Attendee & Booking) ==========
    const colWidth = (contentWidth - margins.card) / 2
    
    // Extract attendee information with multiple fallback paths
    const attendeeName = attendee?.name || attendee?.fullName || attendee?.firstName + ' ' + attendee?.lastName || booking?.name || '—'
    const attendeeEmail = attendee?.email || booking?.email || '—'
    const attendeePhone = attendee?.phone || attendee?.phoneNumber || attendee?.mobile || booking?.phone || '—'
    
    const attendeeRows = [
      { label: 'Full Name', value: String(attendeeName).trim() },
      { label: 'Email Address', value: String(attendeeEmail) },
      { label: 'Phone Number', value: String(attendeePhone) },
      { label: 'Ticket Type', value: String(ticketType) },
      { label: 'Seat Number', value: String(ticket.seatLabel || 'General Admission') }
    ]

    const bookingId = booking?._id || booking?.id || 'N/A'
    const fullBookingId = String(bookingId).toUpperCase()
    const displayBookingId = fullBookingId.length > 12 ? fullBookingId.slice(-12) : fullBookingId
    
    const fullTicketId = String(ticket.ticketId || ticket.qrId || bookingId).toUpperCase()
    const displayTicketId = fullTicketId.length > 12 ? fullTicketId.slice(-12) : fullTicketId
    
    const bookingRows = [
      { label: 'Booking ID', value: displayBookingId },
      { label: 'Ticket ID', value: displayTicketId },
      { label: 'Booking Date', value: String(formatDateTime(booking?.createdAt || booking?.date || booking?.bookingDate)) },
      { label: 'Payment Status', value: String(paymentStatus) },
      { label: 'Amount Paid', value: String(formatCurrency(amount)) }
    ]

    drawCard(pdf, contentX, cursorY, colWidth, 56, 'Attendee Details', attendeeRows)
    drawCard(pdf, contentX + colWidth + margins.card, cursorY, colWidth, 56, 'Booking Details', bookingRows)
    cursorY += 60

    // ========== QR & INSTRUCTIONS SECTION ==========
    const qrCardWidth = colWidth
    const instrCardWidth = colWidth
    const [borderR, borderG, borderB] = hexToRgb(colors.border)

    // QR Card with accent border
    pdf.setFillColor(245, 245, 245)
    pdf.roundedRect(contentX + 0.5, cursorY + 0.5, qrCardWidth - 1, 69, 4, 4, 'F')
    
    pdf.setDrawColor(primaryR, primaryG, primaryB)
    pdf.setLineWidth(1.2)
    pdf.setFillColor(255, 255, 255)
    pdf.roundedRect(contentX, cursorY, qrCardWidth, 69, 4, 4, 'FD')

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(12)
    pdf.setTextColor(primaryR, primaryG, primaryB)
    pdf.text('SCAN AT ENTRY', contentX + 8, cursorY + 8)

    // QR Image
    const qrDataUrl = await getQrDataUrl(ticket)
    if (qrDataUrl) {
      try {
        pdf.addImage(qrDataUrl, 'PNG', contentX + (qrCardWidth - 48) / 2, cursorY + 14, 48, 48)
      } catch (imgErr) {
        console.error('Error adding QR image:', imgErr)
        pdf.setFontSize(9)
        pdf.setTextColor(colors.textMuted)
        pdf.text('QR Code', contentX + qrCardWidth / 2, cursorY + 38, { align: 'center' })
        pdf.text('unavailable', contentX + qrCardWidth / 2, cursorY + 44, { align: 'center' })
      }
    } else {
      pdf.setFontSize(9)
      pdf.setTextColor(colors.textMuted)
      pdf.text('QR Code', contentX + qrCardWidth / 2, cursorY + 38, { align: 'center' })
      pdf.text('unavailable', contentX + qrCardWidth / 2, cursorY + 44, { align: 'center' })
    }

    // Instructions Card with accent border
    const instrX = contentX + qrCardWidth + margins.card
    pdf.setFillColor(245, 245, 245)
    pdf.roundedRect(instrX + 0.5, cursorY + 0.5, instrCardWidth - 1, 69, 4, 4, 'F')
    
    pdf.setDrawColor(primaryR, primaryG, primaryB)
    pdf.setLineWidth(1.2)
    pdf.setFillColor(255, 255, 255)
    pdf.roundedRect(instrX, cursorY, instrCardWidth, 69, 4, 4, 'FD')
    pdf.setDrawColor(borderR, borderG, borderB)
    pdf.setLineWidth(0.5)
    pdf.roundedRect(instrX, cursorY, instrCardWidth, 65, 3, 3, 'FD')

    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(12)
    pdf.setTextColor(primaryR, primaryG, primaryB)
    pdf.text('ENTRY INSTRUCTIONS', instrX + 8, cursorY + 8)

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8.3)
    pdf.setTextColor(colors.textSecondary)

    const rules = [
      '• Arrive 15 minutes before event',
      '• Present QR code at entrance',
      '• Valid ID must be carried',
      '• One entry per ticket only',
      '• Follow venue guidelines',
      '• Ticket is non-transferable'
    ]

    let ruleY = cursorY + 16
    rules.forEach((rule, idx) => {
      if (idx % 2 === 1) {
        pdf.setFillColor(249, 250, 251)
        pdf.rect(instrX + 2, ruleY - 3.5, instrCardWidth - 4, 6, 'F')
      }
      pdf.setTextColor(colors.textSecondary)
      pdf.text(rule, instrX + 6, ruleY)
      ruleY += 6
    })

    cursorY += 75

    // ========== FOOTER SECTION ==========
    // Divider line
    pdf.setDrawColor(borderR, borderG, borderB)
    pdf.setLineWidth(0.5)
    pdf.line(contentX, pageHeight - margin - 14, contentX + contentWidth, pageHeight - margin - 14)

    // Footer text
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    pdf.setTextColor(colors.textMuted)
    pdf.text(String(eventWebsite), contentX, pageHeight - margin - 6)
    pdf.text(String(eventEmail), contentX + contentWidth, pageHeight - margin - 6, { align: 'right' })

    // Status badges with better styling
    const badgeY = pageHeight - margin - 11
    
    // Ticket number badge
    pdf.setFillColor(245, 245, 245)
    pdf.setDrawColor(primaryR, primaryG, primaryB)
    pdf.setLineWidth(0.8)
    pdf.roundedRect(contentX, badgeY, 26, 7, 2, 2, 'FD')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8.5)
    pdf.setTextColor(primaryR, primaryG, primaryB)
    pdf.text(`Ticket #${ticket.ticketIndex}`, contentX + 3, badgeY + 5)

    // Payment status badge
    pdf.setFillColor(primaryR, primaryG, primaryB)
    pdf.setDrawColor(primaryR, primaryG, primaryB)
    pdf.roundedRect(contentX + 32, badgeY, 24, 7, 2, 2, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.text(String(paymentStatus || 'CONFIRMED'), contentX + 34, badgeY + 5)
  } catch (err) {
    console.error('Error generating ticket page:', err)
    throw err
  }
}

// Build ticket items from booking
const buildTicketItems = (booking) => {
  const { seats, quantity, ticketIds, scans, qrCodes, _id, id, user, event } = booking
  const baseId = _id || id || Date.now().toString()
  const items = []

  if (Array.isArray(seats) && seats.length > 0) {
    seats.forEach((seat, idx) => {
      const ticketId = ticketIds?.[idx] || null
      const isScanned = scans?.some(s => s.ticketId === ticketId)
      items.push({
        seatLabel: seat?.toString() || `Seat ${idx + 1}`,
        ticketId,
        qrId: `${baseId}-${seat}`,
        qrImage: qrCodes?.[idx]?.image || null,
        isScanned,
        ticketIndex: idx + 1,
        user,
        event
      })
    })
  } else {
    const count = quantity || 1
    for (let i = 0; i < count; i++) {
      const ticketId = ticketIds?.[i] || null
      const isScanned = scans?.some(s => s.ticketId === ticketId)
      items.push({
        seatLabel: count > 1 ? `#${i + 1}` : 'General',
        ticketId,
        qrId: `${baseId}-${i + 1}`,
        qrImage: qrCodes?.[i]?.image || null,
        isScanned,
        ticketIndex: i + 1,
        user,
        event
      })
    }
  }

  return items
}

// Main export function
export async function generateTicketPdf({ booking }) {
  try {
    if (!booking) {
      throw new Error('Booking data is required')
    }

    const tickets = buildTicketItems(booking)
    if (!tickets || tickets.length === 0) {
      throw new Error('No tickets to generate')
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    for (let i = 0; i < tickets.length; i++) {
      if (i > 0) pdf.addPage()

      await generateTicketPage(pdf, {
        ticket: tickets[i],
        booking,
        event: booking.event,
        pageWidth,
        pageHeight
      })
    }

    const eventTitle = booking?.event?.title || 'event'
    const sanitizedTitle = eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    const bookingId = booking?._id || booking?.id || Date.now().toString()
    pdf.save(`ticket_${sanitizedTitle}_${bookingId.slice(-6)}.pdf`)
  } catch (err) {
    console.error('PDF generation error:', err)
    throw err
  }
}
