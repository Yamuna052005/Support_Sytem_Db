const mysql = require('mysql2/promise');
const env = require('./env');

function buildSslOptions() {
  if (!env.db.ssl) return undefined;
  const ssl = { rejectUnauthorized: env.db.sslRejectUnauthorized };
  if (env.db.sslCa) ssl.ca = env.db.sslCa.replace(/\\n/g, '\n');
  return ssl;
}

function buildPoolConfig(extra = {}) {
  const common = {
    waitForConnections: true,
    connectionLimit: 10,
    // Return DATETIME/TIMESTAMP as JS Date objects (serialised as ISO strings in JSON)
    dateStrings: false,
    timezone: 'Z',
    ssl: buildSslOptions(),
    ...extra,
  };

  if (env.db.url) return { uri: env.db.url, ...common };

  return {
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.name,
    ...common,
  };
}

// Lazily create the pool so that importing the app (e.g. in tests) does not open connections.
let pool;
function getPool() {
  if (!pool) {
    pool = mysql.createPool(buildPoolConfig());
    // Store and read TIMESTAMPs in UTC so they match the `timezone: 'Z'` parsing above,
    // whatever time zone the database server runs in.
    pool.pool.on('connection', (conn) => conn.query("SET time_zone = '+00:00'"));
  }
  return pool;
}

/**
 * Run a parameterised query. Always pass user input through `params`,
 * never concatenate it into `sql` - this is what protects against SQL injection.
 */
async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

module.exports = { query, getPool, closePool, buildPoolConfig };
