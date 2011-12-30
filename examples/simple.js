var replimate = require('../');

var opts = {
	action: 'replicate',
	source: 'http://sidelab.iriscouch.com/seattle_neighbourhood',
	target: 'seattle_neighbourhood'
};

replimate('http://admin:notaparty@replimate.iriscouch.com/', opts, function(err, monitor) {
    monitor.on('completed', function() {
        console.log('finished');
    });
});
