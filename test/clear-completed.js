var replimate = require('../'),
    config = require('./config/connection'),
    assert = require('assert');
    
describe('replication', function() {
    it('should be able to clear completed replication jobs', function(done) {
        replimate(config.couchurl, { action: 'clear-completed' }, function(err) {
            done(err);
        });
    });
});
