const db = require('./db');

function createCall({ id, contactId, leadName, leadPhone, formAnswers, isRetry = false }) {
  return db.prepare(`
    INSERT OR IGNORE INTO calls (id, contact_id, lead_name, lead_phone, form_answers, is_retry)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, contactId || null, leadName, leadPhone, formAnswers || null, isRetry ? 1 : 0);
}

function updateCallOutcome({ id, outcome, bookedTime }) {
  return db.prepare(`
    UPDATE calls
    SET outcome = ?, booked_time = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
    WHERE id = ?
  `).run(outcome, bookedTime || null, id);
}

function updateCallReport({ id, transcript, recordingUrl, endedReason, durationSeconds }) {
  return db.prepare(`
    UPDATE calls
    SET transcript = ?, recording_url = ?, ended_reason = ?, duration_seconds = ?,
        updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
    WHERE id = ?
  `).run(transcript || null, recordingUrl || null, endedReason || null, durationSeconds || null, id);
}

function getCall(id) {
  return db.prepare('SELECT * FROM calls WHERE id = ?').get(id);
}

function getCalls({ page = 1, limit = 20, outcome, search } = {}) {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (outcome && outcome !== 'all') {
    if (outcome === 'pending') {
      conditions.push('outcome IS NULL');
    } else {
      conditions.push('outcome = ?');
      params.push(outcome);
    }
  }

  if (search) {
    conditions.push('(lead_name LIKE ? OR lead_phone LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const calls = db.prepare(`
    SELECT id, contact_id, lead_name, lead_phone, outcome, booked_time,
           ended_reason, duration_seconds, recording_url, is_retry, created_at
    FROM calls ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  const { total } = db.prepare(`SELECT COUNT(*) as total FROM calls ${where}`).get(...params);

  return { calls, total, page, pages: Math.ceil(total / limit) };
}

function getStats() {
  const summary = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN date(created_at) = date('now') THEN 1 ELSE 0 END) as today,
      SUM(CASE WHEN outcome = 'transfer' THEN 1 ELSE 0 END) as transfers,
      SUM(CASE WHEN outcome = 'booked' THEN 1 ELSE 0 END) as booked,
      SUM(CASE WHEN outcome = 'not_qualified' THEN 1 ELSE 0 END) as not_qualified,
      SUM(CASE WHEN outcome IS NULL THEN 1 ELSE 0 END) as pending
    FROM calls
  `).get();

  const total = summary.total || 0;
  summary.transfer_rate = total > 0 ? (summary.transfers || 0) / total : 0;
  summary.book_rate = total > 0 ? (summary.booked || 0) / total : 0;
  summary.qualified_rate = total > 0 ? ((summary.transfers || 0) + (summary.booked || 0)) / total : 0;

  const chartRows = db.prepare(`
    SELECT
      date(created_at) as date,
      COALESCE(outcome, 'pending') as outcome,
      COUNT(*) as count
    FROM calls
    WHERE created_at >= datetime('now', '-14 days')
    GROUP BY date(created_at), COALESCE(outcome, 'pending')
    ORDER BY date ASC
  `).all();

  const chartMap = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    chartMap[key] = { date: key, transfer: 0, booked: 0, not_qualified: 0, pending: 0 };
  }
  for (const row of chartRows) {
    if (chartMap[row.date]) chartMap[row.date][row.outcome] = row.count;
  }

  summary.chart = Object.values(chartMap);
  return summary;
}

module.exports = { createCall, updateCallOutcome, updateCallReport, getCall, getCalls, getStats };
