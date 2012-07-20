var replimate = require('../'),
    util = require('util'),
    targetUrl = 'http://admin:notaparty@replimate.iriscouch.com/';

replimate(targetUrl, function(err, docs) {
    console.log(util.inspect(docs, false, 3));
});