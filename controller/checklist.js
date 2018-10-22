const moment = require("moment");
const _ = require("lodash");
const Sequelize = require('sequelize');
const models = require('../modelORM');
const { Tasks, TaskChecklist, Users } = models;
const Op = Sequelize.Op

exports.get = {
    getCheckList: (req, cb) => {
        const queryString = req.query;
        const limit = 5;
        const association = [
            {
                model: Users,
                as: 'user',
                attributes: ['firstName', 'lastName']
            }
        ]
        const whereObj = {
            ...(typeof queryString.taskId != "undefined" && queryString.taskId != "") ? { taskId: queryString.taskId } : {}
        }
        const options = {
            ...(typeof queryString.page != "undefined" && queryString.page != "") ? { offset: (limit * _.toNumber(queryString.page)) - limit, limit } : {},
            ...(typeof queryString.includes != "undefined" && queryString.includes != "") ? { include: _.filter(association, (associationObj) => { return _.findIndex((queryString.includes).split(','), (includesObj) => { return includesObj == associationObj.as }) >= 0 }) } : {}
        }
        try {
            TaskChecklist.findAll(
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
        const options = {
            include: [
                {
                    model: Users,
                    as: 'user',
                    attributes: ['firstName', 'lastName']
                }
            ]
        }

        try {
            TaskChecklist.create(body).then((response) => {
                TaskChecklist.findOne({ ...options, where: { id: response.dataValues.id } }).then((response) => {
                    const insertResponse = response.toJSON();
                    if (body.isPeriodicTask == 1) {
                        const { periodTask, description, isDocument, isMandatory, taskDueDate, createdBy } = body;

                        Tasks.findAll(
                            {
                                where: {
                                    periodTask: periodTask,
                                    $and: Tasks.sequelize.where(Tasks.sequelize.fn('date', Tasks.sequelize.col('dueDate')), '>', moment(taskDueDate).format('YYYY-MM-DD HH:mm:ss'))
                                }
                            }
                        ).map((mapObject) => {
                            return mapObject.toJSON();
                        }).then((resultArray) => {
                            if (resultArray.length > 0) {
                                const newPeriodicChecklist = _.map(resultArray, (resultObj) => {
                                    return {
                                        description: description,
                                        isDocument: isDocument,
                                        isMandatory: isMandatory,
                                        taskId: resultObj.id,
                                        createdBy: createdBy,
                                        periodChecklist: insertResponse.id
                                    }
                                });
                                TaskChecklist.bulkCreate(newPeriodicChecklist).then(() => {
                                    cb({ status: true, data: insertResponse });
                                })
                            } else {
                                cb({ status: true, data: insertResponse });
                            }
                        });
                    } else {
                        cb({ status: true, data: insertResponse });
                    }
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
        const options = {
            include: [
                {
                    model: Users,
                    as: 'user',
                    attributes: ['firstName', 'lastName']
                }
            ]
        }

        try {
            TaskChecklist.update(body, { where: { id: body.id } }).then((response) => {
                TaskChecklist.findOne({ ...options, where: { id: body.id } }).then((response) => {
                    const updateResponse = response.toJSON();
                    if (typeof body.isPeriodicTask != "undefined" && body.isPeriodicTask == 1) {
                        const { id, periodTask, description, isDocument, isMandatory, taskDueDate, createdBy, periodChecklist } = body;
                        Tasks.findAll(
                            {
                                where: {
                                    periodTask: periodTask,
                                    $and: Tasks.sequelize.where(Tasks.sequelize.fn('date', Tasks.sequelize.col('dueDate')), '>', moment(taskDueDate).format('YYYY-MM-DD HH:mm:ss'))
                                }
                            }
                        ).map((mapObject) => {
                            return mapObject.toJSON();
                        }).then((resultArray) => {
                            if (resultArray.length > 0) {
                                const updatePeriodicChecklistPromise = _.map(resultArray, (resultObj) => {
                                    const checkListPeriodId = (periodChecklist != null) ? periodChecklist : id;
                                    const updatedChecklistData = {
                                        description: description,
                                        isDocument: isDocument,
                                        isMandatory: isMandatory,
                                        createdBy: createdBy
                                    };

                                    return new Promise((resolve) => {
                                        TaskChecklist.update(updatedChecklistData, { where: { taskId: resultObj.id, periodChecklist: checkListPeriodId } }).then((response) => {
                                            resolve(response)
                                        });
                                    });
                                });
                                Promise.all(updatePeriodicChecklistPromise).then((values) => {
                                    cb({ status: true, data: updateResponse });
                                }).catch((err) => {
                                    cb({ status: false, error: err })
                                });
                            } else {
                                cb({ status: true, data: updateResponse });
                            }
                        });
                    } else {
                        cb({ status: true, data: updateResponse });
                    }
                });
            });
        } catch (err) {
            cb({ status: false, error: err })
        }
    }
}

exports.delete = {
    index: (req, cb) => {
        const id = req.params.id;
        const queryString = req.query;

        try {
            TaskChecklist.findOne(
                { where: { id: id } }
            ).then((response) => {
                const taskChecklistResponse = response.toJSON();
                const periodChecklist = (taskChecklistResponse.periodChecklist != null) ? taskChecklistResponse.periodChecklist : id;
                const checklistTaskId = queryString.taskId;

                TaskChecklist.findAll(
                    {
                        where: {
                            periodChecklist,
                            taskId: {
                                [Op.gt]: checklistTaskId
                            }
                        }
                    }
                ).map((mapObject) => {
                    return mapObject.toJSON();
                }).then((resultArray) => {
                    const toBeDeletedChecklist = _.map(resultArray, (resultObj) => { return resultObj.id });
                    toBeDeletedChecklist.push(id);
                    TaskChecklist.destroy({ where: { id: toBeDeletedChecklist } }).then(() => {
                        cb({ status: true, data: id })
                    });
                });

            });
        } catch (err) {
            cb({ status: false, error: err })
        }
    }
}