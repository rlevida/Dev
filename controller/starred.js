const _ = require("lodash");
const dbName = "starred";
const { defaultGet, defaultPut, defaultDelete } = require("./")
const models = require('../modelORM');
const { ActivityLogsDocument, Starred, Users, Tasks, Notes, Document } = models;

exports.get = {
    index: (req, cb) => {
        const queryString = req.query;
        const limit = 10;

        const association = [
            {
                model: Users,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName', 'emailAddress']
            }
        ];

        if (typeof queryString.type != "undefined") {
            switch (queryString.type) {
                case "task":
                    association.push({
                        model: Tasks,
                        as: 'task',
                        attributes: ['id', 'task', 'status', 'dueDate']
                    });
                    break;
                case "notes":
                    association.push({
                        model: Notes,
                        as: 'notes'
                    })
                    break;
                case "document":
                    association.push({
                        model: Document,
                        as: 'document'
                    })
                default:
            }
        }

        const options = {
            include: association,
            ...(typeof queryString.page != "undefined" && queryString.page != "") ? { offset: (limit * _.toNumber(queryString.page)) - limit, limit } : {},
            order: [['dateUpdated', 'DESC']]
        };
        const whereObj = {
            ...(typeof queryString.userId !== 'undefined' && queryString.userId !== '') ? { usersId: queryString.userId } : {},
            ...(typeof queryString.type !== 'undefined' && queryString.type !== '') ? { linkType: queryString.type } : {},
            ...(typeof queryString.isActive !== 'undefined' && queryString.isActive !== '') ? { isActive: queryString.isActive } : {}
        }

        async.parallel({
            count: function (callback) {
                try {
                    Starred.findAndCountAll({ ..._.omit(options, ['offset', 'limit']), where: whereObj, distinct: true }).then((response) => {
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
                    Starred.findAll({ ...options, where: whereObj }).map((response) => {
                        let responseObj = response.toJSON();

                        if (typeof responseObj.task != "undefined") {
                            responseObj = { ...responseObj, title: responseObj.task.task }
                        }

                        if (typeof responseObj.notes != "undefined") {
                            responseObj = { ...responseObj, title: responseObj.notes.note }
                        }

                        if (typeof responseObj.document != "undefined") {
                            responseObj = { ...responseObj, title: responseObj.document.origin }
                        }

                        return responseObj;
                    }).then((resultArray) => {
                        callback(null, resultArray);
                    })
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
        defaultGetById(dbName, req, (res) => {
            if (res.status) {
                cb({ status: true, data: res.data })
            } else {
                cb({ status: false, error: res.error })
            }
        })
    }
}

exports.post = {
    index: (req, cb) => {
        const body = req.body;
        const queryString = req.query;

        Starred.findOne({
            where: body
        }).then((response) => {
            async.parallel({
                result: (parallelCallback) => {
                    const responseResult = (response != null) ? response.toJSON() : "";

                    if (responseResult == "") {
                        Starred.create({ ...body, isActive: 1 }).then((response) => {
                            parallelCallback(null, _.omit(response.toJSON(), ["dateUpdated"]))
                        });
                    } else {
                        Starred.update(
                            { ...body, isActive: (responseResult.isActive != 1) ? 1 : 0 },
                            { where: body }
                        ).then((response) => {
                            return Starred.findOne({ where: body });
                        }).then((findRes) => {
                            parallelCallback(null, findRes.toJSON())
                        });
                    }
                },
                documentActivityLog: (parallelCallback) => {
                    if (body.linkType === 'document') {
                        const dataToSubmit = {
                            ...body,
                            actionType: 'starred',
                            projectId: queryString.projectId,
                            old: queryString.document,
                            new: '',
                            title: `${response.isActive ? 'Unstarred document' : 'Starred document'}`
                        }
                        ActivityLogsDocument
                            .create(dataToSubmit)
                            .then((resDocument) => {
                                ActivityLogsDocument
                                    .findOne({
                                        where: resDocument.id,
                                        include: [{
                                            model: Users,
                                            as: 'user'
                                        }]
                                    })
                                    .then((findRes) => {
                                        parallelCallback(null, [findRes])
                                    })
                            })
                    } else {
                        parallelCallback(null, '')
                    }

                }
            }, (err, { result, documentActivityLog }) => {
                cb({ status: true, data: { result: result, documentActivityLog: documentActivityLog } })
            })
        });
    }
}

exports.put = {
    index: (req, cb) => {
        defaultPut(dbName, req, (res) => {
            if (res.success) {
                cb({ status: true, data: res.data })
            } else {
                cb({ status: false, error: c.error })
            }
        })
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