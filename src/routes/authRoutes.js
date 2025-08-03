const express = require('express');
const { RegisterUser, LoginUser, refreshToken } = require('../controllers/authController');
const router = express.Router();

router.get('/login', (req, res) => {
  res.send('Login Page');
});

router.get('/register', (req, res) => {
  res.send('Register Page');
});

router.post('/register', RegisterUser);
router.post('/login', LoginUser);
router.post('/refresh-token', refreshToken);

module.exports = router;