// Order model stores one document per food item in an order.
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    studentName: { type: String, required: true, trim: true },
    registrationNo: { type: String, required: true, trim: true },
    year: { type: String, required: true, trim: true },
    branch: { type: String, required: true, trim: true },
    foodItemName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    orderStatus: { type: String, enum: ['pending', 'fulfilled'], default: 'pending' },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
