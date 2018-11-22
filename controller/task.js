const async = require("async");
const _ = require("lodash");
const moment = require("moment");
const models = require('../modelORM');
const { ChecklistDocuments, Document, TaskDependency, Tasks, Members, TaskChecklist, Workstream, Projects, Users, Sequelize, DocumentLink, ActivityLogs, Reminder, sequelize } = models;
const dbName = "task";
const { defaultDelete } = require("./");
const func = global.initFunc();
const associationStack = [
    {
        model: Members,
        as: 'task_members',
        required: false,
        where: { linkType: 'task' },
        include: [
            {
                model: Users,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName', 'emailAddress']
            }
        ],
    },
    {
        model: TaskChecklist,
        as: 'checklist',
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
                        as: 'user',
                        attributes: ['id', 'firstName', 'lastName', 'emailAddress']
                    }
                ]
            }
        ]
    },
];

exports.get = {
    index: (req, cb) => {
        const associationArray = _.cloneDeep(associationStack);
        const queryString = req.query;
        const limit = 10;
        const dueDate = (typeof queryString.dueDate != "undefined") ? JSON.parse(queryString.dueDate) : "";
        const status = (typeof queryString.status != "undefined") ? JSON.parse(queryString.status) : "";
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
            ...(dueDate != "") ? {
                dueDate: {
                    [Sequelize.Op[dueDate.opt]]: dueDate.value
                }
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
        };

        if (typeof queryString.userId != "undefined" && queryString.userId != "") {
            const compareOpt = (Array.isArray(queryString.userId)) ? "IN" : "=";
            const ids = (Array.isArray(queryString.userId)) ? `(${(queryString.userId).join(",")})` : queryString.userId;
            
            whereObj[Sequelize.Op.or] = [
                {
                    id: {
                        [Sequelize.Op.in]: Sequelize.literal(`(SELECT DISTINCT task.id FROM task LEFT JOIN members on task.id = members.linkId WHERE members.linkType = "task" AND members.userTypeLinkId ${compareOpt} ${ids})`)
                    }
                },
                {
                    workstreamId: {
                        [Sequelize.Op.in]: Sequelize.literal(`(SELECT DISTINCT linkId FROM members WHERE memberType="responsible" AND linkType="workstream" AND userTypeLinkId ${compareOpt} ${ids})`)
                    }
                },
                {
                    approverId: queryString.userId
                }
            ]
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
                        ...options
                    }).map((mapObject) => {
                        const responseData = mapObject.toJSON();
                        const assignedTaskMembers = _.filter(responseData.task_members, (member) => { return member.memberType == "assignedTo" });
                        const data = {
                            ...responseData,
                            assignedTo: ((assignedTaskMembers).length > 0) ? assignedTaskMembers[0].userTypeLinkId : ""
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
        const whereObj = {
            id: req.params.id
        };
        const options = {
            include: associationStack
        };

        try {
            Tasks.findOne(
                { ...options, where: whereObj }
            ).then((response) => {
                const responseData = response.toJSON();
                const assignedTaskMembers = _.filter(responseData.task_members, (member) => { return member.memberType == "assignedTo" });
                cb({
                    status: true,
                    data: {
                        ...responseData,
                        assignedTo: ((assignedTaskMembers).length > 0) ? assignedTaskMembers[0].userTypeLinkId : ""
                    }
                });
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
    myTaskStatus: (req, cb) => {
        const queryString = req.query;

        try {
            sequelize.query(`
            SELECT

            SUM(CASE WHEN task.dueDate < :date AND (task.status != "Completed" OR task.status IS NULL) AND task_members.memberType="assignedTo" AND task_members.userTypeLinkId = :user_id then 1 else 0 end)  AS assigned_issues,
            SUM(CASE WHEN task.dueDate = :date AND (task.status != "Completed" OR task.status IS NULL) AND task_members.memberType="assignedTo" AND task_members.userTypeLinkId = :user_id then 1 else 0 end)  AS assigned_due_today,
            SUM(CASE WHEN task_members.memberType="assignedTo" AND task_members.userTypeLinkId = :user_id then 1 else 0 end)  AS assigned_active,
            
            SUM(CASE WHEN task.dueDate < :date AND (task.status != "Completed" OR task.status IS NULL) AND task_members.memberType="Follower" AND task_members.userTypeLinkId = :user_id then 1 else 0 end)  AS followed_issues,
            SUM(CASE WHEN task.dueDate = :date AND (task.status != "Completed" OR task.status IS NULL) AND task_members.memberType="Follower" AND task_members.userTypeLinkId = :user_id then 1 else 0 end)  AS followed_due_today,
            SUM(CASE WHEN task_members.memberType="Follower" AND task_members.userTypeLinkId = :user_id then 1 else 0 end)  AS followed_active,

            SUM(CASE WHEN task.dueDate < :date AND (task.status != "Completed" OR task.status IS NULL) AND workstream_members.memberType="responsible" AND workstream_members.userTypeLinkId = :user_id then 1 else 0 end)  AS responsible_issues,
            SUM(CASE WHEN task.dueDate = :date AND (task.status != "Completed" OR task.status IS NULL) AND workstream_members.memberType="responsible" AND workstream_members.userTypeLinkId = :user_id then 1 else 0 end)  AS responsible_due_today,
            SUM(CASE WHEN workstream_members.memberType="responsible" AND workstream_members.userTypeLinkId = :user_id then 1 else 0 end)  AS responsible_active

            FROM 
            
            task 
            LEFT JOIN( SELECT * FROM members WHERE linkType = "task" ) AS task_members ON task_members.linkId = task.id
            LEFT JOIN workstream ON task.workstreamId = workstream.id
            LEFT JOIN ( SELECT * FROM members WHERE linkType = "workstream" ) AS workstream_members ON workstream_members.linkId = task.workstreamId
            
            WHERE 
            
            task.id IN (SELECT DISTINCT task.id FROM task LEFT JOIN members on task.id = members.linkId WHERE members.linkType = "task" AND members.userTypeLinkId = :user_id)
            OR
            workstream.id = (SELECT DISTINCT linkId FROM members WHERE memberType="responsible" AND linkType="workstream" AND userTypeLinkId = :user_id)
            OR
            task.approverId = ${queryString.userId}
           
            `, {
                    replacements: {
                        user_id: queryString.userId,
                        date: moment(queryString.date, 'YYYY-MM-DD').utc().format("YYYY-MM-DD HH:mm")
                    },
                    type: sequelize.QueryTypes.SELECT
                }
            )
                .then((response) => {
                    cb({ status: true, data: response[0] });
                })
        } catch (err) {
            callback(err)
        }

    },
    taskStatus: (req, cb) => {
        const queryString = req.query;

        try {
            sequelize.query(`
            SELECT
            SUM(CASE WHEN task.dueDate < :date AND (task.status != "Completed" OR task.status IS NULL) then 1 else 0 end)  AS assigned_issues,
            SUM(CASE WHEN task.dueDate = :date AND (task.status != "Completed" OR task.status IS NULL) then 1 else 0 end)  AS assigned_due_today,
            COUNT(*)  AS assigned_active
            FROM task 
            WHERE
            task.id > 0 
            ${(typeof queryString.projectId != "undefined" && queryString.projectId != "") ? `
            AND
            task.projectId = ${queryString.projectId} 
            ` : ``}
            ${(typeof queryString.userId != "undefined" && queryString.userId != "") ? `
            AND
            task.id IN (SELECT DISTINCT task.id FROM task LEFT JOIN members on task.id = members.linkId WHERE members.linkType = "task" AND members.userTypeLinkId = :user_id AND members.memberType = :member_type )
            ` : ``}
            `,
                {
                    replacements: {
                        user_id: queryString.userId,
                        date: moment(queryString.date, 'YYYY-MM-DD').utc().format("YYYY-MM-DD HH:mm"),
                        member_type: "assignedTo"
                    },
                    type: sequelize.QueryTypes.SELECT
                }
            )
                .then((response) => {
                    cb({ status: true, data: _.mapValues(response[0], function (v) { return _.toNumber(v); }) });
                })
        } catch (err) {
            callback(err)
        }

    }
}

exports.post = {
    index: (req, cb) => {
        const body = req.body;
        const options = {
            include: associationStack
        };
        try {
            Tasks.create(_.omit(body, ["task_dependency", "dependency_type", "assignedTo"])).then((response) => {
                const newTaskResponse = response.toJSON();
                async.waterfall([
                    function (callback) {
                        if (typeof body.periodic != "undefined" && body.periodic == 1) {
                            const taskPromises = _.times(body.periodInstance - 1, (o) => {
                                return new Promise((resolve) => {
                                    const nextDueDate = moment(body.dueDate).add(body.periodType, o + 1).format('YYYY-MM-DD HH:mm:ss');
                                    const newPeriodTask = { ...body, dueDate: nextDueDate, periodTask: newTaskResponse.id, ...(body.startDate != null && body.startDate != "") ? { startDate: moment(body.startDate).add(body.periodType, o + 1).format('YYYY-MM-DD HH:mm:ss') } : {} }

                                    Tasks.create(_.omit(newPeriodTask, ["task_dependency", "dependency_type", "assignedTo"])).then((response) => {
                                        const createTaskObj = response.toJSON();
                                        resolve(createTaskObj);
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
                                        if (typeof body.assignedTo != "undefined" && body.assignedTo != "") {
                                            const assignedTo = { linkType: "task", linkId: taskObj.id, usersType: "users", userTypeLinkId: body.assignedTo, memberType: "assignedTo" };
                                            Members.create(assignedTo).then((response) => {
                                                parallelCallback(null, response.toJSON());
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
                    function (newTasksArgs, callback) {
                        async.parallel({
                            tasks: (parallelCallback) => {
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
                                    parallelCallback(null, response)
                                });
                            },
                            activity_logs: (parallelCallback) => {
                                const activityLogs = _.map(newTasksArgs, (taskObj) => {
                                    const activityObj = _.omit(taskObj, ["dateAdded", "dateUpdated"]);
                                    return {
                                        usersId: body.userId,
                                        linkType: "task",
                                        linkId: taskObj.id,
                                        actionType: "created",
                                        new: JSON.stringify({ task: activityObj }),
                                        title: taskObj.task
                                    }
                                })
                                ActivityLogs.bulkCreate(activityLogs).then((response) => {
                                    parallelCallback(null, response)
                                });
                            }
                        }, (err, response) => {
                            callback(null, response)
                        })

                    }
                ], function (err, result) {
                    cb({ status: true, data: result.tasks });
                });
            });
        } catch (err) {
            cb({ status: false, error: err })
        }
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
            include: _.filter(associationStack, (o) => { return o.as == "workstream" })
        };

        try {
            async.parallel({
                task: (parallelCallback) => {
                    try {
                        Tasks.findOne({ ...options, where: whereObj }).then((response) => {
                            const responseObj = response.toJSON();
                            const currentTask = _(responseObj)
                                .omit(["workstreamId", "dateUpdated", "dateAdded"])
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
                                    .omit(["workstreamId", "dateUpdated", "dateAdded", "periodic", "periodInstance", "periodTask"])
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
                    if (body.periodic == 1) {
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
                                Members.findAll(
                                    {
                                        where: {
                                            linkType: "task",
                                            memberType: "assignedTo",
                                            linkId: relatedTaskObj.data.id
                                        },
                                        include: [
                                            {
                                                model: Users,
                                                as: 'user',
                                                attributes: ['id', 'firstName', 'lastName']
                                            }
                                        ]
                                    }
                                ).map((mapObject) => {
                                    return mapObject.toJSON();
                                }).then((resultArray) => {
                                    const oldMembersStack = _(resultArray)
                                        .map((oldMemberObj) => {
                                            const omittedObject = _.omit(oldMemberObj, ["id", "dateAdded", "dateUpdated"]);
                                            return { ...omittedObject, value: oldMemberObj.user.firstName + ' ' + oldMemberObj.user.lastName }
                                        }).value();

                                    Members.destroy({
                                        where: {
                                            linkType: "task",
                                            linkId: relatedTaskObj.data.id,
                                            usersType: "users",
                                            memberType: "assignedTo"
                                        }
                                    }).then(() => {
                                        if (body.assignedTo != "") {
                                            const assignedTo = { linkType: "task", linkId: relatedTaskObj.data.id, usersType: "users", userTypeLinkId: body.assignedTo, memberType: "assignedTo" };
                                            Members.create(assignedTo).then(() => {
                                                return Members.findAll(
                                                    {
                                                        where: {
                                                            linkType: "task",
                                                            memberType: "assignedTo",
                                                            linkId: relatedTaskObj.data.id
                                                        },
                                                        include: [
                                                            {
                                                                model: Users,
                                                                as: 'user',
                                                                attributes: ['id', 'firstName', 'lastName']
                                                            }
                                                        ]
                                                    });
                                            }).map((mapObject) => {
                                                return mapObject.toJSON();
                                            }).then((resultArray) => {
                                                const newMembersStack = _(resultArray)
                                                    .map((newMemberObj) => {
                                                        const omittedObject = _.omit(newMemberObj, ["id", "dateAdded", "dateUpdated"]);
                                                        return { ...omittedObject, value: newMemberObj.user.firstName + ' ' + newMemberObj.user.lastName }
                                                    }).value();
                                                const isEqualMembers = func.isArrayEqual(oldMembersStack, newMembersStack);
                                                resolve({
                                                    data: resultArray,
                                                    ...(isEqualMembers == false) ? {
                                                        logs: {
                                                            old: JSON.stringify({ "members": { user: oldMembersStack } }),
                                                            new: JSON.stringify({ "members": { user: newMembersStack } })
                                                        }
                                                    } : {}
                                                });
                                            });
                                        } else {
                                            const isEqualMembers = func.isArrayEqual(oldMembersStack, []);

                                            resolve({
                                                data: oldMembersStack,
                                                ...(isEqualMembers == false) ? {
                                                    logs: {
                                                        old: JSON.stringify({ "members": { user: oldMembersStack } }),
                                                        new: JSON.stringify({ "members": { user: [] } }),
                                                    }
                                                } : {}
                                            });
                                        }
                                    });
                                });
                            });
                        });

                        Promise.all(memberPromise).then((values) => {
                            const memberLogsStack = _(values)
                                .filter((memberObj) => {
                                    return (typeof memberObj.logs != "undefined")
                                })
                                .map((memberObj) => {
                                    const { logs, data } = memberObj;
                                    return { usersId: body.userId, linkType: "task", linkId: data[0].linkId, actionType: "modified", old: logs.old, new: logs.new }
                                })
                                .value();

                            parallelCallback(null, memberLogsStack);
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
                            .omit(["dateUpdated", "dateAdded"])
                            .mapValues((objVal, objKey) => {
                                if (objKey == "dueDate" || objKey == "startDate") {
                                    return (objVal != "" && objVal != null) ? moment(objVal).format("YYYY-MM-DD") : "";
                                } else {
                                    return objVal;
                                }
                            }).value();

                        Tasks.update({ status }, { where: { id: body.id } }).then((response) => {
                            return Tasks.findOne({ ...options, where: { id: body.id } });
                        }).then((response) => {
                            const updatedResponse = response.toJSON();
                            const updatedTask = _(updatedResponse)
                                .omit(["dateUpdated", "dateAdded"])
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
                                approver: (statusParallelCallback) => {
                                    if (body.status == "For Approval") {
                                        Members
                                            .destroy({ where: { linkId: updatedResponse.id, linkType: 'task', memberType: 'approver' } })
                                            .then((res) => {
                                                Members
                                                    .create({ userTypeLinkId: body.approverId, usersType: 'users', linkType: 'task', linkId: updatedResponse.id, memberType: 'approver', receiveNotification: 1 })
                                                    .then((createRes) => {
                                                        statusParallelCallback(null)
                                                    })
                                            })
                                    } else {
                                        statusParallelCallback(null)
                                    }
                                },
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
                                            detail: (typeof body.message !== 'undefined') ? body.message : `Task ${body.status}`
                                        }
                                        Reminder.create(reminderDetails).then((res) => {
                                            mapCallback(null, res)
                                        })
                                    }, (err, mapCallbackResult) => {
                                        statusParallelCallback(null)
                                    })
                                },
                                email: (statusParallelCallback) => {
                                    async.map(membersToRemind, (e, mapCallback) => {
                                        const message = (typeof body.message != "undefined") ? body.message : ''
                                        const mailOptions = {
                                            from: '"no-reply" <no-reply@c_cfo.com>',
                                            to: `${e.emailAddress}`,
                                            subject: '[CLOUD-CFO]',
                                            text: `Task ${body.status}`,
                                            html: `<p> ${message}</p>
                                                        <p>${updatedResponse.task} ${body.status}</p>
                                                        <a href="${ ((process.env.NODE_ENV == "production") ? "https:" : "http:")}${global.site_url}project/${updatedResponse.projectId}/workstream/${updatedResponse.workstreamId}?task=${updatedResponse.id}">Click here</a>`
                                        }
                                        global.emailtransport(mailOptions)
                                        mapCallback()
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
                                        title: updatedResponse.task
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
                    if (body.status == "Completed") {
                        ChecklistDocuments
                            .findAll({
                                where: { taskId: body.id }
                            })
                            .map((res) => {
                                return res.id
                            })
                            .then((res) => {
                                if (res.length > 0) {
                                    Document
                                        .update({ isCompleted: 1 }, { where: { id: res } })
                                        .then((documentRes) => {
                                            parallelCallback(null, documentRes)
                                        })
                                } else {
                                    parallelCallback(null, res)
                                }
                            })
                    } else {
                        parallelCallback(null)
                    }
                }
            }, (err, { status, periodic }) => {
                const statusStack = [status.task];
                if (periodic != "") {
                    statusStack.push(periodic)
                }
                cb({ status: true, data: { task: statusStack, activity_log: status.activity_log } });
            })
        } catch (err) {
            cb({ status: false, error: err })
        }
    },
    taskApproval: (req, cb) => {
        const body = req.body
        const id = req.params.id

        async.parallel({
            task: (parallelCallback) => {
                try {
                    Tasks
                        .update(body.data, { where: { id: id } })
                        .then((res) => {
                            Tasks
                                .findOne({
                                    where: { id: id },
                                    include: associationStack
                                })
                                .then((findRes) => {
                                    parallelCallback(null, [findRes])
                                })
                        })
                } catch (err) {
                    parallelCallback(err)
                }
            },
            reminder: (parallelCallback) => {
                try {
                    Reminder
                        .create(body.reminder)
                        .then((res) => {
                            parallelCallback(null, res)
                        })
                } catch (err) {
                    parallelCallback(err)
                }
            },
            email: (parallelCallback) => {
                try {
                    if (body.mailDetails.receiveNotification) {
                        const mailOptions = {
                            from: '"no-reply" <no-reply@c_cfo.com>',
                            to: `${body.mailDetails.emailAddress}`,
                            subject: '[CLOUD-CFO]',
                            text: 'Assigned as approver',
                            html: `<p> Assigned as approver</p>
                                <p>${body.mailDetails.task}</p>
                                <a href="${ ((process.env.NODE_ENV == "production") ? "https:" : "http:")}${global.site_url}project/${body.mailDetails.project}/workstream/${body.mailDetails.workstreamId}?task=${body.mailDetails.taskId}">Click here</a>`
                        }
                        global.emailtransport(mailOptions)
                    }
                    parallelCallback(null, "")
                } catch (err) {
                    parallelCallback(err)
                }
            }
        }, (err, result) => {
            cb({ status: true, data: result })
        })
    },
    taskReject: (req, cb) => {
        const body = req.body
        const id = req.params.id

        async.parallel({
            task: (parallelCallback) => {
                try {
                    Tasks
                        .update(body.data, { where: { id: id } })
                        .then((res) => {
                            Tasks
                                .findOne({
                                    where: { id: id },
                                    include: associationStack
                                })
                                .then((findRes) => {
                                    parallelCallback(null, [findRes])
                                })
                        })
                } catch (err) {
                    parallelCallback(err)
                }
            },
            reminder: (parallelCallback) => {
                try {
                    Reminder
                        .create(body.reminder)
                        .then((res) => {
                            parallelCallback(null, res)
                        })
                } catch (err) {
                    parallelCallback(err)
                }
            },
            email: (parallelCallback) => {
                try {
                    if (body.mailDetails.receiveNotification) {
                        const mailOptions = {
                            from: '"no-reply" <no-reply@c_cfo.com>',
                            to: `${body.mailDetails.emailAddress}`,
                            subject: '[CLOUD-CFO]',
                            text: 'Task Rejected',
                            html: `<p> ${body.mailDetails.rejectMessage}</p>
                                <p>${body.mailDetails.task}</p>
                                <a href="${ ((process.env.NODE_ENV == "production") ? "https:" : "http:")}${global.site_url}project/${body.mailDetails.project}/workstream/${body.mailDetails.workstreamId}?task=${body.mailDetails.taskId}">Click here</a>`
                        }
                        global.emailtransport(mailOptions)
                    }
                    parallelCallback(null, "")
                } catch (err) {
                    parallelCallback(err)
                }
            }
        }, (err, result) => {
            cb({ status: true, data: result })
        })

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
    }
}