const schedule = require('node-schedule'),
    sequence = require("sequence").Sequence,
    async = require("async"),
    moment = require("moment"),
    _ = require("lodash"),
    CronJob = require('cron').CronJob;;

const Sequelize = require("sequelize")
const Op = Sequelize.Op;

/**
 * 
 * Comment : Manage reminder for due today
 *   *    *    *    *    *    *
 *   s    i    H    DM    M   DW 
 * 
 **/

var job = new CronJob('0 7 * * *', function () {
    const models = require('../modelORM');
    const {
        Tasks,
        TaskMemberReminder,
        Members,
        Users,
        Reminder,
        Workstream,
        Projects,
        UsersNotificationSetting,
        Notification,
        UsersTeam,
        Teams,
        Type
    } = models;

    Tasks
        .findAll({
            where: {
                dueDate: {
                    [Op.or]: [
                        { [Op.lt]: moment().utc().format("YYYY-MM-DD") },
                    ]
                },
                isActive: 1,
                status: {
                    [Op.ne]: "Completed"
                }
            },
            include: [{
                model: Members,
                as: 'assignee',
                attributes: ['userTypeLinkId'],
                where: { memberType: 'assignedTo' },
                required: false,
            }, {
                model: Members,
                as: 'follower',
                required: false,
                attributes: ['userTypeLinkId'],
                where: { memberType: 'follower', linkType: 'task', isDeleted: 0 },
            }, {
                model: Workstream,
                as: 'workstream',
                required: false,
                include: [{
                    model: Members,
                    as: 'responsible',
                    where: { memberType: 'responsible', linkType: 'workstream' },
                    required: false
                }]
            }]
        })
        .map((res) => {
            return res.toJSON();
        })
        .then((res) => {
            async.map(res, (e, mapCallback) => {
                async.parallel({
                    notificationAssgined: async (parallelCallback) => {
                        const receiver = e.assignee[0].userTypeLinkId;

                        UsersNotificationSetting
                            .findAll({
                                where: { usersId: receiver },
                                include: [{
                                    model: Users,
                                    as: 'notification_setting',
                                    required: false
                                }]
                            })
                            .map((response) => {
                                return response.toJSON()
                            })
                            .then(async (response) => {
                                let notificationArr = await _.filter(response, (nSetting) => {
                                    return nSetting.taskDeadline === 1
                                }).map((nSetting) => {
                                    const { emailAddress } = { ...nSetting.notification_setting }
                                    return {
                                        usersId: nSetting.usersId,
                                        projectId: e.projectId,
                                        taskId: e.id,
                                        workstreamId: e.workstreamId,
                                        createdBy: e.assignee[0].userTypeLinkId,
                                        type: "taskDeadline",
                                        message: `You seem to have missed a deadline.`,
                                        emailAddress: emailAddress,
                                        receiveEmail: nSetting.receiveEmail
                                    }
                                })

                                Notification
                                    .bulkCreate(notificationArr)
                                    .map((notificationRes) => {
                                        return notificationRes.id
                                    })
                                    .then((notificationRes) => {
                                        Notification
                                            .findAll({
                                                where: { id: notificationRes },
                                                include: [
                                                    {
                                                        model: Users,
                                                        as: 'to',
                                                        required: false,
                                                        attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                    },
                                                    {
                                                        model: Projects,
                                                        as: 'project_notification',
                                                        required: false,
                                                        include: [{
                                                            model: Type,
                                                            as: 'type',
                                                            required: false,
                                                            attributes: ["type"]
                                                        }]
                                                    },
                                                    {
                                                        model: Users,
                                                        as: 'from',
                                                        required: false,
                                                        attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                    },
                                                    {
                                                        model: Workstream,
                                                        as: 'workstream_notification',
                                                        required: false,
                                                        attributes: ["workstream"]
                                                    },
                                                    {
                                                        model: Tasks,
                                                        as: 'task_notification',
                                                        required: false,
                                                        attributes: ["task"]
                                                    },
                                                ]
                                            })
                                            .map((findNotificationRes) => {
                                                // req.app.parent.io.emit('FRONT_NOTIFICATION', {
                                                //     ...findNotificationRes.toJSON()
                                                // })
                                                return findNotificationRes.toJSON()
                                            })
                                            .then(() => {
                                                async.map(notificationArr, ({ emailAddress, message, receiveEmail, projectId, workstreamId, taskId }, mapCallback) => {
                                                    if (receiveEmail === 1) {
                                                        let html = '<p>' + message + '</p>';
                                                        html += '<p style="margin-bottom:0">Title: ' + message + '</p>';
                                                        // html += '<p style="margin-top:0">Project - Workstream: ' + workstream.project.project + ' - ' + workstream.workstream + '</p>';
                                                        html += `<p>Message:<br>${message}</p>`;
                                                        html += ` <a href="${((process.env.NODE_ENV == "production") ? "https:" : "http:")}${global.site_url}account#/projects/${projectId}/workstreams/${workstreamId}?task-id=${taskId}">Click here</a>`;
                                                        html += `<p>Date:<br>${moment().format('LLL')}</p>`;

                                                        const mailOptions = {
                                                            from: '"no-reply" <no-reply@c_cfo.com>',
                                                            to: `${emailAddress}`,
                                                            subject: '[CLOUD-CFO]',
                                                            html: html
                                                        };
                                                        global.emailtransport(mailOptions);
                                                    }
                                                    mapCallback(null)
                                                }, (err) => {
                                                    return
                                                })
                                            })
                                    })
                            })
                    },
                    notificationTeamLeader: (parallelCallback) => {
                        UsersTeam.findAll({
                            where: { usersId: e.assignee[0].userTypeLinkId },
                            include: [{
                                model: Teams,
                                as: 'team',
                                required: false
                            }]
                        }).map((o) => {
                            return o.toJSON().team.teamLeaderId
                        }).then(async (o) => {
                            const receiver = _.union(o);

                            UsersNotificationSetting
                                .findAll({
                                    where: { usersId: receiver },
                                    include: [{
                                        model: Users,
                                        as: 'notification_setting',
                                        required: false
                                    }]
                                })
                                .map((response) => {
                                    return response.toJSON()
                                })
                                .then(async (response) => {
                                    let notificationArr = await _.filter(response, (nSetting) => {
                                        return nSetting.taskTeamDeadline === 1
                                    }).map((nSetting) => {
                                        const { emailAddress } = { ...nSetting.notification_setting }
                                        return {
                                            usersId: nSetting.usersId,
                                            projectId: e.projectId,
                                            taskId: e.id,
                                            workstreamId: e.workstreamId,
                                            createdBy: e.assignee[0].userTypeLinkId,
                                            type: "taskTeamDeadline",
                                            message: `Team member seem to have missed a deadline.`,
                                            emailAddress: emailAddress,
                                            receiveEmail: nSetting.receiveEmail
                                        }
                                    })

                                    Notification
                                        .bulkCreate(notificationArr)
                                        .map((notificationRes) => {
                                            return notificationRes.id
                                        })
                                        .then((notificationRes) => {
                                            Notification
                                                .findAll({
                                                    where: { id: notificationRes },
                                                    include: [
                                                        {
                                                            model: Users,
                                                            as: 'to',
                                                            required: false,
                                                            attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                        },
                                                        {
                                                            model: Users,
                                                            as: 'from',
                                                            required: false,
                                                            attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                        },
                                                        {
                                                            model: Projects,
                                                            as: 'project_notification',
                                                            required: false,
                                                            include: [{
                                                                model: Type,
                                                                as: 'type',
                                                                required: false,
                                                                attributes: ["type"]
                                                            }]
                                                        },
                                                        {
                                                            model: Workstream,
                                                            as: 'workstream_notification',
                                                            required: false,
                                                            attributes: ["workstream"]
                                                        },
                                                        {
                                                            model: Tasks,
                                                            as: 'task_notification',
                                                            required: false,
                                                            attributes: ["task"]
                                                        },
                                                    ]
                                                })
                                                .map((findNotificationRes) => {
                                                    // req.app.parent.io.emit('FRONT_NOTIFICATION', {
                                                    //     ...findNotificationRes.toJSON()
                                                    // })
                                                    return findNotificationRes.toJSON()
                                                })
                                                .then(() => {
                                                    async.map(notificationArr, ({ emailAddress, message, receiveEmail, projectId, workstreamId, taskId }, mapCallback) => {
                                                        if (receiveEmail === 1) {
                                                            let html = '<p>' + message + '</p>';
                                                            html += '<p style="margin-bottom:0">Title: ' + message + '</p>';
                                                            // html += '<p style="margin-top:0">Project - Workstream: ' + workstream.project.project + ' - ' + workstream.workstream + '</p>';
                                                            html += `<p>Message:<br>${message}</p>`;
                                                            html += ` <a href="${((process.env.NODE_ENV == "production") ? "https:" : "http:")}${global.site_url}account#/projects/${projectId}/workstreams/${workstreamId}?task-id=${taskId}">Click here</a>`;
                                                            html += `<p>Date:<br>${moment().format('LLL')}</p>`;

                                                            const mailOptions = {
                                                                from: '"no-reply" <no-reply@c_cfo.com>',
                                                                to: `${emailAddress}`,
                                                                subject: '[CLOUD-CFO]',
                                                                html: html
                                                            };
                                                            global.emailtransport(mailOptions);
                                                        }
                                                        mapCallback(null)
                                                    }, (err) => {
                                                        parallelCallback(null)
                                                    })
                                                })
                                        })
                                })
                        })
                    },
                    notificationTaskFollower: (parallelCallback) => {
                        const receiver = e.follower.map((e) => { return e.userTypeLinkId });
                        UsersNotificationSetting
                            .findAll({
                                where: { usersId: receiver },
                                include: [{
                                    model: Users,
                                    as: 'notification_setting',
                                    required: false
                                }]
                            })
                            .map((response) => {
                                return response.toJSON()
                            })
                            .then(async (response) => {
                                let message = "";
                                message = `Task following seem to have missed a deadline.`;

                                let notificationArr = await _.filter(response, (nSetting) => {
                                    return nSetting.taskFollowingDeadline === 1
                                }).map((nSetting) => {
                                    const { emailAddress } = { ...nSetting.notification_setting }
                                    return {
                                        usersId: nSetting.usersId,
                                        createdBy: e.assignee[0].userTypeLinkId,
                                        projectId: e.projectId,
                                        taskId: e.id,
                                        workstreamId: e.workstreamId,
                                        type: "taskFollowingDeadline",
                                        message: message,
                                        emailAddress: emailAddress,
                                        receiveEmail: nSetting.receiveEmail
                                    }
                                })

                                Notification
                                    .bulkCreate(notificationArr)
                                    .map((notificationRes) => {
                                        return notificationRes.id
                                    })
                                    .then((notificationRes) => {
                                        Notification
                                            .findAll({
                                                where: { id: notificationRes },
                                                include: [
                                                    {
                                                        model: Users,
                                                        as: 'to',
                                                        required: false,
                                                        attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                    },
                                                    {
                                                        model: Users,
                                                        as: 'from',
                                                        required: false,
                                                        attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                    },
                                                    {
                                                        model: Projects,
                                                        as: 'project_notification',
                                                        required: false,
                                                        include: [{
                                                            model: Type,
                                                            as: 'type',
                                                            required: false,
                                                            attributes: ["type"]
                                                        }]
                                                    },
                                                    {
                                                        model: Workstream,
                                                        as: 'workstream_notification',
                                                        required: false,
                                                        attributes: ["workstream"]
                                                    },
                                                    {
                                                        model: Tasks,
                                                        as: 'task_notification',
                                                        required: false,
                                                        attributes: ["task"]
                                                    },
                                                ]
                                            })
                                            .map((findNotificationRes) => {
                                                // req.app.parent.io.emit('FRONT_NOTIFICATION', {
                                                //     ...findNotificationRes.toJSON()
                                                // })
                                                return findNotificationRes.toJSON()
                                            })
                                            .then(() => {
                                                async.map(notificationArr, ({ emailAddress, message, receiveEmail, projectId, workstreamId, taskId }, mapCallback) => {
                                                    if (receiveEmail === 1) {
                                                        let html = '<p>' + message + '</p>';
                                                        html += '<p style="margin-bottom:0">Title: ' + message + '</p>';
                                                        // html += '<p style="margin-top:0">Project - Workstream: ' + workstream.project.project + ' - ' + workstream.workstream + '</p>';
                                                        html += `<p>Message:<br>${message}</p>`;
                                                        html += ` <a href="${((process.env.NODE_ENV == "production") ? "https:" : "http:")}${global.site_url}account#/projects/${projectId}/workstreams/${workstreamId}?task-id=${taskId}">Click here</a>`;
                                                        html += `<p>Date:<br>${moment().format('LLL')}</p>`;

                                                        const mailOptions = {
                                                            from: '"no-reply" <no-reply@c_cfo.com>',
                                                            to: `${emailAddress}`,
                                                            subject: '[CLOUD-CFO]',
                                                            html: html
                                                        };
                                                        global.emailtransport(mailOptions);
                                                    }
                                                    mapCallback(null)
                                                }, (err) => {
                                                    parallelCallback(null)
                                                })
                                            })
                                    })
                            })
                    },
                    notificationTaskResponsible: (parallelCallback) => {
                        const receiver = e.workstream.responsible[0].userTypeLinkId
                        UsersNotificationSetting
                            .findAll({
                                where: { usersId: receiver },
                                include: [{
                                    model: Users,
                                    as: 'notification_setting',
                                    required: false
                                }]
                            })
                            .map((response) => {
                                return response.toJSON()
                            })
                            .then(async (response) => {
                                let message = "";
                                message = `Task seem to have missed a deadline as a responsible.`;
                                let notificationArr = await _.filter(response, (nSetting) => {
                                    return nSetting.taskFollowingDeadline === 1
                                }).map((nSetting) => {
                                    const { emailAddress } = { ...nSetting.notification_setting }

                                    return {
                                        usersId: nSetting.usersId,
                                        createdBy: e.assignee[0].userTypeLinkId,
                                        projectId: e.projectId,
                                        taskId: e.id,
                                        workstreamId: e.workstreamId,
                                        type: "taskResponsibleDeadLine",
                                        message: message,
                                        emailAddress: emailAddress,
                                        receiveEmail: nSetting.receiveEmail
                                    }
                                })
                                Notification
                                    .bulkCreate(notificationArr)
                                    .map((notificationRes) => {
                                        return notificationRes.id
                                    })
                                    .then((notificationRes) => {
                                        Notification
                                            .findAll({
                                                where: { id: notificationRes },
                                                include: [
                                                    {
                                                        model: Users,
                                                        as: 'to',
                                                        required: false,
                                                        attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                    },
                                                    {
                                                        model: Users,
                                                        as: 'from',
                                                        required: false,
                                                        attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                    },
                                                    {
                                                        model: Projects,
                                                        as: 'project_notification',
                                                        required: false,
                                                        include: [{
                                                            model: Type,
                                                            as: 'type',
                                                            required: false,
                                                            attributes: ["type"]
                                                        }]
                                                    },
                                                    {
                                                        model: Workstream,
                                                        as: 'workstream_notification',
                                                        required: false,
                                                        attributes: ["workstream"]
                                                    },
                                                    {
                                                        model: Tasks,
                                                        as: 'task_notification',
                                                        required: false,
                                                        attributes: ["task"]
                                                    },
                                                ]
                                            })
                                            .map((findNotificationRes) => {
                                                // req.app.parent.io.emit('FRONT_NOTIFICATION', {
                                                //     ...findNotificationRes.toJSON()
                                                // })
                                                return findNotificationRes.toJSON()
                                            })
                                            .then(() => {
                                                async.map(notificationArr, ({ emailAddress, message, receiveEmail, projectId, workstreamId, taskId }, mapCallback) => {
                                                    if (receiveEmail === 1) {
                                                        let html = '<p>' + message + '</p>';
                                                        html += '<p style="margin-bottom:0">Title: ' + message + '</p>';
                                                        // html += '<p style="margin-top:0">Project - Workstream: ' + workstream.project.project + ' - ' + workstream.workstream + '</p>';
                                                        html += `<p>Message:<br>${message}</p>`;
                                                        html += ` <a href="${((process.env.NODE_ENV == "production") ? "https:" : "http:")}${global.site_url}account#/projects/${projectId}/workstreams/${workstreamId}?task-id=${taskId}">Click here</a>`;
                                                        html += `<p>Date:<br>${moment().format('LLL')}</p>`;

                                                        const mailOptions = {
                                                            from: '"no-reply" <no-reply@c_cfo.com>',
                                                            to: `${emailAddress}`,
                                                            subject: '[CLOUD-CFO]',
                                                            html: html
                                                        };
                                                        global.emailtransport(mailOptions);
                                                    }
                                                    mapCallback(null)
                                                }, (err) => {
                                                    parallelCallback(null)
                                                })
                                            })
                                    })
                            })
                    }

                }, () => {
                    mapCallback(null)
                })
            }, () => { return })
        })

    // const associationFindAllStack = [
    //     {
    //         model: Members,
    //         as: 'projectManager',
    //         where: {
    //             memberType: 'project manager'
    //         },
    //         required: false,
    //     },
    //     {
    //         model: Tasks,
    //         as: 'tasks',
    //         where: {
    //             dueDate: {
    //                 [Op.or]: [
    //                     { [Op.lt]: moment().utc().format("YYYY-MM-DD") },
    //                     { [Op.eq]: moment().utc().format("YYYY-MM-DD") },
    //                     { [Op.between]: [moment().utc().subtract(1, 'days').format("YYYY-MM-DD"), moment().utc().add(1, 'days').format("YYYY-MM-DD")] },
    //                 ]
    //             },
    //             isActive: 1
    //         },
    //         required: true,
    //         include: [{
    //             model: TaskMemberReminder,
    //             as: 'task_member_reminder',
    //             include: [{
    //                 model: Users,
    //                 as: 'user',
    //                 attributes: ['id', 'firstName', 'lastName', 'emailAddress']
    //             }]
    //         }]
    //     },

    // ]

    // sequence.create().then((nextThen) => {
    //     Projects
    //         .findAll({
    //             include: associationFindAllStack,
    //             where: { [Op.or]: [{ remindOnDuedate: 1 }, { remindBeforeDuedate: 1 }], isActive: 1 }
    //         })
    //         .then((res) => {
    // async.parallel({
    //     beforeDuedate: (parallelCallback) => {
    //         async.map(res, (e, mapCallback) => {
    //             if (e.remindBeforeDuedate) {
    //                 e.tasks.filter((t) => {
    //                     const currentDate = moment().format('YYYY-MM-DD')
    //                     const dueDate = moment(t.dueDate).format('YYYY-MM-DD')
    //                     if (e.remindBeforeDuedate > 0 && moment(dueDate).diff(moment(currentDate), 'days') == 1) {
    //                         mapCallback(null, t)
    //                     } else {
    //                         mapCallback(null, '')
    //                     }
    //                 })
    //             } else {
    //                 mapCallback(null, '')
    //             }
    //         }, (err, results) => {
    //             parallelCallback(null, _.filter(results, (r) => { return r !== '' }))
    //         })
    //     },
    //     onDudate: (parallelCallback) => {
    //         async.map(res, (e, mapCallback) => {
    //             if (e.remindOnDuedate) {
    //                 e.tasks.filter((t) => {
    //                     const currentDate = moment().format('YYYY-MM-DD')
    //                     const dueDate = moment(t.dueDate).format('YYYY-MM-DD')
    //                     if (e.remindOnDuedate > 0 && moment(dueDate).diff(moment(currentDate), 'days') == 0) {
    //                         mapCallback(null, t)
    //                     } else {
    //                         mapCallback(null, '')
    //                     }
    //                 })
    //             } else {
    //                 mapCallback(null, '')
    //             }
    //         }, (err, results) => {
    //             parallelCallback(null, _.filter(results, (r) => { return r !== '' }))
    //         })
    //     }
    // }, (err, results) => {
    //     nextThen(results)
    // })
    //         })
    // }).then((nextThen, result) => {
    //     async.parallel({
    //         sendBeforeDuedate: (parallelCallback) => {
    //             if (result.beforeDuedate.length) {
    //                 async.map(result.beforeDuedate, (e, mapCallback) => {
    //                     async.map(e.task_member_reminder, (tm, tmMapCallback) => {
    //                         async.parallel({
    //                             defaultNotification: (tmParallelCallback) => {
    //                                 if (tm.defaultNotification) {
    //                                     const dataToSubmit = {
    //                                         usersId: tm.user.id,
    //                                         projectId: e.projectId,
    //                                         linkId: e.id,
    //                                         linkType: 'task',
    //                                         detail: 'Task Reminder Before Due Date'
    //                                     }
    //                                     Reminder
    //                                         .create(dataToSubmit)
    //                                         .then((res) => {
    //                                             tmParallelCallback(null, res)
    //                                         })
    //                                 } else {
    //                                     tmParallelCallback(null)
    //                                 }
    //                             },
    //                             emailNotification: (tmParallelCallback) => {
    //                                 if (tm.emailNotification) {
    //                                     let mailOptions = {
    //                                         from: '"no-reply" <no-reply@c_cfo.com>', // sender address
    //                                         to: `${tm.user.emailAddress}`, // list of receivers
    //                                         subject: '[CLOUD-CFO]', // Subject line
    //                                         text: 'Task Reminder Before Due Date', // plain text body
    //                                         html: `<p> Task Reminder Before Due Date</p>
    //                                         <p>${e.task}</p>
    //                                         <a href="${ ((process.env.NODE_ENV == "production") ? "https:" : "http:")}${global.site_url}project/${e.projectId}/workstream/${e.workstreamId}?task=${e.id}">Click here</a>
    //                                     `
    //                                     }
    //                                     global.emailtransport(mailOptions)
    //                                     tmParallelCallback(null)
    //                                 } else {
    //                                     tmParallelCallback(null)
    //                                 }
    //                             }
    //                         }, (err, tmParallelCallbackResult) => {
    //                             tmMapCallback(null)
    //                         })

    //                     }, (err, tmMapCallbackResult) => {
    //                         mapCallback(null, tmMapCallbackResult)
    //                     })

    //                 }, (err, mapCallbackResult) => {
    //                     parallelCallback(null)
    //                 })
    //             } else {
    //                 parallelCallback(null)
    //             }
    //         },
    //         sendOnDuedate: (parallelCallback) => {
    //             if (result.onDudate.length) {
    //                 async.map(result.onDudate, (e, mapCallback) => {
    //                     async.map(e.task_member_reminder, (tm, tmMapCallback) => {
    //                         async.parallel({
    //                             defaultNotification: (tmParallelCallback) => {
    //                                 if (tm.defaultNotification) {
    //                                     const dataToSubmit = {
    //                                         usersId: tm.user.id,
    //                                         projectId: e.projectId,
    //                                         linkId: e.id,
    //                                         linkType: 'task',
    //                                         detail: 'Task Reminder On Due Date'
    //                                     }
    //                                     Reminder
    //                                         .create(dataToSubmit)
    //                                         .then((res) => {
    //                                             tmParallelCallback(null, res)
    //                                         })
    //                                 } else {
    //                                     tmParallelCallback(null)
    //                                 }
    //                             },
    //                             emailNotification: (tmParallelCallback) => {
    //                                 if (tm.emailNotification) {
    //                                     let mailOptions = {
    //                                         from: '"no-reply" <no-reply@c_cfo.com>', // sender address
    //                                         to: `${tm.user.emailAddress}`, // list of receivers
    //                                         subject: '[CLOUD-CFO]', // Subject line
    //                                         text: 'Task Reminder On Due Date', // plain text body
    //                                         html: `<p> Task Reminder On Due Date</p>
    //                                         <p>${e.task}</p>
    //                                         <a href="${ ((process.env.NODE_ENV == "production") ? "https:" : "http:")}${global.site_url}project/${e.projectId}/workstream/${e.workstreamId}?task=${e.id}">Click here</a>
    //                                     `
    //                                     }
    //                                     global.emailtransport(mailOptions)
    //                                     tmParallelCallback(null)
    //                                 } else {
    //                                     tmParallelCallback(null)
    //                                 }
    //                             }
    //                         }, (err, tmParallelCallbackResult) => {
    //                             tmMapCallback(null)
    //                         })

    //                     }, (err, tmMapCallbackResult) => {
    //                         mapCallback(null, tmMapCallbackResult)
    //                     })

    //                 }, (err, mapCallbackResult) => {
    //                     parallelCallback(null)
    //                 })
    //             } else {
    //                 parallelCallback(null)
    //             }
    //         }
    //     })
    // })
}, null, true, 'Asia/Manila');

// var j = schedule.scheduleJob('0 0 0 * * *', () => {

// })