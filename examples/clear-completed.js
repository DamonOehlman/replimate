var replimate = require('../');

replimate('http://admin:notaparty@replimate.iriscouch.com/', { action: 'clear-completed' }, function(err) {
    if (! err) {
        console.log('_replicator database now a little cleaner...');
    }
    else {
        console.log(err);
    }
});