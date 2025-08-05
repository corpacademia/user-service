const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

require('dotenv').config();

const hashPassword = async (password) => {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.log(error);
  }
};

const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

const signJwt =  (id) => {
    return jwt.sign({ _id: id }, process.env.SECRET_KEY, { expiresIn: "1d" }); // Token expires in 1 day
};

 //Verify JWT with Error Handling
const verifyToken =  (token) => {
    try {
        return jwt.verify(token, process.env.SECRET_KEY);
    } catch (error) {
        return null; 
    }
};


module.exports = {
  hashPassword,
  comparePassword,
  signJwt,
  verifyToken,
};