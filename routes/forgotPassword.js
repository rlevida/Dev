var express = require('express');
var router = express();

router.get('/', function (req, res, next) {
    var ufp = global.initModel('users_forgot_password'),
        hash = req.query.hash;
    ufp.getData("users_forgot_password",{hash:hash},{}, (response) => {
        if (response.data.length > 0) {
            res.render('index', {
                title: global.site_name + ' - Forgot Password',
                global: global,
                body: './template/index',
                page: 'forgotPassword',
            });
        } else {
            res.render('error', {
                message: 'Link not found or already been expired. Please try again.',
            });
        }
    });
});

module.exports = router;