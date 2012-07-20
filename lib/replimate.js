var debug = require('debug')('replimate'),
    request = require('request'),
    events = require('events'),
    util = require('util'),
    relax = require('./helpers/relax'),
    coreActions = {},
    reUrlStrip = /(https?\:\/\/|\:\d*)/ig,
    reTrailingSlash = /\/(_replicator)?$/,
    reDesign = /^\_design/i;

// ## Helper Functions

// ### _createReplicationId
// This function is used to create an id for a `_replicator` db document based
// on the source and target of the document.
function _createReplicationId(opts) {
    return (opts.source || '').replace(reUrlStrip, '').replace(/\//g, '_') + 
        '_' + opts.target;
} // _createReplicationId
    
// ### _dbToRules
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
    
// ### _parseOpts
// Will be implemeted as a string to options object parser
function _parseOpts(opts) {
    // if the options is already an object, then return that object
    if (typeof opts == 'object') {
        // TODO: sanity check the object
        return opts;
    }
    // otherwise parse the string
    else {
        return {};
    }
};

// ### _watchForState
// This function is used to regularly run the `checkStatus` method of a monitor
// to look for a particular `_replication_state` result from the database.  Once
// the required status has been detected, the event it triggered
function _watchForState(monitor, state, interval) {
    
    var monitorTimer;
        
    function checkState() {
        monitor.checkStatus(function(err, data) {
            // if we captured an error, trigger an error event
            if (err) {
                debug('Received error checking status: ', err);
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
                debug(evtName + ' event listener detected, watching for replication completion');
                monitorTimer = setInterval(checkState, interval || 1000);
            }
        }
    };
} // _watchForDone

// ## Monitor
// The replication Monitor class is returned from creating a replication task
// using replimate. A Monitor provides a useful way to pass around an object that 
// can be used in other parts of your application to check on the status of a 
// particular replication job
function Monitor(targetUrl, docData, opts) {
    this.docUrl = targetUrl + '/' + (docData.id || docData._id);
    
    // watch for a done event being assigned
    this.on('newListener', _watchForState(this, 'completed'));
    this.on('newListener', _watchForState(this, 'triggered'));
};

// inherit from the node event emitter class
util.inherits(Monitor, events.EventEmitter);

// ### Monitor.cancel
// Cancel a replication task
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

// ### Monitor.checkStatus
// Request the status of the replication task
Monitor.prototype.checkStatus = function(callback) {
    relax(this.docUrl, callback);
};

// ## Replimate Core Actions
// Replimate implements a few core actions that can be invoked through the options
// passed to replimate

// ### info
// The `info` action is used to retrieve a list of all the current replication jobs for
// the target servers `_replicator` database.  If no action is specified, then info is 
// used by default
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

// ### replicate
// The `replicate` action is used to create a new replication task in the target
// server's `_replicator` database.  For information on how the CouchDB _replicator
// database operates, see the [CouchDB wiki](http://wiki.apache.org/couchdb/Replication#Replicator_database)
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
    
    var ignoreKeys = ['action'],
        doc = {};
        
    // replicate the options into the doc
    Object.keys(opts).forEach(function(key) {
        if (opts.hasOwnProperty(key) && (ignoreKeys.indexOf(key) < 0)) {
            doc[key] = opts[key];
        }
    });
    
    // if create target is undefined, then default to true
    if (typeof doc.create_target == 'undefined') {
        doc.create_target = true;
    } 

    // initialise the user context (replication needs it)
    // TODO: determine the user roles for the current user and use those credentials
    doc.user_ctx = {
        name: 'admin',
        roles: ['_admin']
    };
    
    // if the replication is continuous, then create a unique id for the replication
    if (doc.continuous) {
        doc._id = _createReplicationId(opts);
        
        // check to see if the replication is already setup
        relax(targetUrl + '/' + doc._id, function(err, data) {
            // if not found, then
            if (err) {
                relax(targetUrl + '/' + doc._id, doc, responseHandler);
            }
            else {
                responseHandler(err, data);
            }
        });
    }
    else {
        relax(targetUrl + '/' + new Date().getTime(), doc, responseHandler);
    }
};

// ## replimate function
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