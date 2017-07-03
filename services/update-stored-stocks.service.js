const Stock        = require('../models/stock.model.js');
const requestStock = require('./stock-request.service');

const updateDocs = function(socket, updatedCount, callback) {

  Stock.find((err, res) => {
    if(!err && res) {
      socket.emit('total', res.length);
    }
    if(updatedCount === res.length) {
      return callback(res);
    } else if(res[updatedCount]['symbol']){
      requestStock(res[updatedCount]['symbol'], data => {
        if(data['Error Message']) {
          return callback(res);
        } else {
          // Collect needed data from the response
          let newSeries = data['Monthly Time Series'];
          let seriesList = [];
          // Format newSeries which is an object of objects into an array of objects
          if(typeof newSeries === 'object'){
            Object.keys(newSeries).forEach((serie, index) => {
              seriesList.push({
                moment: serie,
                value: newSeries[serie]['1. open']
              });
            });
          }
          seriesList = seriesList.splice(0, 12);
          seriesList.sort((a, b) => {
            let c = new Date(a.moment).getTime();
            let d = new Date(b.moment).getTime();
            return c - d;
          });
          Stock.findOneAndUpdate({_id: res[updatedCount]._id}, {$set: {series: seriesList}}, (err, raw) => {
            updatedCount++;
            socket.emit('updated', updatedCount);
            return updateDocs(socket, updatedCount, callback);
          });
        }
      });
    }
  });
}

module.exports = updateDocs;