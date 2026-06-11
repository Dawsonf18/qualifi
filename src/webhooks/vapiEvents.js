const logger = require('../lib/logger');
const { triggerTransfer, cancelRetry } = require('../services/vapi');
const { sendSms, bookCalendarEvent, addTag, writeNote } = require('../services/ghl');
const { updateCallOutcome, updateCallReport } = require('../database/calls');
const { config } = require('../config');

async function handleVapiEvents(req, res) {
  logger.info('Vapi event webhook received', { rawBody: req.body });

  const message = req.body?.message;
  if (!message) {
    logger.warn('Vapi webhook body missing message field', { body: req.body });
    return res.status(200).json({ received: true });
  }

  const eventType = message.type;
  logger.info('Vapi event type', { eventType });

  // function-call: Vapi WAITS for our HTTP response — must process synchronously
  if (eventType === 'function-call') {
    return handleFunctionCall(message, res);
  }

  // All other events: respond immediately, process in background
  res.status(200).json({ received: true });

  try {
    if (eventType === 'end-of-call-report') await handleEndOfCallReport(message);
    else if (eventType === 'status-update') handleStatusUpdate(message);
    else logger.info('Unhandled Vapi event type', { eventType });
  } catch (err) {
    logger.error('Error processing Vapi event', { eventType, error: err.message, stack: err.stack });
  }
}

async function handleFunctionCall(message, res) {
  const fnName = message.functionCall?.name;
  const fnArgs = message.functionCall?.parameters || {};
  const callId = message.call?.id;
  const metadata = message.call?.metadata || {};
  const { leadName, leadPhone, contactId } = metadata;

  logger.info('Vapi function call', { fnName, fnArgs, callId });

  try {
    if (fnName === 'transfer_call') {
      await Promise.all([
        triggerTransfer(callId),
        sendSms({
          toNumber: config.myPhoneNumber,
          message: `NOW — ${leadName} (${leadPhone}) is qualified. Connecting now.`,
        }),
      ]);

      updateCallOutcome({ id: callId, outcome: 'transfer' });

      return res.status(200).json({ result: 'Great, connecting you now — just one moment.' });
    }

    if (fnName === 'book_appointment') {
      const { requested_time } = fnArgs;

      await Promise.all([
        bookCalendarEvent({ contactId, startTime: requested_time, leadName }),
        sendSms({
          toNumber: config.myPhoneNumber,
          message: `BOOK — ${leadName} (${leadPhone}) booked for ${requested_time}.`,
        }),
      ]);

      updateCallOutcome({ id: callId, outcome: 'booked', bookedTime: requested_time });

      return res.status(200).json({
        result: `Perfect, you're all set for ${requested_time}. You'll receive a confirmation shortly.`,
      });
    }

    logger.warn('Unknown function call from Vapi', { fnName });
    return res.status(200).json({ result: 'Understood.' });
  } catch (err) {
    logger.error('Error handling Vapi function call', { fnName, error: err.message, stack: err.stack });
    return res.status(200).json({
      result: 'Sorry, I ran into a small issue — a specialist will follow up shortly.',
    });
  }
}

function handleStatusUpdate(message) {
  const status = message.status;
  const callId = message.call?.id;
  logger.info('Vapi call status update', { status, callId });

  if (status === 'in-progress' && callId) cancelRetry(callId);
}

async function handleEndOfCallReport(message) {
  const call = message.call || {};
  const callId = call.id;
  const transcript = message.transcript || '';
  const recordingUrl = message.recordingUrl || '';
  const endedReason = message.endedReason || 'unknown';
  const durationSeconds = message.durationSeconds || null;
  const metadata = call.metadata || {};
  const { contactId, leadName, outcome } = metadata;

  logger.info('End-of-call report', { callId, endedReason, contactId, outcome });

  updateCallReport({ id: callId, transcript, recordingUrl, endedReason, durationSeconds });

  if (contactId) {
    const tasks = [
      writeNote({
        contactId,
        note: [
          `AI Qualification Call — ${new Date().toISOString()}`,
          `Outcome: ${outcome || 'not_qualified'}`,
          `Ended reason: ${endedReason}`,
          recordingUrl ? `Recording: ${recordingUrl}` : null,
          '',
          'Transcript:',
          transcript,
        ]
          .filter((l) => l !== null)
          .join('\n'),
      }),
    ];

    if (!outcome) {
      tasks.push(addTag({ contactId, tag: 'ai-not-qualified' }));
      updateCallOutcome({ id: callId, outcome: 'not_qualified' });
    }

    await Promise.all(tasks);
  }
}

module.exports = { handleVapiEvents };
