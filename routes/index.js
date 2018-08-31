var express = require('express');
var sess = require('express-session');
var jwt = require('jsonwebtoken');
var router = express();

router.use(function (req, res, next) {
    let session = global.initModel("session");
    session.getData("session",{session:req.cookies["app.sid"]},{},(ret)=>{
        if(ret.status && ret.data.length > 0){
            session.putData("session",{dateUpdated:new Date()},{id:ret.data[0].id},()=>{
                req.userDetails = ret.data[0];
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
    let func = global.initFunc();
    
    func.getUserRoles({ id:req.userDetails.usersId }, resp =>{
        if(resp.userRole != "4" && resp.userRole != "5" && resp.userRole != "6" ){
            res.render('index', {
                title: global.site_name + " - Users",
                body: './template/index',
                page: 'users'
            });
        }else{
            res.render('index', {
                title: global.site_name + " - error",
                body: './template/index',
                page: 'pageNotAvailable'
            });
        }
    })
});

router.get('/company', function (req, res, next) {
    res.render('index', {
        title: global.site_name + " - Company",
        body: './template/index',
        page: 'company'
    });
});

router.get('/mytask', function (req, res, next) {
    res.render('index', {
        title: global.site_name + " - Teams",
        body: './template/index',
        page: 'mytask'
    });
});

router.get('/wikis', function (req, res, next) {
    res.render('index', {
        title: global.site_name + " - Wikis",
        body: './template/index',
        page: 'wikis'
    });
});

router.get('/reports', function (req, res, next) {
    res.render('index', {
        title: global.site_name + " - Reports",
        body: './template/index',
        page: 'reports'
    });
});

router.get('/profile',function (req,res,next){
    res.render('index', {
        title: global.site_name + " - Profile",
        body: './template/index',
        page: 'profile'
    });
})

router.get('/reminder',function(req,res,next){
    res.render('index',{
        title: global.site_name + ' - Reminder',
        body: './template/index',
        page: 'reminder'
    })
})
module.exports = router;
