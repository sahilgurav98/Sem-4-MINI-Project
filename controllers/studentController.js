// Handles student dashboard and order placement.
const FoodItem = require('../models/FoodItem');
const Order = require('../models/Order');

async function dashboard(req, res) {
  const foodItems = await FoodItem.find({ isAvailable: true }).sort({ name: 1 });
  res.render('student/dashboard', {
    student: req.session.student,
    foodItems,
    success: null,
    error: null
  });
}

async function placeOrder(req, res) {
  try {
    const foodItems = await FoodItem.find({ isAvailable: true }).sort({ name: 1 });
    const selected = req.body.items;

    if (!selected || typeof selected !== 'object') {
      return res.render('student/dashboard', {
        student: req.session.student,
        foodItems,
        success: null,
        error: 'Please select at least one item with quantity.'
      });
    }

    const orderDocs = Object.entries(selected)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([foodItemName, qty]) => ({
        studentName: req.session.student.name,
        registrationNo: req.session.student.registrationNo,
        year: req.session.student.year,
        branch: req.session.student.branch,
        foodItemName,
        quantity: Number(qty),
        orderStatus: 'pending'
      }));

    if (!orderDocs.length) {
      return res.render('student/dashboard', {
        student: req.session.student,
        foodItems,
        success: null,
        error: 'Please enter quantity greater than 0 for at least one item.'
      });
    }

    await Order.insertMany(orderDocs);

    return res.render('student/dashboard', {
      student: req.session.student,
      foodItems,
      success: 'Order placed successfully.',
      error: null
    });
  } catch (error) {
    const foodItems = await FoodItem.find({ isAvailable: true }).sort({ name: 1 });
    return res.render('student/dashboard', {
      student: req.session.student,
      foodItems,
      success: null,
      error: error.message
    });
  }
}

module.exports = {
  dashboard,
  placeOrder
};
