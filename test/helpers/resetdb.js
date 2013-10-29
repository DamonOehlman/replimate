module.exports = function(name) {
  return function(couch, callback) {
    couch.db.destroy(name, function(err) {
      callback();
    });
  };
};

