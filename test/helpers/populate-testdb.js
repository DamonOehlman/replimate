exports.run = function(couch, callback) {
    couch.use('test').insert({ test: true }, callback);
};