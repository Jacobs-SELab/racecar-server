var Properties = require('./Properties').Properties;
var settings = require('../settings');
var Objects = require('./objects');
var Error = require('../errors');
var _ = require('underscore');

exports.Driver = Driver;

function toRadians (angle) {
  return angle * (Math.PI / 180);
}

function roundDigit (num, k) {
  var pow10 = Math.pow(10, k);
  return Math.round(num*pow10)/pow10;
}

function Driver (map) {
  var _startTime;
  var _broken = false;
  var _started = false;
  var _state = 'i';
  var _dead = false;
  var _drunk = false;
  var _map = map;
  var _finished = false;

  var self = this;


  function getVision () {
    var position = self.Properties.get('position');
    var vision;
    if (position.angle >= 0 && position.angle < 45) {
      vision = _map.getVision(Math.round(position.x), Math.round(position.y), 1, 0, settings.vision.width, settings.vision.height);
    } else if (position.angle >= 45 && position.angle < 135) {
      vision = _map.getVision(Math.round(position.x), Math.round(position.y), 0, -1, settings.vision.width, settings.vision.height);
    } else if (position.angle >= 135 && position.angle < 225) {
      vision = _map.getVision(Math.round(position.x), Math.round(position.y), -1, 0, settings.vision.width, settings.vision.height);
    } else if (position.angle >= 225 && position.angle < 315) {
      vision = _map.getVision(Math.round(position.x), Math.round(position.y), 0, 1, settings.vision.width, settings.vision.height);
    } else if (position.angle >= 315 && position.angle < 360) {
      vision = _map.getVision(Math.round(position.x), Math.round(position.y), 1, 0, settings.vision.width, settings.vision.height);
    } else {
      throw Error.InvalidAngle;
    }

    vision = _.map(vision, function (r) {
      return r.join('');
    });

    var visionStr = vision.join('\n');
    return visionStr;
  };

  self.Properties = new Properties();

  var startPos = map.getStartPosition();
  console.log(startPos);
  self.Properties.set('position.x', startPos.x);
  self.Properties.set('position.y', startPos.y);

  self.start = function () {
    _started = true;
    _startTime = new Date();
  };

  self.getStartTime = function () {
    return _startTime;
  };

  self.drunk = function () {
    return _drunk;
  };

  self.dead = function () {
    return _dead;
  };

  self.started = function () {
    return _started;
  };

  self.finished = function () {
    return _finished;
  };

  self.broken = function () {
    return _broken;
  };

  self.update = function () {
    var speed = self.Properties.get('speed');
    if (_state === 'a') {
      speed += (settings.interval/1000)*self.Properties.get('acceleration');
      self.Properties.set('speed', speed);
    } else if (_state === 'b') {
      speed -= (settings.interval/1000)*self.Properties.get('acceleration');
      self.Properties.set('speed', speed);
    }
    var speedMs = speed/1000;
    var initialPos;
    var position = initialPos = self.Properties.get('position');
    initialPos = JSON.parse(JSON.stringify(position));
    var distance = speedMs*settings.interval;
    var dy = Math.sin(toRadians(position.angle))*distance;
    var dx = Math.sqrt((distance*distance) - (dy*dy));
    position.x += dx;
    position.y += dy;
    self.Properties.set('position', position);
    var obstacle = _map.getCell(position.x, position.y);
    if (Math.round(initialPos.x) !== Math.round(position.x) || Math.round(initialPos.y) !== Math.round(position.y)) {
      console.log('cell', obstacle);
      switch (obstacle) {
        case Objects.Outside:
          var health = self.Properties.get('health');
          health -= 20;
          self.Properties.set('health', health);
          if (health <= 0) {
            _dead = true;
            _finished = true;
          }
          break;
        case Objects.Track:
          // everything alright
          break;
        case Objects.Rock:
          var health = self.Properties.get('health');
          var speed = self.Properties.get('speed');
          health -= 10;
          speed -= (0.05*speed);
          self.Properties.set('health', health);
          self.Properties.set('speed', speed);
          if (health <= 0) {
            _dead = true;
            _finished = true;
          }
          break;
        case Objects.Wall:
          _dead = true;
          break;
        case Objects.Light.Green: 
          // everything alright
          break;
        case Objects.Light.Red:
          var health = self.Properties.get('health');
          health -= 20;
          self.Properties.set('health', health);
          if (health <= 0) {
            _dead = true;
            _finished = true;
          }
          break;
        case Objects.Health:
          var health = self.Properties.get('health');
          health += 20;
          health = (health > 100) ? 100 : health;
          self.Properties.set('health', health);
          break;
        case Objects.Speed:
          var speed = self.Properties.get('speed');
          speed += 0.1*speed;
          if (speed >= self.Properties.get('maxSpeed')) {
            self.Properties.set('speed', self.Properties.get('maxSpeed'));
          } else {
            self.Properties.set('speed', speed);
          }
          break;
        case Objects.Vodka:
          _drunk = true;
          break;
        case Objects.Prohibition:
          _drunk = false;
          break;
        case Objects.Nails:
          _broken = true;
          break;
        case Objects.Finish:
          if (_map.getSide() === 'right') {
            var angle = self.Properties.get('angle');
            if ((angle >= 0 && angle <= 90) || (angle >= 270 && angle <= 360)) {
              _finished = true;
            } else {
              _finished = true;
              _dead = true;
            }
          } else if (_map.getSide() === 'left') {
            var angle = self.Properties.get('angle');
            if (angle >= 90 && angle <= 270) {
              _finished = true;
            } else {
              _finished = true;
              _dead = true;
            }
          } else {
            throw Error.WrongMapData;
          }
          break;
        case Objects.Car:
        default:
          // shouldn't be hit
          break;
      }
    }
  };

  self.handleCommand = function (command) {
    var cmd = command.split(/\s+/);
    if (cmd.length < 3) {
      return Error.InvalidCommand;
    }
    if (cmd[0] !== 'a' && cmd[0] !== 'b' && cmd[0] !== 'i') {
      return Error.InvalidCommand;
    } 
    var dAngle = parseFloat(cmd[2], 10);
    if (!dAngle) {
      return Error.InvalidCommand;
    }
    var angle = self.Properties.get('position.angle');
    if (cmd[1] === '+' || (_drunk && cmd[1] === '-')) {
      angle += dAngle;
      angle = (angle % 360);
    } else if (cmd[1] === '-' || (_drunk && cmd[1] === '+')) {
      angle -= dAngle;
      angle = (angle % 360);
    } 
    _state = cmd[0];
  };

  self.repair = function () {
    _broken = false;
  };

  self.getJson = function () {
    var json = {};
    json.position = self.Properties.get('position');
    json.timePassed = (new Date() - _startTime);
    json.speed = self.Properties.get('speed');
    json.health = self.Properties.get('health');
    json.acceleration = self.Properties.get('acceleration');
    json.drunk = _drunk;
    json.broken = _broken;
    json.dead = _dead;

    return json;
  };

  self.getStatusString = function () {
    var vision = getVision();
    var timePassed = roundDigit(((new Date()) - _startTime)/1000, 2);
    return ''+timePassed+
            ' '+roundDigit(self.Properties.get('position.x'), settings.precision)+
            ' '+roundDigit(self.Properties.get('position.y'), settings.precision)+
            ' '+roundDigit(self.Properties.get('speed'), settings.precision)+
            ' '+roundDigit(self.Properties.get('position.angle'), settings.precision)+
            ' '+roundDigit(self.Properties.get('health'), settings.precision)+
            '\n'+vision;
  };
};