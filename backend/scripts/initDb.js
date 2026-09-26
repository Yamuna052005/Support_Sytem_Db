/**
 * Creates the tables and loads sample data into the database configured in backend/.env.
 * Useful for cloud databases where you don't have the mysql CLI handy.
 *
 *   npm run db:setup            -> schema + seed
 *   npm run db:setup -- --no-seed  -> schema only
 *
 * WARNING: schema.sql drops existing tables first.
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { buildPoolConfig } = require('../src/config/db');

const DB_DIR = path.join(__dirname, '..', '..', 'database');

async function run() {
  const withSeed = !process.argv.includes('--no-seed');
  // Drop pool-only options, which a single connection does not accept.
  // eslint-disable-next-line no-unused-vars
  const { waitForConnections, connectionLimit, ...config } = buildPoolConfig({ multipleStatements: true });
  const connection = await mysql.createConnection(config);

  try {
    console.log('Applying schema.sql ...');
    await connection.query(fs.readFileSync(path.join(DB_DIR, 'schema.sql'), 'utf8'));

    if (withSeed) {
      console.log('Applying seed.sql ...');
      await connection.query(fs.readFileSync(path.join(DB_DIR, 'seed.sql'), 'utf8'));
    }
    console.log('Database ready.');
  } finally {
    await connection.end();
  }
}

run().catch((err) => {
  console.error('Database setup failed:', err.message);
  process.exit(1);
});
