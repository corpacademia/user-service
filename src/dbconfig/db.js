const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.DATABASE_PORT,
  ssl: {
    require: true,
    rejectUnauthorized: false   // set true if you later add AWS RDS CA cert
  }
});

module.exports = pool;
