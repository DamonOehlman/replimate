var async = require('async'),
    debug = require('debug')('replimate'),
    replimate = require('../replimate'),
    request = require('request');

module.exports = function(targetUrl, opts, callback) {
    var deleteDocs = [];
    
    function _deleteDoc(doc, itemCallback) {
        var deleteUrl = targetUrl + '/' + doc._id + '?rev=' + doc._rev;
        
        debug('DELETE: ' + deleteUrl);
        request.del(deleteUrl, function(err, res, body) {
            itemCallback(err);
        });
    } // _deleteDoc
    
    // get the existing replication docs
    replimate(targetUrl, function(err, docs) {
        if (! err) {
            docs.forEach(function(doc) {
                if (doc._replication_state === 'completed') {
                    deleteDocs.push(doc);
                }
            });

            async.forEach(deleteDocs, _deleteDoc, callback);
        }
        else {
            callback(err);
        }
    });
};