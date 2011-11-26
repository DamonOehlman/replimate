var request = require('request');

module.exports = function(targetUrl, opts, callback) {
    request(targetUrl, function(err, res, body) {
        console.log(res);
        
        callback(err, res);
    });
};