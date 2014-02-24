var colors = require('colors');
var net = require('net');
var fs = require('fs');
var url = require("url");
var path = require('path');
var inquirer = require('inquirer');
var app = require('http').createServer(handleHTTP);
var io = require('socket.io').listen(app);
var _ = require('underscore');
_.str = require('underscore.string');

_.mixin(_.str.exports());
_.str.include('Underscore.string', 'string');

var settings = require('./settings.json');
var Map = require('./lib/Map');

var port = process.env.PORT || settings.port;
var httpPort = process.env.HTTPPORT || settings.httpPort;

var files = fs.readdirSync(path.join(__dirname, 'maps'));

var maps = _.filter(files, function (f) {
  return _(f).endsWith('.map');
});

inquirer.prompt([{
  type: 'list',
  name: 'mapname',
  message: 'Which map do you want to load?',
  paginated: true,
  choices: maps
}], function (answers) {

  var mapPath = path.join(__dirname, 'maps', answers.mapname);
  
  var map = Map.read(mapPath);

  // console.log(map.getFullMapString());

  var Connection = require('./lib/Connection')(map);

  var Pool;

  var server = net.createServer(function (socket) {
    Pool = Connection(socket);
  });

  server.on('listening', function (e) {
    console.log('Server is listening on port '.green + port.toString().green);
  });

  setTimeout(function(){

  });

  io.sockets.on('connection', function (socket) {
    socket.on('init', function (data) {
      if (data.team) {
        
        if (!Pool) {
          socket.emit('init_'+data.team, null);
          return;
        }

        var conn = Pool.getConnection(data.team);

        if (!conn) {
          socket.emit('init_'+data.team, null);
        }
        else {
          conn.setSocket(socket);
          conn.initInfo();
        }
      }
    });
  });

  server.listen(port);
  app.listen(httpPort, function (e) {
    console.log('Connect Front-End to port '.green + httpPort.toString().green);
  });
});

function handleHTTP (req, res) {
  var uri = url.parse(req.url).pathname
    , filename = path.join(process.cwd(), "web", uri);
  
  fs.exists(filename, function(exists) {
    if(!exists) {
      res.writeHead(404, {"Content-Type": "text/plain"});
      res.write("404 Not Found\n");
      res.end();
      return;
    }
 
    if (fs.statSync(filename).isDirectory()) filename += '/index.html';
 
    fs.readFile(filename, "binary", function(err, file) {
      if(err) {        
        res.writeHead(500, {"Content-Type": "text/plain"});
        res.write(err + "\n");
        res.end();
        return;
      }

      var mimeTypes = {
        "html": "text/html",
        "jpeg": "image/jpeg",
        "jpg": "image/jpeg",
        "png": "image/png",
        "js": "text/javascript",
        "css": "text/css"
      };

      var mime = mimeTypes[filename.split('.').pop()];
      res.writeHead(200, {"Content-Type" : mime});
      res.write(file, "binary");
      res.end();

    });
  });
}


