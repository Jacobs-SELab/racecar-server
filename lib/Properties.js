var _ = require('lodash');

var default_properties = {
  id: '',
  name: '',
  position {
    x: 0,
    y: 0,
    angle: 0
  }, 
  speed: 0.0,
  map: '',
  health: 100
};

exports.Properties = Properties;
exports.defaults = function () {
  return default_settings;
};

function Properties(properties) {
  this.properties = properties || default_properties;

  return {
    set: function (key, value) {
      set(key, value, properties);

      return this;
    },
    get: function (key, def) {
      return _.cloneDeep(get(key, def, properties));
    },
    unset: function () {
      for (var i = 0; i < arguments.length; i++) {
        if (typeof arguments[i] === "string") {
          unset(arguments[i], properties);
        }
      }

      return this;
    }
  };
}

function set(key, value, obj) {
  var p = key.indexOf(".");

  if (p === -1) {
    return obj[key] = value;
  }

  if (!obj.hasOwnProperty(key.substr(0, p))) {
    obj[key.substr(0, p)] = {};
  }

  return set(key.substr(p + 1), value, obj[key.substr(0, p)]);
}

function get(key, def, obj) {
  var p = key.indexOf(".");

  if (p === -1) {
    if (key === '*') {
      return obj;
    }
    return obj.hasOwnProperty(key) ? obj[key] : def;
  }

  if (!obj.hasOwnProperty(key.substr(0, p))) {
    return def;
  }

  return get(key.substr(p + 1), def, obj[key.substr(0, p)]);
}

function unset(key, obj) {
  var p = key.indexOf(".");

  if (p === -1) {
    if (key === '*') {
      return 'reset';
    } else {
      delete obj[key];
    }
    return;
  }

  if (!obj.hasOwnProperty(key.substr(0, p))) {
    return;
  }

  if (unset(key.substr(p + 1), obj[key.substr(0, p)]) === 'reset') {
    obj[key.substr(0, p)] = {};
  }
}