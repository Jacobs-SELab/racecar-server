var Properties = require('./Properties').Properties;

exports.Driver = Driver;

function Driver (map) {
  var _startTime;
  var _broken = true;
  var _started = false;
  var _map = map;

  function getVision () {

  };

  this.Properties = new Properties();

  this.start = function () {
    _started = true;
    _startTime = new Date();
  };

  this.started = function () {
    return _started;
  };

  this.broken = function () {
    return _broken;
  };

  this.update = function () {

  };

  this.handleCommand = function () {

  };

  this.repair = function () {
    _broken = false;
  };

  this.getStatusString = function () {
    var vision = getVision();
    var timePassed = Math.round(((new Date()) - _startTime)/1000);
    return ''+timePassed+
            ' '+this.Properties.get('position.x')+
            ' '+this.Properties.get('position.y')+
            ' '+this.Properties.get('speed')+
            ' '+this.Properties.get('position.angle')+
            ' '+this.Properties.get('health')+
            ' '+vision;
  };
};