const express = require('express');
const router = express.Router();
const { register, sendOTP, staffSetup, verifyOTP, setPassword, login, refreshAccessToken, logout, forgotPassword } = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/send-otp', sendOTP);
router.post('/staff-setup', staffSetup);
router.post('/verify-otp', verifyOTP);
router.post('/set-password', setPassword);
router.post('/login', login);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);

module.exports = router;
