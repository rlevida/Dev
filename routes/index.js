var express = require('express');
var sess = require('express-session');
var jwt = require('jsonwebtoken');
var router = express();

router.use(function (req, res, next) {
    let session = global.initModel("session");
    session.getData("session",{session:req.cookies["app.sid"]},{},(ret)=>{
        if(ret.status && ret.data.length > 0){
            session.putData("session",{dateUpdated:new Date()},{id:ret.data[0].id},()=>{
                next();
            })
        } else {
            res.redirect('/auth');
        }
    })
});

router.get('/', function (req, res, next) {
    res.render('index', {
        title: global.site_name,
        page: 'index',
        subpage: '',
        body: "./template/index"
    });
});

router.get('/users', function (req, res, next) {
    res.render('index', {
        title: global.site_name + " - Users",
        body: './template/index',
        subpage: '',
        page: 'users'
    });
});

router.get('/company', function (req, res, next) {
    res.render('index', {
        title: global.site_name + " - Company",
        body: './template/index',
        subpage: '',
        page: 'company'
    });
});

router.get('/teams', function (req, res, next) {
    res.render('index', {
        title: global.site_name + " - Teams",
        body: './template/index',
        subpage: '',
        page: 'teams'
    });
});

router.get('/mytask', function (req, res, next) {
    res.render('index', {
        title: global.site_name + " - Teams",
        body: './template/index',
        subpage: '',
        page: 'mytask'
    });
});

router.get('/wikis', function (req, res, next) {
    res.render('index', {
        title: global.site_name + " - Wikis",
        body: './template/index',
        subpage: '',
        page: 'wikis'
    });
});

router.get('/reports', function (req, res, next) {
    res.render('index', {
        title: global.site_name + " - Reports",
        body: './template/index',
        subpage: '',
        page: 'reports'
    });
});

module.exports = router;
