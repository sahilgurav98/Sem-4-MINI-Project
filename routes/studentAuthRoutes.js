// Student auth routes.
const express = require('express');
const controller = require('../controllers/studentAuthController');

const router = express.Router();

router.get('/signup', controller.renderSignup);
router.post('/signup', controller.signup);
router.get('/login', controller.renderLogin);
router.post('/login', controller.login);
router.post('/logout', controller.logout);

module.exports = router;
