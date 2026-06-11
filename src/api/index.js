const { getCalls, getCall, getStats } = require('../database/calls');
const logger = require('../lib/logger');

// Mounts routes directly on the Express app instance to avoid
// Express 5 + dotenvx module-hook path-stripping conflicts with sub-routers.
function mountApiRoutes(app) {
  app.get('/api/stats', (req, res) => {
    try {
      res.json(getStats());
    } catch (err) {
      logger.error('GET /api/stats failed', { error: err.message });
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  app.get('/api/calls', (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
      const outcome = req.query.outcome || null;
      const search = req.query.search ? req.query.search.trim() : null;

      res.json(getCalls({ page, limit, outcome, search }));
    } catch (err) {
      logger.error('GET /api/calls failed', { error: err.message });
      res.status(500).json({ error: 'Failed to fetch calls' });
    }
  });

  app.get('/api/calls/:id', (req, res) => {
    try {
      const call = getCall(req.params.id);
      if (!call) return res.status(404).json({ error: 'Call not found' });
      res.json(call);
    } catch (err) {
      logger.error('GET /api/calls/:id failed', { error: err.message });
      res.status(500).json({ error: 'Failed to fetch call' });
    }
  });
}

module.exports = { mountApiRoutes };
