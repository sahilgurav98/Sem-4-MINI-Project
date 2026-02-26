// Student functional routes.
const express = require('express');
const { requireStudent } = require('../middleware/auth');
const controller = require('../controllers/studentController');

const router = express.Router();

router.get('/dashboard', requireStudent, controller.dashboard);
router.post('/order', requireStudent, controller.placeOrder);

module.exports = router;
