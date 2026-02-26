// Creates a default admin from environment variables if not present.
const bcrypt = require('bcrypt');
const Admin = require('../models/Admin');

async function seedAdminIfNeeded() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    return;
  }

  const existing = await Admin.findOne({ email });
  if (existing) {
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await Admin.create({
    name: 'Default Admin',
    email,
    password: hashedPassword
  });

  console.log(`✅ Default admin created: ${email}`);
}

module.exports = seedAdminIfNeeded;
