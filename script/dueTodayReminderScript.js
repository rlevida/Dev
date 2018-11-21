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
// var j = schedule.scheduleJob('0 0 * * *', () => {
const models = require('../modelORM');
const {
    Tasks,
    TaskMemberReminder,
    Members,
    Users,
    Reminder,
    Workstream,
    Projects
} = models;

const associationFindAllStack = [
    {
        model: Members,
        as: 'projectManager',
        where: {
            memberType: 'project manager'
        },
        required: false,
    },
    {
        model: Tasks,
        as: 'tasks',
        where: { isActive: 1 },
        required: true,
        include: [{
            model: TaskMemberReminder,
            as: 'task_member_reminder',
            include: [{
                model: Users,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName', 'emailAddress']
            }]
        }]
    },

]

sequence.create().then((nextThen) => {
    Projects
        .findAll({
            include: associationFindAllStack,
            where: { [Op.or]: [{ remindOnDuedate: 1 }, { remindBeforeDuedate: 1 }], isActive: 1 }
        })
        .then((res) => {
            async.parallel({
                beforeDuedate: (parallelCallback) => {
                    async.map(res, (e, mapCallback) => {
                        if (e.remindBeforeDuedate) {
                            e.tasks.filter((t) => {
                                const currentDate = moment().format('YYYY-MM-DD')
                                const dueDate = moment(t.dueDate).format('YYYY-MM-DD')
                                if (e.remindBeforeDuedate > 0 && moment(dueDate).diff(moment(currentDate), 'days') == 1) {
                                    mapCallback(null, t)
                                } else {
                                    mapCallback(null, '')
                                }
                            })
                        } else {
                            mapCallback(null, '')
                        }
                    }, (err, results) => {
                        parallelCallback(null, _.filter(results, (r) => { return r !== '' }))
                    })
                },
                onDudate: (parallelCallback) => {
                    async.map(res, (e, mapCallback) => {
                        if (e.remindOnDuedate) {
                            e.tasks.filter((t) => {
                                const currentDate = moment().format('YYYY-MM-DD')
                                const dueDate = moment(t.dueDate).format('YYYY-MM-DD')
                                if (e.remindOnDuedate > 0 && moment(dueDate).diff(moment(currentDate), 'days') == 0) {
                                    mapCallback(null, t)
                                } else {
                                    mapCallback(null, '')
                                }
                            })
                        } else {
                            mapCallback(null, '')
                        }
                    }, (err, results) => {
                        parallelCallback(null, _.filter(results, (r) => { return r !== '' }))
                    })
                }
            }, (err, results) => {
                nextThen(results)
            })
        })
}).then((nextThen, result) => {
    async.parallel({
        sendBeforeDuedate: (parallelCallback) => {

        },
        sendOnDuedate: (parallelCallback) => {

        }
    })
    // result.map((e) => {
    //     if (e.task_member_reminder.length) {
    //         e.task_member_reminder.map((tm) => {
    //             if (tm.defaultNotification) {
    //                 const dataToSubmit = {
    //                     usersId: tm.user.id,
    //                     projectId: e.projectId,
    //                     linkId: e.id,
    //                     linkType: 'task',
    //                     detail: ''
    //                 }
    //                 Reminder
    //                     .create(dataToSubmit)
    //                     .then((res) => { })
    //             }
    //         })
    //     }
    // })
    // async.parallel({
    //     remindTaskAssigned : (parallelCallback) => {
    //         async.map( result , (e, mapCallback) => {
    //             if(e.assignee.length > 0){
    //                 let dataToSubmit = { 
    //                     usersId: e.assignee[0].user.id,
    //                     projectId: e.projectId,
    //                     linkType: 'task',
    //                     type:"Task Due Today",
    //                     reminderDetail: "Task Due Today"
    //                 }

    //                 Reminder
    //                     .create(dataToSubmit)
    //                     .then((res) => {
    //                         mapCallback(null,res)
    //                     })
    //                     .catch((err) => {
    //                         console.log(err)
    //                         mapCallback(null,"")
    //                     })
    //             }else{
    //                 mapCallback(null,"")
    //             }
    //         }, (err, ret) => {
    //             parallelCallback(null,"")
    //         });
    //     },
    //     sendToEmail: (parallelCallback) => {
    //         async.map( result , (e, mapCallback) => {
    //             if(e.assignee.length > 0){
    //                 if(e.assignee[0].receiveNotification){
    //                     let mailOptions = {
    //                         from: '"no-reply" <no-reply@c_cfo.com>', // sender address
    //                         to: `${e.assignee[0].user.emailAddress}`, // list of receivers
    //                         subject: '[CLOUD-CFO]', // Subject line
    //                         text: 'Task Due Today', // plain text body
    //                         html:`<p> Task Due Today as Assignee</p>
    //                                 <p>${e.task}</p>
    //                                 <a href="${ ( (process.env.NODE_ENV == "production") ? "https:" : "http:" )}${global.site_url}project/${e.projectId}/workstream/${e.workstreamId}?task=${e.id}">Click here</a>
    //                                 `
    //                     }
    //                     global.emailtransport(mailOptions)
    //                     mapCallback(null)
    //                 }else{
    //                     mapCallback(null)
    //                 }
    //             }else{
    //                 mapCallback(null)
    //             }
    //         },(err,ret) => {
    //             parallelCallback(null,"")
    //         })
    //     },

    // },(error,asyncParallelResult) => {
    //     nextThen(result)
    // })
}).then((nextThen, result) => {
    async.parallel({
        remindTaskResponsible: (parallelCallback) => {
            async.map(result, (e, mapCallback) => {
                if (e.responsible.length > 0) {
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
                            mapCallback(null, res)
                        })
                        .catch((err) => {
                            mapCallback(null)
                        })
                } else {
                    mapCallback(null)
                }
            }, (err, ret) => {
                parallelCallback(null, ret);
            });
        }, sendToEmail: (parallelCallback) => {
            async.map(result, (e, mapCallback) => {
                if (e.responsible.length > 0) {
                    if (e.responsible[0].receiveNotification > 0) {
                        let mailOptions = {
                            from: '"no-reply" <no-reply@c_cfo.com>', // sender address
                            to: `${e.responsible[0].user.emailAddress}`, // list of receivers
                            subject: '[CLOUD-CFO]', // Subject line
                            text: 'Task Due Today', // plain text body
                            html: `<p> Task Due Today as Responsilbe</p>
                                            <p>${e.task}</p>
                                            <a href="${ ((process.env.NODE_ENV == "production") ? "https:" : "http:")}${global.site_url}project/${e.projectId}/workstream/${e.workstreamId}?task=${e.id}">Click here</a>
                                            `
                        }
                        global.emailtransport(mailOptions)
                        mapCallback(null)
                    }
                } else {
                    mapCallback(null)
                }
            }, (err, ret) => {
                parallelCallback(null, ret);
            });
        }
    }, (error, asyncParallelResult) => {
        nextThen(result)
    })
}).then((nextThen, result) => {
    async.parallel({
        remindTaskFollower: (parallelCallback) => {
            async.map(result, (e, mapCallback) => {
                if (e.follower.length > 0) {
                    async.map(e.follower, (f, cb) => {
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
                                cb(null, res)
                            })
                            .catch((err) => {
                                cb(null, "")
                            })

                    }, (err, ret) => {
                        mapCallback(null)
                    })
                } else {
                    mapCallback(null)
                }
            }, (err, res) => {
                parallelCallback(null, res);
            });
        },
        sendToEmail: (parallelCallback) => {
            async.map(result, (e, mapCallback) => {
                if (e.follower.length > 0) {
                    async.map(e.follower, (f, cb) => {
                        if (f.receiveNotification) {
                            let mailOptions = {
                                from: '"no-reply" <no-reply@c_cfo.com>', // sender address
                                to: `${f.user.emailAddress}`, // list of receivers
                                subject: '[CLOUD-CFO]', // Subject line
                                text: 'Task Due Today', // plain text body
                                html: `<p> Task Due Today as Follower</p>
                                                <p>${e.task}</p>
                                                <a href="${ ((process.env.NODE_ENV == "production") ? "https:" : "http:")}${global.site_url}project/${e.projectId}/workstream/${e.workstreamId}?task=${e.id}">Click here</a>`
                            }
                            global.emailtransport(mailOptions)
                            cb(null)
                        }
                    }, (err, ret) => {
                        mapCallback(null)
                    })
                } else {
                    mapCallback(null)
                }
            }, (err, ret) => {
                parallelCallback(null, ret)
            });
        }

    }, (error, asyncParallelResult) => {

    })
})
// })