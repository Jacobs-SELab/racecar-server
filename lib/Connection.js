var _  = require('underscore');
_.str = require('underscore.string');
var Pool = require('./ConnectionPool');
var Driver = require('./Driver').Driver;
var Settings = require('./../settings.json');
var Error = require('../errors');

_.mixin(_.str.exports());
_.str.include('Underscore.string', 'string');

var Map;
var SocketIO;

exports = module.exports = function (map, socket_io) {
  Map = map;
  SocketIO = socket_io;

  /**
   * Creates Connection instance
   * @param  {Socket} socket     connection
   * @return {Connection}        instance
   */
  return function handle (socket) {
    // something(socket);
    var conn =  new Connection(socket);
    return Pool;
  }
}

/**
 * Connection class that keeps track of everything
 * related to the respective established connection
 * @param {Socket} socket parameter of the createServer callback of Net
 */
function Connection (socket) {
  var self = this;

  /**
   * Handles incoming messages and calls necessary methods
   * @param {String} data message send as string
   */
  var handleIncoming = function (data) {
    data = data.replace(/\r\n$/g, ''); // removes trailing new line
    console.log('incoming: ', data);
    var _s = _(data);

    if (!self.Driver.started() && _s.startsWith('Hello, I am ')) {
      var name = data.substr('Hello, I am '.length);
      var valid = Pool.registerTeam(self.id, name);
      if (!valid) {
        WriteError(Error.TeamNameTaken);
      }
      self.Driver.Properties.set('name', name);
      sendInit();
    } else if (!self.Driver.started() && _s.startsWith('START')) {
      self.Driver.start();
      self.intervalId = setInterval(function () {
        if (!self.Driver.broken() && !self.Driver.dead() && !self.Driver.finished()) {
          var extra = self.Driver.update();
          if (extra !== null) {
            self.Socket.write(extra+'\r\n');
          }
          sendWebSocket();
          if (Settings.sendContinous) {
            sendStatus();
          }
        } else if (self.Driver.finished()) {
          var start = self.Driver.getStartTime();
          var time = Math.round(((new Date()) - start)/1000);
          var endState = (self.Driver.dead()) ? 'dead' : 'alive';
          self.Socket.write('FIN ' + time + ' ' + endState + '\r\n');
          endWebSocket(endState);
          closeConnection();
        }
      }, Settings.interval);
    } else if (self.Driver.started()) {
      if (_s.startsWith('ST ')) {
        var cmd = data.substr('ST '.length);
        self.Driver.handleCommand(cmd);
        if (!Settings.sendContinous) {
          sendStatus();
        }
      } else if (data === 'REPAIR ME') {
        self.Driver.repair();
      } else {
        WriteError(Error.NotValidCommand);
      }
    } else {
      WriteError(Error.NotValidCommand);
    }
  };

  /**
   * Sends initial messages as specified in Project specs
   */
  var sendInit = function () {
    var msg = 'Hi, ' + self.Driver.Properties.get('name') + '\n';
    msg += Map.getDimensionsString() + '\n';
    msg += Map.getFilteredMapString() + '\n';
    msg += self.Driver.Properties.get('maxSpeed').toString() + ' ' + self.Driver.Properties.get('acceleration');
    msg += '\r\n';
    self.Socket.write(msg);
  };

  /**
   * Sends current status of the car
   */
  var sendStatus = function () {
    self.Socket.write('VI ' + self.Driver.getStatusString() + '\n');
    //socket.emit('status_'+self.Driver.Properties.get('name'), self.Driver.getJson());
  };

  var setSocket = function (s) {
    self.SocketIO = s;
  };

  var sendWebSocket = function () {
    if (self.SocketIO) {
      self.SocketIO.emit('status_' + self.Driver.Properties.get('name'), self.Driver.getJson());
    }
  };

  var endWebSocket = function (state) {
    if (self.SocketIO) {
      self.SocketIO.emit('end_' + self.Driver.Properties.get('name'), state);
    }
  };

  var initWebSocket = function () {
    var initJson = {};
    initJson.driver = self.Driver.getJson();
    initJson.map = Map.getFullMap();
    self.SocketIO.emit('init_' + self.Driver.Properties.get('name'), initJson);
  };

  /**
   * Called after a connection is closed.
   */
  var closeConnection = function () {
    clearInterval(self.intervalId);
    Pool.remove(self.id);
    console.log('QUIT ' + self.id);
    // self.Socket.write('END\r\n');
  };

  var WriteError = function (msg) {
    self.Socket.write('ERROR ' + msg + '\r\n');
  };

  self.Socket = socket;
  self.Driver = new Driver(Map);

  self.Socket.setEncoding('utf8');
  self.Socket.on('data', handleIncoming);
  self.Socket.on('end', closeConnection);

  self.id = Pool.add(this);
  self.Driver.Properties.set('id', self.id);
  self.initInfo = initWebSocket;
  self.setSocket = setSocket;
};