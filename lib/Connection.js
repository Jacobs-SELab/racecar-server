var _  = require('underscore');
_.str = require('underscore.string');
var Pool = require('./ConnectionPool');
var Driver = require('./Driver').Driver;
var Settings = require('./../settings.json');
var Map = require('./Map');

_.mixin(_.str.exports());
_.str.include('Underscore.string', 'string');

/**
 * Creates Connection instance
 * @param  {Socket} socket     connection
 * @return {Connection}        instance
 */
exports.handle = function (socket) {
  return new Connection(socket);
};

/**
 * Connection class that keeps track of everything
 * related to the respective established connection
 * @param {Socket} socket parameter of the createServer callback of Net
 */
function Connection (socket) {
  this.Socket = socket;
  this.Driver = new Driver();

  socket.setEncoding('utf8');
  socket.on('data', this.handleIncoming);
  socket.on('end', this.closeConnection);

  this.id = Pool.add(this);
  this.Driver.Properties.set('id', this.id);
};

/**
 * Alias for .prototype
 * @type {Function}
 */
Connection.fn = Connection.prototype;

/**
 * Handles incoming messages and calls necessary methods
 * @param {String} data message send as string
 */
Connection.fn.handleIncoming = function (data) {
  var _s = _(data);
  
  if (!this.Driver.started() && _s.startsWith('Hello, I am ')) {
    var name = data.substr('Hello, I am '.length);
    this.Driver.Properties.set('name', name);
    this.sendInit();
  } else if (!this.Driver.started() && _s.startsWith('START')) {
    this.Driver.start();
    this.intervalId = setInterval(function () {
      if (this.Driver.broken()) {
        this.Driver.update();
        socket.emit('status_'+this.Driver.Properties.get('name'), this.Driver.getJson);
        // this.sendStatus();
      }
    }, Settings.interval);
  } else if (this.Driver.started()) {
    if (_s.startsWith('ST ')) {
      var cmd = data.substr('ST '.length);
      this.Driver.handleCommand(cmd);
      this.sendStatus();
    } else if (data === 'REPAIR ME') {
      this.Driver.repair();
    } else {
      this.WriteError(Error.NOT_VALID_COMMAND);
    }
  } else {
    this.WriteError(Error.NOT_STARTED);
  }
};

/**
 * Sends initial messages as specified in Project specs
 */
Connection.fn.sendInit = function () {

};

/**
 * Sends current status of the car
 */
Connection.fn.sendStatus = function () {
  this.Socket.write('VI ' + this.Driver.getStatusString);
};

/**
 * Called after a connection is closed.
 */
Connection.fn.closeConnection = function () {
  clearInterval(this.intervalId);
  Pool.remove(this.id);
};

Connection.fn.WriteError = function () {

};