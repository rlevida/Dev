var express = require('express');
var sess = require('express-session');
var jwt = require('jsonwebtoken');
var router = express();
var mime = require('mime-types')
var toPdf = require("office-to-pdf")
    async = require("async"),
    _ = require("lodash");

/**
 * Middleware
 * 
 */
router.use(function (req, res, next) {
    let session = global.initModel("session");
    let token = (req.body.Token)
                ?req.body.Token
                :(req.params.Token)
                ?req.params.Token
                :(req.query.Token)
                ?req.query.Token
                :(req.cookies["app.sid"])
                ?req.cookies["app.sid"]
                :"";
    
    session.getData("session",{session:token},{},(ret)=>{
        if(ret.status && ret.data.length > 0){
            req.query.auth = {};
            req.query.auth.yourToken = token;
            req.query.auth.userId = ret.data[0].userId;
            req.query.auth.LastLoggedIn = ret.data[0].date_updated;
            session.putData("session",{date_updated:new Date()},{id:ret.data[0].id},()=>{
                next()
            })
        } else {
            res.status(401).send({error:"Unauthorized",error_description:"Unauthorized Access"})
        }
    })
});

/**
 * GET
 * 
 */
router.get('/:controller',(req,res,next)=>{
    if(!req.params.controller){
        res.status(400).send("Page Not found.")
        return;
    }
    try {
        let controller = global.initController(req.params.controller);
        controller.get.index(req,(c)=>{
            if(c.status){
                res.send(c.data)
            }else{
                res.status(400).send({message:c.error});
            }
        }) 
    } catch (err){
        res.status(400).send({error:"Not Found!"})
    }
})

router.get('/:controller/detail/:id',(req,res,next)=>{
    if(!req.params.controller ){
        res.status(400).send("Page Not found.")
        return;
    }
    if(!req.params.id){
        res.status(400).send("Id is requird.")
        return;
    }
    try {
        let controller = global.initController(req.params.controller);
        controller.get.getById(req,(c)=>{
            if(c.status){
                res.send(c.data)
            } else {
                res.status(400).send({message:c.error});
            }
        }) 
    } catch (err){
        res.status(400).send({error:"Not Found!"})
    }
})

router.get('/:controller/:action',(req,res,next)=>{
    if(!req.params.controller || !req.params.action ){
        res.status(400).send("Page Not found.")
        return;
    }
    try {
        let controller = global.initController(req.params.controller);
        controller.get[req.params.action](req,(c)=>{
            if(c.status){
                res.send(c.data)
            }else{
                res.status(400).send({message:c.error});
            }
        }) 
    } catch (err){
        res.status(400).send({error:"Not Found!"})
    }
})

router.post('/:controller',(req,res,next)=>{
    if(!req.params.controller ){
        res.status(400).send("Page Not found.")
        return;
    }
    try {
        let controller = global.initController(req.params.controller);
        controller.post.index(req,(c)=>{
            if(c.status){
                res.send(c.data)
            }else{
                res.status(400).send({message:c.error});
            }
        }) 
    } catch (err){
        res.status(400).send({error:"Not Found!"})
    }
})

router.post('/:controller/:action',(req,res,next)=>{
    if(!req.params.controller || !req.params.action ){
        res.status(400).send("Page Not found.")
        return;
    }
    try {
        let controller = global.initController(req.params.controller);
        controller.post[req.params.action](req,(c)=>{
            if(c.status){
                res.send(c.data)
            }else{
                res.status(400).send({message:c.error});
            }
        })
    } catch (err){
        res.status(400).send({error:"Not Found!"})
    }
})

router.put('/:controller/:id',(req,res,next)=>{
    if(!req.params.controller ){
        res.status(400).send("Page Not found.")
        return;
    }
    if(!req.params.id){
        res.status(400).send("Id is requird.")
        return;
    }
    try {
        let controller = global.initController(req.params.controller);
        controller.put.index(req,(c)=>{
            if(c.status){
                res.send(c.data)
            }else{
                res.status(400).send({message:c.error});
            }
        }) 
    } catch (err){
        res.status(400).send({error:"Not Found!"})
    }
})

router.put('/:controller/:action/:id',(req,res,next)=>{
    if(!req.params.controller || !req.params.action ){
        res.status(400).send("Page Not found.")
        return;
    }
    if(!req.params.id){
        res.status(400).send("Id is requird.")
        return;
    }
    try {
        let controller = global.initController(req.params.controller);
        controller.put[req.params.action](req,(c)=>{
            if(c.status){
                res.send(c.data)
            }else{
                res.status(400).send({message:c.error});
            }
        }) 
    } catch (err){
        res.status(400).send({error:"Not Found!"})
    }
})

router.delete('/:controller/:id',(req,res,next)=>{
    if(!req.params.controller ){
        res.status(400).send("Page Not found.")
        return;
    }
    if(!req.params.id){
        res.status(400).send("Id is requird.")
        return;
    }
    try {
        let controller = global.initController(req.params.controller);
        controller.delete.index(req,(c)=>{
            if(c.status){
                res.send(c.data)
            } else {
                res.status(400).send({message:c.error});
            }
        }) 
    } catch (err){
        res.status(400).send({error:"Not Found!"})
    }
})

router.delete('/:controller/:action/:id',(req,res,next)=>{
    if(!req.params.controller || !req.params.action ){
        res.status(400).send("Page Not found.")
        return;
    }
    if(!req.params.id){
        res.status(400).send("Id is requird.")
        return;
    }
    try {
        let controller = global.initController(req.params.controller);
        controller.delete[req.params.action](req,(c)=>{
            if(c.status){
                res.send(c.data)
            }else{
                res.status(400).send({message:c.error});
            }
        }) 
    } catch (err){
        res.status(400).send({error:"Not Found!"})
    }
})

module.exports = router;





// router.get('/taskChecklist',(req,res,next)=>{
//     let taskCheckList = global.initModel("task_checklist")
//     let filter = (typeof d.filter != "undefined")?JSON.parse(d.filter):{};
//     let taskCheckListType = global.initModel("checklist_type");

//     taskCheckList.getData("task_checklist", filter, {}, (c) => {
//         if (c.status) {
//             async.map(c.data, (o, mapCallback) => {
//                 taskCheckListType.getData("checklist_type", { checklistId: o.id }, {}, (res) => {
//                     mapCallback(null, { ...o, types: (res.data).map((o) => { return { value: o.type, name: o.type } }) });
//                 })
//             }, (err, o) => {
//                 res.send(o)
//             })
//         } else {
//             if(c.error) { res.status(400).send({message:c.error.sqlMessage}); return; }

//             res.send([])
//         }
//     })
// })

// router.get('/company',(req,res,next)=>{
//     let model = global.initModel("company")
//     let d = req.query
//     let filter = (typeof d.filter != "undefined")?JSON.parse(d.filter):{};
//     model.getData("company",filter,{},(c)=>{
//         if(c.status) {
//             res.send(c.data)
//         } else {
//             if(c.error) { res.status(400).send({message:c.error.sqlMessage}); return; }

//             res.send([])
//         }
//     })
// })

// router.get('/conversation',(req,res,next)=>{
//     let model = global.initModel("conversation")
//     let d = req.query
//     let filter = (typeof d.filter != "undefined")?JSON.parse(d.filter):{};
//     model.getData("conversation",filter,{},(c)=>{
//         if(c.status) {
//             res.send(c.data)
//         } else {
//             if(c.error) { res.status(400).send({message:c.error.sqlMessage}); return; }

//             res.send([])
//         }
//     })
// })

// router.get('/document',(req,res,next)=>{
//     let documentLink = global.initModel("document_link")
//     let filter = (typeof d.filter != "undefined") ? d.filter : {};
    
//     documentLink.getData("document_link", filter ,{},(c)=>{
//         if(c.status) {
//             if(c.data.length > 0){
//                 if(filter.linkType == "project"){
//                     let docLinkId = [];
//                         c.data.map( link => {
//                             docLinkId.push(link.documentId)
//                         })

//                     let document = global.initModel("document");
//                     document.getProjectDocument( filter, docLinkId , ( doc )=>{
//                         if(doc.status){
//                             res.send(doc.data)
//                         }
//                     })
//                 }

//                 if(filter.linkType == "workstream" || d.type == "workstream"){
//                     let tag = global.initModel("tag")
//                         tag.getData("tag",d.filter,{},(tagRes)=>{
//                             let tagId = []
//                             if(tagRes.status){
//                                 tagRes.data.map(tag =>{
//                                     tagId.push(tag.tagTypeId)
//                                 })
//                                 if(tagId.length){
//                                     let document = global.initModel("document");
//                                     document.getProjectDocument( filter, tagId , ( doc )=>{
//                                         if(doc.status){
//                                             res.send(doc.data)
//                                         }
//                                     })
//                                 }else{
//                                         res.send([])
//                                 }
//                             }
//                     })
//                 }
//             }else{
//                 res.send(c.data)
//             }
                    
//         }else{
//             if(c.error) { res.status(400).send({message:c.error.sqlMessage}); return; }
//         }

//     })
// })

// router.get('/folder',(req,res,next)=>{
//     let model = global.initModel("folder")
//     let d = req.query
//     let filter = (typeof d.filter != "undefined")?JSON.parse(d.filter):{};
//     model.getData("folder",filter,{},(c)=>{
//         if(c.status) {
//             res.send(c.data)
//         } else {
//             if(c.error) { res.status(400).send({message:c.error.sqlMessage}); return; }

//             res.send([])
//         }
//     })
// })

// router.get('/members',(req,res,next)=>{
//     let model = global.initModel("members")
//     let d = req.query
//     let filter = (typeof d.filter != "undefined")?JSON.parse(d.filter):{};
//     model.getData("members",filter,{},(c)=>{
//         if(c.status) {
//             res.send(c.data)
//         } else {
//             if(c.error) { res.status(400).send({message:c.error.sqlMessage}); return; }

//             res.send([])
//         }
//     })
// })

// router.get('/project',(req,res,next)=>{
//     let model = global.initModel("project")
//     let d = req.query
//     let filter = (typeof d.filter != "undefined")?JSON.parse(d.filter):{};
//     model.getProjectList("project", filter, {}, (c) => {
//         if (c.status) {
//             res.send(c.data)
//         } else {
//             if(c.error) { res.status(400).send({message:c.error.sqlMessage}); return; }
        
//             res.send([])
//         }
//     })
// })

// router.get('/reminder',(req,res,next)=>{
//     let model = global.initModel("reminder")
//     let d = req.query
//     let filter = (typeof d.filter != "undefined")?JSON.parse(d.filter):{};
//         model.getReminderList(filter, (c) => {
//             if (c.status) {
//                 res.send(c.data)
//             } else {
//                 if(c.error) { res.status(400).send({message:c.error.sqlMessage}); return; }

//                 res.send([])
//             }
//         })
// })

// router.get('/role',(req,res,next)=>{
//     let model = global.initModel("role")
//     let d = req.query
//     let filter = (typeof d.filter != "undefined")?JSON.parse(d.filter):{};
//         model.getData("role",filter,{},(c)=>{
//             if (c.status) {
//                 res.send(c.data)
//             } else {
//                 if(c.error) { res.status(400).send({message:c.error.sqlMessage}); return; }

//                 res.send([])
//             }
//         })
// })

// router.get('/starred',(req,res,next)=>{
//     let model = global.initModel("starred")
//     let d = req.query
//     let filter = (typeof d.filter != "undefined")?JSON.parse(d.filter):{};
//         model.getData("starred",filter,{},(c)=>{
//             if (c.status) {
//                 res.send(c.data)
//             } else {
//                 if(c.error) { res.status(400).send({message:c.error.sqlMessage}); return; }

//                 res.send([])
//             }
//         })
// })

// router.get('/status',(req,res,next)=>{
//     let model = global.initModel("status")
//     let d = req.query
//     let filter = (typeof d.filter != "undefined")?JSON.parse(d.filter):{};
//         model.getData("status",filter,{},(c)=>{
//             if (c.status) {
//                 res.send(c.data)
//             } else {
//                 if(c.error) { res.status(400).send({message:c.error.sqlMessage}); return; }

//                 res.send([])
//             }
//         })
// })

// router.get('/team',(req,res,next)=>{
//     let team = global.initModel("team");
//     let usersTeam = global.initModel("users_team");
//     let d = req.query
//     let filter = (typeof d.filter != "undefined")?JSON.parse(d.filter):{};
        
//     team.getData("team", filter, {}, (c) => {
//         if (c.status) {
//             async.map(c.data, (team, mapCallback) => {
//                 usersTeam.getData("users_team", { teamId: team.id }, {}, (c) => {
//                     mapCallback(null, team)
//                 });
//             }, function (err, teamResults) {
//                 res.send(teamResults)
//             });
//         } else {
//             if(c.error) { res.status(400).send({message:c.error.sqlMessage}); return; }

//             res.send([])
//         }
//     })
// })

// router.get('/type',(req,res,next)=>{
//     let model = global.initModel("type")
//     let d = req.query
//     let filter = (typeof d.filter != "undefined")?JSON.parse(d.filter):{};
//     model.getData("type",filter,{},(c)=>{
//         if (c.status) {
//             res.send(c.data)
//         } else {
//             if(c.error) { res.status(400).send({message:c.error.sqlMessage}); return; }

//             res.send([])
//         }
//     })
// })

// router.get('/users',(req,res,next)=>{
//     let users = global.initModel("users")
//     let filter = (typeof d.filter != "undefined") ? d.filter : {};
//     let usersRole = global.initModel("users_role");
//     let usersTeam = global.initModel("users_team")
//     let members = global.initModel("members")

//     users.getData("users", filter, {}, (c) => {
//         if (c.status) {
//             async.map(c.data, (user, mapCallback) => {
//                 async.parallel({
//                     role: function (parallelCallback) {
//                         usersRole.getData("users_role", { usersId: user.id }, {}, (role) => {
//                             parallelCallback(null, role.data)
//                         });
//                     },
//                     team: function (parallelCallback) {
//                         usersTeam.getData("users_team", { usersId: user.id }, {}, (team) => {
//                             parallelCallback(null, team.data)
//                         });
//                     }
//                 }, function (err, { role, team }) {
//                     let memberList = [user.id];
//                     let getMember = _.map(team, (o) => { return o.teamId });
//                     let allMember = memberList.concat(getMember);
//                     members.getProjectMember({ ids: allMember }, (result) => {
//                         mapCallback(null, { ...user, role, team, projects: result.data })

//                     })
//                 });
//             }, function (err, usersResult) {
//                 res.send(usersResult)
//             })
//         } else {
//             if(c.error) { res.status(400).send({message:c.error.sqlMessage}); return; }

//             res.send([])
//         }
//     })
// })

// router.get('/usersTeam',(req,res,next)=>{
//     let model = global.initModel("users_team")
//     let d = req.query
//     let filter = (typeof d.filter != "undefined")?JSON.parse(d.filter):{};
//     model.getData("users_team",filter,{},(c)=>{
//         if (c.status) {
//             res.send(c.data)
//         } else {
//             if(c.error) { res.status(400).send({message:c.error.sqlMessage}); return; }

//             res.send([])
//         }
//     })
// })

// router.get('/workstream',(req,res,next)=>{
//     let workstream = global.initModel("workstream")
//     let members = global.initModel("members")
//     let filter = (typeof d.filter != "undefined") ? d.filter : {};
    
//     workstream.getWorkstreamList("workstream", filter, {}, (c) => {
//         if (c.status) {
//             async.map(c.data, function (result, workstreamCallback) {
//                 members.countData("members", { linkId: result.id, linkType: 'workstream' }, 'member_count', (e) => {
//                     workstreamCallback(null, Object.assign({}, result, { member_count: e.data.member_count }))
//                 })
//             }, function (err, results) {
//                 res.send(results)
//             });
//         } else {
//             if(c.error) { res.status(400).send({message:c.error.sqlMessage}); return; }

//             res.send([])
//         }
//     })
// })

// router.get('/downloadFolder',(req,res,next)=>{
//     var fs = global.initRequire('fs'),
//         AWS = global.initAWS();

//     let fileList = JSON.parse(req.query.data)
//     let folderName = req.query.folderName
//     let tempFolderName = new Date().getTime()
//     let path = `${folderName}`
//     fs.mkdir(path,function(e){
      
//         let promise = new Promise(function(resolve,reject){
//             fileList.map( file =>{
//                 var s3 = new AWS.S3();
//                 let fileStream = fs.createWriteStream( `${path}/${file.origin}` ) ;
//                     s3.getObject({
//                         Bucket: global.AWSBucket,
//                         Key: global.environment + "/upload/" + file.name,
//                     }, (err,data) => {
//                         if(err){
//                             console.log("Error in Uploading to AWS. [" + err + "]");
//                         }else{
//                             fileStream.write(data.Body)
//                             resolve(folderName)
//                             fileStream.end()
//                         }
//                     });
//             })}
//         )
//         promise.then((data)=>{
//             var tar = require("tar")
//             var writeStream  = tar.c(
//                 {
//                     gzip: "gzip",
//                 },
//                 [`${folderName}`]
//             ).pipe(fs.createWriteStream(`${folderName}.tgz`))
//             writeStream.on('finish', () => {

//                 var deleteFolderRecursive = function(path) { // remove temp files
//                     if( fs.existsSync(path) ) {
//                         fs.readdirSync(path).forEach(function(file,index){
//                             var curPath = path + "/" + file;
//                             if(fs.lstatSync(curPath).isDirectory()) { // recurse
//                             deleteFolderRecursive(curPath);
//                             } else { // delete file
//                             fs.unlinkSync(curPath);
//                             }
//                         });
//                         fs.rmdirSync(path);
//                     }
//                   };
//                   deleteFolderRecursive(path)
                
//                 res.download(`${folderName}.tgz` , `${folderName}.tgz`,(c)=>{
//                     fs.unlink(`${folderName}.tgz`,(t)=>{
//                     })
//                 })
//             })
//         }).catch((err)=>{
//             console.log(`promise error `, err )
//         })
//     })
// })

// router.get('/printDocument',(req,res,next)=>{
//     let fileName = req.query.fileName
//     let originName = req.query.fileOrigin
//     let fs = global.initRequire('fs'), AWS = global.initAWS();
//     let fileStream = fs.createWriteStream( `${originName}` ) ;
//     let s3 = new AWS.S3();

//     let promise = new Promise(function(resolve,reject){
//         s3.getObject({
//             Bucket: global.AWSBucket,
//             Key: global.environment + "/upload/" + fileName,
//         }, (err,data) => {
//             if(err){
//                 console.log("Error in Uploading to AWS. [" + err + "]");
//             }else{
//                 fileStream.write(data.Body)
//                 resolve(originName)
//                 fileStream.end()

//             }
//         });
//     })
    
//     promise.then((data)=>{
//         var wordBuffer = fs.readFileSync(`${__dirname}/../${data}`)
//         toPdf(wordBuffer).then(
//             (pdfBuffer) => {
//                 let pdfdata = new Promise(function(resolve,reject){
//                     let convertedData = fs.writeFileSync(`./${data}.pdf`, pdfBuffer)
//                         resolve(convertedData)
//                 })

//                 pdfdata.then((newpdf)=>{
//                     let file = fs.readFileSync(`${__dirname}/../${data}.pdf`);
//                     let fileContentType = mime.contentType(`${data}.pdf`)
//                         res.contentType(fileContentType);
//                         fs.unlink(`${__dirname}/../${data}`,(t)=>{})
//                         fs.unlink(`./${data}.pdf`,(t)=>{})
//                         res.send(file);
//                 })
//           }, (err) => {
//             console.log(err)
//           }
//         )
//     })
// })

// /**
//  * GET /:id
//  * 
//  */
// router.get('/checklist/:id', function (req, res, next) {
//     if(!req.params.id){
//         res.send({success:false,message:"Id is requird."})
//         return;
//     }
//     let model = global.initModel("checklist")
//     model.getData("checklist",{id:req.params.id},{},(c)=>{
//         if(c.data.length > 0) {
//             res.send(c.data[0])
//         } else {
//             res.send({})
//         }
//     })
// });

// router.get('/company/:id', function (req, res, next) {
//     if(!req.params.id){
//         res.send({success:false,message:"Id is requird."})
//         return;
//     }
//     let model = global.initModel("company")
//     model.getData("company",{id:req.params.id},{},(c)=>{
//         if(c.data.length > 0) {
//             res.send(c.data[0])
//         } else {
//             res.send({})
//         }
//     })
// });

// router.get('/conversation/:id', function (req, res, next) {
//     if(!req.params.id){
//         res.send({success:false,message:"Id is requird."})
//         return;
//     }
//     let model = global.initModel("conversation")
//     model.getData("conversation",{id:req.params.id},{},(c)=>{
//         if(c.data.length > 0) {
//             res.send(c.data[0])
//         } else {
//             res.send({})
//         }
//     })
// });

// router.get('/document/:id', function (req, res, next) {
//     if(!req.params.id){
//         res.send({success:false,message:"Id is requird."})
//         return;
//     }
//     let model = global.initModel("document")
//     model.getData("document",{id:req.params.id},{},(c)=>{
//         if(c.data.length > 0) {
//             res.send(c.data[0])
//         } else {
//             res.send({})
//         }
//     })
// });

// router.get('/folder/:id', function (req, res, next) {
//     if(!req.params.id){
//         res.send({success:false,message:"Id is requird."})
//         return;
//     }
//     let model = global.initModel("folder")
//     model.getData("folder",{id:req.params.id},{},(c)=>{
//         if(c.data.length > 0) {
//             res.send(c.data[0])
//         } else {
//             res.send({})
//         }
//     })
// });

// router.get('/members/:id', function (req, res, next) {
//     if(!req.params.id){
//         res.send({success:false,message:"Id is requird."})
//         return;
//     }
//     let model = global.initModel("members")
//     model.getData("members",{id:req.params.id},{},(c)=>{
//         if(c.data.length > 0) {
//             res.send(c.data[0])
//         } else {
//             res.send({})
//         }
//     })
// });

// router.get('/project/:id', function (req, res, next) {
//     if(!req.params.id){
//         res.send({success:false,message:"Id is requird."})
//         return;
//     }
//     let model = global.initModel("project")
//     model.getData("project",{id:req.params.id},{},(c)=>{
//         if(c.data.length > 0) {
//             res.send(c.data[0])
//         } else {
//             res.send({})
//         }
//     })
// });

// router.get('/project/:id', function (req, res, next) {
//     if(!req.params.id){
//         res.send({success:false,message:"Id is requird."})
//         return;
//     }
//     let model = global.initModel("project")
//     model.getData("project",{id:req.params.id},{},(c)=>{
//         if(c.data.length > 0) {
//             res.send(c.data[0])
//         } else {
//             res.send({})
//         }
//     })
// });


// /**
//  * POST
//  * 
//  */
// router.post('/upload', (req, res, next) => {
//     var formidable = global.initRequire("formidable"),
//         modalFunc = global.initModelFunc(),
//         func = global.initFunc();

//         var form = new formidable.IncomingForm();
//         var filenameList = [];
//         var files = []
//         form.multiples = true;


//         let type = (typeof req.query.type != "undefined")?req.query.type:"others";
//         let uploadType = (typeof req.query.uploadType != "undefined")?req.query.uploadType:"";
//         let uploaded = false;
//         // every time a file has been uploaded successfully copy to AWS
        
//         files.push( new Promise((resolve,reject) =>{
//             form.on('file', function(field, file) {
//             var date = new Date();
//             var Id = func.generatePassword(date.getTime()+file.name,"attachment");
//             var filename = file.name + "_" + Id + "." + func.getFilePathExtension(file.name);
//             // var filename = file.name;
//             if(uploadType == "form"){
//                 filenameList.push({filename:filename,origin:file.name,Id:Id});
//             }else{
//                 filenameList.push(filename);
//             }
//                 func.uploadFile({file : file, form : type, filename : filename},response =>{
//                     if(response.Message == 'Success'){
//                         resolve(filenameList)
//                     }
//                 });
//             });
//         }))


//         Promise.all(files).then( e =>{
//             res.send({files : e[0], status : "end" });
//         })
//         // log any errors that occur
//         form.on('error', function(err) {
//             console.log('An error has occured: \n' + err);
//         });
//         // once all the files have been uploaded, send a response to the client
//         // form.on('end', function() {
//         //    res.send({files : filenameList, status : "end" });
//         // });
//         // parse the incoming request containing the form data
//         form.parse(req);
// })

// /**
//  * PUT
//  * 
//  */


// /**
//  * DELETE
//  * 
//  */
