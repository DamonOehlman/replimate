var debug = require('debug')('replimate'),
    request = require('request'),
    events = require('events'),
    util = require('util'),
    relax = require('./helpers/relax'),
    coreActions = {},
    reUrlStrip = /(https?\:\/\/|\:\d*)/ig,
    reTrailingSlash = /\/(_replicator)?$/,
    reDesign = /^\_design/i;

function _createReplicationId(opts) {
    return (opts.source || '').replace(reUrlStrip, '').replace(/\//g, '_') + 
        '_' + opts.target;
} // _createReplicationId
    
function _dbToRules(data) {
    var rules = [];
    
    (data.rows || []).forEach(function(row) {
        // if not a design doc then include in the results
        if (row.doc && !reDesign.test(row.id)) {
            debug('found replication job: ' + row.id + ', status = ' + row.doc._replication_state);
            rules.push(row.doc);
        }
    });
    
    return rules;
} // _dbToRules
    
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

function _watchForState(monitor, state, interval) {
    
    var monitorTimer;
        
    function checkState() {
        monitor.checkStatus(function(err, data) {
            console.log(data);
            
            // if we captured an error, trigger an error event
            if (err) {
                monitor.emit('error', new Error('Error checking status while waiting for replication completion'));
                clearInterval(monitorTimer);
            }
            else if (data && data._replication_state === state) {
                monitor.emit(state, data);
                clearInterval(monitorTimer);
            }
        });
    }
    
    return function(evtName) {
        if (evtName === state) {
            if (! monitorTimer) {
                debug('done event listener detected, watching for replication completion');
                monitorTimer = setInterval(checkState, interval || 1000);
            }
        }
    };
} // _watchForDone

/* define the replication monitor */

function Monitor(targetUrl, docData, opts) {
    this.docUrl = targetUrl + '/' + (docData.id || docData._id);
    
    // watch for a done event being assigned
    this.on('newListener', _watchForState(this, 'completed'));
    this.on('newListener', _watchForState(this, 'triggered'));
};

util.inherits(Monitor, events.EventEmitter);

Monitor.prototype.cancel = function(callback) {
    var targetUrl = this.docUrl;
    
    // get the data for the document
    relax(targetUrl, function(err, data) {
        if (! err) {
            // delete the item
            relax(targetUrl + '?rev=' + data._rev, 'DELETE', callback);
        }
        else {
            callback(err);
        }
    });
}; // cancel

Monitor.prototype.checkStatus = function(callback) {
    relax(this.docUrl, callback);
};

/* define the core actions */

coreActions.info = function(targetUrl, opts, callback) {
    relax(targetUrl, function(err, data) {
        // if we didn't receive an error, then we connected to the db (hooray)
        if (! err) {
            // let's try and get all the docs
            relax(targetUrl + '/_all_docs?include_docs=true', function(err, data) {
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
            if (err) {
                debug('received error: ', err, data, opts);
            }
            
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
    
    // if the replication is continuous, then create a unique id for the replication
    if (opts.continuous) {
        opts._id = _createReplicationId(opts);
        
        // check to see if the replication is already setup
        relax(targetUrl + '/' + opts._id, function(err, data) {
            // if not found, then
            if (err) {
                relax(targetUrl + '/' + opts._id, opts, responseHandler);
            }
            else {
                responseHandler(err, data);
            }
        });
    }
    else {
        relax(targetUrl + '/' + new Date().getTime(), opts, responseHandler);
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