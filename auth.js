var auth = require('basic-auth');

var admins = {
    'volendaycloudcfo': { password: '119bccf4l82ac660do83cu9c6dndec1f58o9' },
};

module.exports = function(req, res, next) {
    var user = auth(req);
    if (!user || !admins[user.name] || admins[user.name].password !== user.pass) {
        res.set('WWW-Authenticate', 'Basic realm="Volenday"');
        return res.status(401).send();
    }
    return next();
};