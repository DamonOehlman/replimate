var debug = require('debug')('replimate');
var request = require('request');
var relax = require('./relax');
var actions = require('./actions/');
var reTrailingSlash = /\/(_replicator)?$/;

/**
  # replimate

  Replimate provides some helpers for working with the CouchDB 1.1
  (and above) `_replicator` database.  Using the `_replicator` database
  provides some benefits over the traditional replication methods
  including replication persistence across CouchDB server restarts.

  ## Example Usage

  Working with replimate is designed to be really easy, and here are
  a few examples:

  ### Getting the Current _replicator DB docs

  <<< examples/getdocs.js

  ### Creating a New Replication Job

  Creating a new replcication job is pretty easy also:

  <<< examples/start-simple.js

  You will note here, however, that we need to supply admin credentials to
  create a new replication job as the seattle_neighbourhood db will be need
  to be created on the replimate.iriscouch.com server.

  ### Removing Completed Jobs

  One thing that is interesting about the `_replicator` database is that it
  does start to fill up with replication jobs that have been completed in
  the past.  In an effort to help keep my replicator database instances
  clear, the `clear-completed` job was created.

  Like creating new replication jobs, a user with admin privileges is
  required:

  <<< examples/clear-completed.js

  ## Reference

**/

/**
  ### replimate(targetUrl, opts?, callback)

  Start the replimate process.  The `targetUrl` specifies the target couch
  server endpoint (including basic auth admin credentials if required).

  If no `opts` are specified, then replimate will simply return information on
  the entries within the `_replicator` database on that server.

**/
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
    action = actions[opts.action] || require('./actions/' + opts.action);
  }
  catch (e) {
    callback(e);
  }

  // if we have an action, then process it
  if (action) {
    action(targetUrl.replace(reTrailingSlash, '') + '/_replicator', opts, callback);
  }
};

// ## Helper Functions

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