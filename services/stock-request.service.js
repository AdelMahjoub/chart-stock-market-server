const querystring = require('querystring'); // https://nodejs.org/docs/latest/api/querystring.html
const https       = require('https');       // https://nodejs.org/docs/latest/api/https.html

const requestStock = function(symbol, callback) {

  const searchQuery = querystring.stringify({
    function: 'TIME_SERIES_MONTHLY',
    symbol: symbol,
    //interval: '60min',
    apikey: process.env.ALPHA_VANTAGE_KEY
  });

  const options = {
    hostname: 'www.alphavantage.co',
    port: 443,
    path: '/query?' + searchQuery,
    method: 'GET'
  }

  https.get(options, res => {
    
    let data = '';
    
    res.setEncoding('utf8');
    
    res.on('data', chunk => {
      data += chunk;
    });

    res.on('end', () => {
      return callback(JSON.parse(data));
    });
  });
}

module.exports = requestStock;