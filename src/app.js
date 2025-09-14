const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const authRouter = require('./routes/authRoutes');

const app = express();

// Tables
const tables = require('./dbconfig/userTables');
tables;

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
}));

// ✅ Add Health Check Route BEFORE other routes
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Static files
app.use('/uploads', express.static('public/uploads'));

// Routes
app.use('/', authRouter);

module.exports = app;
