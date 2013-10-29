module.exports = function(couch, callback) {
  // look for the test db
  couch.db.destroy('test2', callback);
};