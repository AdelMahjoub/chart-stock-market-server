/**
 * Node modules
 */
const express = require('express'); // http://expressjs.com/en/4x/api.html
const http    = require('http');    // https://nodejs.org/dist/latest-v6.x/docs/api/http.html
const path    = require('path');    // https://nodejs.org/dist/latest-v6.x/docs/api/path.html

/**
 * Initialize
 */
require('dotenv').config();                                        // https://www.npmjs.com/package/dotenv
const app          = express();                                    // express instance
const server       = http.createServer(app);                       // http server
const io           = require('socket.io')(server);                 // https://socket.io/docs/
const requestStock = require('./services/stock-request.service');
const Stock        = require('./models/stock.model');

/**
 * Setup
 */
app.set('port', process.env.PORT || 3000);                // setup app's server port
app.use(express.static(path.join(__dirname, 'public')));  // setup static folder
/**
 * NODE_ENV === production
 */
if(process.env.NODE_ENV === 'production') {
  const compression = require('compression'); // https://github.com/expressjs/compression
  const helmet = require('helmet');           // https://github.com/helmetjs/helmet

  app.use(helmet());
  app.use(compression());
  app.disable('X-Powered-By');
}

/**
 * Routes
 */
app.get('/',(req, res, next) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((req, res, next) => {
  res.redirect('/');
})

server.listen(app.get('port'), () => {
  console.log(`Server running on port: ${app.get('port')} in ${process.env.NODE_ENV} mode.` );
});

/**
 * SocketIo
 */
io.on('connection', socket => {
  
  // Emit all stored stocks on user first connection
  Stock.find((err, res) => {
    if(!err && res) {
      io.emit('user connected', res);
    }
  });

  // User request a new stock
  socket.on('add stock', symbol => {
    // Get request to Alpha Vantage api
    requestStock(symbol.toLowerCase(), data => {
      if(data['Error Message']) {
        socket.emit('stock not found');
      } else {
        // Collect needed data from the response
        let newSymbol = data['Meta Data']['2. Symbol'].toLowerCase();
        let newSeries = data['Monthly Time Series'];
        let seriesList = [];
        // Format newSeries which is an object of objects into an array of objects
        Object.keys(newSeries).forEach((serie, index) => {
          seriesList.push({
            moment: serie,
            value: newSeries[serie]['1. open']
          });
        });
        seriesList = seriesList.splice(0, 12);
        seriesList.sort((a, b) => {
          let c = new Date(a.moment).getTime();
          let d = new Date(b.moment).getTime();
          return c - d;
        });
        // Check if the symbol already stored in the db
        Stock.findOne({symbol: newSymbol}, (err, res) => {
          // Symbol do not exits, add a new symbol
          if(!err && !res) {
            Stock.create(new Stock({symbol: newSymbol, series: seriesList}), (err, res) => {
              // Return all symbols
              Stock.find((err, res) => {
                if(!err && res) {
                  io.emit('stock found', res);
                }
              });
            });
            // Symbol do exists, update series
          } else if(!err && res){
            Stock.update({symbol: newSymbol}, {$set: {series: newSeries}}, (err, raw) => {
              // Return all symbols
              Stock.find((err, res) => {
                if(!err && res) {
                  io.emit('stock found', res);
                }
              });
            })
          }
        });
      }
    }); // End of Aplpha vantage Get request
  }); // End of add stock socket event

  // User delete stock request
  socket.on('remove stock', symbol => {
    Stock.findOneAndRemove({symbol: symbol}, (err, res) => {
      // Return all symbols
      Stock.find((err, res) => {
        if(!err && res) {
          io.emit('stock found', res);
        }
      });
    });
  });

});