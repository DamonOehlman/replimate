var async = require('async'),
    replimate = require('../'),
    config = require('./config/connection'),
    couch = require('nano')(config.couchurl),
    assert = require('assert');
    
describe('replication', function() {
    var _monitor;
    
    before(function(done) {
        async.series([
            async.apply(require('./helpers/create-testdb').run, couch),
            async.apply(require('./helpers/populate-testdb').run, couch)
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
            done(err);
        });
    });
});