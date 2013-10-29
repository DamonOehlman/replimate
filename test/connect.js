var replimate = require('../');
var assert = require('assert');
var config = require('./config/connection');

describe('connectivity', function() {
  it('should be able to connect to the _replicator database', function(done) {
    replimate(config.couchurl, function(err, data) {
      assert(data);
      done(err);
    });
  });
});
