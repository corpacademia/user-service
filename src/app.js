const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRouter = require('./routes/authRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const corsOptions = {
  origin: process.env.FRONTEND_URL || "https://app.golabing.ai",
  credentials: true,
};

app.use(cors(corsOptions));

// Load tables (if you just want to load them for side effects)
require('./dbconfig/userTables');

// Health check route
app.get('/health', (req, res) => res.status(200).send('OK'));

// Routers
app.use('/auth', authRouter);
app.use('/api/v1/user_ms', userRouter);

module.exports = app;
