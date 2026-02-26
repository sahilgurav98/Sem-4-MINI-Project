// Admin authentication routes.
const express = require('express');
const controller = require('../controllers/adminAuthController');

const router = express.Router();

router.get('/login', controller.renderLogin);
router.post('/login', controller.login);
router.post('/logout', controller.logout);

module.exports = router;
