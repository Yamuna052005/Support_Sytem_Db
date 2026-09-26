const db = require('../config/db');

const SELECT_COMMENT = `
  SELECT cm.id, cm.ticket_id, cm.user_id, cm.comment, cm.created_at,
         u.name AS author_name, u.role AS author_role
  FROM ticket_comments cm
  INNER JOIN users u ON u.id = cm.user_id`;

async function findByTicket(ticketId) {
  return db.query(`${SELECT_COMMENT} WHERE cm.ticket_id = ? ORDER BY cm.created_at ASC, cm.id ASC`, [
    ticketId,
  ]);
}

async function create({ ticketId, userId, comment }) {
  const result = await db.query(
    'INSERT INTO ticket_comments (ticket_id, user_id, comment) VALUES (?, ?, ?)',
    [ticketId, userId, comment],
  );
  // Bump the ticket's updated_at so "recently updated" sorting reflects new replies.
  await db.query('UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [ticketId]);
  const rows = await db.query(`${SELECT_COMMENT} WHERE cm.id = ?`, [result.insertId]);
  return rows[0];
}

module.exports = { findByTicket, create };
