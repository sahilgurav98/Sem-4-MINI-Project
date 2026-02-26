// Admin dashboard routes.
const express = require('express');
const multer = require('multer');
const { requireAdmin } = require('../middleware/auth');
const controller = require('../controllers/adminController');

const router = express.Router();

const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.xlsx')) {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx files are allowed.'));
    }
  }
});

router.get('/dashboard', requireAdmin, controller.dashboard);
router.post('/food-item', requireAdmin, controller.addFoodItem);
router.post('/food-item/:id/toggle', requireAdmin, controller.toggleFoodAvailability);
router.post('/order/:id/fulfill', requireAdmin, controller.fulfillOrder);
router.post('/order/:id/delete', requireAdmin, controller.deleteOrder);
router.post('/train', requireAdmin, upload.single('trainingFile'), controller.uploadTrainingData);
router.post('/predict', requireAdmin, controller.runPrediction);

module.exports = router;
