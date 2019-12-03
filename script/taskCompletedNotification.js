const
    moment = require("moment"),
    { omit } = require("lodash"),
    CronJob = require("cron").CronJob, func = global.initFunc();

const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const notificationTemplate = global.notificationEmailTemplate()

/**
 *
 * Comment : Manage notification for task overdue
 *   *    *    *    *    *    *
 *   s    i    H    DM    M   DW
 *
 **/

/* Notification for completed tasks under my team */
var job = new CronJob(
    "0 7 * * *",
    async () => {
        try {
            const models = require("../modelORM");
            const { Tasks, Members, Users, Projects, UsersNotificationSetting, Type, Teams, UsersTeam } = models;

            /* Get all task that are completed yesterday under my team */
            const usersTasks = await Users.findAll({
                where: { isActive: 1, isDeleted: 0, firstName: { [Op.ne]: "default" } },
                include: [
                    {
                        model: UsersNotificationSetting,
                        as: "user_notification_setting",
                    },
                    {
                        /* task assigned team leader include */
                        model: Teams,
                        as: "task_team_leader",
                        required: true,
                        include: [{
                            model: UsersTeam,
                            required: true,
                            as: 'task_team_member',
                            include: [{
                                model: Members,
                                required: true,
                                as: "task_team_member_assigned",
                                where: {
                                    linkType: "task", memberType: "assignedTo", isDeleted: 0
                                },
                                include: [{
                                    model: Tasks,
                                    as: 'assigned_task',
                                    required: true,
                                    where: {
                                        isActive: 1,
                                        dateCompleted: {
                                            [Op.gt]: moment().subtract(1, 'days').startOf('day').utc().format(),
                                            [Op.lt]: moment().subtract(1, 'days').endOf('day').utc().format()
                                        },
                                        status: "Completed"
                                    },
                                    /* Used in creating notification email table in task assigned column */
                                    include: [
                                        {
                                            model: Members,
                                            as: "assignee",
                                            where: {
                                                linkType: 'task',
                                                memberType: 'assignedTo',
                                                isDeleted: 0
                                            },
                                            include: [{ model: Users, as: "user" }]
                                        },
                                        {
                                            model: Projects,
                                            as: "task_project",
                                            required: true,
                                            where: { isActive: 1 },
                                            include: [{
                                                model: Type,
                                                as: "type",
                                                required: false,
                                                attributes: ["type"]
                                            }]
                                        },
                                    ]
                                }],
                            }]
                        }]
                    },
                ]
            }).map((usersTasksResponse) => {
                const { taskMemberCompleted } = { ...usersTasksResponse.toJSON().user_notification_setting }
                let teamLeaderTasks = [];

                if (taskMemberCompleted) {
                    /* Get all the task of a team members */
                    usersTasksResponse.toJSON().task_team_leader.forEach((teamObj) => {
                        teamObj.task_team_member.forEach((teamMemberObj) => {
                            teamMemberObj.task_team_member_assigned.forEach((teamMemberAssignedObj) => {
                                teamMemberAssignedObj.assigned_task.forEach((task) => {
                                    teamLeaderTasks.push(task);
                                })
                            })
                        })
                    })
                }

                /* omit to remove members field, uniqBy to remove duplicate data */
                return {
                    ...omit(usersTasksResponse.toJSON(), "members", "task_team_leader"), teamLeaderTasks
                }
            })
            /* Send email notification to task assigned, task follower, task assigned team leader */
            usersTasks.forEach((user) => {
                if (user.user_notification_setting.receiveEmail) {
                    if (user.teamLeaderTasks.length > 0) {
                        const taskTeamLeaderEmail = notificationTemplate.taskCompletedNotification({ ...user, tasks: user.teamLeaderTasks, message: "Some tasks under your team have been completed", memberType: "myTeam" });
                        const mailOptions = func.MailOptions({ to: `${user.emailAddress}`, html: taskTeamLeaderEmail, subject: "Completed tasks under my team" })
                        global.emailtransport(mailOptions);
                    }
                }
            })
        } catch (err) {
            console.error(err)
        }
    },
    null,
    true,
    "Asia/Manila"
);

/* Notification for following task have been completed */
var job = new CronJob(
    "0 7 * * *",
    async () => {
        try {
            const models = require("../modelORM");
            const { Tasks, Members, Users, Projects, UsersNotificationSetting, Type } = models;

            /* Get all task that are completed yesterday under my team */
            const usersTasks = await Users.findAll({
                where: { isActive: 1, isDeleted: 0, firstName: { [Op.ne]: "default" } },
                include: [
                    {
                        model: UsersNotificationSetting,
                        as: "user_notification_setting",
                    },
                    {
                        /* task follower include */
                        model: Members,
                        as: "task_follower",
                        required: true,
                        where: { linkType: "task", memberType: "follower", isDeleted: 0 },
                        include: [{
                            model: Tasks,
                            as: 'follower_task',
                            required: true,
                            where: {
                                isActive: 1,
                                dateCompleted: {
                                    [Op.gt]: moment().subtract(1, 'days').startOf('day').utc().format(),
                                    [Op.lt]: moment().subtract(1, 'days').endOf('day').utc().format()
                                },
                                status: "Completed"
                            },
                            /* Used in creating notification email table in task assigned column */
                            include: [
                                {
                                    model: Members,
                                    as: "assignee",
                                    where: {
                                        linkType: 'task',
                                        memberType: 'assignedTo',
                                        isDeleted: 0
                                    },
                                    include: [{ model: Users, as: "user" }]
                                },
                                {
                                    model: Projects,
                                    as: "task_project",
                                    required: true,
                                    where: { isActive: 1 },
                                    include: [{
                                        model: Type,
                                        as: "type",
                                        required: false,
                                        attributes: ["type"]
                                    }]
                                },
                            ]
                        }]
                    },
                ]
            }).map((usersTasksResponse) => {
                const { taskFollowingCompleted } = { ...usersTasksResponse.toJSON().user_notification_setting }
                let followerTasks = [];

                if (taskFollowingCompleted) {
                    /* Get all the follower tasks */
                    usersTasksResponse.toJSON().task_follower.forEach((taskAssignedObj) => {
                        taskAssignedObj.follower_task.forEach((task) => {
                            followerTasks.push(task)
                        })
                    })
                }

                /* omit to remove members field, uniqBy to remove duplicate data */
                return {
                    ...omit(usersTasksResponse.toJSON(), "members", "task_follower"), followerTasks
                }
            })

            /* Send email notification to task assigned, task follower, task assigned team leader */
            usersTasks.forEach((user) => {
                if (user.user_notification_setting.receiveEmail) {
                    if (user.followerTasks.length > 0) {
                        const taskFollowerEmail = notificationTemplate.taskCompletedNotification({ ...user, tasks: user.followerTasks, message: "Some tasks you are following have been completed", memberType: "following" });
                        const mailOptions = func.MailOptions({ to: user.emailAddress, html: taskFollowerEmail, subject: "Tasks you are following have been completed" });
                        global.emailtransport(mailOptions);
                    }
                }
            })
        } catch (err) {
            console.error(err)
        }
    },
    null,
    true,
    "Asia/Manila"
);

