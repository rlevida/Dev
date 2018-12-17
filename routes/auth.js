var express = require('express');
var jwt = require('jsonwebtoken');
var router = express();

router.use(function (req, res, next) {
    let session = global.initModel("session");
    session.getData("session", { session: req.cookies["app.sid"] }, {}, (ret) => {
        if (ret.status && ret.data.length > 0) {
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

router.get('/login', (req, res, next) => {
    try {
        let controller = global.initController('login');
        controller.get.index(req, (c) => {
            res.send(c)
        })
    } catch (err) {
        res.status(400).send({ error: "Not Found!" })
    }
})

module.exports = router;