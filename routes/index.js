const express = require('express');
const sess = require('express-session');
const jwt = require('jsonwebtoken');
const router = express();
const models = require('../modelORM');
const {
    Session,
    Members
} = models;

router.use(function (req, res, next) {
    try {
        Session
            .findOne({ where: { session: req.cookies["app.sid"] } })
            .then((ret) => {
                if (ret) {
                    Session
                        .update({ dateUpdated: new Date() }, { where: { id: ret.toJSON().id } })
                        .then((updateRes) => {
                            req.userDetails = ret.toJSON();
                            req.userDetails.userType = JSON.parse(ret.toJSON().data).userType;
                            next();
                        })
                } else {
                    res.redirect('/auth');
                }
            })
    } catch (err) {
        console.error(err)
    }
});

router.use(function (req, res, next) {
    if (req.userDetails.userType === "External") {
        try {
            Members
                .findAll({ where: { userTypeLinkId: req.userDetails.usersId, linkType: "project" } })
                .then((ret) => {
                    if (ret.length > 0) {
                        req.memberDetails = ret
                        next()
                    } else {
                        res.render('index', {
                            title: global.site_name,
                            page: 'noProjectAvailable',
                            body: "./template/index",
                            user: JSON.stringify(req.userDetails.data)
                        });
                    }
                })
        } catch (err) {
            console.error(err)
        }
    } else {
        next()
    }
})

router.get('/account', function (req, res, next) {
    res.render('index', {
        title: global.site_name,
        page: 'account',
        body: "./template/index",
        user: JSON.stringify(req.userDetails.data)
    });
});

module.exports = router;
