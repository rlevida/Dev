const async = require("async");
const _ = require("lodash");
const moment = require("moment");

const { defaultDelete } = require("./");
const models = require('../modelORM');
const { ChecklistDocuments, Document, DocumentRead, TaskDependency, Tasks, Members, TaskChecklist, Workstream, Projects, Users, Sequelize, DocumentLink, ActivityLogs, Reminder, Starred, Type, UsersTeam, Teams, Tag, sequelize } = models;

const dbName = "task";
const func = global.initFunc();
const Op = Sequelize.Op;

const associationStack = [
    {
        model: Tag,
        as: 'tag_task',
        required: false,
        where: { linkType: 'task', isDeleted: 0 },
        include: [
            {
                model: Document,
                as: 'document',
                include: [{
                    model: DocumentRead,
                    as: 'document_read',
                    attributes: ['id'],
                    required: false
                },
                {
                    model: Users,
                    as: 'user',
                    attributes: ['id', 'username', 'firstName', 'lastName', 'avatar']
                }]
            }
        ]
    },
    {
        model: Members,
        as: 'task_members',
        required: false,
        where: { linkType: 'task', isDeleted: 0 },
        include: [
            {
                model: Users,
                as: 'user'
            }
        ],
    },
    {
        model: TaskDependency,
        as: 'task_dependency',
        required: false,
        where: { isDeleted: 0 },
        include: [
            {
                model: Tasks,
                as: 'task'
            }
        ],
    },
    {
        model: Starred,
        as: 'task_starred',
        where: { linkType: 'task', isActive: 1 },
        required: false,
        include: [
            {
                model: Users,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName', 'emailAddress']
            }
        ]
    },
    {
        model: TaskChecklist,
        as: 'checklist',
        where: { isDeleted: 0 },
        required: false,
        include: [
            {
                model: Users,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName', 'emailAddress']
            },
            {
                model: ChecklistDocuments,
                as: 'tagDocuments',
                where: { isDeleted: 0 },
                required: false,
                include: [
                    {
                        model: Document,
                        as: 'document',
                        include: [{
                            model: DocumentRead,
                            as: 'document_read',
                            attributes: ['id'],
                            required: false
                        },
                        {
                            model: Users,
                            as: 'user',
                            attributes: ['id', 'username', 'firstName', 'lastName', 'avatar']
                        }]
                    }
                ]
            }
        ]
    },
    {
        model: Workstream,
        as: 'workstream',
        include: [
            {
                model: Projects,
                as: 'project',
                required: false,
                include: [
                    {
                        model: Members,
                        as: 'project_members',
                        required: false,
                        attributes: ['id', 'linkId', 'memberType'],
                        where: { linkType: 'project' },
                        include: [
                            {
                                model: Users,
                                as: 'user',
                                attributes: ['id', 'firstName', 'lastName', 'emailAddress']
                            }
                        ]
                    },
                    {
                        model: Type,
                        as: 'type',
                        required: false,
                        attributes: ["type"]
                    }
                ]
            },
            {
                model: Members,
                as: 'responsible',
                required: false,
                attributes: ['id', 'linkId'],
                where: { linkType: 'workstream', memberType: 'responsible' },
                include: [
                    {
                        model: Users,
                        as: 'user'
                    }
                ]
            }
        ]
    }
];

exports.get = {
    index: async (req, cb) => {
        const associationArray = _.cloneDeep(associationStack);
        const queryString = req.query;
        const limit = 10;
        const status = (typeof queryString.status != "undefined") ? JSON.parse(queryString.status) : "";
        let dueDate = "";

        if (typeof queryString.dueDate != "undefined" && queryString.dueDate != "") {
            if (Array.isArray(queryString.dueDate)) {
                dueDate = _.reduce(queryString.dueDate, function (obj, values) {
                    const arrValues = JSON.parse(values);
                    obj[Sequelize.Op[arrValues.opt]] = arrValues.value;
                    return obj;
                }, {});
            } else {
                dueDate = JSON.parse(queryString.dueDate);
            }
        }
        const whereObj = {
            ...(typeof queryString.projectId != "undefined" && queryString.projectId != "") ? { projectId: queryString.projectId } : {},
            ...(typeof queryString.workstreamId != "undefined" && queryString.workstreamId != "") ? { workstreamId: queryString.workstreamId } : {},
            ...(typeof queryString.task != "undefined" && queryString.task != "") ? {
                [Sequelize.Op.and]: [
                    Sequelize.where(Sequelize.fn('lower', Sequelize.col('task.task')),
                        {
                            [Sequelize.Op.like]: sequelize.fn('lower', `%${queryString.task}%`)
                        }
                    )
                ]
            } : {},
            ...(status != "") ? {
                status: {

                    ...(status.opt == "not") ? {
                        [Sequelize.Op.or]: {
                            [Sequelize.Op[status.opt]]: status.value,
                            [Sequelize.Op.eq]: null
                        }
                    } : {
                            [Sequelize.Op.and]: {
                                [Sequelize.Op[status.opt]]: status.value
                            }
                        }
                }
            } : {},
            ...(dueDate != "" && typeof queryString.view == "undefined") ? {
                dueDate: (queryString.dueDate == "null") ? null :
                    {
                        ...(dueDate != "" && Array.isArray(dueDate)) ? {
                            [Sequelize.Op.or]: dueDate
                        } : (dueDate != "") ? {
                            [Sequelize.Op[dueDate.opt]]: _.map(dueDate.value, (o) => { return moment(o, 'YYYY-MM-DD').utc().format("YYYY-MM-DD HH:mm") })
                        } : {},
                        [Sequelize.Op.not]: null
                    }
            } : {},
            ...(typeof queryString.view != "undefined" && queryString.view == "calendar") ? {
                [Sequelize.Op.or]: [
                    {
                        dueDate: {
                            [Sequelize.Op[dueDate.opt]]: _.map(dueDate.value, (o) => { return moment(o, 'YYYY-MM-DD').utc().format("YYYY-MM-DD HH:mm") })
                        }
                    },
                    {
                        startDate: {
                            [Sequelize.Op[dueDate.opt]]: _.map(dueDate.value, (o) => { return moment(o, 'YYYY-MM-DD').utc().format("YYYY-MM-DD HH:mm") })
                        }
                    }
                ]
            } : {},
            ...(typeof queryString.isActive != "undefined" && queryString.isActive != '') ? { isActive: queryString.isActive } : {}

        };

        if (typeof queryString.userId != "undefined" && queryString.userId != "") {
            let queryUserIds = (Array.isArray(queryString.userId)) ? `(${(queryString.userId).join(",")})` : queryString.userId;
            let opOrArray = [];

            if (typeof queryString.type != "undefined") {
                const compareOpt = (Array.isArray(queryString.userId)) ? "IN" : "=";
                const ids = (Array.isArray(queryString.userId)) ? `(${(queryString.userId).join(",")})` : queryString.userId;
                switch (queryString.type) {
                    case "assignedToMe":
                        opOrArray.push(
                            {
                                id: {
                                    [Sequelize.Op.in]: Sequelize.literal(`(SELECT DISTINCT task.id FROM task LEFT JOIN members on task.id = members.linkId WHERE members.linkType = "task" AND members.memberType ="assignedTo" AND members.userTypeLinkId ${compareOpt} ${ids} AND members.isDeleted = 0)`)
                                }
                            },
                            {
                                approverId: queryString.userId
                            }
                        );
                        break;
                    case "myTeam":
                        const userTeams = await UsersTeam
                            .findAll({ where: { usersId: queryUserIds, isDeleted: 0 } })
                            .map((mapObject) => {
                                const { teamId } = mapObject.toJSON();
                                return teamId;
                            });
                        const teams = await Teams
                            .findAll({ where: { teamLeaderId: queryUserIds, isDeleted: 0 } })
                            .map((mapObject) => {
                                const { id } = mapObject.toJSON();
                                return id;
                            });
                        const teamIds = _.uniq([...userTeams, ...teams]);
                        const allTeams = await UsersTeam
                            .findAll({ where: { teamId: teamIds, isDeleted: 0 } })
                            .map((mapObject) => {
                                const { usersId } = mapObject.toJSON();
                                return usersId;
                            })
                            .filter((o) => { return o != queryString.userId });
                        if (allTeams.length > 0) {
                            opOrArray.push(
                                {
                                    id: {
                                        [Sequelize.Op.in]: Sequelize.literal(`(SELECT DISTINCT task.id FROM task LEFT JOIN members on task.id = members.linkId WHERE members.linkType = "task" AND members.userTypeLinkId IN (${(allTeams).join(",")}) AND members.userTypeLinkId <> ${queryString.userId} AND members.isDeleted = 0 AND members.memberType = "assignedTo")`)
                                    }
                                }
                            );
                        }
                        break;
                    case "following":
                        opOrArray.push(
                            {
                                id: {
                                    [Sequelize.Op.in]: Sequelize.literal(`(SELECT DISTINCT task.id FROM task LEFT JOIN members on task.id = members.linkId WHERE members.linkType = "task" AND members.userTypeLinkId ${compareOpt} ${ids} AND members.memberType = "follower" AND members.isDeleted=0)`)
                                }
                            }
                        );
                        break;
                    default:
                }
            }
            whereObj[Sequelize.Op.or] = opOrArray;
        }
        if (typeof queryString.starredUser !== 'undefined' && queryString.starredUser !== '') {
            _.find(associationArray, { as: 'task_starred' }).where = {
                linkType: 'task',
                isActive: 1,
                usersId: queryString.starredUser,
                isDeleted: 0
            };
        }
        const options = {
            include: associationArray,
            ...(typeof queryString.page != "undefined" && queryString.page != "") ? { offset: (limit * _.toNumber(queryString.page)) - limit, limit } : {},
            order: [['dueDate', 'ASC']]
        };
        async.parallel({
            count: function (callback) {
                try {
                    Tasks.findAndCountAll({ ..._.omit(options, ['offset', 'limit']), where: whereObj, distinct: true }).then((response) => {
                        const pageData = {
                            total_count: response.count,
                            ...(typeof queryString.page != "undefined" && queryString.page != "") ? { current_page: (response.count > 0) ? _.toNumber(queryString.page) : 0, last_page: _.ceil(response.count / limit) } : {}
                        }

                        callback(null, pageData)
                    });
                } catch (err) {
                    callback(err)
                }
            },
            result: function (callback) {
                try {
                    Tasks.findAll({
                        where: whereObj,
                        logging: true,
                        ...options
                    }).map((mapObject) => {
                        const responseData = mapObject.toJSON();
                        const assignedTaskMembers = _.filter(responseData.task_members, (member) => { return member.memberType == "assignedTo" });
                        const data = {
                            ...responseData,
                            assignedTo: ((assignedTaskMembers).length > 0) ? assignedTaskMembers[0].userTypeLinkId : "",
                            isStarred: (typeof queryString.starredUser !== 'undefined' && queryString.starredUser !== '' && (responseData.task_starred).length > 0) ? responseData.task_starred[0].isActive : 0
                        }
                        return data;
                    }).then((resultArray) => {
                        callback(null, resultArray);
                    });
                } catch (err) {
                    callback(err)
                }
            }
        }, function (err, results) {
            if (err != null) {
                cb({ status: false, error: err });
            } else {
                cb({ status: true, data: results })
            }
        });
    },
    getById: (req, cb) => {
        const queryString = req.query;
        const associationArray = _.cloneDeep(associationStack);
        const whereObj = {
            id: req.params.id
        };

        if (typeof queryString.starredUser !== 'undefined' && queryString.starredUser !== '') {
            _.find(associationArray, { as: 'task_starred' }).where = {
                linkType: 'task',
                isDeleted: 0,
                usersId: queryString.starredUser
            };
        }
        const options = {
            include: associationArray
        };
        try {
            Tasks.findOne(
                { ...options, where: whereObj }
            ).then((response) => {
                if (response != null) {
                    const responseData = response.toJSON();
                    const assignedTaskMembers = _.filter(responseData.task_members, (member) => { return member.memberType == "assignedTo" });
                    cb({
                        status: true,
                        data: {
                            ...responseData,
                            assignedTo: ((assignedTaskMembers).length > 0) ? assignedTaskMembers[0].userTypeLinkId : "",
                            isStarred: (typeof queryString.starredUser !== 'undefined' && queryString.starredUser !== '' && (responseData.task_starred).length > 0) ? responseData.task_starred[0].isActive : 0
                        }
                    });
                } else {
                    cb({ status: false, error: "Task not found." })
                }
            });
        } catch (err) {
            cb({ status: false, error: err })
        }
    },
    getTaskList: (req, cb) => {
        let d = req.query
        let task = global.initModel("task")
        let taskDependencies = global.initModel("task_dependency")
        let filter = (typeof d.filter != "undefined") ? JSON.parse(d.filter) : {};
        task.getTaskList("task", filter, {}, (c) => {
            async.map(c.data, (o, mapCallback) => {
                taskDependencies.getData("task_dependency", { taskId: o.id }, {}, (results) => {
                    mapCallback(null, { ...o, dependencies: results.data })
                });
            }, (err, result) => {
                cb({ status: true, data: result })
            });
        })
    },
    profileTask: async (req, cb) => {
        const queryString = req.query;
        Tasks.findAll({
            where: {
                isDeleted: 0,
                dueDate: {
                    [Op.between]: [
                        moment(queryString.date, 'YYYY-MM-DD').startOf('month').format("YYYY-MM-DD HH:mm"),
                        moment(queryString.date, 'YYYY-MM-DD').endOf('month').format("YYYY-MM-DD HH:mm")
                    ]
                }
            },
            include: [{
                attributes: [],
                model: Members,
                as: 'task_members',
                required: true,
                where: {
                    linkType: 'task',
                    usersType: 'users',
                    userTypeLinkId: queryString.userId,
                    isDeleted: 0,
                    memberType: "assignedTo"
                },
            }],
            attributes: [
                [models.sequelize.literal('COUNT(DISTINCT CASE WHEN task.id <> 0  THEN task.id END)'), 'assigned_tasks'],
                [models.sequelize.literal('COUNT(DISTINCT CASE WHEN task.status = "Completed"  THEN task.id END)'), 'on_time'],
                [models.sequelize.literal('COUNT(DISTINCT CASE WHEN task.status <> "Completed" AND task.dueDate = "' + moment(queryString.date, 'YYYY-MM-DD').utc().format("YYYY-MM-DD HH:mm") + '" THEN task.id END)'), 'due_today'],
                [models.sequelize.literal('COUNT(DISTINCT CASE WHEN task.status <> "Completed" AND task.dueDate < "' + moment(queryString.date, 'YYYY-MM-DD').utc().format("YYYY-MM-DD HH:mm") + '" THEN task.id END)'), 'issues'],
                [models.sequelize.literal('COUNT(DISTINCT CASE WHEN task.status <> "Completed" AND task.dueDate > "' + moment(queryString.date, 'YYYY-MM-DD').utc().format("YYYY-MM-DD HH:mm") + '" THEN task.id END)'), 'remaining']
            ]
        }).map((response) => {
            return response.toJSON();
        }).then((response) => {
            cb({ status: true, data: response })
        });
    },
    myTaskStatus: async (req, cb) => {
        const queryString = req.query;
        const userTeams = await UsersTeam
            .findAll({ where: { usersId: queryString.userId, isDeleted: 0 } })
            .map((mapObject) => {
                const { teamId } = mapObject.toJSON();
                return teamId;
            });
        const teams = await Teams
            .findAll({ where: { teamLeaderId: queryString.userId, isDeleted: 0 } })
            .map((mapObject) => {
                const { id } = mapObject.toJSON();
                return id;
            });
        const teamIds = _.uniq([...userTeams, ...teams]);
        const allTeams = await UsersTeam
            .findAll({ where: { teamId: teamIds, isDeleted: 0 } })
            .map((mapObject) => {
                const { usersId } = mapObject.toJSON();
                return usersId;
            })
            .filter((o) => { return o != queryString.userId });

        async.parallel({
            assigned_to_me: (parallelCallback) => {
                try {
                    Tasks.findAll({
                        group: ['projectId'],
                        where: {
                            isDeleted: 0,
                            dueDate: {
                                [Op.lte]: moment(queryString.date, 'YYYY-MM-DD')
                            },
                            status: {
                                [Op.ne]: "Completed"
                            }
                        },
                        include: [{
                            attributes: [],
                            model: Members,
                            as: 'task_members',
                            required: true,
                            where: { linkType: 'task', usersType: 'users', userTypeLinkId: queryString.userId, isDeleted: 0, memberType: "assignedTo" },
                        }],
                        attributes: [
                            'projectId',
                            [models.sequelize.literal('COUNT(DISTINCT CASE WHEN task.status <> "Completed" AND task.dueDate < "' + moment(queryString.date, 'YYYY-MM-DD').utc().format("YYYY-MM-DD HH:mm") + '" THEN task.id END)'), 'issues'],
                            [models.sequelize.literal('COUNT(DISTINCT CASE WHEN task.status <> "Completed" AND task.dueDate = "' + moment(queryString.date, 'YYYY-MM-DD').utc().format("YYYY-MM-DD HH:mm") + '" THEN task.id END)'), 'due_today']
                        ]
                    }).map((response) => {
                        return response.toJSON();
                    }).then((response) => {
                        parallelCallback(null, response);
                    });
                } catch (err) {
                    parallelCallback(err)
                }
            },
            following: (parallelCallback) => {
                Tasks.findAll({
                    group: ['projectId'],
                    where: {
                        isDeleted: 0,
                        dueDate: {
                            [Op.lte]: moment(queryString.date, 'YYYY-MM-DD')
                        },
                        status: {
                            [Op.ne]: "Completed"
                        }
                    },
                    include: [{
                        attributes: [],
                        model: Members,
                        as: 'task_members',
                        required: true,
                        where: { linkType: 'task', usersType: 'users', userTypeLinkId: queryString.userId, isDeleted: 0, memberType: "follower" },
                    }],
                    attributes: [
                        'projectId',
                        [models.sequelize.literal('COUNT(DISTINCT CASE WHEN task.status <> "Completed" AND task.dueDate < "' + moment(queryString.date, 'YYYY-MM-DD').utc().format("YYYY-MM-DD HH:mm") + '" THEN task.id END)'), 'issues'],
                        [models.sequelize.literal('COUNT(DISTINCT CASE WHEN task.status <> "Completed" AND task.dueDate = "' + moment(queryString.date, 'YYYY-MM-DD').utc().format("YYYY-MM-DD HH:mm") + '" THEN task.id END)'), 'due_today']
                    ]
                }).map((response) => {
                    return response.toJSON();
                }).then((response) => {
                    parallelCallback(null, response);
                });
            },
            team: (parallelCallback) => {
                Tasks.findAll({
                    group: ['projectId'],
                    where: {
                        isDeleted: 0,
                        dueDate: {
                            [Op.lte]: moment(queryString.date, 'YYYY-MM-DD')
                        },
                        status: {
                            [Op.ne]: "Completed"
                        }
                    },
                    include: [{
                        attributes: [],
                        model: Members,
                        as: 'task_members',
                        required: true,
                        where: { linkType: 'task', usersType: 'users', userTypeLinkId: allTeams, isDeleted: 0, memberType: "assignedTo" },
                    }],
                    attributes: [
                        'projectId',
                        [models.sequelize.literal('COUNT(DISTINCT CASE WHEN task.status <> "Completed" AND task.dueDate < "' + moment(queryString.date, 'YYYY-MM-DD').utc().format("YYYY-MM-DD HH:mm") + '" THEN task.id END)'), 'issues'],
                        [models.sequelize.literal('COUNT(DISTINCT CASE WHEN task.status <> "Completed" AND task.dueDate = "' + moment(queryString.date, 'YYYY-MM-DD').utc().format("YYYY-MM-DD HH:mm") + '" THEN task.id END)'), 'due_today']
                    ]
                }).map((response) => {
                    return response.toJSON();
                }).then((response) => {
                    parallelCallback(null, response);
                });
            }
        }, (err, response) => {
            if (err != null) {
                cb({ status: false, data: err });
            } else {
                cb({ status: true, data: response })
            }
        })
    },
    projectTaskStatus: (req, cb) => {
        const queryString = req.query;
        const { projectId } = queryString;
        const currentDate = moment(queryString.date, 'YYYY-MM-DD').format("YYYY-MM-DD HH:mm");
        async.parallel({
            task_due: (parallelCallback) => {
                try {
                    Tasks.findAndCountAll(
                        {
                            where: {
                                dueDate: {
                                    [Op.eq]: currentDate
                                },
                                projectId
                            }
                        }).then(({ count }) => {
                            parallelCallback(null, count)
                        });
                } catch (err) {
                    parallelCallback(err)
                }
            },
            task_for_approval: (parallelCallback) => {
                try {
                    Tasks.findAndCountAll(
                        {
                            where: {
                                status: 'For Approval',
                                projectId
                            }
                        }).then(({ count }) => {
                            parallelCallback(null, count)
                        });
                } catch (err) {
                    parallelCallback(err)
                }
            },
            delayed_task: (parallelCallback) => {
                try {
                    Tasks.findAndCountAll(
                        {
                            where: {
                                dueDate: {
                                    [Op.lt]: currentDate
                                },
                                status: {
                                    [Op.ne]: 'Completed'
                                },
                                projectId
                            }
                        }).then(({ count }) => {
                            parallelCallback(null, count)
                        });
                } catch (err) {
                    parallelCallback(err)
                }
            },
            new_files: (parallelCallback) => {
                try {
                    DocumentLink.findAndCountAll(
                        {
                            where: {
                                linkType: 'project',
                                linkid: projectId
                            },
                            include: [
                                {
                                    model: Document,
                                    as: 'document',
                                    required: true,
                                    where: {
                                        status: 'new'
                                    }
                                }
                            ]
                        }).then(({ count }) => {
                            parallelCallback(null, count)
                        });
                } catch (err) {
                    parallelCallback(err)
                }
            }
        }, (err, response) => {
            if (err != null) {
                cb({ status: false, data: err });
            } else {
                cb({ status: true, data: response })
            }
        });
    }

}

exports.post = {
    index: (req, cb) => {
        const body = req.body;
        const options = {
            include: associationStack
        };
        try {
            Tasks.create(_.omit(body, ["task_dependency", "dependency_type", "assignedTo", "dateUpdated"])).then((response) => {
                const newTaskResponse = response.toJSON();
                ActivityLogs.create({
                    usersId: body.userId,
                    linkType: "task",
                    linkId: newTaskResponse.id,
                    actionType: "created",
                    new: JSON.stringify({ task: _.omit(newTaskResponse, ["dateAdded", "dateUpdated"]) }),
                    title: newTaskResponse.task
                }).then((response) => {
                    async.waterfall([
                        function (callback) {
                            if (typeof body.periodic != "undefined" && body.periodic == 1) {
                                const taskPromises = _.times(body.periodInstance - 1, (o) => {
                                    return new Promise((resolve) => {
                                        const nextDueDate = moment(body.dueDate).add(body.periodType, o + 1).format('YYYY-MM-DD HH:mm:ss');
                                        const newPeriodTask = {
                                            ...body,
                                            dueDate: nextDueDate,
                                            ...(body.startDate != null && body.startDate != "") ? { startDate: moment(body.startDate).add(body.periodType, o + 1).format('YYYY-MM-DD HH:mm:ss') } : {},
                                            periodTask: newTaskResponse.id
                                        };

                                        Tasks.create(_.omit(newPeriodTask, ["task_dependency", "dependency_type", "assignedTo"])).then((response) => {
                                            const createTaskObj = response.toJSON();
                                            ActivityLogs.create({
                                                usersId: body.userId,
                                                linkType: "task",
                                                linkId: createTaskObj.id,
                                                actionType: "created",
                                                new: JSON.stringify({ task: _.omit(createTaskObj, ["dateAdded", "dateUpdated"]) }),
                                                title: createTaskObj.task
                                            }).then((response) => {
                                                resolve(createTaskObj);
                                            });
                                        });
                                    });
                                });
                                Promise.all(taskPromises).then((values) => {
                                    callback(null, [...[newTaskResponse], ...values])
                                })
                            } else {
                                callback(null, [newTaskResponse])
                            }
                        },
                        function (newTasksArgs, callback) {
                            const taskAttrPromises = _.map(newTasksArgs, (taskObj) => {
                                return new Promise((resolve) => {
                                    async.parallel({
                                        task_dependency: (parallelCallback) => {
                                            const taskDependencyPromise = _.map(body.task_dependency, (taskDependencyObj) => {
                                                return new Promise((resolve) => {
                                                    const dependentObj = {
                                                        taskId: taskObj.id,
                                                        dependencyType: body.dependency_type,
                                                        linkTaskId: taskDependencyObj.value
                                                    };
                                                    TaskDependency.create(dependentObj).then((response) => {
                                                        resolve({ data: response.toJSON() });
                                                    })
                                                })
                                            });

                                            Promise.all(taskDependencyPromise).then((values) => {
                                                parallelCallback(null, values);
                                            });
                                        },
                                        members: (parallelCallback) => {
                                            const members = [];
                                            if (typeof body.assignedTo != "undefined" && body.assignedTo != "") {
                                                members.push({ linkType: "task", linkId: taskObj.id, usersType: "users", userTypeLinkId: body.assignedTo, memberType: "assignedTo" });
                                            }

                                            if (typeof body.approverId != "undefined" && body.approverId != "") {
                                                members.push({ linkType: "task", linkId: taskObj.id, usersType: "users", userTypeLinkId: body.approverId, memberType: "approver" });
                                            }
                                            if (members.length > 0) {
                                                Members.bulkCreate(members).then((response) => {
                                                    parallelCallback(null, response);
                                                });
                                            } else {
                                                parallelCallback(null, {});
                                            }
                                        }
                                    }, (err, response) => {
                                        resolve(response)
                                    })
                                })
                            });

                            Promise.all(taskAttrPromises).then((values) => {
                                callback(null, newTasksArgs)
                            });
                        },
                        function (newTasksArgs) {
                            Tasks.findAll(
                                {
                                    ...options,
                                    where: {
                                        id: {
                                            [Sequelize.Op.in]: _.map(newTasksArgs, (o) => { return o.id })
                                        }
                                    }
                                }
                            ).map((mapObject) => {
                                return mapObject.toJSON();
                            }).then((response) => {
                                async.parallel({
                                    projects: (parallelCallback) => {
                                        Projects.update({ dateUpdated: body.dateUpdated },
                                            {
                                                where: { id: response[0].projectId }
                                            })
                                            .then((res) => {
                                                parallelCallback(null);
                                            });
                                    },
                                    workstream: (parallelCallback) => {
                                        Workstream.update({ dateUpdated: body.dateUpdated },
                                            {
                                                where: { id: response[0].workstreamId }
                                            })
                                            .then((res) => {
                                                parallelCallback(null);
                                            });
                                    }
                                }, () => {
                                    cb({ status: true, data: response });
                                });
                            });
                        }
                    ], function (err, result) {
                        cb({ status: true, data: result.tasks });
                    });
                });

            });
        } catch (err) {
            cb({ status: false, error: err })
        }
    },
    document: (req, cb) => {
        const formidable = global.initRequire("formidable");
        const func = global.initFunc();
        const { projectId, workstreamId } = { ...req.query };
        let form = new formidable.IncomingForm();
        let files = [];
        let type = "upload";
        let checklistStack = [];
        let userId = "";
        let taskId = "";
        const filesStack = [];

        form.multiples = true;
        form.on('field', function (name, field) {
            if (name == "userId") {
                userId = field
            } else if (name == "tagged") {
                checklistStack = JSON.parse(field);
            } else {
                taskId = field;
            }
        }).on('file', function (field, file) {
            const date = new Date();
            const id = func.generatePassword(date.getTime() + file.name, "attachment");
            const filename = id + (file.name).replace(/[^\w.]|_/g, "_");

            filesStack.push({
                id,
                file: file,
                form: type,
                filename: filename
            });
        }).on('end', function () {
            async.map(filesStack, (fileObj, mapCallback) => {
                func.uploadFile(_.omit(fileObj, ['id']), response => {
                    if (response.Message == 'Success') {
                        mapCallback(null, {
                            filename: fileObj.filename,
                            origin: fileObj.file.name,
                            Id: fileObj.id,
                            userId,
                            taskId,
                            checklist: checklistStack
                        })
                    } else {
                        mapCallback(esponse.Message)
                    }
                });
            }, async (err, results) => {
                const newDocs = _.map(results, ({ filename, origin, userId }) => {
                    return {
                        name: filename,
                        origin,
                        uploadedBy: userId,
                        type: 'document',
                        status: 'new'
                    };
                });

                const documentUpload = await Document.bulkCreate(newDocs).map((o) => { return o.toJSON() });
                const documentUploadResult = await _.map((documentUpload), ({ id }) => { return { documentId: id, linkType: 'project', linkId: projectId } });
                DocumentLink.bulkCreate(documentUploadResult).map((o) => { return o.toJSON() })

                const workstreamTag = _.map(documentUpload, ({ id }) => {
                    return {
                        linkType: "workstream",
                        linkId: workstreamId,
                        tagType: "document",
                        tagTypeId: id
                    }
                });

                Tag.bulkCreate(workstreamTag);

                if (checklistStack.length > 0) {
                    const checklistTag = _(documentUpload)
                        .map(({ id }) => {
                            return _.map(checklistStack, ({ value }) => {
                                return {
                                    taskId,
                                    checklistId: value,
                                    documentId: id
                                }
                            })
                        })
                        .flatten()
                        .value();
                    ChecklistDocuments.bulkCreate(checklistTag).then((o) => {
                        TaskChecklist.findAll(
                            {
                                where: {
                                    id: _.map(checklistTag, (o) => { return o.checklistId })
                                },
                                include: [
                                    {
                                        model: Users,
                                        as: 'user',
                                        attributes: ['id', 'firstName', 'lastName', 'emailAddress']
                                    },
                                    {
                                        model: ChecklistDocuments,
                                        as: 'tagDocuments',
                                        include: [
                                            {
                                                model: Document,
                                                as: 'document'
                                            }
                                        ]
                                    }
                                ],
                            }
                        ).map((mapObject) => {
                            return mapObject.toJSON();
                        }).then((o) => {
                            cb({ status: true, data: { result: o, type: "checklist" } });
                        })
                    });
                } else {
                    const taskTag = _.map(documentUpload, ({ id }) => {
                        return {
                            linkType: "task",
                            linkId: taskId,
                            tagType: "document",
                            tagTypeId: id
                        }
                    });

                    Tag.bulkCreate(taskTag)
                        .map((o) => { return o.toJSON() })
                        .then((o) => {
                            Tag.findAll(
                                {
                                    where: {
                                        linkType: "task",
                                        linkId: taskId,
                                        tagType: "document",
                                        tagTypeId: _.map(taskTag, ({ tagTypeId }) => { return tagTypeId })
                                    },
                                    include: [
                                        {
                                            model: Document,
                                            as: 'document',
                                            include: [{
                                                model: DocumentRead,
                                                as: 'document_read',
                                                attributes: ['id'],
                                                required: false
                                            }]
                                        }
                                    ]
                                }
                            ).then((o) => {
                                cb({ status: true, data: { result: o, type: "document" } });
                            })
                        });
                }
            });
        }).on('error', function (err) {
            cb({ status: false, error: "Upload error. Please try again later." });
        });

        form.parse(req);
    }
}

exports.put = {
    index: (req, cb) => {
        const body = req.body;
        const updateBody = _.omit(body, ["id", "task_members", "task_dependency", "checklist", "workstream"]);
        const whereObj = {
            id: req.params.id
        };
        const options = {
            include: _.filter(associationStack, (o) => { return o.as == "workstream" || o.as == "task_members" })
        };

        try {
            async.parallel({
                task: (parallelCallback) => {
                    try {
                        Tasks.findOne({ ...options, where: whereObj }).then((response) => {
                            const responseObj = response.toJSON();
                            const currentTask = _(responseObj)
                                .omit(["workstreamId", "approvalRequired", "approverId", "dateUpdated", "dateAdded", "periodic", "periodInstance", "periodTask"])
                                .mapValues((objVal, objKey) => {
                                    if (objKey == "dueDate" || objKey == "startDate") {
                                        return (objVal != "" && objVal != null) ? moment(objVal).format("YYYY-MM-DD") : "";
                                    } else if (objKey == "workstream") {
                                        return (responseObj.workstream).workstream;
                                    } else {
                                        return objVal;
                                    }
                                }).value();
                            Tasks.update(updateBody, { where: { id: body.id } }).then((response) => {
                                return Tasks.findOne({ ...options, where: { id: body.id } })
                            }).then((response) => {
                                const updatedResponse = response.toJSON();
                                const updatedTask = _(updatedResponse)
                                    .omit(["workstreamId", "approvalRequired", "approverId", "dateUpdated", "dateAdded", "periodic", "periodInstance", "periodTask"])
                                    .mapValues((objVal, objKey) => {
                                        if (objKey == "dueDate" || objKey == "startDate") {
                                            return (objVal != "" && objVal != null) ? moment(objVal).format("YYYY-MM-DD") : "";
                                        } else if (objKey == "workstream") {
                                            return (updatedResponse.workstream).workstream;
                                        } else {
                                            return objVal;
                                        }
                                    }).value();
                                const newObject = func.changedObjAttributes(updatedTask, currentTask);
                                const objectKeys = _.map(newObject, function (value, key) {
                                    return key;
                                });

                                parallelCallback(null, {
                                    data: updatedResponse, ...(_.isEmpty(newObject)) ? {} : {
                                        logs: {
                                            old: JSON.stringify({ "task_details": _.pick(currentTask, objectKeys) }),
                                            new: JSON.stringify({ "task_details": newObject })
                                        }
                                    }
                                });
                            })
                        })
                    } catch (err) {
                        parallelCallback(err);
                    }
                },
                period: (parallelCallback) => {
                    if (typeof body.periodic != "undefined" && body.periodic == 1) {
                        const taskId = (body.periodTask == null) ? body.id : body.periodTask;
                        Tasks.findAll(
                            {
                                ...options,
                                where: {
                                    periodTask: taskId,
                                    id: {
                                        [Sequelize.Op.gt]: body.id
                                    }
                                }
                            }
                        ).map((mapObject) => {
                            return mapObject.toJSON();
                        }).then((resultArray) => {
                            if (resultArray.length > 0) {
                                const periodTaskPromise = _.map(resultArray, (periodTaskObj, index) => {
                                    const currentTask = _(periodTaskObj)
                                        .omit(["workstreamId", "dateUpdated", "dateAdded", "periodic", "periodInstance", "periodTask"])
                                        .mapValues((objVal, objKey) => {
                                            if (objKey == "dueDate" || objKey == "startDate") {
                                                return (objVal != "" && objVal != null) ? moment(objVal).format("YYYY-MM-DD") : "";
                                            } else if (objKey == "workstream") {
                                                return (periodTaskObj.workstream).workstream;
                                            } else {
                                                return objVal;
                                            }
                                        }).value();

                                    const nextDueDate = moment(body.dueDate).add(body.periodType, (body.period * (index + 1))).format('YYYY-MM-DD HH:mm:ss');
                                    const newPeriodTask = { ...updateBody, dueDate: nextDueDate, ...(body.startDate != null && body.startDate != "") ? { startDate: moment(body.startDate).add(body.periodType, (body.period * (index + 1))).format('YYYY-MM-DD HH:mm:ss') } : {} }

                                    return new Promise((resolve) => {
                                        Tasks.update(_.omit(newPeriodTask, ["periodTask", "status"]), { where: { id: periodTaskObj.id } }).then((response) => {
                                            return Tasks.findOne({ ...options, where: { id: periodTaskObj.id } });
                                        }).then((response) => {
                                            const updatedResponse = response.toJSON();
                                            const updatedTask = _(updatedResponse)
                                                .omit(["workstreamId", "dateUpdated", "dateAdded"])
                                                .mapValues((objVal, objKey) => {
                                                    if (objKey == "dueDate" || objKey == "startDate") {
                                                        return (objVal != "" && objVal != null) ? moment(objVal).format("YYYY-MM-DD") : "";
                                                    } else if (objKey == "workstream") {
                                                        return (updatedResponse.workstream).workstream;
                                                    } else {
                                                        return objVal;
                                                    }
                                                }).value();

                                            const newObject = func.changedObjAttributes(updatedTask, currentTask);
                                            const objectKeys = _.map(newObject, function (_, key) {
                                                return key;
                                            });
                                            resolve({
                                                data: updatedResponse,
                                                ...(_.isEmpty(newObject) == false) ? {
                                                    logs: {
                                                        old: JSON.stringify({ "task_details": _.pick(currentTask, objectKeys) }),
                                                        new: JSON.stringify({ "task_details": newObject })
                                                    }
                                                } : {}
                                            });
                                        });
                                    });
                                });
                                Promise.all(periodTaskPromise).then((values) => {
                                    parallelCallback(null, values);
                                });
                            } else {
                                parallelCallback(null, []);
                            }
                        });
                    } else {
                        parallelCallback(null, []);
                    }
                }
            }, (err, result) => {
                const { period, task } = result;
                const allTask = period.concat(task);
                const taskLogStack = _(allTask)
                    .filter((periodObj) => {
                        return (typeof periodObj.logs != "undefined")
                    })
                    .map((periodObj) => {
                        const { logs, data } = periodObj
                        return { usersId: body.userId, linkType: "task", linkId: data.id, actionType: "modified", old: logs.old, new: logs.new }
                    })
                    .value();


                async.parallel({
                    members: (parallelCallback) => {
                        const memberPromise = _.map(allTask, (relatedTaskObj) => {
                            return new Promise((resolve) => {
                                Members.findAll({
                                    where: {
                                        linkType: "task",
                                        linkId: relatedTaskObj.data.id,
                                        isDeleted: 0
                                    },
                                    include: [
                                        {
                                            model: Users,
                                            as: 'user',
                                            attributes: ['id', 'firstName', 'lastName']
                                        }
                                    ]
                                })
                                    .map((o) => { return o.toJSON() })
                                    .then((responseObj) => {
                                        const oldUserResponse = responseObj;

                                        Members.update({ isDeleted: 1 },
                                            {
                                                where: {
                                                    linkType: "task",
                                                    linkId: relatedTaskObj.data.id,
                                                    usersType: "users"
                                                }
                                            }).then(() => {
                                                const members = [];
                                                if (typeof body.assignedTo != "undefined" && body.assignedTo != "") {
                                                    members.push({ linkType: "task", linkId: relatedTaskObj.data.id, usersType: "users", userTypeLinkId: body.assignedTo, memberType: "assignedTo" });
                                                }

                                                if (typeof body.approverId != "undefined" && body.approverId != "") {
                                                    members.push({ linkType: "task", linkId: relatedTaskObj.data.id, usersType: "users", userTypeLinkId: body.approverId, memberType: "approver" });
                                                }

                                                if (members.length > 0) {
                                                    Members.bulkCreate(members).map(async (response) => {
                                                        const responseObj = response.toJSON();
                                                        const userDetails = await Users.findOne({
                                                            where: {
                                                                id: responseObj.userTypeLinkId
                                                            }
                                                        }).
                                                            then((o) => {
                                                                return o.toJSON();
                                                            });
                                                        return { ..._.omit(responseObj, ["dateUpdated"]), user: userDetails }
                                                    }).then((o) => {
                                                        const newAssigned = _.find(o, (res) => { return res.memberType == "assignedTo" });
                                                        const newApprover = _.find(o, (res) => { return res.memberType == "approver" });
                                                        const oldAssigned = _.find(oldUserResponse, (res) => { return res.memberType == "assignedTo" });
                                                        const oldApprover = _.find(oldUserResponse, (res) => { return res.memberType == "approver" });

                                                        const memberLogs = _([
                                                            {
                                                                old: oldAssigned,
                                                                new: newAssigned,
                                                                type: "assigned"
                                                            },
                                                            {
                                                                old: oldApprover,
                                                                new: newApprover,
                                                                type: "approver"
                                                            }
                                                        ])
                                                            .filter((o) => {
                                                                const oldUser = (typeof o.old != "undefined") ? o.old.userTypeLinkId : 0;
                                                                const newUser = (typeof o.new != "undefined") ? o.new.userTypeLinkId : 0;
                                                                return oldUser != newUser
                                                            })
                                                            .map((o) => {
                                                                return {
                                                                    old: (o.old != "undefined" && _.isEmpty(o.old) == false) ? JSON.stringify({
                                                                        [o.type]: o.old
                                                                    }) : "",
                                                                    new: (o.new != "undefined" && _.isEmpty(o.new) == false) ? JSON.stringify({
                                                                        [o.type]: o.new
                                                                    }) : "",
                                                                    actionType: "modified",
                                                                    usersId: body.userId,
                                                                    linkType: "task",
                                                                    linkId: relatedTaskObj.data.id,
                                                                    title: _.isEmpty(o.new) ? (_.isEmpty(o.old) == false) ? (o.old).user.firstName + " " + (o.old).user.lastName : "" : (o.new).user.firstName + " " + (o.new).user.lastName
                                                                }
                                                            }).value();
                                                        resolve(memberLogs);
                                                    });
                                                } else {
                                                    resolve(null)
                                                }
                                            });
                                    })
                            });
                        });

                        Promise.all(memberPromise).then((values) => {
                            parallelCallback(null, _.flatten(values));
                        });
                    }
                }, (err, { members }) => {
                    async.parallel({
                        activity_logs: (parallelCallback) => {
                            const allLogsStack = [...members, ...taskLogStack];
                            ActivityLogs.bulkCreate(allLogsStack).then((response) => {
                                parallelCallback(null, response)
                            });
                        },
                        tasks: (parallelCallback) => {
                            Tasks.findAll(
                                {
                                    ...options,
                                    where: {
                                        id: _.map(allTask, (allTaskObj) => { return allTaskObj.data.id })
                                    }
                                }
                            ).map((mapObject) => {
                                return mapObject.toJSON();
                            }).then((resultArray) => {
                                parallelCallback(null, resultArray)
                            });
                        },
                        project: (parallelCallback) => {
                            Projects
                                .update(
                                    {
                                        dateUpdated: body.dateUpdated
                                    },
                                    {
                                        where: { id: allTask[0].data.projectId }
                                    })
                                .then((res) => {
                                    parallelCallback(null)
                                });
                        },
                        workstream: (parallelCallback) => {
                            Workstream.update({ dateUpdated: body.dateUpdated },
                                {
                                    where: { id: allTask[0].data.workstreamId }
                                })
                                .then((res) => {
                                    parallelCallback(null);
                                });
                        }
                    }, (err, response) => {
                        cb({ status: true, data: response.tasks });
                    });
                })

            });
        } catch (err) {
            cb({ status: false, error: err })
        }
    },
    status: ({ body }, cb) => {
        const options = {
            include: associationStack
        };
        try {
            async.parallel({
                periodic: (parallelCallback) => {
                    if (body.periodic == 1 && body.status == "Completed") {
                        const periodTaskId = (body.periodTask == null) ? body.id : body.periodTask;
                        Tasks.findAll({
                            ...options,
                            limit: 1,
                            where: {
                                periodTask: periodTaskId
                            },
                            order: [['dueDate', 'DESC']]
                        }).map((mapObject) => {
                            return mapObject.toJSON();
                        }).then((resultArray) => {
                            const latestPeriodicTask = resultArray;
                            const latestTaskDate = _.omit(latestPeriodicTask[0], ["status", "dateAdded", "dateUpdated"]);
                            const nextDueDate = moment(latestTaskDate.dueDate).add(latestTaskDate.periodType, latestTaskDate.period).format('YYYY-MM-DD HH:mm:ss');
                            const newPeriodTask = { ...latestTaskDate, id: "", dueDate: nextDueDate, periodTask: periodTaskId, ...(latestTaskDate.startDate != null && latestTaskDate.startDate != "") ? { startDate: moment(latestTaskDate.startDate).add(latestTaskDate.periodType, latestTaskDate.period).format('YYYY-MM-DD HH:mm:ss') } : {} }

                            Tasks.create(newPeriodTask).then((response) => {
                                const createTaskObj = response.toJSON();
                                const periodTaskMembers = _.map(latestPeriodicTask[0].task_members, (membersObj) => { return _.omit({ ...membersObj, linkId: createTaskObj.id }, ["id", "user", "dateAdded", "dateUpdated"]) });
                                const periodTaskDependencies = _.map(latestPeriodicTask[0].task_dependency, (dependencyObj) => { return _.omit({ ...dependencyObj, taskId: createTaskObj.id }, ["id", "task", "dateAdded", "dateUpdated"]) });

                                async.parallel({
                                    members: (parallelCallback) => {
                                        Members.bulkCreate(periodTaskMembers, { returning: true }).then((response) => {
                                            parallelCallback(null, response);
                                        })
                                    },
                                    dependencies: (parallelCallback) => {
                                        TaskDependency.bulkCreate(periodTaskDependencies, { returning: true }).then((response) => {
                                            parallelCallback(null, response);
                                        });
                                    },
                                    activity_logs: (parallelCallback) => {
                                        ActivityLogs.create({
                                            usersId: body.userId,
                                            linkType: "task",
                                            linkId: createTaskObj.id,
                                            actionType: "created",
                                            new: JSON.stringify({ task: _.omit(createTaskObj, ["dateAdded", "dateUpdated"]) }),
                                            title: createTaskObj.task
                                        }).then((response) => {
                                            parallelCallback(null, response)
                                        });
                                    }
                                }, (err, response) => {
                                    Tasks.findOne({ ...options, where: { id: createTaskObj.id } }).then((response) => {
                                        const newTask = response.toJSON();
                                        parallelCallback(null, newTask);
                                    });
                                })
                            });
                        });
                    } else {
                        parallelCallback(null, "");
                    }
                },
                status: (parallelCallback) => {
                    const { status } = body;
                    Tasks.findOne({ ...options, where: { id: body.id } }).then((response) => {
                        const currentTask = _(response.toJSON())
                            .omit(["checklist", "tag_task", "dateUpdated", "dateAdded", "dateCompleted"])
                            .mapValues((objVal, objKey) => {
                                if (objKey == "dueDate" || objKey == "startDate") {
                                    return (objVal != "" && objVal != null) ? moment(objVal).format("YYYY-MM-DD") : "";
                                } else {
                                    return objVal;
                                }
                            }).value();

                        Tasks.update({
                            status,
                            dateCompleted: (body.status == "Completed") ? moment(body.date).format('YYYY-MM-DD HH:mm:ss') : null
                        }, { where: { id: body.id } }).then((response) => {
                            return Tasks.findOne({ ...options, where: { id: body.id } });
                        }).then((response) => {
                            const updatedResponse = response.toJSON();
                            const updatedTask = _(updatedResponse)
                                .omit(["checklist", "tag_task", "dateUpdated", "dateAdded", "dateCompleted"])
                                .mapValues((objVal, objKey) => {
                                    if (objKey == "dueDate" || objKey == "startDate") {
                                        return (objVal != "" && objVal != null) ? moment(objVal).format("YYYY-MM-DD") : "";
                                    } else {
                                        return objVal;
                                    }
                                }).value();
                            const newObject = func.changedObjAttributes(updatedTask, currentTask);
                            const objectKeys = _.map(newObject, function (value, key) { return key; });

                            const taskMembers = _.map(updatedResponse.task_members, (member) => { return member.user });
                            const workstreamResponsible = _.map(updatedResponse.workstream.responsible, (responsible) => { return responsible.user })
                            const membersToRemind = _.uniqBy(_.filter(taskMembers.concat(workstreamResponsible), (member) => { return member.id != body.userId }), 'id');

                            async.parallel({
                                reminder: (statusParallelCallback) => {
                                    async.map(membersToRemind, (e, mapCallback) => {
                                        const reminderDetails = {
                                            createdBy: body.userId,
                                            linkId: body.id,
                                            linkType: "task",
                                            projectId: updatedResponse.projectId,
                                            seen: 0,
                                            type: `Task ${body.status}`,
                                            usersId: e.id,
                                            detail: `${body.username} updated the task ${updatedResponse.task} on ${updatedResponse.workstream.workstream} to ${body.status}`
                                        }
                                        Reminder.create(reminderDetails).then((res) => {
                                            mapCallback(null, res)
                                        })
                                    }, (err, mapCallbackResult) => {
                                        statusParallelCallback(null)
                                    })
                                },
                                activity_logs: (statusParallelCallback) => {
                                    ActivityLogs.create({
                                        usersId: body.userId,
                                        linkType: "task",
                                        linkId: body.id,
                                        actionType: "modified",
                                        old: JSON.stringify({ "task_status": _.pick(currentTask, objectKeys) }),
                                        new: JSON.stringify({ "task_status": newObject }),
                                        title: updatedResponse.task,
                                        notes: body.message
                                    }).then((response) => {
                                        const responseObj = response.toJSON();
                                        return ActivityLogs.findOne({
                                            include: [
                                                {
                                                    model: Users,
                                                    as: 'user',
                                                    attributes: ['firstName', 'lastName']
                                                }
                                            ],
                                            where: { id: responseObj.id }
                                        })
                                    }).then((response) => {
                                        const responseObj = response.toJSON();
                                        const assignedTaskMembers = _.filter(updatedResponse.task_members, (member) => { return member.memberType == "assignedTo" });
                                        const data = {
                                            ...updatedResponse,
                                            assignedTo: ((assignedTaskMembers).length > 0) ? assignedTaskMembers[0].userTypeLinkId : ""
                                        }
                                        statusParallelCallback(null, { task: data, activity_log: responseObj });
                                    });
                                }
                            }, (err, { activity_logs }) => {
                                parallelCallback(null, activity_logs)
                            })
                        });
                    });
                },
                document: (parallelCallback) => {
                    async.parallel({
                        documents: (parallelCallback) => {
                            ChecklistDocuments.findAll({
                                where: { taskId: body.id }
                            }).map((res) => {
                                return res.toJSON().documentId
                            }).then((o) => {
                                parallelCallback(null, o)
                            });
                        },
                        tag: (parallelCallback) => {
                            Tag.findAll({
                                where: {
                                    linkType: 'task',
                                    linkId: body.id,
                                    tagType: 'document'
                                }
                            }).map((res) => {
                                return res.toJSON().tagTypeId;
                            }).then((o) => {
                                parallelCallback(null, o)
                            })
                        }
                    }, (err, data) => {
                        const documentId = _.uniq([...data.documents, ...data.tag]);
                        const updateBody = {
                            isCompleted: (body.status == "Completed") ? 1 : 0
                        };
                        Document
                            .update(updateBody, { where: { id: documentId } })
                            .then((documentRes) => {
                                parallelCallback(null, documentRes)
                            });
                    })
                }
            }, (err, { status, periodic }) => {
                const statusStack = [status.task];
                if (periodic != "") {
                    statusStack.push(periodic)
                }

                async.parallel({
                    projects: (parallelCallback) => {
                        Projects.update({ dateUpdated: body.dateUpdated },
                            {
                                where: { id: statusStack[0].projectId }
                            })
                            .then((res) => {
                                parallelCallback(null);
                            });
                    },
                    workstream: (parallelCallback) => {
                        Workstream.update({ dateUpdated: body.dateUpdated },
                            {
                                where: { id: statusStack[0].workstreamId }
                            })
                            .then((res) => {
                                parallelCallback(null);
                            });
                    }
                }, () => {
                    cb({ status: true, data: { task: statusStack, activity_log: status.activity_log } });
                });
            })
        } catch (err) {
            cb({ status: false, error: err })
        }
    }
}

exports.delete = {
    index: (req, cb) => {
        const params = req.params;
        defaultDelete(dbName, req, (res) => {
            if (res.success) {
                async.parallel({
                    task_dependencies: (parallelCallback) => {
                        TaskDependency.destroy({
                            where: {
                                linkTaskId: params.id
                            }
                        }).then(() => {
                            parallelCallback(null)
                        });
                    },
                    document_link: (parallelCallback) => {
                        DocumentLink.destroy({
                            where: {
                                linkType: "task",
                                linkId: params.id
                            }
                        }).then(() => {
                            parallelCallback(null)
                        });
                    },
                    members: (parallelCallback) => {
                        Members.destroy({
                            where: {
                                linkType: "task",
                                linkId: params.id
                            }
                        }).then(() => {
                            parallelCallback(null)
                        });
                    },
                    reminder: (parallelCallback) => {
                        Reminder.destroy({
                            where: {
                                linkType: "task",
                                linkId: params.id
                            }
                        }).then(() => {
                            parallelCallback(null)
                        });
                    },
                    task_checklist: (parallelCallback) => {
                        TaskChecklist.destroy({
                            where: {
                                taskId: params.id
                            }
                        }).then(() => {
                            parallelCallback(null)
                        });
                    }
                }, (err, response) => {
                    cb({ status: true, id: params.id });
                })

            } else {
                cb({ status: false, error: res.error })
            }
        })
    },
    document: (req, cb) => {
        const params = req.params;
        const queryString = req.query;

        if (queryString.type == "Subtask Document") {
            ChecklistDocuments.update({ isDeleted: 1 },
                {
                    where: {
                        id: params.id
                    }
                }).then(() => {
                    cb({ status: true, id: params.id });
                });
        } else {
            async.parallel({
                tag: (parallelCallback) => {
                    Tag.update({ isDeleted: 1 },
                        {
                            where: {
                                tagType: "document",
                                tagTypeId: params.id
                            }
                        }).then((response) => {
                            parallelCallback(null);
                        });
                },
                document: (parallelCallback) => {
                    Document.update({ isDeleted: 1 },
                        {
                            where: {
                                id: params.id
                            }
                        }).then(() => {
                            parallelCallback(null);
                        });
                }
            }, () => {
                cb({ status: true, id: params.id });
            })
        }
    }
}