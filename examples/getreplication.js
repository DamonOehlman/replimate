var replimate = require('../');

replimate('http://replimate.iriscouch.com/', function(err, docs) {
    console.log(docs);
});