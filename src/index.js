const express = require('express');
const cors = require('cors');
const path = require('path');
const { validateConfig } = require('./config');
const logger = require('./lib/logger');
const { handleGhlNewLead } = require('./webhooks/ghlNewLead');
const { handleVapiEvents } = require('./webhooks/vapiEvents');
const { mountApiRoutes } = require('./api/index');

try {
  validateConfig();
} catch (err) {
  logger.warn(`Config validation warning: ${err.message}`);
  logger.warn('Some features will not work until all env vars are set.');
}

const app = express();

app.use(cors());
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Dashboard API ─────────────────────────────────────────────────────────────
mountApiRoutes(app);

// ── Webhook endpoints ─────────────────────────────────────────────────────────
app.post('/webhooks/ghl-new-lead', handleGhlNewLead);
app.post('/webhooks/vapi-events', handleVapiEvents);

// ── Serve React frontend in production ────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Unhandled Express error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, () => {
  logger.info(`Qualifi server running on port ${PORT}`);
  logger.info('  GET  /health');
  logger.info('  GET  /api/stats');
  logger.info('  GET  /api/calls');
  logger.info('  GET  /api/calls/:id');
  logger.info('  POST /webhooks/ghl-new-lead');
  logger.info('  POST /webhooks/vapi-events');
});

module.exports = app;
