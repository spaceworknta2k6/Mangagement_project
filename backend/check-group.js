const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function run() {
  await connectDB();
  const email = 'huonglt@hust.edu.vn';
  const user = await User.findOne({ email });
  console.log('--- USER IN DB ---');
  console.log(user);
  
  if (user) {
    const isMatch = await bcrypt.compare('password123', user.passwordHash);
    console.log('Password matching password123:', isMatch);
  }
  
  mongoose.disconnect();
}

run();
