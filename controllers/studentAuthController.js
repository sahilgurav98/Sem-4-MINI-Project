// Handles student signup/login/logout flows.
const bcrypt = require('bcrypt');
const Student = require('../models/Student');

function renderSignup(req, res) {
  res.render('student/signup', { error: null });
}

function renderLogin(req, res) {
  res.render('student/login', { error: null });
}

async function signup(req, res) {
  try {
    const { name, email, password, registrationNo, year, branch } = req.body;

    const existing = await Student.findOne({ $or: [{ email }, { registrationNo }] });
    if (existing) {
      return res.render('student/signup', { error: 'Email or Registration Number already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const student = await Student.create({
      name,
      email,
      password: hashedPassword,
      registrationNo,
      year,
      branch
    });

    req.session.admin = null;
    req.session.student = {
      id: student._id,
      name: student.name,
      registrationNo: student.registrationNo,
      year: student.year,
      branch: student.branch
    };

    return req.session.save(() => {
      res.redirect('/student/dashboard');
    });
  } catch (error) {
    return res.render('student/signup', { error: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const student = await Student.findOne({ email });

    if (!student) {
      return res.render('student/login', { error: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password, student.password);
    if (!valid) {
      return res.render('student/login', { error: 'Invalid email or password.' });
    }

    req.session.admin = null;
    req.session.student = {
      id: student._id,
      name: student.name,
      registrationNo: student.registrationNo,
      year: student.year,
      branch: student.branch
    };

    return req.session.save(() => {
      res.redirect('/student/dashboard');
    });
  } catch (error) {
    return res.render('student/login', { error: error.message });
  }
}

function logout(req, res) {
  req.session.student = null;
  req.session.save(() => {
    res.redirect('/student/login');
  });
}

module.exports = {
  renderSignup,
  renderLogin,
  signup,
  login,
  logout
};
