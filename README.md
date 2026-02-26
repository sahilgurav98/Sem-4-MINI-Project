# Canteen Preorder System with Food Demand Prediction

A complete Node.js + Express + MongoDB web application with **two portals**:

1. **Student Website** for signup, login, and canteen preorders.
2. **Admin Dashboard** for managing food items, orders, and TensorFlow.js food demand prediction.

---

## Features

### Student Side
- Student signup and login with bcrypt password hashing.
- Session-based authentication.
- Auto-filled student profile in order form.
- Multiple food item ordering in a single submit.
- Each selected food item stored as a separate order entry.

### Admin Side
- Separate admin login.
- Protected dashboard routes.
- Add food items with price and availability.
- Toggle food item availability.
- View all orders and mark as fulfilled.
- Delete orders.

### ML Demand Prediction (TensorFlow.js FNN)
- Upload `.xlsx` training file from admin dashboard.
- Parse and normalize data.
- Train a Feedforward Neural Network on backend.
- Save model and normalization metadata.
- Predict required plates with a 10% buffer stock.

---

## Tech Stack

- Frontend: EJS, Bootstrap, custom CSS
- Backend: Node.js, Express.js
- Database: MongoDB + Mongoose
- Auth: bcrypt + express-session
- ML: TensorFlow.js (`@tensorflow/tfjs-node`)
- Upload + Parsing: multer + xlsx

---

## Folder Structure

```
/models
/controllers
/routes
/views
/public
/ml
/utils
/config
/middleware
```

---

## Setup Instructions

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

Create `.env` file by copying `.env.example`:

```bash
cp .env.example .env
```

Update values as needed:
- `MONGODB_URI`
- `SESSION_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

### 3) Start MongoDB

Make sure your MongoDB server is running.

### 4) Run project

```bash
npm start
```

or for development:

```bash
npm run dev
```

---

## Login URLs

- Student login: `http://localhost:3000/student/login`
- Student signup: `http://localhost:3000/student/signup`
- Admin login: `http://localhost:3000/admin/login`

---

## Excel Training File Format

Upload `.xlsx` with this header row exactly:

- `dayOfWeek` (0-6)
- `timeOfDay` (Breakfast=0, Lunch=1, Dinner=2)
- `avgDailySales` (number)
- `foodType` (numeric encoding)
- `eventDay` (No=0, Yes=1)
- `platesRequired` (target output)

Example rows:

| dayOfWeek | timeOfDay | avgDailySales | foodType | eventDay | platesRequired |
|-----------|-----------|---------------|----------|----------|----------------|
| 1         | 1         | 120           | 0        | 0        | 130            |
| 5         | 2         | 180           | 2        | 1        | 230            |

---

## Production Notes

- Replace default `SESSION_SECRET`.
- Use persistent session store (Redis/MongoStore) in production.
- Use HTTPS and secure cookies.
- Add rate limiting and stronger validation for public deployments.

