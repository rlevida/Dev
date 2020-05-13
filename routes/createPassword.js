var express = require('express');
var router = express();
var moment = require('moment');
const models = require('../modelORM');
const {
    UsersCreatePassword
} = models;

router.get('/', function (req, res, next) {
    const hash = req.query.hash;
    try {
        UsersCreatePassword
            .findOne({ where: { hash: hash } })
            .then((ret) => {
                if (ret != null) {
                    res.render('auth', {
                        title: global.site_name + ' - Create Password',
                        global: global,
                        page: 'createPassword'
                    });
                } else {
                    res.render('auth', {
                        title: global.site_name,
                        global: global,
                        page: 'activationExpired'
                    });
                }
            })
    } catch (err) {
        res.render('error', {
            message: 'Something wen wrong. Please try again.',
        });
    }
});

router.put('/create', (req, res, next) => {
    try {
        let controller = global.initController('createPassword');
        controller.put.index(req, (c) => {
            if (c.status) {
                res.send(c.data)
            } else {
                res.status(400).send({ message: c.error });
            }
        })
    } catch (err) {
        res.status(400).send({ error: "Not Found!" })
    }
})

module.exports = router;