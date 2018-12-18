const express = require('express');
const router = express();
const models = require('../modelORM');
const {
    Session
} = models;

router.use(function (req, res, next) {
    Session
        .findOne({ where: { session: req.cookies["app.sid"] } })
        .then((ret) => {
            if (ret) {
                res.redirect('/');
            } else {
                next();
            }
        })
});

router.get('/', function (req, res, next) {
    res.render('auth', {
        title: global.site_name,
        global: global,
        body: "./template/auth",
        page: "auth"
    });
});

router.get('/forgotPassword', (req, res, next) => {
    try {
        let controller = global.initController('forgotPassword');
        controller.get.index(req, (c) => {
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

router.put('/forgotPassword', (req, res, next) => {
    try {
        let controller = global.initController('forgotPassword');
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

router.post('/login', (req, res, next) => {
    try {
        let controller = global.initController('login');
        controller.post.index(req, (c) => {
            res.send(c)
        })
    } catch (err) {
        res.status(400).send({ error: "Not Found!" })
    }
})

module.exports = router;