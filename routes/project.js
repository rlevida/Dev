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
    if(req.userDetails.users_userType != "External"){
        res.render('project', {
            title: global.site_name,
            page: 'project',
            subpage: '',
            project: "",
            body: "./template/index",
            user: JSON.stringify(req.userDetails.data)
        });
    }else{
        let members = global.initModel("members")
            members.getData("members", { userTypeLinkId : req.userDetails.usersId , linkType : "project" }, {}, (c) => {
                if (c.status) {
                    if(c.data.length){
                        if(c.data.length > 1){
                            res.render('project', {
                                title: global.site_name,
                                page: 'project',
                                subpage: '',
                                project: "",
                                body: "./template/index",
                                user: JSON.stringify(req.userDetails.data)
                            });
                        }else{
                            res.redirect(`/project/${c.data[0].linkId}`);
                        }
                    }
                } else {
                    if (c.error) { socket.emit("RETURN_ERROR_MESSAGE", { message: c.error.sqlMessage }) }
                }
            })
    }
});

router.get('/:project', function (req, res, next) {
   
    if(typeof req.params != "undefined" && typeof req.params.project != "undefined"){
        let func = global.initFunc();
            func.getUserAllowedAccess({ userId: req.userDetails.usersId , params:req.params.project },resp=>{
                if(resp.status){
                    res.render('project', {
                        title: global.site_name,
                        page: 'project',
                        subpage: 'home',
                        body: "./template/index",
                        project: req.params.project,
                        user: JSON.stringify(req.userDetails.data)
                    });
                }else{
                    res.render('index', {
                        title: global.site_name + " - pageNotAvailable",
                        body: './template/index',
                        page: 'pageNotAvailable',
                        user: JSON.stringify(req.userDetails.data)
                    });
                }
            })
    }
});

router.get('/documents/:project', function (req, res, next) {

    if(typeof req.params != "undefined" && typeof req.params.project != "undefined"){
        let func = global.initFunc();
            func.getUserAllowedAccess({ userId: req.userDetails.usersId , params:req.params.project },resp=>{
                if(resp.status){
                    res.render('project', {
                        title: global.site_name,
                        page: 'project',
                        subpage: 'documents',
                        body: "./template/index",
                        project: req.params.project,
                        folder: req.query.folder,
                        folderType: req.query.type,
                        user: JSON.stringify(req.userDetails.data)
                    });
                }else{
                    res.render('index', {
                        title: global.site_name + " - pageNotAvailable",
                        body: './template/index',
                        page: 'pageNotAvailable',
                        user: JSON.stringify(req.userDetails.data)
                    });
                }
            })
    }
});

router.get('/trash/:project', function (req, res, next) {

    if(typeof req.params != "undefined" && typeof req.params.project != "undefined"){
        let func = global.initFunc();
            func.getUserAllowedAccess({ userId: req.userDetails.usersId , params:req.params.project },resp=>{
                if(resp.status){
                    res.render('project', {
                        title: global.site_name + " - Trash",
                        body: './template/index',
                        page: 'project',
                        subpage: 'trash',
                        project: req.params.project,
                        user: JSON.stringify(req.userDetails.data)
                    });
                }else{
                    res.render('index', {
                        title: global.site_name + " - pageNotAvailable",
                        body: './template/index',
                        page: 'pageNotAvailable',
                        user: JSON.stringify(req.userDetails.data)
                    });
                }
            })  
    }
});

// router.get('/processes/:project', function (req, res, next) {
    
//     if(typeof req.params != "undefined" && typeof req.params.project != "undefined"){
//         let func = global.initFunc();
//             func.getUserAllowedAccess({ userId: req.userDetails.usersId , params:req.params.project },resp=>{
//                 if(resp.status){
//                     res.render('project', {
//                         title: global.site_name + " - Processes",
//                         body: './template/index',
//                         page: 'project',
//                         subpage: 'processes',
//                         project: req.params.project
//                     });
//                 }else{
//                     res.render('index', {
//                         title: global.site_name + " - pageNotAvailable",
//                         body: './template/index',
//                         page: 'pageNotAvailable'
//                     });
//                 }
//             })  
//     }
// });


router.get('/:project/workstream', function (req, res, next) {
    
    if(typeof req.params != "undefined" && typeof req.params.project != "undefined"){
        let func = global.initFunc();
            func.getUserAllowedAccess({ userId: req.userDetails.usersId , params:req.params.project },resp=>{
                if(resp.status){
                    res.render('project', {
                        title: global.site_name + " - Workstream",
                        body: './template/index',
                        page: 'project',
                        subpage: 'workstream',
                        project: req.params.project,
                        user: JSON.stringify(req.userDetails.data)
                    });
                }else{
                    res.render('index', {
                        title: global.site_name + " - pageNotAvailable",
                        body: './template/index',
                        page: 'pageNotAvailable',
                        user: JSON.stringify(req.userDetails.data)
                    });
                }
            })  
    }
});


router.get('/:project/workstream/:workstream', function (req, res, next) {
    if(typeof req.params != "undefined" && typeof req.params.project != "undefined"){
        let task = (typeof req.query.task != "undefined" ? req.query.task : undefined )
        let func = global.initFunc();
            func.getUserAllowedAccess({ userId: req.userDetails.usersId , params:req.params.project },resp=>{
                if(resp.status){
                    res.render('project', {
                        title: global.site_name + " - Workstream",
                        body: './template/index',
                        page: 'project',
                        subpage: 'workstream',
                        project: req.params.project,
                        workstream : req.params.workstream,
                        task : task,
                        user: JSON.stringify(req.userDetails.data)
                    });
                }else{
                    res.render('index', {
                        title: global.site_name + " - pageNotAvailable",
                        body: './template/index',
                        page: 'pageNotAvailable',
                        user: JSON.stringify(req.userDetails.data)
                    });
                }
            })  
    }
});

router.get('/:project/task', function (req, res, next) {
    if(typeof req.params != "undefined" && typeof req.params.project != "undefined"){
        let func = global.initFunc();
            func.getUserAllowedAccess({ userId: req.userDetails.usersId , params:req.params.project },resp=>{
                if(resp.status){
                    res.render('project', {
                        title: global.site_name + " - Tasks",
                        body: './template/index',
                        page: 'project',
                        subpage: 'task',
                        project: req.params.project,
                        user: JSON.stringify(req.userDetails.data)
                    });
                }else{
                    res.render('index', {
                        title: global.site_name + " - pageNotAvailable",
                        body: './template/index',
                        page: 'pageNotAvailable',
                        user: JSON.stringify(req.userDetails.data)
                    });
                }
            })  
    }
});

router.get('/conversations/:project', function (req, res, next) {

    if(typeof req.params != "undefined" && typeof req.params.project != "undefined"){
        let func = global.initFunc();
        func.getUserAllowedAccess({ userId: req.userDetails.usersId , params:req.params.project },resp=>{
            if(resp.status){
                res.render('project', {
                    title: global.site_name + " - Conversations",
                    body: './template/index',
                    page: 'project',
                    subpage: 'conversations',
                    project: req.params.project,
                    user: JSON.stringify(req.userDetails.data)
                });
            }else{
                res.render('index', {
                    title: global.site_name + " - pageNotAvailable",
                    body: './template/index',
                    page: 'pageNotAvailable',
                    user: JSON.stringify(req.userDetails.data)
                });
            }
        })   
    }
});

module.exports = router;
