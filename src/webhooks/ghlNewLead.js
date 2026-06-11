const logger = require('../lib/logger');
const { startOutboundCall } = require('../services/vapi');
const { createCall } = require('../database/calls');

const SYSTEM_FIELDS = new Set([
  'contact_id', 'id', 'contactId',
  'contact_name', 'full_name', 'name', 'firstName', 'lastName', 'first_name', 'last_name',
  'phone', 'phone_number', 'contact_phone', 'phoneNumber',
  'email', 'location_id', 'locationId',
  'event_type', 'type', 'form_id', 'formId',
]);

async function handleGhlNewLead(req, res) {
  logger.info('GHL new-lead webhook received', { rawBody: req.body });
  res.status(200).json({ received: true });

  try {
    const body = req.body;

    const leadName =
      body.contact_name ||
      body.full_name ||
      body.name ||
      [body.firstName || body.first_name, body.lastName || body.last_name].filter(Boolean).join(' ') ||
      null;

    const leadPhone =
      body.phone || body.phone_number || body.contact_phone || body.phoneNumber || null;

    const contactId = body.contact_id || body.contactId || body.id || null;

    if (!leadName || !leadPhone) {
      logger.warn('GHL webhook missing required fields — check field mapping', {
        extractedName: leadName,
        extractedPhone: leadPhone,
        bodyKeys: Object.keys(body),
      });
      return;
    }

    const formAnswers = Object.entries(body)
      .filter(([k]) => !SYSTEM_FIELDS.has(k))
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n') || 'No additional form answers.';

    logger.info('Triggering outbound call', { leadName, leadPhone, contactId });
    const callData = await startOutboundCall({ leadName, leadPhone, formAnswers, contactId });

    if (callData?.id) {
      createCall({
        id: callData.id,
        contactId,
        leadName,
        leadPhone,
        formAnswers,
        isRetry: false,
      });
      logger.info('Call record saved to DB', { callId: callData.id });
    }
  } catch (err) {
    logger.error('Error handling GHL new-lead webhook', { error: err.message, stack: err.stack });
  }
}

module.exports = { handleGhlNewLead };
