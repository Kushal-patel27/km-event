import { jsPDF } from 'jspdf'

const brandAccent = '#e11d48' // subtle brand accent (rose-600)
const textPrimary = '#0f172a'
const textMuted = '#475569'
const borderColor = '#e2e8f0'
const bgTag = '#f8fafc'

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

const formatAmount = (value) => {
  const num = toNumber(value)
  if (num === null) return '—'
  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  return `INR ${formatted}`
}

const formatDateTime = (dateValue) => {
  if (!dateValue) return '—'
  const dt = new Date(dateValue)
  if (Number.isNaN(dt.getTime())) return '—'
  return dt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

const buildTicketItems = (booking) => {
  const { seats, quantity, ticketIds, scans, qrCodes, _id, id, user, event } = booking
  const baseId = _id || id || Date.now().toString()
  const items = []

  if (Array.isArray(seats) && seats.length > 0) {
    seats.forEach((seat, idx) => {
      const ticketId = ticketIds && ticketIds[idx] ? ticketIds[idx] : null
      const isScanned = scans && scans.some(s => s.ticketId === ticketId)
      items.push({
        seatLabel: seat?.toString() || `Seat ${idx + 1}`,
        ticketId,
        qrId: `${baseId}-${seat}`,
        qrImage: qrCodes && qrCodes[idx] ? qrCodes[idx].image : null,
        isScanned,
        ticketIndex: idx + 1,
        user,
        event
      })
    })
  } else {
    const count = quantity || (typeof seats === 'number' ? seats : 1)
    for (let i = 0; i < count; i++) {
      const ticketId = ticketIds && ticketIds[i] ? ticketIds[i] : null
      const isScanned = scans && scans.some(s => s.ticketId === ticketId)
      items.push({
        seatLabel: count > 1 ? `#${i + 1}` : 'General',
        ticketId,
        qrId: `${baseId}-${i + 1}`,
        qrImage: qrCodes && qrCodes[i] ? qrCodes[i].image : null,
        isScanned,
        ticketIndex: i + 1,
        user,
        event
      })
    }
  }

  return items
}

const fetchAsDataUrl = async (url) => {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return await new Promise(resolve => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  } catch (e) {
    console.error('QR fetch failed', e)
    return null
  }
}

const getQrDataUrl = async (ticket) => {
  if (ticket.qrImage) return ticket.qrImage
  const qrPayload = {
    ticketId: ticket.ticketId,
    bid: ticket.qrId,
    uid: ticket.user?.id,
    evt: ticket.event?._id || ticket.event?.id
  }
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(JSON.stringify(qrPayload))}`
  return await fetchAsDataUrl(qrUrl)
}

const drawChip = (pdf, text, x, y) => {
  const paddingX = 2.8
  const paddingY = 1.6
  const textWidth = pdf.getTextWidth(text)
  const boxW = textWidth + paddingX * 2
  const boxH = 6
  pdf.setFillColor(bgTag)
  pdf.setDrawColor(borderColor)
  pdf.roundedRect(x, y, boxW, boxH, 2, 2, 'FD')
  pdf.setTextColor(textMuted)
  pdf.setFontSize(9)
  pdf.text(text, x + paddingX, y + boxH - paddingY)
  return boxW
}

const drawTicketPage = async (pdf, { ticket, event, booking, pageWidth, pageHeight, margin }) => {
  const attendee = booking?.user || booking?.attendee || {}
  const ticketType = booking?.ticketType?.name || booking?.ticketType || 'Standard'
  const paymentStatus = (booking?.paymentStatus || booking?.status || 'Confirmed').toString()
  const amountPaid = booking?.totalAmount ?? booking?.total ?? booking?.amountPaid
  const bookingDate = booking?.createdAt || booking?.date
  const eventDate = event?.date

  const contentX = margin
  const contentW = pageWidth - margin * 2
  let cursorY = margin

  // Header
  pdf.setFillColor(bgTag)
  pdf.setDrawColor(borderColor)
  pdf.roundedRect(contentX, cursorY, contentW, 24, 4, 4, 'FD')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(15)
  pdf.setTextColor(textPrimary)
  pdf.text(event?.title || 'Event Title', contentX + 12, cursorY + 14)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10.5)
  pdf.setTextColor(textMuted)
  pdf.text(event?.website || 'www.yoursite.com', contentX + 12, cursorY + 19)

  // Logo placeholder
  pdf.setDrawColor(brandAccent)
  pdf.setLineWidth(1.2)
  pdf.circle(contentX + contentW - 14, cursorY + 12, 6)
  pdf.setFontSize(9.5)
  pdf.setFont('helvetica', 'bold')
  pdf.text('LOGO', contentX + contentW - 18, cursorY + 14, { align: 'left' })

  cursorY += 28

  // Event details box
  pdf.setDrawColor(borderColor)
  pdf.roundedRect(contentX, cursorY, contentW, 32, 3, 3)
  pdf.setFontSize(10.5)
  pdf.setTextColor(textMuted)
  pdf.text('Event', contentX + 6, cursorY + 8)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(12)
  pdf.setTextColor(textPrimary)
  pdf.text(event?.title || '—', contentX + 6, cursorY + 16)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10.2)
  pdf.setTextColor(textMuted)
  pdf.text(`Type: ${event?.type || 'General'}`, contentX + 6, cursorY + 24)
  pdf.text(`Date & Time: ${formatDateTime(eventDate)}`, contentX + contentW * 0.45, cursorY + 16)
  pdf.text(`Venue: ${event?.location || '—'}`, contentX + contentW * 0.45, cursorY + 24)

  cursorY += 40

  // Attendee & booking columns
  const colW = (contentW - 8) / 2
  const drawSection = (title, rows, colX) => {
    pdf.setDrawColor(borderColor)
    pdf.roundedRect(colX, cursorY, colW, 50, 3, 3)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(11.2)
    pdf.setTextColor(textPrimary)
    pdf.text(title, colX + 6, cursorY + 13)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10.2)
    pdf.setTextColor(textMuted)
    let y = cursorY + 22
    rows.forEach(r => {
      pdf.text(r.label, colX + 6, y)
      pdf.setTextColor(textPrimary)
      pdf.text(r.value || '—', colX + colW / 2, y)
      pdf.setTextColor(textMuted)
      y += 8
    })
  }

  drawSection('Attendee', [
    { label: 'Name', value: attendee?.name || '—' },
    { label: 'Email', value: attendee?.email || '—' },
    { label: 'Phone', value: attendee?.phone || booking?.phone || '—' },
    { label: 'Ticket Type', value: ticketType },
    { label: 'Seat', value: ticket.seatLabel }
  ], contentX)

  drawSection('Booking', [
    { label: 'Ticket ID', value: ticket.ticketId || ticket.qrId },
    { label: 'Booking Date', value: formatDateTime(bookingDate) },
    { label: 'Payment Status', value: paymentStatus },
    { label: 'Amount Paid', value: formatAmount(amountPaid) },
    { label: 'Quantity', value: booking?.quantity ? String(booking.quantity) : '1' }
  ], contentX + colW + 6)

  cursorY += 62

  // QR and instructions row
  const qrSize = 54
  pdf.setDrawColor(borderColor)
  pdf.roundedRect(contentX, cursorY, qrSize + 14, qrSize + 22, 3, 3)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11.5)
  pdf.setTextColor(textPrimary)
  pdf.text('Scan at Entry', contentX + 7, cursorY + 13)

  const qrDataUrl = await getQrDataUrl(ticket)
  if (qrDataUrl) {
    pdf.addImage(qrDataUrl, 'PNG', contentX + 7, cursorY + 17, qrSize, qrSize)
  } else {
    pdf.setTextColor(textMuted)
    pdf.setFontSize(9)
    pdf.text('QR unavailable', contentX + 9, cursorY + 32)
  }

  // Instructions
  const instrX = contentX + qrSize + 22
  pdf.setDrawColor(borderColor)
  pdf.roundedRect(instrX, cursorY, contentW - (qrSize + 22), qrSize + 22, 3, 3)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(11.5)
  pdf.setTextColor(textPrimary)
  pdf.text('Instructions & Entry Rules', instrX + 6, cursorY + 13)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9.7)
  pdf.setTextColor(textMuted)
  const rules = [
    '• Please arrive 15 minutes early for check-in.',
    '• Keep this ticket handy; one scan per entry.',
    '• Government ID may be required.',
    '• No refunds for late arrivals or no-shows.',
    '• Follow venue safety and security guidelines.'
  ]
  let ry = cursorY + 22
  rules.forEach(r => {
    pdf.text(r, instrX + 6, ry)
    ry += 6.5
  })

  cursorY += qrSize + 36

  // Footer
  pdf.setDrawColor(borderColor)
  pdf.line(contentX, pageHeight - margin - 10, contentX + contentW, pageHeight - margin - 10)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9.5)
  pdf.setTextColor(textMuted)
  pdf.text(event?.website || 'www.yoursite.com', contentX, pageHeight - margin - 4)
  pdf.text(event?.supportEmail || 'support@yoursite.com', contentX + contentW, pageHeight - margin - 4, { align: 'right' })

  // Chips
  drawChip(pdf, `Ticket ${ticket.ticketIndex}`, contentX, pageHeight - margin - 18)
  drawChip(pdf, paymentStatus.toUpperCase(), contentX + 32, pageHeight - margin - 18)
}

export async function generateTicketPdf({ booking }) {
  const tickets = buildTicketItems(booking)
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 12

  for (let i = 0; i < tickets.length; i++) {
    if (i > 0) pdf.addPage()
    await drawTicketPage(pdf, {
      ticket: tickets[i],
      event: booking.event,
      booking,
      pageWidth,
      pageHeight,
      margin
    })
  }

  const eventTitle = booking?.event?.title || 'event'
  const sanitizedTitle = eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()
  const bookingId = booking?._id || booking?.id || Date.now().toString()
  pdf.save(`ticket_${sanitizedTitle}_${bookingId.slice(-6)}.pdf`)
}
