const async = require("async");
const _ = require("lodash");
const models = require('../modelORM');
const { TaskDependency, Tasks, ActivityLogs, Users, Sequelize } = models;
const func = global.initFunc();

exports.get = {
    index: (req, cb) => {
        const queryString = req.query;
        const limit = 2;
        const association = [
            {
                model: Tasks,
                as: 'task'
            }
        ];
        const whereObj = {
            ...(typeof queryString.taskId != "undefined" && queryString.taskId != "") ? { taskId: queryString.taskId } : {}
        };
        const options = {
            ...(typeof queryString.page != "undefined" && queryString.page != "") ? { offset: (limit * _.toNumber(queryString.page)) - limit, limit } : {},
            ...(typeof queryString.includes != "undefined" && queryString.includes != "") ? { include: _.filter(association, (associationObj) => { return _.findIndex((queryString.includes).split(','), (includesObj) => { return includesObj == associationObj.as }) >= 0 }) } : {},
            ...(typeof queryString.taskId != "undefined" && queryString.taskId != "") ? { taskId: queryString.taskId } : {}
        };
        try {
            TaskDependency.findAll(
                { ...options, where: whereObj }
            ).map((mapObject) => {
                return mapObject.toJSON();
            }).then((resultArray) => {
                cb({ status: true, data: resultArray });
            });
        } catch (err) {
            cb({ status: false, error: err })
        }
    }
}

exports.post = {
    index: (req, cb) => {
        const body = req.body;

        TaskDependency.findAll(
            {
                where: {
                    taskId: body.taskId
                },
                include: [
                    {
                        model: Tasks,
                        as: 'task',
                        attributes: ['id', 'task', 'description']
                    }
                ]
            }
        ).map((mapObject) => {
            return mapObject.toJSON();
        }).then((resultArray) => {
            const taskDependency = _.map(body.task_dependencies, (taskDependencyObj) => { return { taskId: body.taskId, dependencyType: body.dependencyType, linkTaskId: taskDependencyObj.value } });

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
                                attributes: ['id', 'task', 'description']
                            }
                        ]
                    }
                ).map((mapObject) => {
                    return mapObject.toJSON();
                }).then((response) => {
                    const insertResponse = response;
                    const taskDependencyActivityLog = _(insertResponse)
                        .map((o) => {
                            const taskDependencyObj = _.omit(o, ["dateAdded", "dateUpdated"]);
                            return {
                                usersId: body.userId,
                                linkType: "task",
                                linkId: body.taskId,
                                actionType: "created",
                                new: JSON.stringify({ task_dependency: taskDependencyObj }),
                                title: taskDependencyObj.task.task
                            }
                        }).value();

                    ActivityLogs.bulkCreate(taskDependencyActivityLog).map((response) => {
                        return response.toJSON();
                    }).then((resultArray) => {
                        const responseObj = _.map(resultArray, (o) => { return o.id });
                        return ActivityLogs.findAll({
                            include: [
                                {
                                    model: Users,
                                    as: 'user',
                                    attributes: ['firstName', 'lastName']
                                }
                            ],
                            where: {
                                id: {
                                    [Sequelize.Op.in]: responseObj
                                }
                            }
                        })
                    }).map((response) => {
                        const responseObj = response.toJSON();
                        return responseObj;
                    }).then((resultArray) => {
                        cb({ status: true, data: { task_dependencies: insertResponse, activity_log: resultArray } });
                    })
                });
            });
        });
    }
}

exports.delete = {
    index: (req, cb) => {
        const queryString = req.query;
        const params = req.params;
        const association = [
            {
                model: Tasks,
                as: 'task',
                attributes: ['id', 'task', 'description']
            }
        ];
        const whereObj = {
            ...(typeof queryString.taskId != "undefined" && queryString.taskId != "") ? { taskId: queryString.taskId } : {},
            ...(typeof params.id != "undefined" && queryString.id != "") ? { id: params.id } : {}
        };
        try {
            TaskDependency.findOne({
                include: association,
                where: whereObj
            }).then((response) => {
                const taskDependencyObj = response.toJSON();
                const ActivityLogObj = _.omit(taskDependencyObj, ["dateAdded", "dateUpdated"]);

                ActivityLogs.create({
                    usersId: queryString.userId,
                    linkType: "task",
                    linkId: ActivityLogObj.taskId,
                    actionType: "deleted",
                    old: JSON.stringify({
                        task_dependency: ActivityLogObj
                    }),
                    title: taskDependencyObj.task.task
                }).then((result) => {
                    const responseObj = result.toJSON();
                    return ActivityLogs.findOne({
                        include: [
                            {
                                model: Users,
                                as: 'user',
                                attributes: ['firstName', 'lastName']
                            }
                        ],
                        where: {
                            id: responseObj.id
                        }
                    })
                }).then((response) => {
                    const responseObj = response.toJSON();
                    TaskDependency.destroy(
                        { where: whereObj }
                    ).then((response) => {
                        cb({ status: true, data: { activity_log: responseObj } });
                    });
                });
            });
        } catch (err) {
            cb({ status: false, error: err })
        }
    }
}