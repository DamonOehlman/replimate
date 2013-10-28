var replimate = require('..');
var dbUrl = process.env.COUCHDB_URL || 'http://replimate.iriscouch.com';
var out = require('out');

replimate(dbUrl, function(err, docs) {
  if (err) {
    return out.error(err);
  }

  console.log(docs);
});
