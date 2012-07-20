.. _checking-status:

Checking Replication Status
===========================

Getting the current `_replicator` database rules is simple using replimate:

.. literalinclude:: ../examples/getreplication.js
	:language: javascript
	:lines: 2-
	:prepend: var replimate = require('replimate'),

Running this example should run output similar to the following::

    [ { _id: 'test_test2',
        _rev: '119-c46968d9e7a4485015279b4e3af7d465',
        source: 'test',
        target: 'test2',
        continuous: true,
        create_target: true,
        user_ctx: { name: 'admin', roles: [ '_admin' ] },
        owner: 'admin',
        _replication_state: 'triggered',
        _replication_state_time: '2012-07-20T03:32:43+00:00',
        _replication_id: '922742a54303e0c8aa96b09f93bf55ca' } ]

This data is provided directly from the CouchDB `_replicator` db entry, and will contain both current and completed replication jobs.