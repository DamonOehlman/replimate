var EventEmitter = require('events').EventEmitter;
var util = require('util');
var relax = require('./relax');
var debug = require('debug')('replimate-monitor');

/**
  ### Monitor

  The replication Monitor class is returned from creating a replication task
  using replimate. A Monitor provides a useful way to pass around an object that 
  can be used in other parts of your application to check on the status of a 
  particular replication job
**/
function Monitor(targetUrl, docData, opts) {
  if (! (this instanceof Monitor)) {
    return new Monitor(targetUrl, docData, opts);
  }

  EventEmitter.call(this);

  this.docUrl = targetUrl + '/' + (docData.id || docData._id);

  // watch for a done event being assigned
  this.on('newListener', _watchForState(this, 'completed'));
  this.on('newListener', _watchForState(this, 'triggered'));
};

// inherit from the node event emitter class
util.inherits(Monitor, EventEmitter);
module.exports = Monitor;

/**
  #### cancel(callback)

  Cancel a replication task
**/
Monitor.prototype.cancel = function(callback) {
  var targetUrl = this.docUrl;

  // get the data for the document
  relax(targetUrl, function(err, data) {
    if (err) {
      return callback(err);
    }

    // delete the item
    relax(targetUrl + '?rev=' + data._rev, 'DELETE', callback);
  });
};

/**
  #### checkStatus(callback)

  Request the status of the replication task.
**/
Monitor.prototype.checkStatus = function(callback) {
  relax(this.docUrl, callback);
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
      }
      else if (data && data._replication_state === state) {
        monitor.emit(state, data);
      }

      clearInterval(monitorTimer);
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
}