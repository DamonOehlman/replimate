var replimate = require('..');
var targetUrl = process.env.COUCHDB_URL || 'http://localhost:5984';
var out = require('out');

replimate(dbUrl, function(err, docs) {
  if (err) {
    return out.error(err);
  }

  console.log(docs);
});
