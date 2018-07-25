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
        page: 'project',
        subpage: 'documents',
        body: "./template/index"
    });
});

router.get('/trash', function (req, res, next) {
    res.render('index', {
        title: global.site_name + " - Trash",
        body: './template/index',
        page: 'project',
        subpage: 'trash',
    });
});

router.get('/processes', function (req, res, next) {
    res.render('index', {
        title: global.site_name + " - Processes",
        body: './template/index',
        page: 'project',
        subpage: 'processes',
    });
});

router.get('/tasks', function (req, res, next) {
    res.render('index', {
        title: global.site_name + " - Tasks",
        body: './template/index',
        page: 'project',
        subpage: 'task',
    });
});

router.get('/conversations', function (req, res, next) {
    res.render('index', {
        title: global.site_name + " - Conversations",
        body: './template/index',
        page: 'project',
        subpage: 'conversations',
    });
});

module.exports = router;
