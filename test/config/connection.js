try {
    module.exports = require('./override');
}
catch (e) {
    module.exports = {
        couchurl: 'http://admin:notaparty@replimate.iriscouch.com/'
    };
}