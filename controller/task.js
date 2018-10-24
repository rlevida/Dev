const async = require("async");
const _ = require("lodash");
const moment = require("moment");
// const Sequelize = require('sequelize');
const models = require('../modelORM');
const { TaskDependency, Tasks, Members, TaskChecklist, Workstream, Projects, Users, Sequelize, ActivityLogs } = models;
const dbName = "task";
const { defaultGet, defaultGetId, defaultPost, defaultPut, defaultDelete } = require("./");
const func = global.initFunc();
// const Op = Sequelize.Op
const associationStack = [
    {
        model: Members,
        as: 'task_members',
        required: false,
        where: { linkType: 'task' }
    },
    {
        model: TaskDependency,
        as: 'task_dependency',
        include: [
            {
                model: Tasks,
                required: false,
                as: 'task'
            }
        ]
    },
    {
        model: TaskChecklist,
        as: 'checklist',
        include: [
            {
                model: Users,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName']
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
                        required: false,
                        as: 'project_members',
                        attributes: ['id', 'linkId', 'memberType'],
                        where: { linkType: 'project' },
                        include: [
                            {
                                model: Users,
                                as: 'user',
                                attributes: ['id', 'firstName', 'lastName']
                            }
                        ]
                    }
                ]
            },
            {
                model: Members,
                required: false,
                as: 'responsible',
                attributes: ['id', 'linkId'],
                where: { linkType: 'workstream', memberType: 'responsible' },
                include: [
                    {
                        model: Users,
                        as: 'user',
                        attributes: ['id', 'firstName', 'lastName']
                    }
                ]
            }
        ]
    },
];

exports.get = {
    index: (req, cb) => {
        defaultGet(dbName, req, (res) => {
            if (res.status) {
                cb({ status: true, data: res.data })
            } else {
                cb({ status: false, error: res.error })
            }
        })
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
                cb({
                    status: true,
                    data: {
                        ...responseData,
                        dependency_type: ((responseData.task_dependency).length > 0) ? responseData.task_dependency[0].dependencyType : "",
                        task_dependency: _.map(responseData.task_dependency, (taskDependencyObj) => { return { value: taskDependencyObj.task.id, label: taskDependencyObj.task.task } }),
                        assignedTo: ((responseData.task_members).length > 0) ? _.filter(responseData.task_members, (member) => { return member.memberType == "assignedTo" })[0].userTypeLinkId : ""
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
                                        const assignedTo = { linkType: "task", linkId: taskObj.id, usersType: "users", userTypeLinkId: body.assignedTo, memberType: "assignedTo" };
                                        Members.create(assignedTo).then((response) => {
                                            parallelCallback(null, response.toJSON());
                                        });
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
                                    return { usersId: body.userId, linkType: "task", linkId: taskObj.id, actionType: "created", new: JSON.stringify(taskObj) }
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
            include: associationStack
        };

        try {
            async.parallel({
                task: (parallelCallback) => {

                    try {
                        Tasks.findOne({ ...options, where: whereObj }).then((response) => {
                            const currentTask = _.omit(response.toJSON(), ["task_members", "task_dependency", "checklist", "workstream", "dateUpdated"]);
                            Tasks.update(updateBody, { where: { id: body.id } }).then((response) => {
                                return Tasks.findOne({ ...options, where: { id: body.id } })
                            }).then((response) => {
                                const updatedResponse = response.toJSON();
                                const updatedTask = _.omit(updatedResponse, ["task_members", "task_dependency", "checklist", "workstream", "dateUpdated"]);
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
                                where: {
                                    periodTask: taskId,
                                    id: {
                                        [Sequelize.Op.gt]: taskId
                                    }
                                }
                            }
                        ).map((mapObject) => {
                            return mapObject.toJSON();
                        }).then((resultArray) => {
                            if (resultArray.length > 0) {
                                const periodTaskPromise = _.map(resultArray, (periodTaskObj, index) => {
                                    const currentTask = _.omit(periodTaskObj, ["task_members", "task_dependency", "checklist", "workstream", "dateUpdated"]);
                                    const nextDueDate = moment(body.dueDate).add(body.periodType, (body.period * (index + 1))).format('YYYY-MM-DD HH:mm:ss');
                                    const newPeriodTask = { ...updateBody, dueDate: nextDueDate, ...(body.startDate != null && body.startDate != "") ? { startDate: moment(body.startDate).add(body.periodType, (body.period * (index + 1))).format('YYYY-MM-DD HH:mm:ss') } : {} }

                                    return new Promise((resolve) => {
                                        Tasks.update(_.omit(newPeriodTask, ["periodTask", "status"]), { where: { id: periodTaskObj.id } }).then((response) => {
                                            return Tasks.findOne({ where: { id: periodTaskObj.id } });
                                        }).then((response) => {
                                            const updatedResponse = response.toJSON();
                                            const updatedTask = _.omit(updatedResponse, ["task_members", "task_dependency", "checklist", "workstream", "dateUpdated"]);
                                            const newObject = func.changedObjAttributes(updatedTask, currentTask);
                                            const objectKeys = _.map(newObject, function (value, key) {
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
                    }
                }
            }, (err, result) => {
                const { period, task } = result;
                period.push(task);

                const taskLogStack = _(period)
                    .filter((periodObj) => {
                        return (typeof periodObj.logs != "undefined")
                    })
                    .map((periodObj) => {
                        const { logs, data } = periodObj
                        return { usersId: body.userId, linkType: "task", linkId: data.id, actionType: "modified", old: logs.old, new: logs.new }
                    })
                    .value();



                // Updating of Members
                const memberPromise = _.map(period, (relatedTaskObj) => {
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
                            const oldMembers = resultArray;
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
                                const oldMembers = resultArray;
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
                                            const oldMembersStack = _(oldMembers)
                                                .omit(oldMembers, ["dateAdded", "dateUpdated", "receiveNotification"])
                                                .map((oldMemberObj) => { return { ...oldMemberObj, value: oldMemberObj.user.firstName + ' ' + oldMemberObj.user.lastName } });
                                            const newMembersStack = _(resultArray)
                                                .omit(resultArray, ["dateAdded", "dateUpdated", "receiveNotification"])
                                                .map((newMemberObj) => { return { ...newMemberObj, value: newMemberObj.user.firstName + ' ' + newMemberObj.user.lastName } });
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
                                        resolve("");
                                    }
                                })
                            });

                        })
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
                    const allLogsStack = taskLogStack.concat(memberLogsStack);

                    ActivityLogs.bulkCreate(allLogsStack).then((response) => {
                        cb({ status: true, data: _.map(period, (periodObj) => { return periodObj.data }) });
                    });
                });
            });
        } catch (err) {
            cb({ status: false, error: err })
        }
    }
}

exports.delete = {
    index: (req, cb) => {
        defaultDelete(dbName, req, (res) => {
            if (res.success) {
                cb({ status: true, data: res.data })
            } else {
                cb({ status: false, error: res.error })
            }
        })
    }
}