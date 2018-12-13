const moment = require("moment");
const _ = require("lodash");
const Sequelize = require('sequelize');
const sequence = require('sequence').Sequence;
const models = require('../modelORM');
const { ChecklistDocuments, Tag, Tasks, TaskChecklist, Users, Document, DocumentLink, ActivityLogs, Workstream } = models;
const Op = Sequelize.Op
const func = global.initFunc();
const documentAssociationStack = [
    {
        model: Tag,
        where: {
            linkType: 'workstream', tagType: 'document'
        },
        as: 'tagDocumentWorkstream',
        required: false,
        include: [
            {
                model: Workstream,
                as: 'tagWorkstream',
            }
        ]
    },
    {
        model: Tag,
        where: {
            linkType: 'task', tagType: 'document'
        },
        as: 'tagDocumentTask',
        required: false,
        include: [{
            model: Tasks,
            as: 'tagTask',
        }],
    },
    {
        model: Users,
        as: 'user',
        attributes: ['firstName', 'lastName', 'phoneNumber', 'emailAddress']
    }
]

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
                    as: 'document',
                    include: [{
                        model: Users,
                        as: 'user'
                    }]
                }]
            }
        ]
        const whereObj = {
            ...(typeof queryString.taskId != "undefined" && queryString.taskId != "") ? { taskId: queryString.taskId } : {},
            isDeleted: 0
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
                },
                {
                    model: ChecklistDocuments,
                    as: 'tagDocuments',
                    include: [{
                        model: Document,
                        as: 'document',
                        include: [{
                            model: Users,
                            as: 'user'
                        }]
                    }]
                }
            ]
        }

        try {
            TaskChecklist.create(body).then((response) => {
                TaskChecklist.findOne({ ...options, where: { id: response.dataValues.id } }).then((findRes) => {
                    const insertResponse = { ...findRes.toJSON(), document: findRes.tagDocuments.length ? findRes.tagDocuments.map((e) => { return e.document }) : [] }

                    async.waterfall([
                        function (callback) {
                            const checklistActivityLog = _.map([insertResponse], (o) => {
                                const checklistObj = _.omit(o, ["dateAdded", "dateUpdated"]);
                                return { usersId: body.createdBy, linkType: "checklist", linkId: checklistObj.id, actionType: "added", new: JSON.stringify({ checklist: checklistObj }), title: o.description }
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
                                                    const checklistObj = _.omit(o, ["dateAdded", "dateUpdated"]);
                                                    return {
                                                        usersId: body.createdBy,
                                                        linkType: "checklist",
                                                        linkId: o.id,
                                                        actionType: "added",
                                                        new: JSON.stringify({ checklist: checklistObj }),
                                                        title: o.description
                                                    }
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
        }
        try {
            TaskChecklist.findOne({ ...options, where: { id: body.id } }).then((response) => {
                const responseObj = response.toJSON();
                let oldTaskChecklist = responseObj;
                let isMandatory = (oldTaskChecklist.isMandatory == 1) ? "Mandatory" : "Non Mandatory";
                let isDocument = (oldTaskChecklist.isDocument == 1) ? "Document" : "Non Document";
                let status = (oldTaskChecklist.isCompleted == 1) ? "Complete" : "Not Complete";

                checklistType = isMandatory + " and " + isDocument;
                oldTaskChecklist = _.pick({ ...oldTaskChecklist, type: checklistType, status }, ["description", "type", "status"]);

                TaskChecklist.update(body, { where: { id: body.id } }).then((response) => {
                    return TaskChecklist.findOne({ ...options, where: { id: body.id } });
                }).then((response) => {
                    const updateResponse = _.omit({
                        ...response.dataValues,
                        document: response.dataValues.tagDocuments.map((e) => { return e.document })
                    }, "tagDocuments");

                    isMandatory = (updateResponse.isMandatory == 1) ? "Mandatory" : "Non Mandatory";
                    isDocument = (updateResponse.isDocument == 1) ? "Document" : "Non Document";
                    checklistType = isMandatory + " and " + isDocument;
                    status = (updateResponse.isCompleted == 1) ? "Complete" : "Not Complete";

                    const newObject = func.changedObjAttributes(_.pick({ ...updateResponse, type: checklistType, status }, ["description", "type", "status"]), oldTaskChecklist);
                    const objectKeys = _.map(newObject, function (value, key) { return key; });

                    if (_.isEmpty(newObject)) {
                        cb({ status: true, data: { checklist: updateResponse } });
                    } else {
                        const activityLogStack = [{
                            usersId: body.createdBy,
                            linkType: "checklist",
                            linkId: updateResponse.id,
                            actionType: "modified",
                            old: JSON.stringify({ checklist: _.pick(oldTaskChecklist, objectKeys) }),
                            new: JSON.stringify({ checklist: newObject }),
                            title: oldTaskChecklist.description
                        }];

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
                                                        let responseObj = response.toJSON();
                                                        let isMandatory = (responseObj.isMandatory == 1) ? "Mandatory" : "Non Mandatory";
                                                        let isDocument = (responseObj.isDocument == 1) ? "Document" : "Non Document";
                                                        checklistType = isMandatory + " and " + isDocument;
                                                        let oldTaskChecklist = _.pick({ ...responseObj, type: checklistType }, ["description", "type"]);

                                                        TaskChecklist.update(updatedChecklistData, { where: { taskId: resultObj.id, periodChecklist: checkListPeriodId } }).then((response) => {
                                                            return TaskChecklist.findOne({ ...options, where: { id: body.id } });
                                                        }).then((response) => {
                                                            const updateResponse = response.toJSON();
                                                            isMandatory = (updateResponse.isMandatory == 1) ? "Mandatory" : "Non Mandatory";
                                                            isDocument = (updateResponse.isDocument == 1) ? "Document" : "Non Document";
                                                            checklistType = isMandatory + " and " + isDocument;
                                                            const newObject = func.changedObjAttributes(_.pick({ ...updateResponse, type: checklistType }, ["description", "type"]), oldTaskChecklist);
                                                            const objectKeys = _.map(newObject, function (value, key) { return key; });

                                                            if (_.isEmpty(newObject)) {
                                                                resolve("");
                                                            } else {
                                                                resolve({
                                                                    usersId: body.createdBy,
                                                                    linkType: "checklist",
                                                                    linkId: responseObj.id,
                                                                    actionType: "modified",
                                                                    old: JSON.stringify({ checklist: _.pick(oldTaskChecklist, objectKeys) }),
                                                                    new: JSON.stringify({ checklist: newObject }),
                                                                    title: oldTaskChecklist.description
                                                                });
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
        const data = req.body;
        const id = req.params.id;
        const projectId = data.projectId;
        const taskId = data.taskId;
        const documents = data.documents;
        const userId = req.query.userId;

        sequence.create().then((nextThen) => {
            async.map(documents, (e, mapCallback) => {
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
                                            projectId: projectId
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
            try {
                DocumentLink
                    .findAll({
                        where: { documentId: result },
                        include: [{
                            model: Document,
                            as: 'document',
                            include: documentAssociationStack
                        }],
                    })
                    .map((res) => {
                        let resToReturn = {
                            ...res.dataValues.document.toJSON(),
                            tags: res.dataValues.document.tagDocumentWorkstream.map((e) => { return { value: `workstream-${e.tagWorkstream.id}`, label: e.tagWorkstream.workstream } })
                                .concat(res.dataValues.document.tagDocumentTask.map((e) => { return { value: `task-${e.tagTask.id}`, label: e.tagTask.task } }))
                        }
                        return _.omit(resToReturn, "tagDocumentWorkstream", "tagDocumentTask")
                    })
                    .then((res) => {
                        nextThen(res)
                    })

            } catch (err) {
                cb({ status: false, error: err })
            }
        }).then((nextThen, result) => {
            try {
                TaskChecklist
                    .update({ isCompleted: 1 }, { where: { id: id } })
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
                                            as: 'document',
                                            include: [{
                                                model: Users,
                                                as: 'user'
                                            }]
                                        }]
                                    }
                                ]
                            })
                            .then((findRes) => {
                                const taskChecklistObj = findRes.toJSON();
                                const activityLogsStack = [
                                    {
                                        usersId: userId,
                                        linkType: "checklist",
                                        linkId: id,
                                        actionType: "modified",
                                        old: JSON.stringify({ checklist: { status: "Not Complete" } }),
                                        new: JSON.stringify({ checklist: { status: "Complete" } }),
                                        title: taskChecklistObj.description
                                    },
                                    ..._.map(result, (resultObj) => {
                                        return {
                                            usersId: userId,
                                            linkType: "document",
                                            linkId: resultObj.id,
                                            actionType: "added",
                                            new: JSON.stringify({ checklist_document: resultObj }),
                                            title: resultObj.origin
                                        }
                                    })
                                ];
                                ActivityLogs.bulkCreate(activityLogsStack).map((response) => {
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
                                                [Op.in]: responseObj
                                            }
                                        }
                                    })
                                }).map((response) => {
                                    const responseObj = response.toJSON();
                                    return responseObj;
                                }).then((resultArray) => {
                                    const resToReturn = {
                                        ...findRes.dataValues,
                                        document: findRes.dataValues.tagDocuments.map((e) => { return e.document })
                                    };
                                    cb({ status: true, data: { checklist: _.omit(resToReturn, "tagDocuments"), document: result, activity_log: resultArray } })
                                })
                            })
                    })
            } catch (err) {
                cb({ status: false, error: err })
            }
        })













        // sequence.create().then((nextThen) => {
        //     async.map(data.documents, (e, mapCallback) => {
        //         try {
        //             Document
        //                 .findAll({
        //                     where: {
        //                         origin: e.origin
        //                     },
        //                     order: Sequelize.literal('documentNameCount DESC'),
        //                     raw: true,
        //                 })
        //                 .then(res => {
        //                     if (res.length > 0) {
        //                         e.documentNameCount = res[0].documentNameCount + 1
        //                         mapCallback(null, e)
        //                     } else {
        //                         e.projectNameCount = 0;
        //                         mapCallback(null, e)
        //                     }
        //                 })
        //         } catch (err) {
        //             mapCallback(err)
        //         }
        //     }, (err, result) => {
        //         if (err != null) {
        //             cb({ status: false, error: err })
        //         } else {
        //             nextThen(result)
        //         }
        //     })

        // }).then((nextThen, result) => {
        //     async.map(result, (e, mapCallback) => {
        //         let tags = e.tags
        //         delete e.tags
        //         Document
        //             .create(e)
        //             .then((res) => {
        //                 async.parallel({
        //                     documentLink: (parallelCallback) => {
        //                         let linkData = {
        //                             documentId: res.dataValues.id,
        //                             linkType: "project",
        //                             linkId: projectId
        //                         }
        //                         try {
        //                             DocumentLink
        //                                 .create(linkData)
        //                                 .then(c => {
        //                                     parallelCallback(null, c.dataValues)
        //                                 })
        //                         } catch (err) {
        //                             parallelCallback(err)
        //                         }
        //                     },
        //                     documentTag: (parallelCallback) => {
        //                         if (typeof tags != "undefined") {
        //                             async.map(JSON.parse(tags), (t, tagMapCallback) => {
        //                                 let tagData = {
        //                                     linkType: t.value.split("-")[0],
        //                                     linkId: t.value.split("-")[1],
        //                                     tagType: "document",
        //                                     tagTypeId: res.dataValues.id,
        //                                 }

        //                                 try {
        //                                     Tag.create(tagData)
        //                                         .then(c => {
        //                                             tagMapCallback(null, c.data)
        //                                         })
        //                                 } catch (err) {
        //                                     parallelCallback(err)
        //                                 }

        //                             }, (err, tagMapCallbackResult) => {
        //                                 parallelCallback(null, "")
        //                             })
        //                         } else {
        //                             parallelCallback(null, "")
        //                         }
        //                     },
        //                     checklistDocuments: (parallelCallback) => {
        //                         ChecklistDocuments
        //                             .create({ checklistId: id, documentId: res.dataValues.id, taskId: taskId })
        //                             .then((c) => {
        //                                 parallelCallback(null, c.dataValues)
        //                             })
        //                     }
        //                 }, (err, parallelCallbackResult) => {
        //                     if (err != null) {
        //                         mapCallback(err)
        //                     } else {
        //                         mapCallback(null, parallelCallbackResult.documentLink.documentId)
        //                     }
        //                 })
        //             })
        //     }, (err, mapCallbackResult) => {
        //         nextThen(mapCallbackResult)
        //     })
        // }).then((nextThen, result) => {
        //     let dataToSubmit = {
        //         isCompleted: 1,
        //     }
        //     try {
        //         TaskChecklist
        //             .update(dataToSubmit, { where: { id: id } })
        //             .then((res) => {
        //                 TaskChecklist
        //                     .findOne({
        //                         where: { id: id },
        //                         include: [
        //                             {
        //                                 model: Users,
        //                                 as: 'user',
        //                                 attributes: ['firstName', 'lastName']
        //                             },
        //                             {
        //                                 model: ChecklistDocuments,
        //                                 as: 'tagDocuments',
        //                                 include: [{
        //                                     model: Document,
        //                                     as: 'document'
        //                                 }]
        //                             }
        //                         ]
        //                     })
        //                     .then((findRes) => {
        //                         let resToReturn = {
        //                             ...findRes.dataValues,
        //                             document: findRes.dataValues.tagDocuments.map((e) => { return e.document })
        //                         }
        //                         cb({ status: true, data: _.omit(resToReturn, "tagDocuments") })
        //                     })
        //             })
        //     } catch (err) {
        //         cb({ status: false, error: err })
        //     }
        // })
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
                        const checklistObj = _.omit(o, ["dateAdded", "dateUpdated"]);
                        return {
                            usersId: queryString.userId,
                            linkType: "checklist",
                            linkId: o.id,
                            actionType: "deleted",
                            old: JSON.stringify({ checklist: checklistObj }),
                            title: o.description
                        }
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
                        TaskChecklist.update({ isDeleted: 1 }, { where: { id: toBeDeletedChecklist } }).then((response) => {
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