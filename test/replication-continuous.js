var async = require('async'),
    replimate = require('../'),
    config = require('./config/connection'),
    couch = require('nano')(config.couchurl),
    assert = require('assert'),
    _monitor;
    
describe('replication (continuous)', function() {
    var _monitor;
    
    before(function(done) {
        async.series([
            async.apply(require('./helpers/create-testdb').run, couch),
            async.apply(require('./helpers/populate-testdb').run, couch)
        ], done);
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
            
            // save a reference to the monitor
            _monitor = monitor;
            done(err);
        });
    });
    
    it('should be able to check the status of a continuous replication job', function(done) {
        _monitor.checkStatus(function(err, data) {
            assert(data);
            assert.equal(data.continuous, true);
            
            done(err);
        });
    });
    
    it('should be able to receive a triggered event', function(done) {
        _monitor.on('triggered', done);
    });
    
    it('should have the replication status of triggered', function(done) {
        _monitor.checkStatus(function(err, data) {
            assert(data);
            assert.equal(data._replication_state, 'triggered');
            
            done(err);
        });
    });
    
    it('should be able to cancel the replication', function(done) {
        _monitor.cancel(done);
    });
    
    it('should have no status for the job', function(done) {
        _monitor.checkStatus(function(err, data) {
            assert(err);
            assert.equal(err.reason, 'deleted');
            done();
        });
    });
});
