var replimate = require('../');
var config = require('./config/connection');
var assert = require('assert');

describe('replication', function() {
  it('should be able to clear completed replication jobs', function(done) {
    replimate(config.couchurl, { action: 'clear-completed' }, function(err) {
      done(err);
    });
  });
});
