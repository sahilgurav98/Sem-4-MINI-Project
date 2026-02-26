// Main Express application entry point.
require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');

const connectDB = require('./config/db');
const seedAdminIfNeeded = require('./utils/seedAdmin');

const studentAuthRoutes = require('./routes/studentAuthRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Parse form data and JSON payloads.
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static CSS and assets.
app.use('/public', express.static(path.join(__dirname, 'public')));

// Configure EJS template engine.
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session configuration for login persistence.
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

// Home route redirects to student login for first-time experience.
app.get('/', (req, res) => {
  res.redirect('/student/login');
});

app.use('/student', studentAuthRoutes);
app.use('/student', studentRoutes);
app.use('/admin', adminAuthRoutes);
app.use('/admin', adminRoutes);

// Fallback 404 handler.
app.use((req, res) => {
  res.status(404).send('404 - Page not found');
});

// Generic error handler.
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).send('Something went wrong.');
});

async function startServer() {
  await connectDB();
  await seedAdminIfNeeded();

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`✅ Server is running on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start application:', error.message);
  process.exit(1);
});
