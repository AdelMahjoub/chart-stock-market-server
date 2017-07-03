const mongoose = require('mongoose'); // http://mongoosejs.com/

mongoose.Promise = global.Promise; // http://mongoosejs.com/docs/promises.html

const options = {
  user: process.env.DB_USER,
  pass: process.env.DB_PASS,
  server: {
    socketOptions: {
      keepAlive: 1
    }
  }
};

const db = mongoose.connect(process.env.DB_URL, options);

module.exports = db;    