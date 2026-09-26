/**
 * Prints a bcrypt hash for a password - handy for creating agent accounts by hand:
 *   npm run hash -- "MyStrongPassword1"
 * then INSERT INTO users (name, email, password_hash, role) VALUES (..., '<hash>', 'agent');
 */
const bcrypt = require('bcryptjs');

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run hash -- "<password>"');
  process.exit(1);
}
console.log(bcrypt.hashSync(password, 10));
