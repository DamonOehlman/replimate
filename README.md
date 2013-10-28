# replimate

Replimate provides some helpers for working with the CouchDB 1.1
(and above) `_replicator` database.  Using the `_replicator` database
provides some benefits over the traditional replication methods
including replication persistence across CouchDB server restarts.

## Example Usage

Working with replimate is designed to be really easy, and here are
a few examples:

### Getting the Current _replicator DB docs

```js
var replimate = require('replimate');
var dbUrl = process.env.COUCHDB_URL || 'http://replimate.iriscouch.com';
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
var opts = {
  action: 'replicate',
  source: 'http://sidelab.iriscouch.com/seattle_neighbourhood',
  target: 'seattle_neighbourhood'
};
var targetUrl = process.env.COUCHDB_URL || 'http://replimate.iriscouch.com';

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
var targetUrl = process.env.COUCHDB_URL || 'http://replimate.iriscouch.com';
var out = require('out');

replimate(targetUrl, { action: 'clear-completed' }, function(err) {
  if (err) {
    return out.error(err);
  }

  out('_replicator database now a little cleaner...');
});
```

### Monitor

The replication Monitor class is returned from creating a replication task
using replimate. A Monitor provides a useful way to pass around an object that 
can be used in other parts of your application to check on the status of a 
particular replication job

#### cancel(callback)

Cancel a replication task

#### checkStatus(callback)

Request the status of the replication task.

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
