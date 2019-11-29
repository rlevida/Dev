const async = require("async"),
    moment = require("moment"),
    CronJob = require("cron").CronJob;

const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const { find } = require("lodash")

const sendNotification = require("../controller/sendNotification");

/**
 *
 * Comment : Manage notification for task overdue
 *   *    *    *    *    *    *
 *   s    i    H    DM    M   DW
 *
 **/
let keyTimer = 0
var job = new CronJob(
    "0 7 * * *",
    async () => {
        const models = require("../modelORM");
        const { Tasks, Members, Users, Workstream, UsersTeam, Teams, Projects } = models;

        let tasks = await Tasks.findAll({
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
                    required: true,
                    where: {
                        isDeleted: 0,
                        isActive: 1
                    },
                    include: [
                        {
                            model: Members,
                            as: "responsible",
                            where: { memberType: "responsible", linkType: "workstream", isDeleted: 0 },
                            required: false
                        }
                    ]
                },
                {
                    model: Projects,
                    as: "task_project",
                    required: true,
                    where: {
                        isActive: 1,
                        isDeleted: 0,
                        appNotification: 1
                    }
                }
            ]
        }).map(res => {
            return res.toJSON();
        })

        /* SEND NOTIFICATION EVERY 10 SECONDS */
        keyTimer = setInterval(() => {
            if (tasks.length > 0) {
                const taskNotificationData = tasks.slice(0, 10);
                taskNotificationData.forEach(async taskObj => {
                    const sender = await Users.findOne({ where: { id: taskObj.assignee[0].userTypeLinkId }, raw: true });

                    /* TASK ASSIGNED NOTIFICATION */
                    const taskAssignedReceiver = taskObj.assignee[0].userTypeLinkId

                    await sendNotification({
                        sender: sender,
                        receiver: taskAssignedReceiver,
                        notificationType: "taskDeadline",
                        notificationData: { task: taskObj, },
                        projectId: taskObj.projectId,
                        workstreamId: taskObj.workstreamId,
                    });

                    /* TASK TEAM LEADER NOTIFICATION */
                    const taskTeamLeadreceiver = await UsersTeam.findAll({
                        where: { usersId: taskObj.assignee[0].userTypeLinkId },
                        include: [
                            {
                                model: Teams,
                                as: "team",
                                required: false
                            }
                        ]
                    }).map(o => {
                        return o.toJSON().team.teamLeaderId;
                    })

                    if (taskTeamLeadreceiver.length > 0) {
                        await sendNotification({
                            sender: sender,
                            receiver: taskTeamLeadreceiver,
                            notificationType: "taskTeamDeadline",
                            notificationData: { task: taskObj, },
                            projectId: taskObj.projectId,
                            workstreamId: taskObj.workstreamId,
                        });
                    }

                    /* TASK FOLLOWER NOTIFICATION */
                    const taskFollowerReceiver = taskObj.follower.map(e => {
                        return e.userTypeLinkId;
                    });

                    if (taskFollowerReceiver.length > 0) {
                        await sendNotification({
                            sender: sender,
                            receiver: taskFollowerReceiver,
                            notificationType: "taskFollowingDeadline",
                            notificationData: { task: taskObj, },
                            projectId: taskObj.projectId,
                            workstreamId: taskObj.workstreamId,
                        });
                    }

                    /* TASK RESPONSIBLE NOTIFICATION */
                    const taskResponsibleReceiver = taskObj.workstream.responsible[0].userTypeLinkId;

                    if (taskResponsibleReceiver.length > 0) {
                        await sendNotification({
                            sender: sender,
                            receiver: taskResponsibleReceiver,
                            notificationType: "taskResponsibleDeadline",
                            notificationData: { task: taskObj, },
                            projectId: taskObj.projectId,
                            workstreamId: taskObj.workstreamId,
                        });
                    }
                })

                tasks = tasks.filter(taskObj => {
                    return !find(taskNotificationData, { id: taskObj.id });
                })

            } else {
                clearInterval(keyTimer);
            }
        }, 10000);


        return


    },
    null,
    true,
    "Asia/Manila"
);
