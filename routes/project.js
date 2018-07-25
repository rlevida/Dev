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
    res.render('project', {
        title: global.site_name,
        page: 'project',
        subpage: '',
        project: "",
        body: "./template/index"
    });
});

router.get('/:project', function (req, res, next) {

    if(typeof req.params != "undefined" && typeof req.params.project != "undefined"){
        res.render('project', {
            title: global.site_name,
            page: 'project',
            subpage: 'home',
            body: "./template/index",
            project: req.params.project
        });
    }

    
});

router.get('/documents/:project', function (req, res, next) {

    if(typeof req.params != "undefined" && typeof req.params.project != "undefined"){
        res.render('project', {
            title: global.site_name,
            page: 'project',
            subpage: 'documents',
            body: "./template/index",
            project: req.params.project
        });
    }
});

router.get('/trash/:project', function (req, res, next) {

    if(typeof req.params != "undefined" && typeof req.params.project != "undefined"){
        res.render('project', {
            title: global.site_name + " - Trash",
            body: './template/index',
            page: 'project',
            subpage: 'trash',
            project: req.params.project
        });
    }
});

router.get('/processes/:project', function (req, res, next) {

    if(typeof req.params != "undefined" && typeof req.params.project != "undefined"){
        res.render('project', {
            title: global.site_name + " - Processes",
            body: './template/index',
            page: 'project',
            subpage: 'processes',
            project: req.params.project
        });
    }
});

router.get('/tasks/:project', function (req, res, next) {

    if(typeof req.params != "undefined" && typeof req.params.project != "undefined"){
        res.render('project', {
            title: global.site_name + " - Tasks",
            body: './template/index',
            page: 'project',
            subpage: 'task',
            project: req.params.project
        });
    }
});

router.get('/conversations/:project', function (req, res, next) {

    if(typeof req.params != "undefined" && typeof req.params.project != "undefined"){
        res.render('project', {
            title: global.site_name + " - Conversations",
            body: './template/index',
            page: 'project',
            subpage: 'conversations',
            project: req.params.project
        });
    }
});

module.exports = router;
