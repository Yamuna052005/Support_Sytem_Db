const jwt = require('jsonwebtoken');
const env = require('../config/env');
const HttpError = require('../utils/httpError');

/**
 * AUTHENTICATION: who are you?
 * Verifies the Bearer JWT and attaches the user ({ id, name, email, role }) to req.user.
 * Responds 401 when the token is missing, malformed, expired or has a bad signature.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(HttpError.unauthorized('Authentication token is missing'));
  }

  try {
    const payload = jwt.verify(token, env.jwt.secret, { algorithms: ['HS256'] });
    req.user = {
      id: Number(payload.sub),
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };
    return next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token';
    return next(HttpError.unauthorized(message));
  }
}

/**
 * AUTHORIZATION: are you allowed to do this?
 * Must run after `authenticate`. Responds 403 when the user's role is not in `roles`.
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(HttpError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(HttpError.forbidden(`This action requires role: ${roles.join(' or ')}`));
    }
    return next();
  };
}

function signToken(user) {
  return jwt.sign(
    { sub: String(user.id), name: user.name, email: user.email, role: user.role },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn, algorithm: 'HS256' },
  );
}

module.exports = { authenticate, authorize, signToken };
