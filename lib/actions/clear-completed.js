var async = require('async'),
    debug = require('debug')('replimate'),
    replimate = require('../replimate'),
    relax = require('../helpers/relax');

module.exports = function(targetUrl, opts, callback) {
    var deleteDocs = [];
    
    function _deleteDoc(doc, itemCallback) {
        var deleteUrl = targetUrl + '/' + doc._id + '?rev=' + doc._rev;
        
        relax(deleteUrl, 'DELETE', function(err, data) {
            if (err) {
                debug('ERROR: ' + err.reason);
            }
            
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

            debug('found ' + docs.length + ' _replicator docs that should be deleted');
            async.forEach(deleteDocs, _deleteDoc, callback);
        }
        else {
            callback(err);
        }
    });
};