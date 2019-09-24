const async = require("async"),
    moment = require("moment"),
    _ = require("lodash"),
    CronJob = require("cron").CronJob;

const Sequelize = require("sequelize");
const Op = Sequelize.Op;

/**
 *
 * Comment : Manage notification for task overdue
 *   *    *    *    *    *    *
 *   s    i    H    DM    M   DW
 *
 **/

var job = new CronJob(
    "0 7 * * *",
    function() {
        const models = require("../modelORM");
        const { Tasks, Members, Users, Workstream, Projects, UsersNotificationSetting, Notification, UsersTeam, Teams, Type } = models;

        Tasks.findAll({
            where: {
                dueDate: {
                    [Op.lt]: moment()
                        .utc()
                        .format("YYYY-MM-DD")
                },
                isActive: 1,
                status: {
                    [Op.ne]: "Completed"
                }
            },
            include: [
                {
                    model: Members,
                    as: "assignee",
                    attributes: ["userTypeLinkId"],
                    where: { memberType: "assignedTo", linkType: "task", isDeleted: 0 },
                    required: false
                },
                {
                    model: Members,
                    as: "follower",
                    required: false,
                    attributes: ["userTypeLinkId"],
                    where: { memberType: "follower", linkType: "task", isDeleted: 0 }
                },
                {
                    model: Workstream,
                    as: "workstream",
                    required: false,
                    include: [
                        {
                            model: Members,
                            as: "responsible",
                            where: { memberType: "responsible", linkType: "workstream", isDeleted: 0 },
                            required: false
                        }
                    ]
                }
            ]
        })
            .map(res => {
                return res.toJSON();
            })
            .then(res => {
                async.map(
                    res,
                    (e, mapCallback) => {
                        async.parallel(
                            {
                                notificationAssgined: parallelCallback => {
                                    try {
                                        const receiver = e.assignee[0].userTypeLinkId;

                                        UsersNotificationSetting.findAll({
                                            where: { usersId: receiver },
                                            include: [
                                                {
                                                    model: Users,
                                                    as: "notification_setting",
                                                    required: false
                                                }
                                            ]
                                        })
                                            .map(response => {
                                                return response.toJSON();
                                            })
                                            .then(async response => {
                                                let notificationArr = await _.filter(response, nSetting => {
                                                    return nSetting.taskDeadline === 1;
                                                }).map(nSetting => {
                                                    const { emailAddress } = { ...nSetting.notification_setting };
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
                                                    };
                                                });

                                                Notification.bulkCreate(notificationArr)
                                                    .map(notificationRes => {
                                                        return notificationRes.id;
                                                    })
                                                    .then(notificationRes => {
                                                        Notification.findAll({
                                                            where: { id: notificationRes },
                                                            include: [
                                                                {
                                                                    model: Users,
                                                                    as: "to",
                                                                    required: false,
                                                                    attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                                },
                                                                {
                                                                    model: Projects,
                                                                    as: "project_notification",
                                                                    required: false,
                                                                    include: [
                                                                        {
                                                                            model: Type,
                                                                            as: "type",
                                                                            required: false,
                                                                            attributes: ["type"]
                                                                        }
                                                                    ]
                                                                },
                                                                {
                                                                    model: Users,
                                                                    as: "from",
                                                                    required: false,
                                                                    attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                                },
                                                                {
                                                                    model: Workstream,
                                                                    as: "workstream_notification",
                                                                    required: false,
                                                                    attributes: ["workstream"]
                                                                },
                                                                {
                                                                    model: Tasks,
                                                                    as: "task_notification",
                                                                    required: false,
                                                                    attributes: ["task"]
                                                                }
                                                            ]
                                                        })
                                                            .map(findNotificationRes => {
                                                                return findNotificationRes.toJSON();
                                                            })
                                                            .then(() => {
                                                                async.map(
                                                                    notificationArr,
                                                                    ({ emailAddress, message, receiveEmail, projectId, workstreamId, taskId }, mapCallback) => {
                                                                        if (receiveEmail === 1) {
                                                                            let html = "<p>" + message + "</p>";
                                                                            html += '<p style="margin-bottom:0">Title: ' + message + "</p>";
                                                                            html += `<p>Message:<br>${message}</p>`;
                                                                            html += ` <a href="${process.env.NODE_ENV == "production" ? "https:" : "http:"}${
                                                                                global.site_url
                                                                            }account#/projects/${projectId}/workstreams/${workstreamId}?task-id=${taskId}">Click here</a>`;
                                                                            html += `<p>Date:<br>${moment().format("LLL")}</p>`;

                                                                            const mailOptions = {
                                                                                from: '"no-reply" <no-reply@c_cfo.com>',
                                                                                to: `${emailAddress}`,
                                                                                subject: "[CLOUD-CFO]",
                                                                                html: html
                                                                            };
                                                                            global.emailtransport(mailOptions);
                                                                        }
                                                                        mapCallback(null);
                                                                    },
                                                                    err => {
                                                                        parallelCallback(null);
                                                                    }
                                                                );
                                                            });
                                                    });
                                            });
                                    } catch (err) {
                                        console.error(err);
                                        parallelCallback(null);
                                    }
                                },
                                notificationTeamLeader: parallelCallback => {
                                    try {
                                        UsersTeam.findAll({
                                            where: { usersId: e.assignee[0].userTypeLinkId },
                                            include: [
                                                {
                                                    model: Teams,
                                                    as: "team",
                                                    required: false
                                                }
                                            ]
                                        })
                                            .map(o => {
                                                return o.toJSON().team.teamLeaderId;
                                            })
                                            .then(async o => {
                                                const receiver = _.union(o);

                                                UsersNotificationSetting.findAll({
                                                    where: { usersId: receiver },
                                                    include: [
                                                        {
                                                            model: Users,
                                                            as: "notification_setting",
                                                            required: false
                                                        }
                                                    ]
                                                })
                                                    .map(response => {
                                                        return response.toJSON();
                                                    })
                                                    .then(async response => {
                                                        let notificationArr = await _.filter(response, nSetting => {
                                                            return nSetting.taskTeamDeadline === 1;
                                                        }).map(nSetting => {
                                                            const { emailAddress } = { ...nSetting.notification_setting };
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
                                                            };
                                                        });

                                                        Notification.bulkCreate(notificationArr)
                                                            .map(notificationRes => {
                                                                return notificationRes.id;
                                                            })
                                                            .then(notificationRes => {
                                                                Notification.findAll({
                                                                    where: { id: notificationRes },
                                                                    include: [
                                                                        {
                                                                            model: Users,
                                                                            as: "to",
                                                                            required: false,
                                                                            attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                                        },
                                                                        {
                                                                            model: Users,
                                                                            as: "from",
                                                                            required: false,
                                                                            attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                                        },
                                                                        {
                                                                            model: Projects,
                                                                            as: "project_notification",
                                                                            required: false,
                                                                            include: [
                                                                                {
                                                                                    model: Type,
                                                                                    as: "type",
                                                                                    required: false,
                                                                                    attributes: ["type"]
                                                                                }
                                                                            ]
                                                                        },
                                                                        {
                                                                            model: Workstream,
                                                                            as: "workstream_notification",
                                                                            required: false,
                                                                            attributes: ["workstream"]
                                                                        },
                                                                        {
                                                                            model: Tasks,
                                                                            as: "task_notification",
                                                                            required: false,
                                                                            attributes: ["task"]
                                                                        }
                                                                    ]
                                                                })
                                                                    .map(findNotificationRes => {
                                                                        return findNotificationRes.toJSON();
                                                                    })
                                                                    .then(() => {
                                                                        async.map(
                                                                            notificationArr,
                                                                            ({ emailAddress, message, receiveEmail, projectId, workstreamId, taskId }, mapCallback) => {
                                                                                if (receiveEmail === 1) {
                                                                                    let html = "<p>" + message + "</p>";
                                                                                    html += '<p style="margin-bottom:0">Title: ' + message + "</p>";
                                                                                    html += `<p>Message:<br>${message}</p>`;
                                                                                    html += ` <a href="${process.env.NODE_ENV == "production" ? "https:" : "http:"}${
                                                                                        global.site_url
                                                                                    }account#/projects/${projectId}/workstreams/${workstreamId}?task-id=${taskId}">Click here</a>`;
                                                                                    html += `<p>Date:<br>${moment().format("LLL")}</p>`;

                                                                                    const mailOptions = {
                                                                                        from: '"no-reply" <no-reply@c_cfo.com>',
                                                                                        to: `${emailAddress}`,
                                                                                        subject: "[CLOUD-CFO]",
                                                                                        html: html
                                                                                    };
                                                                                    global.emailtransport(mailOptions);
                                                                                }
                                                                                mapCallback(null);
                                                                            },
                                                                            err => {
                                                                                parallelCallback(null);
                                                                            }
                                                                        );
                                                                    });
                                                            });
                                                    });
                                            });
                                    } catch (err) {
                                        console.error(err);
                                        parallelCallback(null);
                                    }
                                },
                                notificationTaskFollower: parallelCallback => {
                                    try {
                                        const receiver = e.follower.map(e => {
                                            return e.userTypeLinkId;
                                        });
                                        UsersNotificationSetting.findAll({
                                            where: { usersId: receiver },
                                            include: [
                                                {
                                                    model: Users,
                                                    as: "notification_setting",
                                                    required: false
                                                }
                                            ]
                                        })
                                            .map(response => {
                                                return response.toJSON();
                                            })
                                            .then(async response => {
                                                let message = "";
                                                message = `Task following seem to have missed a deadline.`;

                                                let notificationArr = await _.filter(response, nSetting => {
                                                    return nSetting.taskFollowingDeadline === 1;
                                                }).map(nSetting => {
                                                    const { emailAddress } = { ...nSetting.notification_setting };
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
                                                    };
                                                });

                                                Notification.bulkCreate(notificationArr)
                                                    .map(notificationRes => {
                                                        return notificationRes.id;
                                                    })
                                                    .then(notificationRes => {
                                                        Notification.findAll({
                                                            where: { id: notificationRes },
                                                            include: [
                                                                {
                                                                    model: Users,
                                                                    as: "to",
                                                                    required: false,
                                                                    attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                                },
                                                                {
                                                                    model: Users,
                                                                    as: "from",
                                                                    required: false,
                                                                    attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                                },
                                                                {
                                                                    model: Projects,
                                                                    as: "project_notification",
                                                                    required: false,
                                                                    include: [
                                                                        {
                                                                            model: Type,
                                                                            as: "type",
                                                                            required: false,
                                                                            attributes: ["type"]
                                                                        }
                                                                    ]
                                                                },
                                                                {
                                                                    model: Workstream,
                                                                    as: "workstream_notification",
                                                                    required: false,
                                                                    attributes: ["workstream"]
                                                                },
                                                                {
                                                                    model: Tasks,
                                                                    as: "task_notification",
                                                                    required: false,
                                                                    attributes: ["task"]
                                                                }
                                                            ]
                                                        })
                                                            .map(findNotificationRes => {
                                                                return findNotificationRes.toJSON();
                                                            })
                                                            .then(() => {
                                                                async.map(
                                                                    notificationArr,
                                                                    ({ emailAddress, message, receiveEmail, projectId, workstreamId, taskId }, mapCallback) => {
                                                                        if (receiveEmail === 1) {
                                                                            let html = "<p>" + message + "</p>";
                                                                            html += '<p style="margin-bottom:0">Title: ' + message + "</p>";
                                                                            html += `<p>Message:<br>${message}</p>`;
                                                                            html += ` <a href="${process.env.NODE_ENV == "production" ? "https:" : "http:"}${
                                                                                global.site_url
                                                                            }account#/projects/${projectId}/workstreams/${workstreamId}?task-id=${taskId}">Click here</a>`;
                                                                            html += `<p>Date:<br>${moment().format("LLL")}</p>`;

                                                                            const mailOptions = {
                                                                                from: '"no-reply" <no-reply@c_cfo.com>',
                                                                                to: `${emailAddress}`,
                                                                                subject: "[CLOUD-CFO]",
                                                                                html: html
                                                                            };
                                                                            global.emailtransport(mailOptions);
                                                                        }
                                                                        mapCallback(null);
                                                                    },
                                                                    err => {
                                                                        parallelCallback(null);
                                                                    }
                                                                );
                                                            });
                                                    });
                                            });
                                    } catch (err) {
                                        console.error(err);
                                        parallelCallback(null);
                                    }
                                },
                                notificationTaskResponsible: parallelCallback => {
                                    try {
                                        const receiver = e.workstream.responsible[0].userTypeLinkId;
                                        UsersNotificationSetting.findAll({
                                            where: { usersId: receiver },
                                            include: [
                                                {
                                                    model: Users,
                                                    as: "notification_setting",
                                                    required: false
                                                }
                                            ]
                                        })
                                            .map(response => {
                                                return response.toJSON();
                                            })
                                            .then(async response => {
                                                let message = "";
                                                message = `Task seem to have missed a deadline as a responsible.`;
                                                let notificationArr = await _.filter(response, nSetting => {
                                                    return nSetting.taskFollowingDeadline === 1;
                                                }).map(nSetting => {
                                                    const { emailAddress } = { ...nSetting.notification_setting };

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
                                                    };
                                                });
                                                Notification.bulkCreate(notificationArr)
                                                    .map(notificationRes => {
                                                        return notificationRes.id;
                                                    })
                                                    .then(notificationRes => {
                                                        Notification.findAll({
                                                            where: { id: notificationRes },
                                                            include: [
                                                                {
                                                                    model: Users,
                                                                    as: "to",
                                                                    required: false,
                                                                    attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                                },
                                                                {
                                                                    model: Users,
                                                                    as: "from",
                                                                    required: false,
                                                                    attributes: ["emailAddress", "firstName", "lastName", "avatar"]
                                                                },
                                                                {
                                                                    model: Projects,
                                                                    as: "project_notification",
                                                                    required: false,
                                                                    include: [
                                                                        {
                                                                            model: Type,
                                                                            as: "type",
                                                                            required: false,
                                                                            attributes: ["type"]
                                                                        }
                                                                    ]
                                                                },
                                                                {
                                                                    model: Workstream,
                                                                    as: "workstream_notification",
                                                                    required: false,
                                                                    attributes: ["workstream"]
                                                                },
                                                                {
                                                                    model: Tasks,
                                                                    as: "task_notification",
                                                                    required: false,
                                                                    attributes: ["task"]
                                                                }
                                                            ]
                                                        })
                                                            .map(findNotificationRes => {
                                                                return findNotificationRes.toJSON();
                                                            })
                                                            .then(() => {
                                                                async.map(
                                                                    notificationArr,
                                                                    ({ emailAddress, message, receiveEmail, projectId, workstreamId, taskId }, mapCallback) => {
                                                                        if (receiveEmail === 1) {
                                                                            let html = "<p>" + message + "</p>";
                                                                            html += '<p style="margin-bottom:0">Title: ' + message + "</p>";
                                                                            html += `<p>Message:<br>${message}</p>`;
                                                                            html += ` <a href="${process.env.NODE_ENV == "production" ? "https:" : "http:"}${
                                                                                global.site_url
                                                                            }account#/projects/${projectId}/workstreams/${workstreamId}?task-id=${taskId}">Click here</a>`;
                                                                            html += `<p>Date:<br>${moment().format("LLL")}</p>`;

                                                                            const mailOptions = {
                                                                                from: '"no-reply" <no-reply@c_cfo.com>',
                                                                                to: `${emailAddress}`,
                                                                                subject: "[CLOUD-CFO]",
                                                                                html: html
                                                                            };
                                                                            global.emailtransport(mailOptions);
                                                                        }
                                                                        mapCallback(null);
                                                                    },
                                                                    err => {
                                                                        parallelCallback(null);
                                                                    }
                                                                );
                                                            });
                                                    });
                                            });
                                    } catch (err) {
                                        console.error(err);
                                        parallelCallback(null);
                                    }
                                }
                            },
                            () => {
                                mapCallback(null);
                            }
                        );
                    },
                    () => {
                        return;
                    }
                );
            });
    },
    null,
    true,
    "Asia/Manila"
);
