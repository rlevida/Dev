const async = require("async"),
    moment = require("moment"),
    _ = require("lodash"),
    CronJob = require("cron").CronJob;

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

var job = new CronJob(
    "0 7 * * *",
    async () => {
        const models = require("../modelORM");
        const { Tasks, Members, Workstream, Users } = models;

        const taskFindResult = await Tasks.findAll({
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
        }).map(res => {
            return res.toJSON();
        })

        taskFindResult.forEach(async taskObj => {
            const sender = await Users.findOne({ where: { id: taskObj.assignee[0].userTypeLinkId }, raw: true });
            const receiver = taskObj.workstream.responsible[0].userTypeLinkId;

            await sendNotification({
                sender: sender,
                receiver: receiver,
                notificationType: "taskResponsibleBeforeDeadline",
                notificationData: { task: taskObj, },
                projectId: taskObj.projectId,
                workstreamId: taskObj.workstreamId,
            });

            await sendNotification({
                sender: sender,
                receiver: taskObj.assignee[0].userTypeLinkId,
                notificationType: "taskBeforeDeadline",
                notificationData: { task: taskObj, },
                projectId: taskObj.projectId,
                workstreamId: taskObj.workstreamId,
            });
        })
    },
    null,
    true,
    "Asia/Manila"
);
