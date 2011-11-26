var replimate = require('../'),
    config = require('./config/connection');
    
describe('connectivity', function() {
    it('should be able to connect to the _replicator database', function(done) {
        replimate(config.couchurl, function(err, res) {
            done(err);
        });
    });
});
