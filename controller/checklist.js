const moment = require("moment");
const _ = require("lodash");
const Sequelize = require('sequelize');
const sequence = require('sequence').Sequence;
const models = require('../modelORM');
const { ChecklistDocuments, Tag, Tasks, TaskChecklist, Users, Document, DocumentLink, ActivityLogs } = models;
const Op = Sequelize.Op
const func = global.initFunc();

exports.get = {
    getCheckList: (req, cb) => {
        const queryString = req.query;
        const limit = 5;
        const association = [
            {
                model: Users,
                as: 'user',
                attributes: ['firstName', 'lastName']
            },
            {
                model: ChecklistDocuments,
                as: 'tagDocuments',
                include: [{
                    model: Document,
                    as: 'document'
                }]
            }
        ]
        const whereObj = {
            ...(typeof queryString.taskId != "undefined" && queryString.taskId != "") ? { taskId: queryString.taskId } : {}
        }
        const options = {
            ...(typeof queryString.page != "undefined" && queryString.page != "") ? { offset: (limit * _.toNumber(queryString.page)) - limit, limit } : {},
            // ...(typeof queryString.includes != "undefined" && queryString.includes != "") ? { include: _.filter(association, (associationObj) => { return _.findIndex((queryString.includes).split(','), (includesObj) => { return includesObj == associationObj.as }) >= 0 }) } : {}
        }
        try {
            TaskChecklist.findAll(
                {
                    where: whereObj,
                    include: association,
                    options
                    // ..._.omit(options, ["includes"]), where: whereObj
                }
            ).map((mapObject) => {
                const objToReturn = {
                    ...mapObject.dataValues,
                    document: mapObject.dataValues.tagDocuments.map((e) => { return e.document })
                }
                return _.omit(objToReturn, "tagDocuments");
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

                    async.waterfall([
                        function (callback) {
                            const checklistActivityLog = _.map([insertResponse], (o) => {
                                const checklistObj = _.omit({ ...o, value: o.description }, ["dateAdded", "dateUpdated"]);
                                return { usersId: body.createdBy, linkType: "task", linkId: body.taskId, actionType: "created", new: JSON.stringify({ task_checklist: checklistObj }) }
                            });

                            if (body.isPeriodicTask == 1) {
                                const { periodTask, description, isDocument, isMandatory, taskDueDate, createdBy } = body;

                                Tasks.findAll(
                                    {
                                        where: {
                                            periodTask: periodTask,
                                            dueDate: {
                                                [Op.gt]: moment(taskDueDate).format('YYYY-MM-DD HH:mm:ss')
                                            }
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

                                        TaskChecklist.bulkCreate(newPeriodicChecklist).map((response) => {
                                            return response.toJSON();
                                        }).then((resultArray) => {
                                            const checklistIds = _.map(resultArray, (o) => { return o.id });

                                            TaskChecklist.findAll({ ...options, where: { id: checklistIds } }).map((response) => {
                                                return response.toJSON();
                                            }).then((result) => {
                                                const updatedChecklistArray = _.map(result, (o) => {
                                                    const checklistObj = _.omit({ ...o, value: o.description }, ["dateAdded", "dateUpdated"]);
                                                    return { usersId: body.createdBy, linkType: "task", linkId: o.taskId, actionType: "created", new: JSON.stringify({ task_checklist: checklistObj }) }
                                                });
                                                callback(null, [...checklistActivityLog, ...updatedChecklistArray])
                                            });

                                        });
                                    } else {
                                        callback(null, checklistActivityLog);
                                    }
                                });
                            } else {
                                callback(null, checklistActivityLog);
                            }
                        },
                        function (activityLogs, callback) {
                            ActivityLogs.bulkCreate(activityLogs).map((response) => {
                                return response.toJSON();
                            }).then((resultArray) => {
                                const responseObj = resultArray[0];
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
                                callback(null, { checklist: insertResponse, activity_log: responseObj });
                            });
                        }
                    ], function (err, result) {
                        cb({ status: true, data: result });
                    });
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
            TaskChecklist.findOne({ ...options, where: { id: body.id } }).then((response) => {
                let oldTaskChecklist = response.toJSON();
                oldTaskChecklist = _.pick({ ...oldTaskChecklist, value: oldTaskChecklist.description }, ["description"]);

                TaskChecklist.update(body, { where: { id: body.id } }).then((response) => {
                    return TaskChecklist.findOne({ ...options, where: { id: body.id } });
                }).then((response) => {
                    const updateResponse = response.toJSON();
                    const newObject = func.changedObjAttributes(_.pick(updateResponse, ["description"]), oldTaskChecklist);

                    if (_.isEmpty(newObject)) {
                        cb({ status: true, data: updateResponse });
                    } else {
                        const activityLogStack = [{ usersId: body.createdBy, linkType: "task", linkId: body.taskId, actionType: "modified", old: JSON.stringify({ task_checklist: oldTaskChecklist }), new: JSON.stringify({ task_checklist: newObject }) }];

                        async.waterfall([
                            function (callback) {
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
                                                    TaskChecklist.findOne({ ...options, where: { taskId: resultObj.id, periodChecklist: checkListPeriodId } }).then((response) => {
                                                        let oldTaskChecklist = response.toJSON();
                                                        const oldTaskChecklistIdTaskId = oldTaskChecklist.taskId
                                                        oldTaskChecklist = _.pick({ ...oldTaskChecklist, value: oldTaskChecklist.description }, ["description"]);

                                                        TaskChecklist.update(updatedChecklistData, { where: { taskId: resultObj.id, periodChecklist: checkListPeriodId } }).then((response) => {
                                                            return TaskChecklist.findOne({ ...options, where: { id: body.id } });
                                                        }).then((response) => {
                                                            const updateResponse = response.toJSON();
                                                            const newObject = func.changedObjAttributes(_.pick(updateResponse, ["description"]), oldTaskChecklist);

                                                            if (_.isEmpty(newObject)) {
                                                                resolve("");
                                                            } else {
                                                                resolve({ usersId: body.createdBy, linkType: "task", linkId: oldTaskChecklistIdTaskId, actionType: "modified", old: JSON.stringify({ task_checklist: oldTaskChecklist }), new: JSON.stringify({ task_checklist: newObject }) });
                                                            }
                                                        });
                                                    });
                                                });
                                            });
                                            Promise.all(updatePeriodicChecklistPromise).then((values) => {
                                                callback(null, [...activityLogStack, ...values]);
                                            }).catch((err) => {
                                                callback(null, activityLogStack);
                                            });
                                        } else {
                                            callback(null, activityLogStack);
                                        }
                                    });
                                } else {
                                    callback(null, activityLogStack);
                                }
                            },
                            function (params, callback) {
                                ActivityLogs.bulkCreate(params).map((response) => {
                                    return response.toJSON();
                                }).then((resultArray) => {
                                    const responseObj = resultArray[0];
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
                                    callback(null, { checklist: updateResponse, activity_log: responseObj });
                                });
                            },
                        ], function (err, result) {
                            cb({ status: true, data: result });
                        });
                    }

                });
            });
        } catch (err) {
            cb({ status: false, error: err })
        }
    },
    updateChecklistDocument: (req, cb) => {
        const data = req.body
        const id = req.params.id
        const projectId = data.projectId
        const taskId = data.taskId

        sequence.create().then((nextThen) => {
            async.map(data.documents, (e, mapCallback) => {
                try {
                    Document
                        .findAll({
                            where: {
                                origin: e.origin
                            },
                            order: Sequelize.literal('documentNameCount DESC'),
                            raw: true,
                        })
                        .then(res => {
                            if (res.length > 0) {
                                e.documentNameCount = res[0].documentNameCount + 1
                                mapCallback(null, e)
                            } else {
                                e.projectNameCount = 0;
                                mapCallback(null, e)
                            }
                        })
                } catch (err) {
                    mapCallback(err)
                }
            }, (err, result) => {
                if (err != null) {
                    cb({ status: false, error: err })
                } else {
                    nextThen(result)
                }
            })

        }).then((nextThen, result) => {
            async.map(result, (e, mapCallback) => {
                let tags = e.tags
                delete e.tags
                Document
                    .create(e)
                    .then((res) => {
                        async.parallel({
                            documentLink: (parallelCallback) => {
                                let linkData = {
                                    documentId: res.dataValues.id,
                                    linkType: "project",
                                    linkId: projectId
                                }
                                try {
                                    DocumentLink
                                        .create(linkData)
                                        .then(c => {
                                            parallelCallback(null, c.dataValues)
                                        })
                                } catch (err) {
                                    parallelCallback(err)
                                }
                            },
                            documentTag: (parallelCallback) => {
                                if (typeof tags != "undefined") {
                                    async.map(JSON.parse(tags), (t, tagMapCallback) => {
                                        let tagData = {
                                            linkType: t.value.split("-")[0],
                                            linkId: t.value.split("-")[1],
                                            tagType: "document",
                                            tagTypeId: res.dataValues.id,
                                        }

                                        try {
                                            Tag.create(tagData)
                                                .then(c => {
                                                    tagMapCallback(null, c.data)
                                                })
                                        } catch (err) {
                                            parallelCallback(err)
                                        }

                                    }, (err, tagMapCallbackResult) => {
                                        parallelCallback(null, "")
                                    })
                                } else {
                                    parallelCallback(null, "")
                                }
                            },
                            checklistDocuments: (parallelCallback) => {
                                ChecklistDocuments
                                    .create({ checklistId: id, documentId: res.dataValues.id, taskId: taskId })
                                    .then((c) => {
                                        parallelCallback(null, c.dataValues)
                                    })
                            }
                        }, (err, parallelCallbackResult) => {
                            if (err != null) {
                                mapCallback(err)
                            } else {
                                mapCallback(null, parallelCallbackResult.documentLink.documentId)
                            }
                        })
                    })
            }, (err, mapCallbackResult) => {
                nextThen(mapCallbackResult)
            })
        }).then((nextThen, result) => {
            let dataToSubmit = {
                isCompleted: 1,
            }
            try {
                TaskChecklist
                    .update(dataToSubmit, { where: { id: id } })
                    .then((res) => {
                        TaskChecklist
                            .findOne({
                                where: { id: id },
                                include: [
                                    {
                                        model: Users,
                                        as: 'user',
                                        attributes: ['firstName', 'lastName']
                                    },
                                    {
                                        model: ChecklistDocuments,
                                        as: 'tagDocuments',
                                        include: [{
                                            model: Document,
                                            as: 'document'
                                        }]
                                    }
                                ]
                            })
                            .then((findRes) => {
                                let resToReturn = {
                                    ...findRes.dataValues,
                                    document: findRes.dataValues.tagDocuments.map((e) => { return e.document })
                                }
                                cb({ status: true, data: _.omit(resToReturn, "tagDocuments") })
                            })
                    })
            } catch (err) {
                cb({ status: false, error: err })
            }
        })
    }
}

exports.delete = {
    index: (req, cb) => {
        const id = req.params.id;
        const queryString = req.query;
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
            TaskChecklist.findOne(
                { ...options, where: { id: id } }
            ).then((response) => {
                const taskChecklistResponse = response.toJSON();
                const periodChecklist = (taskChecklistResponse.periodChecklist != null) ? taskChecklistResponse.periodChecklist : id;
                const checklistTaskId = queryString.taskId;

                TaskChecklist.findAll(
                    {
                        ...options,
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
                    const toBeDeletedArray = resultArray;
                    const deletedActivity = _.map([...toBeDeletedArray, taskChecklistResponse], (o) => {
                        const checklistObj = _.omit({ ...o, value: o.description }, ["dateAdded", "dateUpdated"]);
                        return { usersId: queryString.userId, linkType: "task", linkId: o.taskId, actionType: "deleted", old: JSON.stringify({ task_checklist: checklistObj }) }
                    });

                    ActivityLogs.bulkCreate(deletedActivity).map((response) => {
                        return response.toJSON();
                    }).then((resultArray) => {
                        const responseObj = resultArray[0];
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
                        const toBeDeletedChecklist = _.map(toBeDeletedArray, (resultObj) => { return resultObj.id });
                        toBeDeletedChecklist.push(id);
                        TaskChecklist.destroy({ where: { id: toBeDeletedChecklist } }).then(() => {
                            cb({ status: true, data: { id, activity_log: responseObj } })
                        });
                    });
                });

            });
        } catch (err) {
            cb({ status: false, error: err })
        }
    }
}