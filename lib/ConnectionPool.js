function Pool () {
  var _pool = [];
  var _dict = {};

  var self = this;

  self.add = function (connection) {
    _pool.push(connection);
    var id = _pool.length-1;
    return id;
  };

  self.registerTeam = function (id, name) {
    if (id < _pool.length && !_dict.hasOwnProperty(name)) {
      _dict[name] = id;
      return true;
    } else {
      return false;
    }
  };

  self.getConnection = function (name) {
    var id = _dict[name];
    console.log(id);
    if (id || id === 0) {
      return _pool[id];
    } else {
      return null;
    }
  };

  self.remove = function (id) {
    if (id < 0) {
      return null;
    }
    if (_pool[id]) {
      var name = _pool[id].Driver.Properties.get('name');
      delete _dict[name];
    }
    _pool.splice(id, 1);
  }

  self.getAll = function () {
    return _dict;
  }

};

var pool = new Pool();

exports.add = pool.add;
exports.registerTeam = pool.registerTeam;
exports.getConnection = pool.getConnection;
exports.remove = pool.remove;
exports.getAll = pool.getAll;