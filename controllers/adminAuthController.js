// Handles admin login and optional bootstrap account creation.
const bcrypt = require('bcrypt');
const Admin = require('../models/Admin');

function renderLogin(req, res) {
  res.render('admin/login', { error: null });
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.render('admin/login', { error: 'Invalid admin credentials.' });
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return res.render('admin/login', { error: 'Invalid admin credentials.' });
    }

    req.session.admin = { id: admin._id, name: admin.name, email: admin.email };
    return res.redirect('/admin/dashboard');
  } catch (error) {
    return res.render('admin/login', { error: error.message });
  }
}

function logout(req, res) {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
}

module.exports = {
  renderLogin,
  login,
  logout
};
