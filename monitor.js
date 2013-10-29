var EventEmitter = require('events').EventEmitter;
var util = require('util');
var relax = require('./relax');
var debug = require('debug')('replimate-monitor');
var stateOrder = ['triggered', 'completed'];

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

  // flag completed and triggered as false
  this.completed = false;
  this.triggered = false;

  // monitor the completed and triggered state
  this._monitorState('completed');
  this._monitorState('triggered');

 // watch for a done event being assigned
  this.on('newListener', this._checkState('completed'));
  this.on('newListener', this._checkState('triggered'));
};

// inherit from the node event emitter class
util.inherits(Monitor, EventEmitter);
module.exports = Monitor;

/**
  #### cancel(callback)

  Cancel a replication task
**/
Monitor.prototype.cancel = function(callback) {
  var mon = this;
  var counter = 0;

  function cancel() {
    relax(mon.docUrl, function(infoErr, data) {
      if (infoErr) {
        return callback(infoErr);
      }

      debug('attempting to cancel job, revision: ' + data._rev);
      relax(
        mon.docUrl + '?rev=' + data._rev,
        'DELETE',
        function(delErr, delData) {
          // if we hit an error, and it was a conflict, then try again
          if (delErr && delErr.error === 'conflict') {
            counter += 1;
            return setTimeout(cancel, 50);
          }


          return callback(delErr, delData);
        }
      );
    });
  }

  cancel();
};

/**
  #### checkStatus(callback)

  Request the status of the replication task.
**/
Monitor.prototype.checkStatus = function(callback) {
  relax(this.docUrl, callback);
};

/**
  #### _checkState(stateName)

  This is a simple helper function that will check the current state
  of the specified state name, and if already flagged trigger an event
  immediately when a new event listener is coupled to the replication
  monitor
**/
Monitor.prototype._checkState = function(name) {
  var mon = this;

  return function() {
    debug('new listener for ' + name + ' state monitoring connected');

    // if the state has been triggered, emit the event
    if (mon[name]) {
      mon.emit(name, mon[name]);
    }
  };
}

/**
  #### _monitorState(targetState, interval = 1000)

  Monitor the state of the replication job, and update data against
  the monitor as it changes.
**/
Monitor.prototype._monitorState = function(targetState, interval) {
  var mon = this;
  var targetStateIdx;

  // ensure target state is lower case
  targetState = (targetState || '').toLowerCase();

  // get the target state index
  targetStateIdx = stateOrder.indexOf(targetState);

  function next() {
    debug('checking status, looking for state: ' + targetState);
    mon.checkStatus(function(err, data) {
      var currentStateIdx;

      // if we hit an error, then report and abort
      if (err) {
        return debug('captured error: ', err);
      }

      // get the current state index
      currentStateIdx = stateOrder.indexOf(data._replication_state);
      debug('current state: ' + data._replication_state + ', idx: ' + currentStateIdx);

      // if the replication state, matches the target state then finish
      if (data && data._replication_state === targetState) {
        debug('target state found, triggering "' + targetState + '" event');
        // update the data
        mon[targetState] = data;

        // trigger the event
        return mon.emit(targetState, data);
      }

      // if we have already passed the specified state, then abort
      if (currentStateIdx >= targetStateIdx) {
        debug('passed the target state of: ' + targetState);
        return;
      }

      // if the target state is completed, and it is a continuous job abort
      if (data && data.continuous && targetState === 'completed') {
        debug('aborting completed check for continuous replication job')
        return;
      }

      // no change, check again soon...
      setTimeout(next, interval || 500);
    });
  }

  // check the status
  next();
};