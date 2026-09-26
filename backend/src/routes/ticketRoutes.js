const express = require('express');
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const tickets = require('../controllers/ticketController');
const comments = require('../controllers/commentController');
const { STATUSES, PRIORITIES, SORT_KEYS } = require('../models/ticketModel');

const router = express.Router();

// Every ticket route requires a valid JWT.
router.use(authenticate);

const idParam = param('id').isInt({ min: 1 }).withMessage('Ticket id must be a positive integer').toInt();

const listRules = [
  query('search').optional().isString().trim().isLength({ max: 100 }).withMessage('Search is too long'),
  query('status').optional({ values: 'falsy' }).isIn(STATUSES).withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
  query('priority').optional({ values: 'falsy' }).isIn(PRIORITIES).withMessage(`Priority must be one of: ${PRIORITIES.join(', ')}`),
  query('assigned_to')
    .optional({ values: 'falsy' })
    .custom((v) => v === 'me' || v === 'unassigned' || /^\d+$/.test(v))
    .withMessage('assigned_to must be "me", "unassigned" or an agent id'),
  query('sort').optional({ values: 'falsy' }).isIn(SORT_KEYS).withMessage(`Sort must be one of: ${SORT_KEYS.join(', ')}`),
  query('order').optional({ values: 'falsy' }).isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
];

const createRules = [
  body('subject')
    .isString().withMessage('Subject is required').bail()
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('Subject must be 5-200 characters'),
  body('description')
    .isString().withMessage('Description is required').bail()
    .trim()
    .isLength({ min: 10, max: 5000 }).withMessage('Description must be 10-5000 characters'),
  body('priority')
    .optional()
    .isIn(PRIORITIES).withMessage(`Priority must be one of: ${PRIORITIES.join(', ')}`),
];

const updateRules = [
  idParam,
  body('subject').optional().isString().trim().isLength({ min: 5, max: 200 }).withMessage('Subject must be 5-200 characters'),
  body('description').optional().isString().trim().isLength({ min: 10, max: 5000 }).withMessage('Description must be 10-5000 characters'),
  body('priority').optional().isIn(PRIORITIES).withMessage(`Priority must be one of: ${PRIORITIES.join(', ')}`),
  body('status').optional().isIn(STATUSES).withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
  body('assigned_to')
    .optional({ values: 'undefined' })
    .custom((v) => v === null || (Number.isInteger(v) && v > 0))
    .withMessage('assigned_to must be an agent id or null'),
];

const commentRules = [
  idParam,
  body('comment')
    .isString().withMessage('Comment is required').bail()
    .trim()
    .isLength({ min: 1, max: 2000 }).withMessage('Comment must be 1-2000 characters'),
];

router.get('/', listRules, validate, tickets.list);
router.get('/stats', authorize('agent'), tickets.stats);
router.post('/', authorize('customer'), createRules, validate, tickets.create);

router.get('/:id', idParam, validate, tickets.getOne);
router.put('/:id', authorize('agent', 'customer'), updateRules, validate, tickets.update);
router.delete('/:id', authorize('agent', 'customer'), idParam, validate, tickets.remove);

router.get('/:id/comments', idParam, validate, comments.list);
router.post('/:id/comments', commentRules, validate, comments.create);

module.exports = router;
