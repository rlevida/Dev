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

router.use(function (req,res,next){
    if(req.userDetails.users_userType == "External"){
        let members = global.initModel("members")
            members.getData("members", { userTypeLinkId : req.userDetails.usersId , linkType : "project" }, {}, (c) => {
                if (c.status) {
                    if(c.data.length){
                        req.memberDetails = c.data
                        next()
                    }else{
                        res.render('index', {
                            title: global.site_name,
                            page: 'noProjectAvailable',
                            body: "./template/index"
                        });
                    }
                } else {
                    if (c.error) { socket.emit("RETURN_ERROR_MESSAGE", { message: c.error.sqlMessage }) }
                }
            })
    }else{
        next()
    }
})

router.get('/', function (req, res, next) {
    if(req.userDetails.users_userType != "External"){
        res.render('index', {
            title: global.site_name,
            page: 'index',
            body: "./template/index",
            user: JSON.stringify(req.userDetails.data)
        });
    }else{
        if(req.memberDetails.length > 1){
            res.redirect(`/project/`)
        }else{
            res.redirect(`/project/${req.memberDetails[0].linkId}`)
        }
    }
});


router.get('/users', function (req, res, next) {
    let func = global.initFunc();
    
    func.getUserRoles({ id:req.userDetails.usersId }, resp =>{
        if(resp.userRole != "4" && resp.userRole != "5" && resp.userRole != "6" ){
            res.render('index', {
                title: global.site_name + " - Users",
                body: './template/index',
                page: 'users',
                user: JSON.stringify(req.userDetails.data)
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
        page: 'company',
        user: JSON.stringify(req.userDetails.data)
    });
});

router.get('/mytask', function (req, res, next) {
    res.render('index', {
        title: global.site_name + " - Teams",
        body: './template/index',
        page: 'mytask',
        user: JSON.stringify(req.userDetails.data)
    });
});

router.get('/wikis', function (req, res, next) {
    res.render('index', {
        title: global.site_name + " - Wikis",
        body: './template/index',
        page: 'wikis',
        user: JSON.stringify(req.userDetails.data)
    });
});

router.get('/reports', function (req, res, next) {
    res.render('index', {
        title: global.site_name + " - Reports",
        body: './template/index',
        page: 'reports',
        user: JSON.stringify(req.userDetails.data)
    });
});

router.get('/profile',function (req,res,next){
    res.render('index', {
        title: global.site_name + " - Profile",
        body: './template/index',
        page: 'profile',
        user: JSON.stringify(req.userDetails.data)
    });
})

router.get('/reminder',function(req,res,next){
    res.render('index',{
        title: global.site_name + ' - Reminder',
        body: './template/index',
        page: 'reminder',
        user: JSON.stringify(req.userDetails.data)
    })
})

router.get('/task/:id',function(req,res,next){
    let func = global.initFunc();
    func.getTaskProjectId({id : req.params.id},(c)=>{
        res.render('index',{
            title: global.site_name + '- Task',
            body: './template/index',
            page: 'selectedTask',
            task: req.params.id,
            project: c.data.project,
            workstream: c.data.workstream,
            user: JSON.stringify(req.userDetails.data)
        })
    })
})

router.get('/project/task/:id',function(req,res,next){
    let func = global.initFunc();
    func.getTaskProjectId({id : req.params.id},(c)=>{
        res.render('index',{
            title: global.site_name + '- Task',
            body: './template/index',
            page: 'selectedTask',
            task: req.params.id,
            project: c.data.project,
            workstream: c.data.workstream,
            subpage: 'task',
            user: JSON.stringify(req.userDetails.data)
        })
    })
})
module.exports = router;
