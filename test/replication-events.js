var async = require('async'),
    replimate = require('../'),
    config = require('./config/connection'),
    couch = require('nano')(config.couchurl),
    assert = require('assert');
    
describe('replication events', function() {
    before(function(done) {
        async.series([
            async.apply(require('./helpers/create-testdb').run, couch),
            async.apply(require('./helpers/populate-testdb').run, couch)
        ], done);
    });
    
    
    it('non-continuous replication should trigger a done event', function(done) {
        var opts = {
            action: 'replicate',
            source: 'test',
            target: 'test2'
        };
        
        replimate(config.couchurl, opts, function(err, monitor) {
            assert.equal(typeof monitor, 'object');
            
            // watch for a done event
            monitor.on('completed', done);
        });
    });
});
