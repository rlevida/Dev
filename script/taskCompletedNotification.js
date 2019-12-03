const moment = require("moment");
const { omit, uniqBy, find } = require("lodash");
const CronJob = require("cron").CronJob;
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

const taskCompletedNotification = require("../controller/sendNotification//template/taskCompletedNotification")

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
            let usersTasks = await Users.findAll({
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
                                            where: { isActive: 1, isDeleted: 0, appNotification: 1 },
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
            /* SEND NOTIFICATION EVERY 10 SECONDS */

            keyTimer = setInterval(() => {
                if (usersTasks.length > 0) {
                    const taskNotificationData = usersTasks.slice(0, 10);

                    taskNotificationData.forEach(async user => {
                        if (user.user_notification_setting.receiveEmail) {
                            if (user.teamLeaderTasks.length > 0) {
                                const tasks = user.teamLeaderTasks.filter((taskObj => { return taskObj.task_project.emailNotification }));
                                const message = "Some tasks under your team have been completed";
                                const memberType = "myTeam";
                                const subject = "Completed tasks under my team";
                                const receiver = user.emailAddress;
                                const icons = tasks.map((taskObj) => {
                                    return taskObj.task_project.type.type
                                })
                                taskCompletedNotification({ ...user, tasks, message, memberType, subject, receiver, icons: uniqBy(icons) });
                            }
                        }
                    })

                    usersTasks = usersTasks.filter(user => {
                        return !find(taskNotificationData, { id: user.id });
                    })

                } else {
                    clearInterval(keyTimer);
                }
            }, 10000);

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
            let usersTasks = await Users.findAll({
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
                                    where: { isActive: 1, isDeleted: 0, appNotification: 1 },
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
            /* SEND NOTIFICATION EVERY 10 SECONDS */

            keyTimer = setInterval(() => {
                if (usersTasks.length > 0) {
                    const taskNotificationData = usersTasks.slice(0, 10);
                    taskNotificationData.forEach(async user => {
                        if (user.user_notification_setting.receiveEmail) {
                            if (user.followerTasks.length > 0) {
                                const tasks = user.followerTasks.filter((taskObj => { return taskObj.task_project.emailNotification }));
                                const message = "Some tasks you are following have been completed";
                                const memberType = "following";
                                const subject = "Tasks you are following have been completed";
                                const receiver = user.emailAddress;
                                const icons = tasks.map((taskObj) => {
                                    return taskObj.task_project.type.type
                                })
                                taskCompletedNotification({ ...user, tasks, message, memberType, subject, receiver, icons: uniqBy(icons) });
                            }
                        }
                    })

                    usersTasks = usersTasks.filter(user => {
                        return !find(taskNotificationData, { id: user.id });
                    })

                } else {
                    clearInterval(keyTimer);
                }
            }, 10000);
        } catch (err) {
            console.error(err)
        }
    },
    null,
    true,
    "Asia/Manila"
);

