var mysql = require('mysql2');
var config = require('./config.json')

var con = mysql.createConnection(config.options);

con.connect(function(err) {
  if (err) throw err;
});

module.exports = { con };
