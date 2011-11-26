var request = require('request'),
    reTrailingSlash = /\/$/;

function _parseOpts(opts) {
    // if the options is already an object, then return that object
    // TODO: sanity check the object
    if (typeof opts == 'object') {
        return opts;
    }
    // otherwise parse the string
    else {
        return {};
    }
};

module.exports = function(targetUrl, opts, callback) {
    var action;
    
    // if the options has been passed as a function, then it's the callback
    if (typeof opts == 'function') {
        callback = opts;
        opts = { action: 'info' };
    }
    
    // parse the options
    opts = _parseOpts(opts);
    
    // load the action module
    try {
        action = require('./actions/' + opts.action);
    }
    catch (e) {
        callback(e);
    }
    
    // if we have an action, then process it
    if (action) {
        action(targetUrl.replace(reTrailingSlash, '') + '/_replicator', opts, callback);
    }
};