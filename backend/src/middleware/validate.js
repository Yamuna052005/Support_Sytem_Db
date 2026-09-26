const { validationResult } = require('express-validator');
const HttpError = require('../utils/httpError');

/**
 * Runs after a list of express-validator chains and rejects the request with
 * 400 + a per-field error list when any rule failed.
 */
function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array({ onlyFirstError: true }).map((e) => ({
    field: e.path,
    message: e.msg,
  }));
  return next(HttpError.badRequest('Validation failed', errors));
}

module.exports = validate;
