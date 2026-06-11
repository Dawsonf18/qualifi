require('dotenv').config();

const required = [
  'GHL_API_KEY',
  'GHL_LOCATION_ID',
  'GHL_CALENDAR_ID',
  'GHL_SMS_FROM_NUMBER',
  'VAPI_API_KEY',
  'VAPI_ASSISTANT_ID',
  'VAPI_PHONE_NUMBER_ID',
  'MY_PHONE_NUMBER',
];

function validateConfig() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}

const config = {
  port: parseInt(process.env.PORT || '3000', 10),

  ghl: {
    apiKey: process.env.GHL_API_KEY,
    locationId: process.env.GHL_LOCATION_ID,
    calendarId: process.env.GHL_CALENDAR_ID,
    smsFromNumber: process.env.GHL_SMS_FROM_NUMBER,
  },

  vapi: {
    apiKey: process.env.VAPI_API_KEY,
    assistantId: process.env.VAPI_ASSISTANT_ID,
    phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
  },

  myPhoneNumber: process.env.MY_PHONE_NUMBER,

  retry: {
    enabled: process.env.CALL_RETRY_ENABLED !== 'false',
    delayMinutes: parseInt(process.env.CALL_RETRY_DELAY_MINUTES || '15', 10),
  },
};

module.exports = { config, validateConfig };
