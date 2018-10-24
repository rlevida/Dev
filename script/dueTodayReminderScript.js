var schedule = require('node-schedule'),
    sequence = require("sequence").Sequence,
    async = require("async"),
    moment = require("moment")
    _ = require("lodash");

const Sequelize = require("sequelize")
const Op = Sequelize.Op;
    
/**
 * 
 * Comment : Manage reminder for due today
 *   *    *    *    *    *    *
 *   s    i    H    DM    M   DW 
 * 
 **/
var j = schedule.scheduleJob('0 0 * * *', () => {
    const models = require('../modelORM');
    const {
        Tasks,
        Members,
        Users,
        Reminder,
        Workstream
    } = models;
    
    sequence.create().then((nextThen) => {
        Tasks
            .findAll({ 
                where : Sequelize.where(Sequelize.fn('date', Sequelize.col('dueDate')), '=', moment().format('YYYY-MM-DD 00:00:00')),
                include: [
                    {
                        model: Members,
                        as: 'assignee',
                        where: { linkType : 'task' , memberType: 'assignedTo' } , 
                        include : [{
                            model: Users,
                            as:'user',
                            attributes: ['id','firstName','lastName','emailAddress']
                        }],
                        required:false
                    },
                    {
                        model: Workstream,
                        as: 'workstream',
                        include: [{
                            model: Members,
                            as: 'responsible',
                            where: { linkType: 'workstream', memberType: 'responsible'},
                            include: [{
                                model: Users,
                                as:'user',
                                attributes: ['id','firstName','lastName','emailAddress']
                            }],
                            required:false
                        }],
                    },
                    {
                        model:Members,
                        as:'follower',
                        where: {linkType: 'task', memberType: 'Follower'},
                        required:false,
                        include: [{
                            model:Users,
                            as:'user',
                            attributes: ['id','firstName','lastName','emailAddress']
                        }]
                    }
                ],
                attributes: ['id','projectId','workstreamId','task']
            })
            .map((res) => {
                return {
                    id:res.id,
                    task: res.task,
                    projectId: res.projectId,
                    workstreamId: res.workstreamId,
                    responsible: res.workstream.responsible.map((e) => { return e.toJSON()}),
                    assignee: res.assignee.map((e) => { return e.toJSON()}),
                    follower: res.follower.map((e) => { return e.toJSON()})
                }
            })
            .then((res) => {
                nextThen(res)
            })
            .catch((err) => {
                console.log(err)
            })
        }).then((nextThen,result) => {
            async.parallel({
                remindTaskAssigned : (parallelCallback) => {
                    async.map( result , (e, mapCallback) => {
                        if(e.assignee.length > 0){
                            let dataToSubmit = { 
                                usersId: e.assignee[0].user.id,
                                projectId: e.projectId,
                                linkType: 'task',
                                type:"Task Due Today",
                                reminderDetail: "Task Due Today"
                            }

                            Reminder
                                .create(dataToSubmit)
                                .then((res) => {
                                    mapCallback(null,res)
                                })
                                .catch((err) => {
                                    console.log(err)
                                    mapCallback(null,"")
                                })
                        }else{
                            mapCallback(null,"")
                        }
                    }, (err, ret) => {
                        parallelCallback(null,"")
                    });
                },
                sendToEmail: (parallelCallback) => {
                    async.map( result , (e, mapCallback) => {
                        if(e.assignee.length > 0){
                            if(e.assignee[0].receiveNotification){
                                let mailOptions = {
                                    from: '"no-reply" <no-reply@c_cfo.com>', // sender address
                                    to: `${e.assignee[0].user.emailAddress}`, // list of receivers
                                    subject: '[CLOUD-CFO]', // Subject line
                                    text: 'Task Due Today', // plain text body
                                    html:`<p> Task Due Today as Assignee</p>
                                            <p>${e.task}</p>
                                            <a href="${ ( (process.env.NODE_ENV == "production") ? "https:" : "http:" )}${global.site_url}project/${e.projectId}/workstream/${e.workstreamId}?task=${e.id}">Click here</a>
                                            `
                                }
                                global.emailtransport(mailOptions)
                                mapCallback(null)
                            }else{
                                mapCallback(null)
                            }
                        }else{
                            mapCallback(null)
                        }
                    },(err,ret) => {
                        parallelCallback(null,"")
                    })
                },

            },(error,asyncParallelResult) => {
                nextThen(result)
            })
        }).then((nextThen,result) => {
            async.parallel({
                remindTaskResponsible : (parallelCallback) => {    
                    async.map( result, (e, mapCallback) => {
                        if(e.responsible.length > 0){
                            let dataToSubmit = { 
                                    projectId: e.projectId,
                                    linkType: "workstream",
                                    linkId: e.workstreamId,
                                    type: "Task Due Today",
                                    usersId: e.responsible[0].user.id,
                                    reminderDetail: "Task Due Today as responsible"
                                }

                                Reminder
                                    .create(dataToSubmit)
                                    .then((res) => {
                                        mapCallback(null,res)
                                    })
                                    .catch((err) => {
                                        mapCallback(null)
                                    })
                        }else{
                            mapCallback(null)
                        }
                    }, (err, ret) => {
                        parallelCallback(null, ret);
                    });
                },sendToEmail : (parallelCallback) => {
                    async.map( result, (e, mapCallback) => {
                        if(e.responsible.length > 0){
                            if(e.responsible[0].receiveNotification > 0){
                                let mailOptions = {
                                    from: '"no-reply" <no-reply@c_cfo.com>', // sender address
                                    to: `${e.responsible[0].user.emailAddress}`, // list of receivers
                                    subject: '[CLOUD-CFO]', // Subject line
                                    text: 'Task Due Today', // plain text body
                                    html:`<p> Task Due Today as Responsilbe</p>
                                            <p>${e.task}</p>
                                            <a href="${ ( (process.env.NODE_ENV == "production") ? "https:" : "http:" )}${global.site_url}project/${e.projectId}/workstream/${e.workstreamId}?task=${e.id}">Click here</a>
                                            `
                                }
                                global.emailtransport(mailOptions)
                                mapCallback(null)
                            }
                        }else{
                            mapCallback(null)
                        }
                     }, (err, ret) => {
                         parallelCallback(null, ret);
                     });
                }
            },(error,asyncParallelResult) => {
                nextThen(result)
            })
        }).then((nextThen,result) => {
            async.parallel({
                remindTaskFollower : (parallelCallback) => {
                    async.map(result, (e, mapCallback) => {
                        if(e.follower.length > 0){
                            async.map(e.follower, (f, cb ) => {
                                let dataToSubmit = { 
                                    projectId: e.projectId,
                                    linkType: "task",
                                    linkId: e.id,
                                    type: "Task Due Today",
                                    usersId: f.user.id,
                                    reminderDetail: "Task Due Today as follower"
                                }

                                Reminder
                                    .create(dataToSubmit)
                                    .then((res) => {
                                        cb(null,res)
                                    })
                                    .catch((err) => {
                                        cb(null,"")
                                    })

                            },(err,ret) => {
                                mapCallback(null)
                            })
                        }else{
                            mapCallback(null)
                        }
                    }, (err, res) => {
                         parallelCallback(null, res);
                    });
                },
                sendToEmail : (parallelCallback) => {
                    async.map(result, (e, mapCallback) => {
                        if(e.follower.length > 0){
                            async.map(e.follower, (f,cb) => {
                                if(f.receiveNotification){
                                    let mailOptions = {
                                        from: '"no-reply" <no-reply@c_cfo.com>', // sender address
                                        to: `${f.user.emailAddress}`, // list of receivers
                                        subject: '[CLOUD-CFO]', // Subject line
                                        text: 'Task Due Today', // plain text body
                                        html: `<p> Task Due Today as Follower</p>
                                                <p>${e.task}</p>
                                                <a href="${ ( (process.env.NODE_ENV == "production") ? "https:" : "http:" )}${global.site_url}project/${e.projectId}/workstream/${e.workstreamId}?task=${e.id}">Click here</a>`
                                    }
                                    global.emailtransport(mailOptions)
                                    cb(null)
                                }
                            },(err,ret) => {
                                mapCallback(null)
                            })
                        }else{
                            mapCallback(null)
                        }
                    }, (err, ret) => { 
                        parallelCallback(null, ret)
                    });
                }
                
            },(error, asyncParallelResult) =>{

            })
        })
})