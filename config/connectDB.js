const mongoose = require("mongoose");
const colors = require("colors");

const { config } = require("./settings");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.dbUrl);
    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);

  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

module.exports = connectDB;
