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
                dueDate: moment().utc().add(1, 'days').format("YYYY-MM-DD"),
                isActive: 1
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
            }],
        })
        .map((res) => {
            return res.toJSON();
        })
        .then((res) => {
            async.map(res, (e, mapCallback) => {
                async.parallel({
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
                                message = `Task about to be due`;
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
                                        type: "taskResponsibleBeforeDeadline",
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
}, null, true, 'Asia/Manila');

// var j = schedule.scheduleJob('0 0 0 * * *', () => {

// })