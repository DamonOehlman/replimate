var async = require('async');
var replimate = require('../');
var config = require('./config/connection');
var couch = require('nano')(config.couchurl);
var assert = require('assert');


describe('replication events', function() {
  before(function(done) {
    async.series([
      async.apply(require('./helpers/create-testdb'), couch),
      async.apply(require('./helpers/populate-testdb'), couch)
    ], done);
  });

  it('non-continuous replication should trigger a completed event', function(done) {
    var opts = {
      action: 'replicate',
      source: 'test',
      target: 'test2'
    };

    replimate(config.couchurl, opts, function(err, monitor) {
      assert.equal(typeof monitor, 'object');

      // watch for a done event
      monitor.once('completed', function() {
        done();
      });
    });
  });
});
