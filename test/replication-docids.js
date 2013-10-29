var async = require('async');
var replimate = require('../');
var config = require('./config/connection');
var couch = require('nano')(config.couchurl);
var assert = require('assert');

describe('replication filter', function() {
  before(function(done) {
    async.series([
      async.apply(require('./helpers/resetdb')('test'), couch),
      async.apply(require('./helpers/create-testdb'), couch),
      async.apply(require('./helpers/resetdb')('test2'), couch),

      function(callback) {
        couch.use('test').insert({ _id: 'abc123' }, callback);
      },

      function(callback) {
        couch.use('test').insert({ _id: 'abc456' }, callback);
      }
    ], done);
  });

  it('should be able to replicate specific docids', function(done) {
    var opts = {
      action: 'replicate',
      source: 'test',
      target: 'test2',
      docids: [ 'abc123' ]
    };

    replimate(config.couchurl, opts, function(err, monitor) {
      assert.ifError(err);

      monitor.once('completed', function() {
        done();
      })
    });
  });

  it('test2 should contain only 1 document', function(done) {
    couch.use('test2').list(function(err, data) {
      assert.ifError(err);
      assert.equal(data.rows.length, 1, 'expected only one doc');
      done();
    });
  });
});
