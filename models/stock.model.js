const db = require('../services/db.service'); // db connection instance

const stockSchema = db.Schema({
  symbol: String,
  series: []
});

const Stock = db.model('Stock', stockSchema);

module.exports = Stock;