const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const authRouter = require('./routes/authRoutes');

const app = express();

// Tables
const tables = require('./dbconfig/userTables');
tables; // Initializes tables on start

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_URL || "https://app.golabing.ai",
    credentials: true,
}));

// ✅ Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Static files
app.use('/uploads', express.static('public/uploads'));

// ✅ MOUNT your routes under desired API prefix
app.use('/api/v1/user_ms', authRouter); // <--- this is the fix

module.exports = app;
