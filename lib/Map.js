var fs = require('fs');
var path = require('path');
var settings = require('../settings');
var Error = require('../errors');
var _ = require('underscore');
_.str = require('underscore.string');

_.mixin(_.str.exports());
_.str.include('Underscore.string', 'string');

exports.read = function (filePath) {
  var content = fs.readFileSync(filePath, {encoding: 'utf8'});

  content = content.split('\n');

  var dimensions = content.splice(0,1)[0].split(' ');
  var columns = parseInt(dimensions[0], 10);
  var rows = parseInt(dimensions[1], 10);

  var finishSide = content.splice(0,1)[0];
  if (finishSide.indexOf('Finish From: ') !== 0) {
    throw Error.WrongMapFormat;
  }
  var side = finishSide.substr('Finish From: '.length);

  var filtered = _.map(content, function (c) {
    var row = (c.replace(new RegExp(settings.filtered, 'g'), '_')).split('');
    if (row.length !== columns) {
      throw Error.WrongMapFormat;
    }
    return row;
  });

  if (filtered.length !== rows) {
    throw Error.WrongMapFormat;
  }

  var start = {};
  var normal = [];
  for (var i = 0; i < content.length; i++) {
    var row = content[i].split('');
    var idx = content[i].indexOf('C');
    if (row.length !== columns) {
      throw Error.WrongMapFormat;
    }
    if (idx !== -1) {
      start.x = idx;
      start.y = i;
      // row[idx] = 'C';
    }
    normal.push(row);
  }

  if (!start.x || !start.y) {
    throw Error.NoStart;
  }

  if (normal.length !== rows) {
    throw Error.WrongMapFormat;
  }

  var dim = {columns: columns, rows: rows};

  return (new Map(dim, start, normal, filtered, side));
};

function Map (dimension, start, map, filtered, side) {
  var _size = dimension;
  var _map = map;
  var _start = start;
  var _side = side;
  var _filtered = filtered;
  var _green = true;
  var _nextPhase = (new Date()).getTime()+20000;

  var self = this;

  self.getSide = function () {
    return _side;
  }

  self.getStartPosition = function () {
    return _start;
  }

  self.getDimensions = function () {
    return _size;
  }

  self.getDimensionsString = function () {
    return (_size.columns + ' ' + _size.rows + ' ' + _side);
  }

  self.getFilteredMap = function () {
    return _filtered;
  }

  self.getFilteredMapString = function () {
    var rows = _.map(_filtered, function (r) {
      return r.join('');
    });

    return rows.join('\n');
  }

  self.getFullMap = function () {
    return _map;
  }

  self.getFullMapString = function () {
    var rows = _.map(_map, function (r) {
      return r.join('');
    });

    return rows.join('\n');
  }

  self.updateTrafficLight = function () {
    var now = (new Date()).getTime();
    if (now > _nextPhase) {
      _green = (_green === true) ? false : true;
    }
  }

  self.getVision = function (x, y, dirX, dirY, width, height) {
    if (dirX !== 0 && dirY !== 0) {
      throw Error.InvalidParameters;
    }

    if (width % 2 === 0 || height.length < 2) {
      throw Error.InvalidParameters;
    }

    var initialI, initialJ;
    var vision = [];
    if (dirX === 1) {
      initialJ = y-(Math.floor(width/2));
      maxJ = y+(Math.floor(width/2));
      maxI = x;
      initialI = x+(height-1);
      for (var k = 0; k < height; k++) {
        vision.push([]);
      }
      for (var j = initialJ; j <= maxJ; j++) {
        for (var i = initialI; i >= maxI; i--) {
          if (i === x && j === y) {
            vision[(initialI-i)].push('C');  
          } else if (j >= _map.length || j < 0 || i >= _map[j].length || i < 0) {
            vision[(initialI-i)].push('#');
          } else if (_map[j][i] === 'n') {
            vision[(initialI-i)].push('_');
          } else if (_map[j][i] === '+') {
            if (_green) {
              vision[(initialI-i)].push('+');
            } else {
              vision[(initialI-i)].push('-');
            }
          } else {
            vision[(initialI-i)].push(_map[j][i]);
          }
        }
      }
    } else if (dirX === -1) {
      initialJ = y+(Math.floor(width/2));
      maxJ = y-(Math.floor(width/2));
      maxI = x;
      initialI = x-(height-1);
      for (var k = 0; k < height; k++) {
        vision.push([]);
      }
      for (var j = initialJ; j >= maxJ; j--) {
        for (var i = initialI; i >= maxI; i++) {
          if (i === x && j === y) {
            vision[(initialI-i)].push('C');  
          } else if (j >= _map.length || j < 0 || i >= _map[j].length || i < 0) {
            vision[(initialI-i)].push('#');
          } else if (_map[j][i] === 'n') {
            vision[(initialI-i)].push('_');
          } else if (_map[j][i] === '+') {
            if (_green) {
              vision[(initialI-i)].push('+');
            } else {
              vision[(initialI-i)].push('-');
            }
          } else {
            vision[(initialI-i)].push(_map[j][i]);
          }
        }
      }
    } else if (dirY === 1) {
      initialI = x+(Math.floor(width/2));
      maxI = x-(Math.floor(width/2));
      maxJ = y;
      initialJ = y+(height-1);
      for (var j = initialJ; j >= maxJ; j--) {
        var row = [];
        for (var i = initialI; i >= maxI; i--) {
          if (i === x && j === y) {
            row.push('C');
          } else if (j >= _map.length || j < 0 || i >= _map[j].length || i < 0) {
            row.push('#');
          } else if (_map[j][i] === 'n') {
            row.push('_');
          } else if (_map[j][i] === '+') {
            if (_green) {
              row.push('+');
            } else {
              row.push('-');
            }
          } else {
            row.push(_map[j][i]);
          }
        }
        vision.push(row);
      }
    } else if (dirY === -1) {
      maxI = x+(Math.floor(width/2));
      initialI = x-(Math.floor(width/2));
      initialJ = y-(height-1);
      maxJ = y;
      for (var j = initialJ; j <= maxJ; j++) {
        var row = [];
        for (var i = initialI; i <= maxI; i++) {
          if (i === x && j === y) {
            row.push('C');
          } else if (j >= _map.length || j < 0 || i >= _map[j].length || i < 0) {
            row.push('#');
          } else if (_map[j][i] === 'n') {
            row.push('_');
          } else if (_map[j][i] === '+') {
            if (_green) {
              row.push('+');
            } else {
              row.push('-');
            }
          } else {
            row.push(_map[j][i]);
          }
        }
        vision.push(row);
      }
    } else {
      throw Error.InvalidParameters;
    }

    return vision;
  };

  self.getCell = function (x, y) {
    var idx_x = Math.round(x);
    var idx_y = Math.round(y);

    if (idx_x < 0 || idx_x >= _size.columns || idx_y < 0 || idx_y >= _size.rows) {
      return '#';
    } 

    if (_map[idx_y][idx_x] === '+' && _green === false) {
      return '-';
    } 

    return _map[idx_y][idx_x];
  };
};