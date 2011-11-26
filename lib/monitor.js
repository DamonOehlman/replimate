var events = require('events'),
    util = require('util');
    
var Monitor = exports.Monitor = function(targetUrl, docData, opts) {
    
};

util.inherits(Monitor, events.EventEmitter);

Monitor.prototype.checkStatus = function(callback) {
    callback();
};