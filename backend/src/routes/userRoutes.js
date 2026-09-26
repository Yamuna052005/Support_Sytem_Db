const express = require('express');
const { query } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const users = require('../controllers/userController');

const router = express.Router();

// Agent-only: used to populate the "assign to" dropdown.
router.get(
  '/',
  authenticate,
  authorize('agent'),
  [query('role').optional().isIn(['agent', 'customer']).withMessage('Role must be agent or customer')],
  validate,
  users.list,
);

module.exports = router;
