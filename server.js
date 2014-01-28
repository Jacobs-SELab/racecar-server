var colors = require('colors');
var net = require('net');

var settings = require('./settings.json');
var Connection = require('./lib/Connection');

var port = process.env.PORT || settings.port;


var server = net.createServer(function (socket) {
  var conn = Connection.handle(socket);
});

server.on('listening', function (e) {
  console.log('Server is listening on port '.green + port.toString().green);
});

server.listen(port);