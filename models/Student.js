// Student model stores profile and login credentials for student users.
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    registrationNo: { type: String, required: true, unique: true, trim: true },
    year: { type: String, required: true, trim: true },
    branch: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);
