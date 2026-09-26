const db = require('../config/db');

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

// Sort keys the client may request, mapped to trusted SQL expressions.
// User input is only ever used as a lookup key here, never interpolated directly.
const SORT_COLUMNS = {
  created_at: 't.created_at',
  updated_at: 't.updated_at',
  subject: 't.subject',
  priority: "FIELD(t.priority, 'low', 'medium', 'high', 'urgent')",
  status: "FIELD(t.status, 'open', 'in_progress', 'resolved', 'closed')",
};

const SELECT_TICKET = `
  SELECT
    t.id, t.user_id, t.subject, t.description, t.priority, t.status,
    t.assigned_to, t.created_at, t.updated_at,
    c.name  AS customer_name,
    c.email AS customer_email,
    a.name  AS assigned_to_name
  FROM tickets t
  INNER JOIN users c ON c.id = t.user_id
  LEFT JOIN users a  ON a.id = t.assigned_to`;

/**
 * List tickets with optional filters. `userId` restricts results to one
 * customer's tickets (used to enforce ownership for customers).
 */
async function findAll({ userId, search, status, priority, assignedTo, sort, order } = {}) {
  const where = [];
  const params = [];

  if (userId) {
    where.push('t.user_id = ?');
    params.push(userId);
  }
  if (status) {
    where.push('t.status = ?');
    params.push(status);
  }
  if (priority) {
    where.push('t.priority = ?');
    params.push(priority);
  }
  if (assignedTo === 'unassigned') {
    where.push('t.assigned_to IS NULL');
  } else if (assignedTo) {
    where.push('t.assigned_to = ?');
    params.push(assignedTo);
  }
  if (search) {
    const term = `%${search}%`;
    const clauses = ['t.subject LIKE ?', 't.description LIKE ?', 'c.name LIKE ?', 'c.email LIKE ?'];
    params.push(term, term, term, term);
    // Allow searching by ticket number, e.g. "12" or "#12"
    const idMatch = /^#?(\d+)$/.exec(search.trim());
    if (idMatch) {
      clauses.push('t.id = ?');
      params.push(Number(idMatch[1]));
    }
    where.push(`(${clauses.join(' OR ')})`);
  }

  const sortExpr = SORT_COLUMNS[sort] || SORT_COLUMNS.created_at;
  const direction = order === 'asc' ? 'ASC' : 'DESC';

  const sql = `${SELECT_TICKET}
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY ${sortExpr} ${direction}, t.id ${direction}`;

  return db.query(sql, params);
}

async function findById(id) {
  const rows = await db.query(`${SELECT_TICKET} WHERE t.id = ?`, [id]);
  return rows[0] || null;
}

async function create({ userId, subject, description, priority = 'medium' }) {
  const result = await db.query(
    'INSERT INTO tickets (user_id, subject, description, priority) VALUES (?, ?, ?, ?)',
    [userId, subject, description, priority],
  );
  return findById(result.insertId);
}

const UPDATABLE_FIELDS = ['subject', 'description', 'priority', 'status', 'assigned_to'];

async function update(id, fields) {
  const sets = [];
  const params = [];
  for (const key of UPDATABLE_FIELDS) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = ?`);
      params.push(fields[key]);
    }
  }
  if (sets.length) {
    params.push(id);
    await db.query(`UPDATE tickets SET ${sets.join(', ')} WHERE id = ?`, params);
  }
  return findById(id);
}

async function remove(id) {
  const result = await db.query('DELETE FROM tickets WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

/** Dashboard statistics for agents. */
async function getStats(agentId) {
  const [totals] = await db.query(
    `SELECT
       COUNT(*) AS total,
       SUM(status = 'open')        AS open,
       SUM(status = 'in_progress') AS in_progress,
       SUM(status = 'resolved')    AS resolved,
       SUM(status = 'closed')      AS closed,
       SUM(assigned_to IS NULL AND status IN ('open', 'in_progress')) AS unassigned,
       SUM(assigned_to = ? AND status IN ('open', 'in_progress'))     AS assigned_to_me,
       SUM(priority = 'urgent' AND status IN ('open', 'in_progress')) AS urgent_active
     FROM tickets`,
    [agentId],
  );

  const byPriority = await db.query(
    `SELECT priority, COUNT(*) AS count
     FROM tickets
     WHERE status IN ('open', 'in_progress')
     GROUP BY priority`,
  );

  // SUM() returns strings/null for DECIMAL results - normalise to numbers.
  const stats = {};
  for (const [key, value] of Object.entries(totals)) stats[key] = Number(value) || 0;

  stats.active_by_priority = Object.fromEntries(PRIORITIES.map((p) => [p, 0]));
  for (const row of byPriority) stats.active_by_priority[row.priority] = Number(row.count);

  return stats;
}

module.exports = {
  STATUSES,
  PRIORITIES,
  SORT_KEYS: Object.keys(SORT_COLUMNS),
  findAll,
  findById,
  create,
  update,
  remove,
  getStats,
};
