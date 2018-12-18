var express = require('express');
var router = express();
const models = require('../modelORM');
const {
    UserForgotPassword
} = models;

router.get('/', function (req, res, next) {
    const hash = req.query.hash;
    try {
        UserForgotPassword
            .findOne({ where: { hash: hash } })
            .then((ret) => {
                if (ret) {
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
            })
    } catch (err) {
        res.render('error', {
            message: 'Something wen wrong. Please try again.',
        });
    }
});

module.exports = router;