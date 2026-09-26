/**
 * Error carrying an HTTP status code. Thrown from controllers/middleware and
 * turned into a JSON response by the central error handler.
 */
class HttpError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    if (errors) this.errors = errors;
  }

  static badRequest(message = 'Bad request', errors) {
    return new HttpError(400, message, errors);
  }

  static unauthorized(message = 'Authentication required') {
    return new HttpError(401, message);
  }

  static forbidden(message = 'You do not have permission to perform this action') {
    return new HttpError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new HttpError(404, message);
  }

  static conflict(message = 'Conflict') {
    return new HttpError(409, message);
  }
}

module.exports = HttpError;
