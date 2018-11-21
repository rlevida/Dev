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
            where: {
                dueDate: {
                    [Op.or]: [
                        { [Op.lt]: moment().utc().format("YYYY-MM-DD") },
                        { [Op.eq]: moment().utc().format("YYYY-MM-DD") },
                        { [Op.between]: [moment().utc().subtract(1, 'days').format("YYYY-MM-DD"), moment().utc().add(1, 'days').format("YYYY-MM-DD")] },
                    ]
                },
                isActive: 1
            },
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
                if (result.beforeDuedate.length) {
                    async.map(result.beforeDuedate, (e, mapCallback) => {
                        async.map(e.task_member_reminder, (tm, tmMapCallback) => {
                            async.parallel({
                                defaultNotification: (tmParallelCallback) => {
                                    if (tm.defaultNotification) {
                                        const dataToSubmit = {
                                            usersId: tm.user.id,
                                            projectId: e.projectId,
                                            linkId: e.id,
                                            linkType: 'task',
                                            detail: 'Task Reminder Before Due Date'
                                        }
                                        Reminder
                                            .create(dataToSubmit)
                                            .then((res) => {
                                                tmParallelCallback(null, res)
                                            })
                                    } else {
                                        tmParallelCallback(null)
                                    }
                                },
                                emailNotification: (tmParallelCallback) => {
                                    if (tm.emailNotification) {
                                        let mailOptions = {
                                            from: '"no-reply" <no-reply@c_cfo.com>', // sender address
                                            to: `${tm.user.emailAddress}`, // list of receivers
                                            subject: '[CLOUD-CFO]', // Subject line
                                            text: 'Task Reminder Before Due Date', // plain text body
                                            html: `<p> Task Reminder Before Due Date</p>
                                            <p>${e.task}</p>
                                            <a href="${ ((process.env.NODE_ENV == "production") ? "https:" : "http:")}${global.site_url}project/${e.projectId}/workstream/${e.workstreamId}?task=${e.id}">Click here</a>
                                        `
                                        }
                                        global.emailtransport(mailOptions)
                                        tmParallelCallback(null)
                                    } else {
                                        tmParallelCallback(null)
                                    }
                                }
                            }, (err, tmParallelCallbackResult) => {
                                tmMapCallback(null)
                            })

                        }, (err, tmMapCallbackResult) => {
                            mapCallback(null, tmMapCallbackResult)
                        })

                    }, (err, mapCallbackResult) => {
                        parallelCallback(null)
                    })
                } else {
                    parallelCallback(null)
                }
            },
            sendOnDuedate: (parallelCallback) => {
                if (result.onDudate.length) {
                    async.map(result.onDudate, (e, mapCallback) => {
                        async.map(e.task_member_reminder, (tm, tmMapCallback) => {
                            async.parallel({
                                defaultNotification: (tmParallelCallback) => {
                                    if (tm.defaultNotification) {
                                        const dataToSubmit = {
                                            usersId: tm.user.id,
                                            projectId: e.projectId,
                                            linkId: e.id,
                                            linkType: 'task',
                                            detail: 'Task Reminder On Due Date'
                                        }
                                        Reminder
                                            .create(dataToSubmit)
                                            .then((res) => {
                                                tmParallelCallback(null, res)
                                            })
                                    } else {
                                        tmParallelCallback(null)
                                    }
                                },
                                emailNotification: (tmParallelCallback) => {
                                    if (tm.emailNotification) {
                                        let mailOptions = {
                                            from: '"no-reply" <no-reply@c_cfo.com>', // sender address
                                            to: `${tm.user.emailAddress}`, // list of receivers
                                            subject: '[CLOUD-CFO]', // Subject line
                                            text: 'Task Reminder On Due Date', // plain text body
                                            html: `<p> Task Reminder On Due Date</p>
                                            <p>${e.task}</p>
                                            <a href="${ ((process.env.NODE_ENV == "production") ? "https:" : "http:")}${global.site_url}project/${e.projectId}/workstream/${e.workstreamId}?task=${e.id}">Click here</a>
                                        `
                                        }
                                        global.emailtransport(mailOptions)
                                        tmParallelCallback(null)
                                    } else {
                                        tmParallelCallback(null)
                                    }
                                }
                            }, (err, tmParallelCallbackResult) => {
                                tmMapCallback(null)
                            })

                        }, (err, tmMapCallbackResult) => {
                            mapCallback(null, tmMapCallbackResult)
                        })

                    }, (err, mapCallbackResult) => {
                        parallelCallback(null)
                    })
                } else {
                    parallelCallback(null)
                }
            }
        })
    })
})