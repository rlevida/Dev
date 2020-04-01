const moment = require("moment");
const { omit, uniqBy, find } = require("lodash");
const CronJob = require("cron").CronJob;
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

const taskDuedateNotification = require("../controller/sendNotification/taskDuedateNotification")

/**
 *
 * Comment : Manage notification for task overdue
 *   *    *    *    *    *    *
 *   s    i    H    DM    M   DW
 *
 **/

/* TASK BEFORE DUEDATE NOTIFICATION */
var job = new CronJob(
    "0 7 * * *",
    async () => {
        try {
            const models = require("../modelORM");
            const { Tasks, Members, Users, Projects, UsersNotificationSetting, Type, Notification, Workstream } = models;

            /* Use as sender of email or notifcation */
            const noReplyUser = await Users.findOne({ where: { firstName: "default", lastName: "default", }, raw: true })

            /* Get all task with one day before duedate */
            let usersTasks = await Users.findAll({
                where: { isActive: 1, isDeleted: 0, firstName: { [Op.ne]: "default" } },
                include: [
                    {
                        model: UsersNotificationSetting,
                        as: "user_notification_setting",
                        required: false,
                    },
                    {
                        /*  task assigned include */
                        model: Members,
                        as: "task_assigned",
                        required: false,
                        where: { linkType: "task", memberType: "assignedTo", isDeleted: 0 },
                        include: [{
                            model: Tasks,
                            as: 'assigned_task',
                            required: true,
                            where: {
                                isActive: 1,
                                isDeleted: 0,
                                dueDate: {
                                    [Op.between]: [moment().add(1, "days").startOf("day").utc().format(), moment().add(1, "days").endOf("day").utc().format()]
                                },
                                status: {
                                    [Op.ne]: "Completed"
                                }
                            },
                            /* Used in creating notification email table in task assigned column */
                            include: [
                                {
                                    model: Members,
                                    as: "assignee",
                                    where: {
                                        linkType: 'task',
                                        memberType: 'assignedTo'
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
                                {
                                    model: Workstream,
                                    as: "workstream",
                                    required: true,
                                    where: {
                                        isActive: 1,
                                        isDeleted: 0
                                    },
                                    attributes: ["id"]
                                }
                            ]
                        }],
                    },
                    {
                        /*  task workstream responsible include */
                        model: Members,
                        as: "task_responsible",
                        required: false,
                        where: { linkType: "workstream", memberType: "responsible", isDeleted: 0 },
                        include: [{
                            model: Tasks,
                            as: 'responsible_task',
                            required: true,
                            where: {
                                isActive: 1,
                                isDeleted: 0,
                                dueDate: {
                                    [Op.between]: [moment().add(1, "days").startOf("day").utc().format(), moment().add(1, "days").endOf("day").utc().format()]
                                },
                                status: {
                                    [Op.ne]: "Completed"
                                }
                            },
                            /* Used in creating notification email table in task assigned column */
                            include: [
                                {
                                    model: Members,
                                    as: "assignee",
                                    where: {
                                        linkType: 'task',
                                        memberType: 'assignedTo'
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
                                {
                                    model: Workstream,
                                    as: "workstream",
                                    required: true,
                                    where: {
                                        isActive: 1,
                                        isDeleted: 0
                                    },
                                    attributes: ["id"]
                                }
                            ]
                        }],
                    }
                ]
            }).map((usersTasksResponse) => {
                const { taskBeforeDeadline } = { ...usersTasksResponse.toJSON().user_notification_setting }
                let assignedTasks = [], responsibleTasks = [];

                if (taskBeforeDeadline) {
                    /* Get all the assigned tasks */
                    usersTasksResponse.toJSON().task_assigned.forEach((taskAssignedObj) => {
                        taskAssignedObj.assigned_task.forEach((task) => {
                            assignedTasks.push(task)
                        })
                    })

                    /* Get all the responsible tasks */
                    usersTasksResponse.toJSON().task_responsible.forEach((taskResponsibleObj) => {
                        taskResponsibleObj.responsible_task.forEach((task) => {
                            responsibleTasks.push(task)
                        })
                    })
                }

                /* omit to remove members field, uniqBy to remove duplicate data */
                return { ...omit(usersTasksResponse.toJSON(), "members"), assignedTasks: assignedTasks, responsibleTasks: responsibleTasks }
            })

            /* Create assigned and responsible notification */
            const notificationToCreate = []

            usersTasks.forEach((user) => {
                user.assignedTasks.forEach((task) => {
                    notificationToCreate.push({
                        usersId: user.id,
                        createdBy: noReplyUser.id,
                        projectId: task.projectId,
                        taskId: task.id,
                        workstreamId: task.workstreamId,
                        type: "taskBeforeDeadline",
                        message: "Task about to be due",
                    })
                })
                user.responsibleTasks.forEach((task) => {
                    notificationToCreate.push({
                        usersId: user.id,
                        createdBy: noReplyUser.id,
                        projectId: task.projectId,
                        taskId: task.id,
                        workstreamId: task.workstreamId,
                        type: "taskBeforeDeadline",
                        message: "Task about to be due as responsible",
                    })
                })
            })

            /* Create In-App Notification */
            await Notification.bulkCreate(notificationToCreate);

            /* Create Email Notification */
            /* SEND NOTIFICATION EVERY 10 SECONDS */
            keyTimer = setInterval(() => {
                if (usersTasks.length > 0) {
                    const taskNotificationData = usersTasks.slice(0, 10);

                    taskNotificationData.forEach(async user => {
                        if (user.user_notification_setting.receiveEmail) {
                            if (user.assignedTasks.length > 0) {
                                const tasks = user.assignedTasks.filter(taskObj => { return taskObj.task_project.emailNotification });
                                const message = "Some tasks are about to be due";
                                const memberType = "assignedToMe";
                                const subject = "Tasks due tomorrow!";
                                const receiver = user.emailAddress;
                                const icons = tasks.map((taskObj) => {
                                    return taskObj.task_project.type.type
                                })
                                taskDuedateNotification({ ...user, tasks, message, memberType, receiver, subject, icons: uniqBy(icons) });
                            }

                            if (user.responsibleTasks.length > 0) {
                                const tasks = user.responsibleTasks.filter(taskObj => { return taskObj.task_project.emailNotification });
                                const message = "Some tasks are about to be due";
                                const subject = "Tasks due tomorrow!";
                                const receiver = user.emailAddress;
                                const icons = tasks.map((taskObj) => {
                                    return taskObj.task_project.type.type
                                })
                                taskDuedateNotification({ ...user, tasks, message, receiver, subject, icons: uniqBy(icons) });
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

var ctr = 0;

/* TASK OVERDUE NOTIFICATION */
var job = new CronJob(
    "0 7 * * *",
    async () => {

        try {
            const models = require("../modelORM");
            const { Tasks, Members, Users, Projects, UsersNotificationSetting, Type, Teams, UsersTeam, Notification, Workstream } = models;

            /* Use as sender of email or notifcation */
            const noReplyUser = await Users.findOne({ where: { firstName: "default", lastName: "default", }, raw: true });

            /* Get all task with one day before duedate */
            let usersTasks = await Users.findAll({
                where: { isActive: 1, isDeleted: 0, firstName: { [Op.ne]: "default" } },
                include: [
                    {
                        model: UsersNotificationSetting,
                        as: "user_notification_setting",
                    },
                    {
                        /*  task assigned include */
                        model: Members,
                        as: "task_assigned",
                        required: false,
                        where: { linkType: "task", memberType: "assignedTo", isDeleted: 0 },
                        include: [{
                            model: Tasks,
                            as: 'assigned_task',
                            required: true,
                            where: {
                                isActive: 1,
                                isDeleted: 0,
                                dueDate: {
                                    [Op.lt]: moment().startOf("day").utc().format()
                                },
                                status: {
                                    [Op.ne]: "Completed"
                                }
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
                                {
                                    model: Workstream,
                                    as: "workstream",
                                    required: true,
                                    where: {
                                        isActive: 1,
                                        isDeleted: 0
                                    },
                                    attributes: ["id"]
                                }
                            ]
                        }],
                    },
                    {
                        /* task follower include */
                        model: Members,
                        as: "task_follower",
                        required: false,
                        where: { linkType: "task", memberType: "follower", isDeleted: 0 },
                        include: [{
                            model: Tasks,
                            as: 'follower_task',
                            required: true,
                            where: {
                                isActive: 1,
                                isDeleted: 0,
                                dueDate: {
                                    [Op.lt]: moment().startOf("day").utc().format()
                                },
                                status: {
                                    [Op.ne]: "Completed"
                                }
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
                                {
                                    model: Workstream,
                                    as: "workstream",
                                    required: true,
                                    where: {
                                        isActive: 1,
                                        isDeleted: 0
                                    },
                                    attributes: ["id"]
                                }
                            ]
                        }]
                    },
                    {
                        /* task assigned team leader include */
                        model: Teams,
                        as: "task_team_leader",
                        required: false,
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
                                        isDeleted: 0,
                                        dueDate: {
                                            [Op.lt]: moment().startOf("day").utc().format()
                                        },
                                        status: {
                                            [Op.ne]: "Completed"
                                        }
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
                                        {
                                            model: Workstream,
                                            as: "workstream",
                                            required: true,
                                            where: {
                                                isActive: 1,
                                                isDeleted: 0
                                            },
                                            attributes: ["id"]
                                        }
                                    ]
                                }],
                            }]
                        }]
                    },
                ]
            }).map((usersTasksResponse) => {
                const { taskDeadline } = { ...usersTasksResponse.toJSON().user_notification_setting }
                let assignedTasks = [], followerTasks = [], teamLeaderTasks = [];

                if (taskDeadline) {
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

                    /* Get all the assigned tasks */
                    usersTasksResponse.toJSON().task_assigned.forEach((taskAssignedObj) => {
                        taskAssignedObj.assigned_task.forEach((task) => {
                            assignedTasks.push(task)
                        })
                    })

                    /* Get all the follower tasks */
                    usersTasksResponse.toJSON().task_follower.forEach((taskAssignedObj) => {
                        taskAssignedObj.follower_task.forEach((task) => {
                            followerTasks.push(task)
                        })
                    })
                }

                /* omit to remove members field, uniqBy to remove duplicate data */
                return {
                    ...omit(usersTasksResponse.toJSON(), "members", "task_assigned", "task_follower", "task_team_leader"), assignedTasks, followerTasks, teamLeaderTasks
                }
            })

            /* Send notification task assigned, task follower, task assigned team leader */
            const notificationToCreate = [];

            usersTasks.forEach((user) => {
                /* task assigned */
                user.assignedTasks.forEach((task) => {
                    notificationToCreate.push({
                        usersId: user.id,
                        createdBy: noReplyUser.id,
                        projectId: task.projectId,
                        taskId: task.id,
                        workstreamId: task.workstreamId,
                        type: "taskDeadline",
                        message: "You seem to have missed a deadline.",
                    })
                })
                /* task follower */
                user.followerTasks.forEach((task) => {
                    notificationToCreate.push({
                        usersId: user.id,
                        createdBy: noReplyUser.id,
                        projectId: task.projectId,
                        taskId: task.id,
                        workstreamId: task.workstreamId,
                        type: "taskFollowingDeadline",
                        message: "Task following seem to have missed a deadline.",
                    })
                })
                /* task assigned team leader */
                user.teamLeaderTasks.forEach((task) => {
                    notificationToCreate.push({
                        usersId: user.id,
                        createdBy: noReplyUser.id,
                        projectId: task.projectId,
                        taskId: task.id,
                        workstreamId: task.workstreamId,
                        type: "taskTeamDeadline",
                        message: "Team member seem to have missed a deadline.",
                    })
                })
            })

            /* Create In-App Notification */
            await Notification.bulkCreate(notificationToCreate);


            /* SEND NOTIFICATION EVERY 10 SECONDS */
            keyTimer = setInterval(() => {
                if (usersTasks.length > 0) {
                    const taskNotificationData = usersTasks.slice(0, 10);
                    taskNotificationData.forEach(async user => {
                        if (user.assignedTasks.length > 0) {
                            const tasks = user.assignedTasks.filter(taskObj => { return taskObj.task_project.emailNotification });
                            const message = "You have some tasks that are due";
                            const memberType = "assignedToMe";
                            const subject = "You have missed some tasks due";
                            const receiver = user.emailAddress;
                            const icons = tasks.map((taskObj) => {
                                return taskObj.task_project.type.type
                            })
                            taskDuedateNotification({ ...user, tasks, message, memberType, receiver, subject, icons: uniqBy(icons) });
                        }

                        if (user.followerTasks.length > 0) {
                            const tasks = user.followerTasks.filter(taskObj => { return taskObj.task_project.emailNotification });
                            const message = "Some tasks you are following are past due";
                            const memberType = "following";
                            const subject = "Tasks you are following are already past due";
                            const receiver = user.emailAddress;
                            const icons = tasks.map((taskObj) => {
                                return taskObj.task_project.type.type
                            })
                            taskDuedateNotification({ ...user, tasks, message, memberType, receiver, subject, icons: uniqBy(icons) });
                        }

                        if (user.teamLeaderTasks.length > 0) {
                            const tasks = user.teamLeaderTasks.filter(taskObj => { return taskObj.task_project.emailNotification });
                            const message = "Some tasks of your team are past due";
                            const memberType = "following";
                            const subject = "Your team missed some tasks due";
                            const receiver = user.emailAddress;
                            const icons = tasks.map((taskObj) => {
                                return taskObj.task_project.type.type
                            })
                            taskDuedateNotification({ ...user, tasks, message, memberType, receiver, subject, icons: uniqBy(icons) });
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
