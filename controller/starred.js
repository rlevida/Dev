const _ = require("lodash");
const dbName = "starred";
const models = require("../modelORM");
const { ActivityLogsDocument, Starred, Users, Tasks, Notes, Document, DocumentLink, Workstream, Tag, Sequelize } = models;

exports.get = {
    index: (req, cb) => {
        const queryString = req.query;
        const limit = 10;
        const association = [
            {
                model: Users,
                as: "user",
                attributes: ["id", "firstName", "lastName", "emailAddress"]
            }
        ];
        if (typeof queryString.type != "undefined") {
            switch (queryString.type) {
                case "task":
                    association.push({
                        model: Tasks,
                        as: "task",
                        attributes: ["id", "task", "status", "dueDate"],
                        where: {
                            ...(typeof queryString.projectId != "undefined" && queryString.projectId != "" ? { projectId: queryString.projectId } : {})
                        },
                        include: [
                            {
                                model: Workstream,
                                as: "workstream"
                            }
                        ]
                    });
                    break;
                case "notes":
                    association.push({
                        model: Notes,
                        where: {
                            ...(typeof queryString.projectId != "undefined" && queryString.projectId != "" ? { projectId: queryString.projectId } : {})
                        },
                        as: "notes",
                        include: [
                            {
                                model: Workstream,
                                as: "noteWorkstream"
                            }
                        ]
                    });
                    break;
                case "document":
                    association.push({
                        model: Document,
                        as: "document",
                        include: [
                            {
                                model: DocumentLink,
                                as: "project_member",
                                where: {
                                    ...(typeof queryString.projectId != "undefined" && queryString.projectId != "" ? { linkId: queryString.projectId, linkType: "project" } : {})
                                }
                            },
                            {
                                model: Tag,
                                as: "tagDocumentWorkstream",
                                include: [
                                    {
                                        model: Workstream,
                                        as: "workstream",
                                        where: {
                                            ...(typeof queryString.projectId != "undefined" && queryString.projectId != "" ? { projectId: queryString.projectId } : {})
                                        }
                                    }
                                ]
                            },
                            {
                                model: Users,
                                as: "user"
                            }
                        ]
                    });
                    break;
                default:
            }
        }

        const options = {
            include: association,
            ...(typeof queryString.page != "undefined" && queryString.page != "" ? { offset: limit * _.toNumber(queryString.page) - limit, limit } : {}),
            order: [["dateUpdated", "DESC"]]
        };
        const whereObj = {
            ...(typeof queryString.userId !== "undefined" && queryString.userId !== "" ? { usersId: queryString.userId } : {}),
            ...(typeof queryString.type !== "undefined" && queryString.type !== "" ? { linkType: queryString.type } : {}),
            ...(typeof queryString.isActive !== "undefined" && queryString.isActive !== "" ? { isActive: queryString.isActive } : {}),
            ...(typeof queryString.type == "undefined" || queryString.type == "" ? { linkType: { [Sequelize.Op.not]: "project" } } : {}),
            ...(typeof queryString.isDeleted !== "undefined" && queryString.isDeleted !== "" ? { isDeleted: queryString.isDeleted } : { isDeleted: 0 })
        };
        async.parallel(
            {
                count: function(callback) {
                    try {
                        Starred.findAndCountAll({ ..._.omit(options, ["offset", "limit"]), where: whereObj, distinct: true }).then(response => {
                            const pageData = {
                                total_count: response.count,
                                ...(typeof queryString.page != "undefined" && queryString.page != "" ? { current_page: response.count > 0 ? _.toNumber(queryString.page) : 0, last_page: _.ceil(response.count / limit) } : {})
                            };

                            callback(null, pageData);
                        });
                    } catch (err) {
                        callback(err);
                    }
                },
                result: function(callback) {
                    try {
                        Starred.findAll({
                            ...options,
                            where: whereObj
                        })
                            .map(response => {
                                let responseObj = response.toJSON();
                                if (typeof responseObj.task != "undefined") {
                                    responseObj = { ...responseObj, title: responseObj.task.task, type: "task", workstream: responseObj.task.workstream ? responseObj.task.workstream.workstream : "" };
                                }

                                if (typeof responseObj.notes != "undefined") {
                                    responseObj = { ...responseObj, title: responseObj.notes.note, type: "notes", workstream: responseObj.notes.noteWorkstream ? responseObj.notes.noteWorkstream.workstream : "" };
                                }

                                if (typeof responseObj.document != "undefined") {
                                    responseObj = {
                                        ...responseObj,
                                        title: responseObj.document.origin,
                                        type: "document",
                                        workstream: responseObj.document.tagDocumentWorkstream[0] ? responseObj.document.tagDocumentWorkstream[0].workstream.workstream : ""
                                    };
                                }

                                return responseObj;
                            })
                            .then(async resultArray => {
                                callback(null, resultArray);
                            });
                    } catch (err) {
                        callback(err);
                    }
                }
            },
            function(err, results) {
                if (err != null) {
                    cb({ status: false, error: err });
                } else {
                    cb({ status: true, data: results });
                }
            }
        );
    },
    getById: (req, cb) => {
        defaultGetById(dbName, req, res => {
            if (res.status) {
                cb({ status: true, data: res.data });
            } else {
                cb({ status: false, error: res.error });
            }
        });
    }
};

exports.post = {
    index: (req, cb) => {
        const body = req.body;
        const queryString = req.query;

        Starred.findOne({
            where: body
        }).then(response => {
            async.parallel(
                {
                    result: parallelCallback => {
                        const responseResult = response != null ? response.toJSON() : "";

                        if (responseResult == "") {
                            Starred.create({ ...body, isDeleted: 0 }).then(response => {
                                parallelCallback(null, _.omit(response.toJSON(), ["dateUpdated"]));
                            });
                        } else {
                            Starred.update({ ...body, isDeleted: responseResult.isDeleted != 1 ? 1 : 0 }, { where: body })
                                .then(response => {
                                    return Starred.findOne({ where: body });
                                })
                                .then(findRes => {
                                    parallelCallback(null, findRes.toJSON());
                                });
                        }
                    },
                    documentActivityLog: parallelCallback => {
                        if (body.linkType === "document") {
                            const dataToSubmit = {
                                ...body,
                                actionType: "starred",
                                projectId: queryString.projectId,
                                old: queryString.document,
                                new: "",
                                title: `${response !== null && response.isActive ? "Unstarred document" : "Starred document"}`
                            };
                            ActivityLogsDocument.create(dataToSubmit).then(resDocument => {
                                ActivityLogsDocument.findOne({
                                    where: resDocument.id,
                                    include: [
                                        {
                                            model: Users,
                                            as: "user"
                                        }
                                    ]
                                }).then(findRes => {
                                    parallelCallback(null, [findRes]);
                                });
                            });
                        } else {
                            parallelCallback(null, "");
                        }
                    }
                },
                (err, { result, documentActivityLog }) => {
                    cb({ status: true, data: { result: result, documentActivityLog: documentActivityLog } });
                }
            );
        });
    }
};
