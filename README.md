# Replimate

Replimate provides some helpers for working with the CouchDB 1.1 (and above) `_replicator` database.  Using the `_replicator` database provides some benefits over the traditional replication methods including replication persistence across CouchDB server restarts.

<a href="http://travis-ci.org/#!/DamonOehlman/replimate"><img src="https://secure.travis-ci.org/DamonOehlman/replimate.png" alt="Build Status"></a>

## Example Usage

Working with replimate is designed to be really easy, so let's have a look.

### Getting the Current _replicator DB docs

```js
replimate('http://replimate.iriscouch.com/', function(err, docs) {
    console.log(docs);
});
```

### Creating a New Replication Job

Creating a new replcication job is pretty easy also:

```js
var opts = {
	action: 'replicate',
	source: 'http://sidelab.iriscouch.com/seattle_neighbourhood',
	target: 'seattle_neighbourhood'
};

replimate('http://admin:notaparty@replimate.iriscouch.com/', opts, function(err, monitor) {
    monitor.on('completed', function() {
        console.log('finished');
    });
});
```

You will note here, however, that we need to supply admin credentials to create a new replication job as the seattle_neighbourhood db will be need to be created on the replimate.iriscouch.com server.

### Removing Completed Jobs

One thing that is interesting about the `_replicator` database is that it does start to fill up with replication jobs that have been completed in the past.  In an effort to help keep my replicator database instances clear, the [clear-completed](https://github.com/DamonOehlman/replimate/blob/master/lib/actions/clear-completed.js) was created.

Like creating new replication jobs, a user with admin privileges is required:

```js
replimate('http://admin:notaparty@replimate.iriscouch.com/', { action: 'clear-completed' }, function(err) {
    if (! err) {
        console.log('_replicator database now a little cleaner...');
    }
    else {
        console.log(err);
    }
});
```