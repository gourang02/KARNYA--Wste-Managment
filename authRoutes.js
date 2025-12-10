const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    check('firstName', 'First name is required').not().isEmpty(),
    check('lastName', 'Last name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('userType', 'User type is required').isIn(['donor', 'receiver', 'admin']),
  ],
  authController.register
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  authController.login
);

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth.authenticate, authController.getMe);

// @route   POST api/auth/forgot-password
// @desc    Forgot password - send reset email
// @access  Public
router.post(
  '/forgot-password',
  [check('email', 'Please include a valid email').isEmail()],
  authController.forgotPassword
);

// @route   PUT api/auth/reset-password/:token
// @desc    Reset password
// @access  Public
router.put(
  '/reset-password/:token',
  [check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })],
  authController.resetPassword
);

// @route   POST api/auth/verify-email
// @desc    Verify email address
// @access  Public
router.post(
  '/verify-email',
  [check('token', 'Verification token is required').not().isEmpty()],
  authController.verifyEmail
);

// @route   POST api/auth/resend-verification
// @desc    Resend verification email
// @access  Public
router.post(
  '/resend-verification',
  [check('email', 'Please include a valid email').isEmail()],
  authController.resendVerification
);

module.exports = router;
