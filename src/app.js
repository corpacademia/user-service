const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const authRouter = require('./routes/authRoutes');

const app = express();

// Tables
const tables = require('./dbconfig/userTables');
tables;

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || "https://app.golabing.ai",
  credentials: true,
}));

// ✅ Health Check Route
app.get('/health', (req, res) => res.status(200).send('OK'));

// Routes
app.use('/uploads', express.static('public/uploads'));
app.use('/', authRouter);

// ✅ START THE SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
