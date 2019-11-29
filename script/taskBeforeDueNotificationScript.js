const async = require("async"),
    moment = require("moment"),
    CronJob = require("cron").CronJob;
const { find } = require("lodash")
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

const sendNotification = require("../controller/sendNotification");
/**
 *
 * Comment : Manage notification before task duedate
 *   *    *    *    *    *    *
 *   s    i    H    DM    M   DW
 *
 **/
let keyTimer = 0;
var job = new CronJob(
    "0 7 * * *",
    async () => {
        const models = require("../modelORM");
        const { Tasks, Members, Workstream, Users, Projects } = models;

        let tasks = await Tasks.findAll({
            where: {
                dueDate: moment()
                    .utc()
                    .add(1, "days")
                    .format("YYYY-MM-DD"),
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

                    /* TASK ASSIGNEE NOTIFICATION */
                    await sendNotification({
                        sender: sender,
                        receiver: taskObj.assignee[0].userTypeLinkId,
                        notificationType: "taskBeforeDeadline",
                        notificationData: { task: taskObj, },
                        projectId: taskObj.projectId,
                        workstreamId: taskObj.workstreamId,
                    });

                    /* TASK RESPONSIBLE NOTIFICATION */
                    await sendNotification({
                        sender: sender,
                        receiver: taskObj.workstream.responsible[0].userTypeLinkId,
                        notificationType: "taskResponsibleBeforeDeadline",
                        notificationData: { task: taskObj, },
                        projectId: taskObj.projectId,
                        workstreamId: taskObj.workstreamId,
                    });
                })

                tasks = tasks.filter(taskObj => {
                    return !find(taskNotificationData, { id: taskObj.id });
                })

            } else {
                clearInterval(keyTimer);
            }
        }, 10000);

    },
    null,
    true,
    "Asia/Manila"
);
