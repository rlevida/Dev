const async = require("async");
const _ = require("lodash");
const models = require('../modelORM');
const { TaskDependency, Tasks, ActivityLogs } = models;
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
                { ...options, where: whereObj, logging: true }
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
            const oldTaskDependency = _(resultArray)
                .map((taskDependencyObj) => { return { ..._.omit(taskDependencyObj, ["id", "dateAdded", "dateUpdated"]), value: taskDependencyObj.task.task } })
                .value();
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
                    const newTaskDependencyStack = _(response)
                        .map((newTaskDependencyObj) => {
                            return { ..._.omit(newTaskDependencyObj, ["id", "dateAdded", "dateUpdated"]), value: newTaskDependencyObj.task.task }
                        }).value();
                    const isEqualTaskDependency = func.isArrayEqual(oldTaskDependency, newTaskDependencyStack);

                    if (isEqualTaskDependency == false) {
                        ActivityLogs.create({ usersId: body.userId, linkType: "task", linkId: body.taskId, actionType: "modified", old: JSON.stringify({ "task_dependencies": { task: oldTaskDependency } }), new: JSON.stringify({ "task_dependencies": { task: newTaskDependencyStack } }) }).then((activityResponse) => {
                            cb({ status: true, data: response });
                        });
                    }else{
                        cb({ status: true, data: response });
                    }
                });
            });
        });
        // const association = [
        //     {
        //         model: Tasks,
        //         as: 'parent_task'
        //     },
        //     {
        //         model: Tasks,
        //         as: 'task'
        //     }
        // ];
        // const options = {
        //     ...(typeof req.body.includes != "undefined" && req.body.includes != "") ? { include: _.filter(association, (associationObj) => { return _.findIndex((req.body.includes).split(','), (includesObj) => { return includesObj == associationObj.as }) >= 0 }) } : {}
        // };
        // try {
        //     TaskDependency.bulkCreate(req.body.data).then(() => {
        //         TaskDependency.findAll({ ...options, where: { taskId: req.body.task_id } }).map((mapObject) => {
        //             return mapObject.toJSON();
        //         }).then((resultArray) => {
        //             cb({ status: true, data: resultArray });
        //         });
        //     })
        // } catch (err) {
        //     cb({ status: false, error: err })
        // }
    }
}

exports.delete = {
    index: (req, cb) => {
        const queryString = req.query;
        const params = req.params;
        const whereObj = {
            ...(typeof queryString.taskId != "undefined" && queryString.taskId != "") ? { taskId: queryString.taskId } : {},
            ...(typeof params.id != "undefined" && queryString.id != "") ? { id: params.id } : {}
        };
        const options = {
            raw: true
        };
        try {
            TaskDependency.destroy(
                { ...options, where: whereObj }
            ).then((response) => {
                cb({ status: true });
            });
        } catch (err) {
            cb({ status: false, error: err })
        }
    }
}