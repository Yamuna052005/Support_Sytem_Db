const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const auth = require('../controllers/authController');

const router = express.Router();

const emailRule = body('email')
  .trim()
  .notEmpty().withMessage('Email is required').bail()
  .isEmail().withMessage('Email must be a valid email address').bail()
  .isLength({ max: 255 }).withMessage('Email must be at most 255 characters')
  .toLowerCase();

router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required').bail()
      .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    emailRule,
    body('password')
      .isString().withMessage('Password is required').bail()
      .isLength({ min: 8, max: 72 }).withMessage('Password must be 8-72 characters').bail()
      .matches(/[A-Za-z]/).withMessage('Password must contain a letter').bail()
      .matches(/\d/).withMessage('Password must contain a number'),
  ],
  validate,
  auth.register,
);

router.post(
  '/login',
  [
    emailRule,
    body('password')
      .isString().withMessage('Password is required').bail()
      .notEmpty().withMessage('Password is required'),
  ],
  validate,
  auth.login,
);

router.get('/me', authenticate, auth.me);

module.exports = router;
