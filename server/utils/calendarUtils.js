/**
 * Calendar Integration Utilities
 * Generate calendar links and iCal files for events
 */

/**
 * Generate Google Calendar URL
 */
export const generateGoogleCalendarLink = ({ title, description, location, startDate, endDate }) => {
  const formatDate = (date) => {
    return new Date(date).toISOString().replace(/-|:|\.\d+/g, '');
  };

  const start = formatDate(startDate);
  const end = endDate ? formatDate(endDate) : formatDate(new Date(new Date(startDate).getTime() + 2 * 60 * 60 * 1000)); // Default 2 hours

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: description || '',
    location: location || '',
    dates: `${start}/${end}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Generate iCal/ICS file content
 */
export const generateICalContent = ({ title, description, location, startDate, endDate, organizerEmail, organizerName }) => {
  const formatDate = (date) => {
    return new Date(date).toISOString().replace(/-|:|\.\d+/g, '');
  };

  const start = formatDate(startDate);
  const end = endDate ? formatDate(endDate) : formatDate(new Date(new Date(startDate).getTime() + 2 * 60 * 60 * 1000));
  const timestamp = formatDate(new Date());

  // Clean text for iCal format
  const cleanText = (text) => {
    if (!text) return '';
    return text.replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  };

  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//K&M Events//Event Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${timestamp}@kmevents.com`,
    `DTSTAMP:${timestamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${cleanText(title)}`,
    `DESCRIPTION:${cleanText(description)}`,
    `LOCATION:${cleanText(location)}`,
    organizerEmail ? `ORGANIZER;CN=${cleanText(organizerName || 'K&M Events')}:MAILTO:${organizerEmail}` : '',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');

  return icalContent;
};

/**
 * Generate base64 encoded iCal for email attachment
 */
export const generateICalBase64 = (eventDetails) => {
  const icalContent = generateICalContent(eventDetails);
  return Buffer.from(icalContent).toString('base64');
};

/**
 * Generate Apple Calendar (iCal) data URI
 */
export const generateAppleCalendarLink = (eventDetails) => {
  const icalContent = generateICalContent(eventDetails);
  return `data:text/calendar;charset=utf8,${encodeURIComponent(icalContent)}`;
};

/**
 * Generate Outlook.com calendar URL
 */
export const generateOutlookCalendarLink = ({ title, description, location, startDate, endDate }) => {
  const formatDate = (date) => {
    return new Date(date).toISOString();
  };

  const start = formatDate(startDate);
  const end = endDate ? formatDate(endDate) : formatDate(new Date(new Date(startDate).getTime() + 2 * 60 * 60 * 1000));

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: title,
    body: description || '',
    location: location || '',
    startdt: start,
    enddt: end,
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

/**
 * Generate Yahoo Calendar URL
 */
export const generateYahooCalendarLink = ({ title, description, location, startDate, endDate }) => {
  const formatDate = (date) => {
    return new Date(date).toISOString().replace(/-|:|\.\d+/g, '').slice(0, -1);
  };

  const start = formatDate(startDate);
  const end = endDate ? formatDate(endDate) : formatDate(new Date(new Date(startDate).getTime() + 2 * 60 * 60 * 1000));

  const params = new URLSearchParams({
    v: '60',
    title: title,
    desc: description || '',
    in_loc: location || '',
    st: start,
    et: end,
  });

  return `https://calendar.yahoo.com/?${params.toString()}`;
};

/**
 * Generate all calendar links for an event
 */
export const generateAllCalendarLinks = (eventDetails) => {
  return {
    google: generateGoogleCalendarLink(eventDetails),
    apple: generateAppleCalendarLink(eventDetails),
    outlook: generateOutlookCalendarLink(eventDetails),
    yahoo: generateYahooCalendarLink(eventDetails),
    ical: generateICalContent(eventDetails),
  };
};
