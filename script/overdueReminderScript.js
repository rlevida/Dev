var schedule = require('node-schedule'),
    sequence = require("sequence").Sequence,
    async = require("async"),
    moment = require("moment"),
    _ = require("lodash");

    const models = require('../modelORM');
    const {
        Tasks,
        Members,
        Users,
        Reminder,
        Workstream
    } = models;

    const Sequelize = require("sequelize")
    const Op = Sequelize.Op;
    

/**
 * 
 * Comment : Manage reminder for overdue task
 *   *    *    *    *    *    *
 *   s    i    H    DM    M   DW 
 * 
 **/
var j = schedule.scheduleJob('0 0 * * *', () => {
    const task = global.initModel("task");
    const reminder = global.initModel("reminder");
    const members = global.initModel("members");
    const taskDependency = global.initModel("task_dependency");

    sequence.create().then((nextThen) => {
        task.getTaskOverdue((ret) => {
            if (ret.data.length > 0) {
                const dataToBeProcessed = _.map(ret.data, (e, i) => {
                    return new Promise((resolve, reject) => {
                        async.parallel({
                            periodic: (parallelCallback) => {
                                if (e.periodic == 1) {
                                    const taskId = (e.periodTask == null) ? e.id : e.periodTask;
                                    const nextDueDate = moment(e.dueDate).add(e.periodType, e.period).format('YYYY-MM-DD HH:mm:ss');
                                    const newPeriodTask = { ...e, id: "", startDate: e.dueDate, dueDate: nextDueDate, periodTask: taskId, status: "In Progress" };


                                    task.getData("task", { dueDate: nextDueDate, periodTask: taskId , isActive : 1 }, {}, (e) => {
                                        if ((e.data).length > 0) {
                                            parallelCallback(null, "");
                                        } else {
                                            task.postData("task", newPeriodTask, (c) => {
                                                async.parallel({
                                                    members: (parallelCallback) => {
                                                        members.getData("members", { linkType: "task", linkId: taskId, memberType: "assignedTo" }, {}, (e) => {
                                                            if (e.status && e.data.length > 0) {
                                                                let assignedTo = { linkType: "task", linkId: c.id, usersType: "users", userTypeLinkId: e.data[0].userTypeLinkId, memberType: "assignedTo" };
                                                                members.postData("members", assignedTo, (c) => {
                                                                    parallelCallback(null, e.data[0].userTypeLinkId);
                                                                });
                                                            } else {
                                                                parallelCallback(null, "")
                                                            }
                                                        });
                                                    },
                                                    dependency: (parallelCallback) => {
                                                        taskDependency.getData("task_dependency", { taskId: taskId }, {}, (e) => {
                                                            if (e.status && e.data.length > 0) {
                                                                async.map(e.data, (task, mapCallback) => {
                                                                    taskDependency.postData("task_dependency", {
                                                                        taskId: c.id,
                                                                        dependencyType: task.dependencyType,
                                                                        linkTaskId: task.linkTaskId
                                                                    }, (c) => {
                                                                        mapCallback(null)
                                                                    });
                                                                }, (err, results) => {
                                                                    parallelCallback(null, results)
                                                                });
                                                            } else {
                                                                parallelCallback(null, "")
                                                            }
                                                        });
                                                    }
                                                }, (err, result) => {
                                                    parallelCallback(null, { ...c, result })
                                                })
                                            })
                                        }
                                    });
                                } else {
                                    parallelCallback(null, "");
                                }
                            }
                        }, (error, result) => {
                            if (error != null) {
                                reject(error);
                            } else {
                                resolve(result);
                            }
                        })
                    })

                });
                Promise.all(dataToBeProcessed).then((values) => {
                    nextThen(ret)
                }).catch((err) => { })
            }
        })
    }).then((nextThen,result) =>{
        Tasks
            .findAll({ 
                where : Sequelize.where(Sequelize.fn('date', Sequelize.col('dueDate')), '<', moment().format('YYYY-MM-DD HH:mm:ss')),
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
                        as: 'tWorkstream',
                        include: [{
                            model: Members,
                            as: 'wsResponsible',
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
                    responsible: res.tWorkstream.wsResponsible.map((e) => { return e.toJSON()}),
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

    }).then((nextThen, result) => {
        async.parallel({
            remindTaskAssigned : (parallelCallback) => {
                async.map( result , (e, mapCallback) => {
                    let dataToSubmit = { 
                        usersId: e.assignee[0].user.id,
                        projectId: e.projectId,
                        linkType: 'task',
                        type:"Task Overdue",
                        reminderDetail: "Task Overdue"
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
                }, (err, ret) => {
                    parallelCallback(null,"")
                });
            },
            sendToEmail: (parallelCallback) => {
                async.map( result , (e, mapCallback) => {
                    if(e.assignee[0].receiveNotification){
                        let mailOptions = {
                            from: '"no-reply" <no-reply@c_cfo.com>', // sender address
                            to: `${e.assignee[0].user.emailAddress}`, // list of receivers
                            subject: '[CLOUD-CFO]', // Subject line
                            text: 'Task Overdue Today', // plain text body
                            html:`<p> Task Overdue as Assignee</p>
                                    <p>${e.task}</p>
                                    <a href="${ ( (process.env.NODE_ENV == "production") ? "https:" : "http:" )}${global.site_url}project/${e.projectId}/workstream/${e.workstreamId}?task=${e.id}">Click here</a>
                                    `
                        }
                        global.emailtransport(mailOptions)
                        mapCallback(null)
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
            
    }).then((nextThen, result) => {
        async.parallel({
            remindTaskResponsible : (parallelCallback) => {    
                async.map( result, (e, mapCallback) => {
                   let dataToSubmit = { 
                        projectId: e.projectId,
                        linkType: "workstream",
                        linkId: e.workstreamId,
                        type: "Task Overdue",
                        usersId: e.responsible[0].user.id,
                        reminderDetail: "Task Overdue as responsible"
                    }

                    Reminder
                        .create(dataToSubmit)
                        .then((res) => {
                            mapCallback(null,res)
                        })
                        .catch((err) => {
                            mapCallback(null,"")
                        })
                }, (err, ret) => {
                    parallelCallback(null, ret);
                });
            },sendToEmail : (parallelCallback) => {
                async.map( result, (e, mapCallback) => {
                    if(e.responsible[0].receiveNotification > 0){
                        let mailOptions = {
                            from: '"no-reply" <no-reply@c_cfo.com>', // sender address
                            to: `${e.responsible[0].user.emailAddress}`, // list of receivers
                            subject: '[CLOUD-CFO]', // Subject line
                            text: 'Task Overdue', // plain text body
                            html:`<p> Task Overdue as Responsilbe</p>
                                    <p>${e.task}</p>
                                    <a href="${ ( (process.env.NODE_ENV == "production") ? "https:" : "http:" )}${global.site_url}project/${e.projectId}/workstream/${e.workstreamId}?task=${e.id}">Click here</a>
                                    `
                        }
                        global.emailtransport(mailOptions)
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
                }, (err, res) => {
                     parallelCallback(null, res);
                });
            },
            sendToEmail : (parallelCallback) => {
                async.map(result, (e, mapCallback) => {
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
                }, (err, ret) => { 
                    parallelCallback(null, ret)
                });
            }
            
        },(error, asyncParallelResult) =>{

        })
    })
});
