try {
    module.exports = require('./override');
}
catch (e) {
    module.exports = {
        couchurl: 'http://localhost:5984/'
    };
}