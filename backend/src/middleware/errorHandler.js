const env = require('../config/env');

function notFound(req, res) {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Malformed JSON body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body is not valid JSON' });
  }

  const status = err.status || 500;
  const body = { message: status === 500 ? 'Internal server error' : err.message };
  if (err.errors) body.errors = err.errors;

  if (status === 500) {
    console.error(err);
    if (env.nodeEnv === 'development') body.detail = err.message;
  }

  return res.status(status).json(body);
}

module.exports = { notFound, errorHandler };
