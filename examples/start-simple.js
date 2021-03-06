var replimate = require('../');
var targetUrl = process.env.COUCHDB_URL || 'http://localhost:5984';
var opts = {
  action: 'replicate',
  source: 'http://sidelab.iriscouch.com/seattle_neighbourhood',
  target: 'seattle_neighbourhood'
};

// create a replication rule to run from the test seattle_neighbourhood db
// to a local copy on the replimate instance
replimate(targetUrl, opts, function(err, monitor) {
  console.log('replication started');

  // using the returned monitor,
  // report when the replication has finished
  monitor.on('completed', function() {
    console.log('replication finished');
  });
});
