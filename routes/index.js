var express = require('express');
var sess = require('express-session');
var jwt = require('jsonwebtoken');
var router = express();

router.use(function (req, res, next) {
    let session = global.initModel("session");
    session.getData("session",{session:req.cookies["app.sid"]},{},(ret)=>{
        if(ret.status && ret.data.length > 0){
            session.putData("session",{date_updated:new Date()},{id:ret.data[0].id},()=>{
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
        body: "./template/index"
    });
});

router.get('/users', function (req, res, next) {
    res.render('index', {
        title: global.site_name + " - Users",
        body: './template/index',
        page: 'users'
    });
});

router.get('/company', function (req, res, next) {
    res.render('index', {
        title: global.site_name + " - Company",
        body: './template/index',
        page: 'company'
    });
});

router.get('/position', function (req, res, next) {
    res.render('index', {
        title: global.site_name + " - Position",
        body: './template/index',
        page: 'position'
    });
});

router.get('/branch', function (req, res, next) {
    res.render('index', {
        title: global.site_name + " - Branch",
        body: './template/index',
        page: 'branch'
    });
});

router.get('/learningGroups', function (req, res, next) {
    res.render('index', {
        title: global.site_name + " - Learning Groups",
        body: './template/index',
        page: 'learningGroups'
    });
});

router.get('/trainingModules', function (req, res, next) {
    res.render('index', {
        title: global.site_name + " - Training Modules",
        body: './template/index',
        page: 'trainingModules'
    });
});

router.get('/assignment', function (req, res, next) {
    res.render('index', {
        title: global.site_name + " - Assignments",
        body: './template/index',
        page: 'assignment'
    });
});

router.get('/learningJourney', function (req, res, next) {
    res.render('index', {
        title: global.site_name + " - Program",
        body: './template/index',
        page: 'learningJourney'
    });
});

router.get('/trainingEvent', function (req, res, next) {
    res.render('index', {
        title: global.site_name + " - Training Event",
        body: './template/index',
        page: 'trainingEvent'
    });
});

router.get('/trainingEventCompletion', function (req, res, next) {
    res.render('index', {
        title: global.site_name + " - Training Event Completion",
        body: './template/index',
        page: 'trainingEventCompletion'
    });
});

module.exports = router;
