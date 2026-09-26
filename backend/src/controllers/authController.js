const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const HttpError = require('../utils/httpError');
const { signToken } = require('../middleware/auth');

const SALT_ROUNDS = 10;
// Compared against when the email does not exist, so both paths take similar time
// and response timing does not reveal which emails are registered.
const DUMMY_HASH = '$2b$10$sGzBYVp.xe1Usm8MwxiQb.eCoC.dVbF.S8mZVUbyD0SheTpaeH0kC';

function toPublicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.created_at };
}

async function register(req, res) {
  const { name, email, password } = req.body;

  if (await User.findByEmail(email)) {
    throw HttpError.conflict('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  let user;
  try {
    // Public registration always creates a customer - the role is never taken from input.
    user = await User.create({ name, email, passwordHash, role: 'customer' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw HttpError.conflict('An account with this email already exists');
    throw err;
  }

  res.status(201).json({ token: signToken(user), user: toPublicUser(user) });
}

async function login(req, res) {
  const { email, password } = req.body;

  const user = await User.findByEmail(email);
  const passwordOk = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);

  if (!user || !passwordOk) {
    throw HttpError.unauthorized('Invalid email or password');
  }

  res.json({ token: signToken(user), user: toPublicUser(user) });
}

async function me(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) throw HttpError.unauthorized('User no longer exists');
  res.json({ user: toPublicUser(user) });
}

module.exports = { register, login, me };
