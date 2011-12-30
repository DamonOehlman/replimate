var debug = require('debug')('replimate'),
    request = require('request'),
    reValidStatus = /^[2-3]/;

module.exports = function(url, data, callback) {
    var opts = {
            url: url,
            method: 'GET'
        };
        
    // if the data has been passed as a function, then it's the callback 
    // and we have no data
    if (typeof data == 'function') {
        callback = data;
    }
    else if (typeof data == 'string') {
        opts.method = data;
    }
    else {
        opts.method = 'PUT';
        opts.json = data;
    }
    
    debug(opts.method + ': ' + opts.url);
    request(opts, function(err, res, body) {
        var data;
        
        if (! err) {
            if (reValidStatus.test(res.statusCode)) {
                try {
                    data = typeof body == 'object' ? body : JSON.parse(body);
                }
                catch (e) {
                    err = e;
                }
            }
            else {
                try {
                    err = JSON.parse(body);
                }
                catch (e) {
                    err = 'invalid';
                    data = body;
                }
            }
        }
        
        callback(err, data, res);
    });
};