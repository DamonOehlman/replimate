module.exports = function(couch, callback) {
  // look for the test db
  couch.db.get('test', function(err, res) {
    if (err) {
      // create the test db
      couch.db.create('test', function(err, res) {
        callback(err);
      });
    }
    else {
      callback();
    }
  });
};