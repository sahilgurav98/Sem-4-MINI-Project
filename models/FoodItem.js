// Food item model controlled by admin.
const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    isAvailable: { type: Boolean, default: true },
    category: { type: String, default: 'General', trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('FoodItem', foodItemSchema);
