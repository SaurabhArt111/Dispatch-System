const { fail } = require('../utils/apiResponse');

function notFound(req, res) {
  return fail(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('[error]', err);
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  return fail(res, message, status, err.errors || null);
}

module.exports = { notFound, errorHandler };
