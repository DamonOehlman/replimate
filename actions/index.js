/* jshint node: true */
'use strict';

var debug = require('debug')('replimate-actions');
var relax = require('../relax');
var reDesign = /^\_design/i;
var reUrlStrip = /(https?\:\/\/|\:\d*)/ig;
var Monitor = require('../monitor');

/**
  ### Replimate Core Actions

  Replimate implements a few core actions that can be invoked through the options
  passed to replimate

**/

/**
  #### info(targetUrl, opts, callback)

  The `info` action is used to retrieve a list of all the current replication jobs for
  the target servers `_replicator` database.  If no action is specified, then info is 
  used by default
**/
exports.info = function(targetUrl, opts, callback) {
  relax(targetUrl, function(err, data) {
    if (err) {
      return callback(err);
    }

    // let's try and get all the docs
    relax(targetUrl + '/_all_docs?include_docs=true', function(err, data) {
      if (err) {
        return callback(err);
      }

      callback(err, _dbToRules(data));
    });
  });
};

/**
  #### replicate(targetUrl, opts, callback)

  The `replicate` action is used to create a new replication task in the target
  server's `_replicator` database.  For information on how the CouchDB _replicator
  database operates, see the [CouchDB wiki](http://wiki.apache.org/couchdb/Replication#Replicator_database)
**/
var replicate = exports.replicate = function(targetUrl, opts, callback) {
  var ignoreKeys = ['action'];
  var doc = {};

  // the response handler is used
  function responseHandler(err, data) {
    if (callback) {
      if (err) {
        debug('received error: ', err, data, opts);
      }

      callback(err, err ? data : new Monitor(targetUrl, data, opts));
    }
  }

  // if we have been provided a filter function, then we need to do a
  // bit of legwork to make the filter available
  if (typeof opts.filter == 'function') {
    return callback(new Error('filter function must be a named filter on the source'));
  }

  // replicate the options into the doc
  Object.keys(opts).forEach(function(key) {
    if (opts.hasOwnProperty(key) && (ignoreKeys.indexOf(key) < 0)) {
      doc[key] = opts[key];
    }
  });

  // if we have a filter, then convert to text
  if (typeof doc.filter == 'function') {
    doc.filter = doc.filter.toString();
    console.log(doc);
  }

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

// ### _createReplicationId
// This function is used to create an id for a `_replicator` db document based
// on the source and target of the document.
function _createReplicationId(opts) {
  return (opts.source || '').replace(reUrlStrip, '').replace(/\//g, '_') + 
      '_' + opts.target;
} // _createReplicationId