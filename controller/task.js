const async = require("async");
const _ = require("lodash");
const moment = require("moment");
const models = require('../modelORM');
const { ChecklistDocuments, Document, TaskDependency, Tasks, Members, TaskChecklist, Workstream, Projects, Users, Sequelize, DocumentLink, ActivityLogs, Reminder } = models;
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
                attributes: ['id', 'firstName', 'lastName']
            }
        ],
    },
    {
        model: TaskDependency,
        as: 'task_dependency',
        required: false,
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
        required: false,
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
                        as: 'project_members',
                        required: false,
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
                as: 'responsible',
                required: false,
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
        const associationArray = _.cloneDeep(associationStack);
        const queryString = req.query;
        const limit = 10;
        const date = (typeof queryString.date != "undefined") ? JSON.parse(queryString.date) : "";
        const whereObj = {
            ...(typeof queryString.projectId != "undefined" && queryString.projectId != "") ? { projectId: queryString.projectId } : {},
            ...(typeof queryString.workstreamId != "undefined" && queryString.workstreamId != "") ? { workstreamId: queryString.workstreamId } : {},
            ...(date != "") ? {
                dueDate: {
                    [Sequelize.Op[date.opt]]: date.value
                }
            } : {},
            ...((typeof queryString.type != "undefined" && queryString.type == "myTask") && (typeof queryString.userId != "undefined" && queryString.userId != "")) ? {
                [Sequelize.Op.or]: [
                    {
                        id: {
                            [Sequelize.Op.in]: Sequelize.literal(`(SELECT DISTINCT task.id FROM task LEFT JOIN members on task.id = members.linkId WHERE members.linkType = "task" AND members.userTypeLinkId = ${queryString.userId})`)
                        }
                    },
                    {
                        workstreamId: {
                            [Sequelize.Op.in]: Sequelize.literal(`(SELECT DISTINCT linkId FROM members WHERE memberType="responsible" AND linkType="workstream" AND userTypeLinkId = ${queryString.userId})`)
                        }
                    },
                    {
                        approverId: queryString.userId
                    }
                ]
            } : {}
        };

        if (typeof queryString.role != "undefined" && queryString.role != "" && queryString.role > 2) {
            _.find(associationArray, { as: 'task_members' }).required = true;
            _.find(associationArray, { as: 'task_members' }).where = {
                userTypeLinkId: queryString.userId,
                usersType: "users",
                linkType: "task"
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
                    Tasks.findAndCountAll({ ...options, where: _.omit(whereObj, ["offset", "limit"]), distinct: true }).then((response) => {
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
                        where: whereObj, ...options,
                    }).map((mapObject) => {
                        return mapObject.toJSON();
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
    },
    status: (req, cb) => {
        const queryString = req.query;
        const associationArray = _.cloneDeep(associationStack);

        const options = {
            include: associationArray,
            ...((typeof queryString.type != "undefined" && queryString.type == "myTask") && (typeof queryString.userId != "undefined" && queryString.userId != "")) ? {
                [Sequelize.Op.or]: [
                    {
                        id: {
                            [Sequelize.Op.in]: Sequelize.literal(`(SELECT DISTINCT task.id FROM task LEFT JOIN members on task.id = members.linkId WHERE members.linkType = "task" AND members.userTypeLinkId = ${queryString.userId})`)
                        }
                    },
                    {
                        workstreamId: {
                            [Sequelize.Op.in]: Sequelize.literal(`(SELECT DISTINCT linkId FROM members WHERE memberType="responsible" AND linkType="workstream" AND userTypeLinkId = ${queryString.userId})`)
                        }
                    },
                    {
                        approverId: queryString.userId
                    }
                ]
            } : {}
        };

        try {
            // Tasks.findAll({
            //     ...options,
            // }).map((mapObject) => {
            //     return mapObject.toJSON();
            // }).then((resultArray) => {
            //     //console.log(resultArray)
            //     //callback(null, resultArray);
            // });
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
                        Tasks.findOne({ where: whereObj }).then((response) => {
                            const currentTask = _(response.toJSON())
                                .omit(["dateUpdated", "dateAdded"])
                                .mapValues((objVal, objKey) => {
                                    if (objKey == "dueDate" || objKey == "startDate") {
                                        return (objVal != "" && objVal != null) ? moment(objVal).format("YYYY-MM-DD") : "";
                                    } else {
                                        return objVal;
                                    }
                                }).value();

                            Tasks.update(updateBody, { where: { id: body.id } }).then((response) => {
                                return Tasks.findOne({ where: { id: body.id } })
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
                                        .omit(["dateUpdated", "dateAdded"])
                                        .mapValues((objVal, objKey) => {
                                            if (objKey == "dueDate" || objKey == "startDate") {
                                                return (objVal != "" && objVal != null) ? moment(objVal).format("YYYY-MM-DD") : "";
                                            } else {
                                                return objVal;
                                            }
                                        }).value();

                                    const nextDueDate = moment(body.dueDate).add(body.periodType, (body.period * (index + 1))).format('YYYY-MM-DD HH:mm:ss');
                                    const newPeriodTask = { ...updateBody, dueDate: nextDueDate, ...(body.startDate != null && body.startDate != "") ? { startDate: moment(body.startDate).add(body.periodType, (body.period * (index + 1))).format('YYYY-MM-DD HH:mm:ss') } : {} }

                                    return new Promise((resolve) => {
                                        Tasks.update(_.omit(newPeriodTask, ["periodTask", "status"]), { where: { id: periodTaskObj.id } }).then((response) => {
                                            return Tasks.findOne({ where: { id: periodTaskObj.id } });
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
                                    return { usersId: body.userId, linkType: "task", linkId: body.id, actionType: "modified", old: logs.old, new: logs.new }
                                })
                                .value();

                            parallelCallback(null, memberLogsStack);
                        });
                    },
                    task_dependency: (parallelCallback) => {
                        const taskDependencyPromise = _.map(allTask, (relatedTaskObj) => {
                            return new Promise((resolve) => {
                                TaskDependency.findAll(
                                    {
                                        where: {
                                            taskId: relatedTaskObj.data.id
                                        },
                                        include: [
                                            {
                                                model: Tasks,
                                                as: 'task',
                                                attributes: ['id', 'task']
                                            }
                                        ]
                                    }
                                ).map((mapObject) => {
                                    return mapObject.toJSON();
                                }).then((resultArray) => {
                                    const oldTaskDependency = _(resultArray)
                                        .map((taskDependencyObj) => { return { ..._.omit(taskDependencyObj, ["id", "dateAdded", "dateUpdated"]), value: taskDependencyObj.task.task } })
                                        .value();

                                    TaskDependency.destroy({
                                        where: {
                                            taskId: relatedTaskObj.data.id
                                        }
                                    }).then(() => {
                                        if (typeof body.dependencyType == 'undefined' || body.dependencyType == '') {
                                            const taskDependency = _.map(body.task_dependency, (taskDependencyObj) => { return { taskId: relatedTaskObj.data.id, dependencyType: body.dependency_type, linkTaskId: taskDependencyObj.value } })

                                            TaskDependency.bulkCreate(taskDependency, { returning: true }).map((response) => {
                                                return response.toJSON();
                                            }).then((response) => {
                                                TaskDependency.findAll(
                                                    {
                                                        where: {
                                                            id: _.map(response, (responseObj) => { return responseObj.id })
                                                        },
                                                        include: [
                                                            {
                                                                model: Tasks,
                                                                as: 'task',
                                                                attributes: ['id', 'task']
                                                            }
                                                        ]
                                                    }
                                                ).map((mapObject) => {
                                                    return mapObject.toJSON();
                                                }).then((response) => {
                                                    const newTaskDependencyStack = _(response)
                                                        .map((newTaskDependencyObj) => {
                                                            return { ..._.omit(newTaskDependencyObj, ["id", "dateAdded", "dateUpdated"]), value: newTaskDependencyObj.task.task }
                                                        }).value();
                                                    const isEqualTaskDependency = func.isArrayEqual(oldTaskDependency, newTaskDependencyStack);
                                                    resolve({
                                                        data: response,
                                                        ...(isEqualTaskDependency == false) ? {
                                                            logs: {
                                                                old: JSON.stringify({ "task_dependencies": { task: oldTaskDependency } }),
                                                                new: JSON.stringify({ "task_dependencies": { task: newTaskDependencyStack } }),
                                                            }
                                                        } : {}
                                                    });
                                                });
                                            });

                                        } else {
                                            const isEqualTaskDependency = func.isArrayEqual(oldTaskDependency, []);

                                            resolve({
                                                data: oldTaskDependency,
                                                ...(isEqualTaskDependency == false) ? {
                                                    logs: {
                                                        old: JSON.stringify({ "task_dependencies": { task: oldTaskDependency } }),
                                                        new: JSON.stringify({ "task_dependencies": { task: [] } }),
                                                    }
                                                } : {}
                                            });
                                        }
                                    })
                                });
                            })
                        });

                        Promise.all(taskDependencyPromise).then((values) => {
                            const taskDependencyLogsStack = _(values)
                                .filter((taskDependencyObj) => {
                                    return (typeof taskDependencyObj.logs != "undefined")
                                })
                                .map((taskDependencyObj) => {
                                    const { logs } = taskDependencyObj;
                                    return { usersId: body.userId, linkType: "task", linkId: body.id, actionType: "modified", old: logs.old, new: logs.new }
                                })
                                .value();

                            parallelCallback(null, taskDependencyLogsStack);
                        });
                    }
                }, (err, { members, task_dependency }) => {
                    async.parallel({
                        activity_logs: (parallelCallback) => {
                            const allLogsStack = [...members, ...task_dependency, ...taskLogStack];
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
                                        ActivityLogs.create({ usersId: body.userId, linkType: "task", linkId: createTaskObj.id, actionType: "created", new: JSON.stringify(createTaskObj) }).then((response) => {
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

                    Tasks.update({ status }, { where: { id: body.id } }).then((response) => {
                        return Tasks.findOne({ ...options, where: { id: body.id } });
                    }).then((response) => {
                        const updatedTask = response.toJSON();
                        parallelCallback(null, updatedTask);
                    });
                },
                document: (parallelCallback) => {
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
                }
            }, (err, { status, periodic }) => {
                const statusStack = [status];
                if (periodic != "") {
                    statusStack.push(periodic)
                }
                cb({ status: true, data: statusStack });
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
    }
}