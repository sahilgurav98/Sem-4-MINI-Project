// Admin dashboard operations: manage orders, food items, and ML prediction.
const fs = require('fs');
const Order = require('../models/Order');
const FoodItem = require('../models/FoodItem');
const { parseTrainingExcel } = require('../utils/excelParser');
const { trainModelFromRows, predictDemand } = require('../ml/modelService');

async function dashboard(req, res) {
  const [orders, foodItems] = await Promise.all([
    Order.find().sort({ timestamp: -1 }),
    FoodItem.find().sort({ name: 1 })
  ]);

  res.render('admin/dashboard', {
    admin: req.session.admin,
    orders,
    foodItems,
    message: null,
    prediction: null,
    error: null
  });
}

async function addFoodItem(req, res) {
  try {
    const { name, price, category, isAvailable } = req.body;

    await FoodItem.create({
      name,
      price: Number(price),
      category,
      isAvailable: isAvailable === 'on'
    });

    return res.redirect('/admin/dashboard');
  } catch (error) {
    const [orders, foodItems] = await Promise.all([Order.find().sort({ timestamp: -1 }), FoodItem.find().sort({ name: 1 })]);
    return res.render('admin/dashboard', {
      admin: req.session.admin,
      orders,
      foodItems,
      message: null,
      prediction: null,
      error: error.message
    });
  }
}

async function toggleFoodAvailability(req, res) {
  const { id } = req.params;
  const item = await FoodItem.findById(id);
  if (item) {
    item.isAvailable = !item.isAvailable;
    await item.save();
  }
  res.redirect('/admin/dashboard');
}

async function fulfillOrder(req, res) {
  const { id } = req.params;
  await Order.findByIdAndUpdate(id, { orderStatus: 'fulfilled' });
  res.redirect('/admin/dashboard');
}

async function deleteOrder(req, res) {
  const { id } = req.params;
  await Order.findByIdAndDelete(id);
  res.redirect('/admin/dashboard');
}

async function uploadTrainingData(req, res) {
  try {
    if (!req.file) {
      throw new Error('Please upload an Excel file (.xlsx).');
    }

    const rows = parseTrainingExcel(req.file.path);
    await trainModelFromRows(rows);
    fs.unlinkSync(req.file.path);

    const [orders, foodItems] = await Promise.all([Order.find().sort({ timestamp: -1 }), FoodItem.find().sort({ name: 1 })]);
    return res.render('admin/dashboard', {
      admin: req.session.admin,
      orders,
      foodItems,
      message: 'Model trained successfully with uploaded Excel data.',
      prediction: null,
      error: null
    });
  } catch (error) {
    const [orders, foodItems] = await Promise.all([Order.find().sort({ timestamp: -1 }), FoodItem.find().sort({ name: 1 })]);
    return res.render('admin/dashboard', {
      admin: req.session.admin,
      orders,
      foodItems,
      message: null,
      prediction: null,
      error: error.message
    });
  }
}

async function runPrediction(req, res) {
  try {
    const prediction = await predictDemand(req.body);
    const [orders, foodItems] = await Promise.all([Order.find().sort({ timestamp: -1 }), FoodItem.find().sort({ name: 1 })]);

    return res.render('admin/dashboard', {
      admin: req.session.admin,
      orders,
      foodItems,
      message: 'Prediction generated successfully.',
      prediction,
      error: null
    });
  } catch (error) {
    const [orders, foodItems] = await Promise.all([Order.find().sort({ timestamp: -1 }), FoodItem.find().sort({ name: 1 })]);
    return res.render('admin/dashboard', {
      admin: req.session.admin,
      orders,
      foodItems,
      message: null,
      prediction: null,
      error: error.message
    });
  }
}

module.exports = {
  dashboard,
  addFoodItem,
  toggleFoodAvailability,
  fulfillOrder,
  deleteOrder,
  uploadTrainingData,
  runPrediction
};
