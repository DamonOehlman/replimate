var request = require('request'),
    events = require('events'),
    util = require('util'),
    coreActions = {},
    reValidStatus = /^[2-3]/,
    reTrailingSlash = /\/$/,
    reDesign = /^\_design/i;

function _createReplicationId(opts) {
    return opts.source + '=>' + opts.target;
} // _createReplicationId
    
function _dbToRules(data) {
    var rules = [];
    
    (data.rows || []).forEach(function(row) {
        // if not a design doc then include in the results
        if (! reDesign.test(row.id)) {
            console.log(row);
        }
    });
    
    return rules;
} // _dbToRules
    
function _relax(url, data, callback) {
    var opts = {
            url: url
        };
        
    // if the data has been passed as a function, then it's the callback 
    // and we have no data
    if (typeof data == 'function') {
        callback = data;
    }
    else {
        opts.method = 'POST';
        opts.json = data;
    }
    
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
                }
            }
        }
        
        callback(err, data, res);
    });
}

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

/* define the replication monitor */

function Monitor(targetUrl, docData, opts) {
    this.docUrl = targetUrl + '/' + docData.id;
};

util.inherits(Monitor, events.EventEmitter);

Monitor.prototype.checkStatus = function(callback) {
    _relax(this.docUrl, callback);
};


/* define the core actions */

coreActions.info = function(targetUrl, opts, callback) {
    _relax(targetUrl, function(err, data) {
        // if we didn't receive an error, then we connected to the db (hooray)
        if (! err) {
            // let's try and get all the docs
            _relax(targetUrl + '/_all_docs', function(err, data) {
                if (! err) {
                    callback(err, _dbToRules(data));
                }
                else {
                    callback(err);
                }
            });
        }
        else {
            callback(err);
        }
    });
};

coreActions.replicate = function(targetUrl, opts, callback) {
    
    // the response handler is used 
    function responseHandler(err, data) {
        if (callback) {
            callback(err, err ? data : new Monitor(targetUrl, data, opts));
        }
    }
    
    // if create target is undefined, then default to true
    if (typeof opts.create_target == 'undefined') {
        opts.create_target = true;
    } 

    // initialise the user context (replication needs it)
    // TODO: determine the user roles for the current user and use those credentials
    opts.user_ctx = {
        name: 'admin',
        roles: ['_admin']
    };
    
    // if the replication is continuous, then create a unique id for the 
    if (opts.continuous) {
        opts._id = _createReplicationId(opts);
        
        // check to see if the replication is already setup
        _relax(targetUrl + '/' + opts._id, function(err, data) {
            // if not found, then
            if (err) {
                _relax(targetUrl, opts, responseHandler);
            }
            else {
                responseHandler(err, data);
            }
        });
    }
    else {
        _relax(targetUrl, opts, responseHandler);
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
        action = coreActions[opts.action] || require('./actions/' + opts.action);
    }
    catch (e) {
        callback(e);
    }
    
    // if we have an action, then process it
    if (action) {
        action(targetUrl.replace(reTrailingSlash, '') + '/_replicator', opts, callback);
    }
};