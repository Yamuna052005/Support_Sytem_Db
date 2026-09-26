const db = require('../config/db');

const PUBLIC_COLUMNS = 'id, name, email, role, created_at';

async function findByEmail(email) {
  const rows = await db.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function findById(id) {
  const rows = await db.query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ?`, [id]);
  return rows[0] || null;
}

async function create({ name, email, passwordHash, role = 'customer' }) {
  const result = await db.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, passwordHash, role],
  );
  return findById(result.insertId);
}

async function findAll({ role } = {}) {
  if (role) {
    return db.query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE role = ? ORDER BY name`, [role]);
  }
  return db.query(`SELECT ${PUBLIC_COLUMNS} FROM users ORDER BY role, name`);
}

module.exports = { findByEmail, findById, create, findAll };
