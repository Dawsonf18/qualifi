const axios = require('axios');
const { config } = require('../config');
const logger = require('../lib/logger');

const ghlClient = axios.create({
  baseURL: 'https://services.leadconnectorhq.com',
  headers: {
    Authorization: `Bearer ${config.ghl.apiKey}`,
    'Content-Type': 'application/json',
    Version: '2021-07-28', // GHL API version header — required
  },
  timeout: 10_000,
});

async function sendSms({ toNumber, message }) {
  logger.info('Sending SMS', { to: toNumber, preview: message.slice(0, 60) });

  const response = await ghlClient.post('/conversations/messages', {
    type: 'SMS',
    locationId: config.ghl.locationId,
    fromNumber: config.ghl.smsFromNumber,
    toNumber,
    message,
  });

  return response.data;
}

async function bookCalendarEvent({ contactId, startTime, leadName }) {
  logger.info('Booking calendar event', { contactId, startTime, leadName });

  // GHL calendar slots API — creates an appointment on the configured calendar
  // startTime should be an ISO 8601 string e.g. "2025-09-15T14:00:00-05:00"
  const response = await ghlClient.post('/calendars/events/appointments', {
    locationId: config.ghl.locationId,
    calendarId: config.ghl.calendarId,
    contactId,
    title: `AI Qualified Lead — ${leadName}`,
    startTime,
    // endTime defaults to startTime + calendar's default slot duration if omitted
  });

  return response.data;
}

async function addTag({ contactId, tag }) {
  logger.info('Adding GHL tag', { contactId, tag });

  // GHL contacts API — PATCH merges tags
  const response = await ghlClient.put(`/contacts/${contactId}`, {
    tags: [tag],
  });

  return response.data;
}

async function writeNote({ contactId, note }) {
  logger.info('Writing note to GHL contact', { contactId, preview: note.slice(0, 80) });

  const response = await ghlClient.post(`/contacts/${contactId}/notes`, {
    body: note,
    userId: '', // optional; leave empty to attribute to the API key owner
  });

  return response.data;
}

module.exports = { sendSms, bookCalendarEvent, addTag, writeNote };
