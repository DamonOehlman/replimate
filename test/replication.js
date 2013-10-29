var async = require('async');
var replimate = require('../');
var config = require('./config/connection');
var couch = require('nano')(config.couchurl);
var assert = require('assert');

describe('replication', function() {
  var _monitor;

  before(function(done) {
    async.series([
      async.apply(require('./helpers/create-testdb'), couch),
      async.apply(require('./helpers/populate-testdb'), couch),
      async.apply(require('./helpers/resetdb')('test2'), couch)
    ], done);
  });


  it('should be able to replicate from two test databases', function(done) {
    var opts = {
      action: 'replicate',
      source: 'test',
      target: 'test2'
    };

    replimate(config.couchurl, opts, function(err, monitor) {
      assert.equal(typeof monitor, 'object');

      // save a reference to the monitor
      _monitor = monitor;

      done(err);
    });
  });

  it('should be able to check the status of the replication', function(done) {
    _monitor.checkStatus(function(err, data) {
      assert(data, 'Status check returned data');
      assert.equal(data.source, 'test', 'Source db is test');
      assert.equal(data.target, 'test2', 'Target db is test2');
      done(err);
    });
  });

  it('should be able to create continuous replication jobs', function(done) {
    var opts = {
      action: 'replicate',
      source: 'test',
      target: 'test2',
      continuous: true
    };

    replimate(config.couchurl, opts, function(err, monitor) {
      assert.equal(typeof monitor, 'object');

      monitor.checkStatus(function(statusErr, data) {
        done(statusErr);
      });
    });
  });
});
