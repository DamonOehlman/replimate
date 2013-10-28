var replimate = require('../');
var targetUrl = process.env.COUCHDB_URL || 'http://replimate.iriscouch.com';
var out = require('out');

replimate(targetUrl, { action: 'clear-completed' }, function(err) {
  if (err) {
    return out.error(err);
  }

  out('_replicator database now a little cleaner...');
});