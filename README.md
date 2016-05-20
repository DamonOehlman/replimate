# replimate

Replimate provides some helpers for working with the CouchDB 1.1
(and above) `_replicator` database.  Using the `_replicator` database
provides some benefits over the traditional replication methods
including replication persistence across CouchDB server restarts.


[![NPM](https://nodei.co/npm/replimate.png)](https://nodei.co/npm/replimate/)

[![Build Status](https://api.travis-ci.org/DamonOehlman/replimate.svg?branch=master)](https://travis-ci.org/DamonOehlman/replimate) [![bitHound Score](https://www.bithound.io/github/DamonOehlman/replimate/badges/score.svg)](https://www.bithound.io/github/DamonOehlman/replimate) 

## Example Usage

Working with replimate is designed to be really easy, and here are
a few examples:

### Getting the Current _replicator DB docs

```js
var replimate = require('replimate');
var targetUrl = process.env.COUCHDB_URL || 'http://localhost:5984';
var out = require('out');

replimate(dbUrl, function(err, docs) {
  if (err) {
    return out.error(err);
  }

  console.log(docs);
});

```

### Creating a New Replication Job

Creating a new replcication job is pretty easy also:

```js
var replimate = require('replimate');
var targetUrl = process.env.COUCHDB_URL || 'http://localhost:5984';
var opts = {
  action: 'replicate',
  source: 'http://sidelab.iriscouch.com/seattle_neighbourhood',
  target: 'seattle_neighbourhood'
};

// create a replication rule to run from the test seattle_neighbourhood db
// to a local copy on the replimate instance
replimate(targetUrl, opts, function(err, monitor) {
  console.log('replication started');

  // using the returned monitor,
  // report when the replication has finished
  monitor.on('completed', function() {
    console.log('replication finished');
  });
});

```

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

```js
var replimate = require('replimate');
var targetUrl = process.env.COUCHDB_URL || 'http://localhost:5984';
var out = require('out');

replimate(targetUrl, { action: 'clear-completed' }, function(err) {
  if (err) {
    return out.error(err);
  }

  out('_replicator database now a little cleaner...');
});
```

## Reference

### replimate(targetUrl, opts?, callback)

Start the replimate process.  The `targetUrl` specifies the target couch
server endpoint (including basic auth admin credentials if required).

If no `opts` are specified, then replimate will simply return information on
the entries within the `_replicator` database on that server.

### Monitor

The replication Monitor class is returned from creating a replication task
using replimate. A Monitor provides a useful way to pass around an object that 
can be used in other parts of your application to check on the status of a 
particular replication job

#### cancel(callback)

Cancel a replication task

#### checkStatus(callback)

Request the status of the replication task.

#### _checkState(stateName)

This is a simple helper function that will check the current state
of the specified state name, and if already flagged trigger an event
immediately when a new event listener is coupled to the replication
monitor

#### _monitorState(targetState, interval = 1000)

Monitor the state of the replication job, and update data against
the monitor as it changes.

### Replimate Core Actions

Replimate implements a few core actions that can be invoked through the options
passed to replimate

#### info(targetUrl, opts, callback)

The `info` action is used to retrieve a list of all the current replication jobs for
the target servers `_replicator` database.  If no action is specified, then info is 
used by default

#### replicate(targetUrl, opts, callback)

The `replicate` action is used to create a new replication task in the target
server's `_replicator` database.  For information on how the CouchDB _replicator
database operates, see the [CouchDB wiki](http://wiki.apache.org/couchdb/Replication#Replicator_database)

## License(s)

### MIT

Copyright (c) 2016 Damon Oehlman <damon.oehlman@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
