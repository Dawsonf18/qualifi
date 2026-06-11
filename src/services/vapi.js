const axios = require('axios');
const { config } = require('../config');
const logger = require('../lib/logger');

const vapiClient = axios.create({
  baseURL: 'https://api.vapi.ai',
  headers: {
    Authorization: `Bearer ${config.vapi.apiKey}`,
    'Content-Type': 'application/json',
  },
  timeout: 10_000,
});

// In-memory retry tracker: callId → retry count
// Good enough for MVP; swap for Redis/Bull if we need persistence across restarts.
const retryTimeouts = new Map();

async function startOutboundCall({ leadName, leadPhone, formAnswers, contactId }, isRetry = false) {
  logger.info('Starting outbound call', { leadName, leadPhone, contactId, isRetry });

  const payload = {
    assistantId: config.vapi.assistantId,
    phoneNumberId: config.vapi.phoneNumberId,
    customer: {
      number: leadPhone,
      name: leadName,
    },
    // variableValues are injected into the assistant's system prompt as {{variable_name}}
    assistantOverrides: {
      variableValues: {
        lead_name: leadName,
        form_answers: formAnswers || 'No form answers provided.',
      },
    },
    // metadata rides along on every Vapi webhook for this call
    metadata: {
      contactId,
      leadName,
      leadPhone,
      outcome: null, // set to 'transfer' | 'booked' | 'not_qualified' by function calls
    },
  };

  const response = await vapiClient.post('/call/phone', payload);
  const callId = response.data?.id;
  logger.info('Outbound call created', { callId, leadName });

  if (config.retry.enabled && !isRetry) {
    scheduleRetry({ leadName, leadPhone, formAnswers, contactId, callId });
  }

  return response.data;
}

function scheduleRetry({ leadName, leadPhone, formAnswers, contactId, callId }) {
  const delayMs = config.retry.delayMinutes * 60 * 1000;
  logger.info('Retry scheduled', { callId, delayMinutes: config.retry.delayMinutes });

  const timeout = setTimeout(async () => {
    retryTimeouts.delete(callId);
    logger.info('Firing retry call', { originalCallId: callId, leadName });
    try {
      await startOutboundCall({ leadName, leadPhone, formAnswers, contactId }, true);
    } catch (err) {
      logger.error('Retry call failed', { error: err.message, leadName });
    }
  }, delayMs);

  retryTimeouts.set(callId, timeout);
}

// Call this when a call connects so we don't retry a call that was answered
function cancelRetry(callId) {
  if (retryTimeouts.has(callId)) {
    clearTimeout(retryTimeouts.get(callId));
    retryTimeouts.delete(callId);
    logger.info('Retry cancelled — call was answered', { callId });
  }
}

// Cold transfer: straight handoff to MY_PHONE_NUMBER via a separate Vapi API call.
// NOTE: verify this endpoint against current Vapi docs before first live use.
// Endpoint may be /call/{id}/transfer or handled via PATCH /call/{id}.
async function triggerTransfer(callId) {
  logger.info('Triggering cold transfer', { callId, to: config.myPhoneNumber });

  const response = await vapiClient.post(`/call/${callId}/transfer`, {
    destination: {
      type: 'number',
      number: config.myPhoneNumber,
      // callerId not set — Vapi will use the outbound number's caller ID
    },
  });

  return response.data;
}

module.exports = { startOutboundCall, triggerTransfer, cancelRetry };
