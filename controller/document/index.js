const sequence = require("sequence").Sequence,
    toPdf = require("office-to-pdf"),
    mime = require("mime-types"),
    path = require("path");
const _ = require("lodash");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const models = require("../../modelORM");
const moment = require("moment");
const { ActivityLogsDocument, Document, DocumentLink, DocumentRead, Starred, Tasks, Tag, Users, Workstream, Notes } = models;
const func = global.initFunc();
const createDocument = require("./utils/createDocument");
const createDocumentTag = require("./utils/createDocumentTag");
const createDocumentActivityLog = require("./utils/createDocumentActivityLog");
const createDocumentNotification = require("./utils/createDocumentNotification");
const getDocumentById = require("./utils/getDocumentById");

const associationFindAllStack = [
    {
        model: Tag,
        where: {
            linkType: "workstream",
            tagType: "document"
        },
        as: "tagDocumentWorkstream",
        required: false,
        include: [
            {
                model: Workstream,
                as: "tagWorkstream"
            }
        ]
    },
    {
        model: Tag,
        where: {
            linkType: "task",
            tagType: "document"
        },
        required: false,
        as: "tagDocumentTask",
        include: [
            {
                model: Tasks,
                as: "tagTask"
            }
        ]
    },
    {
        model: Tag,
        where: {
            linkType: "notes",
            tagType: "document"
        },
        required: false,
        as: "tagDocumentNotes",
        include: [
            {
                model: Notes,
                as: "TagNotes"
            }
        ]
    },
    {
        model: Users,
        as: "user"
    },
    {
        model: Starred,
        as: "document_starred",
        where: { linkType: "document", isActive: 1, isDeleted: 0 },
        required: false,
        include: [
            {
                model: Users,
                as: "user",
                attributes: ["id", "firstName", "lastName", "emailAddress"]
            }
        ]
    },
    {
        model: Document,
        as: "document_folder",
        where: { type: "folder" },
        required: false
    },
    {
        model: DocumentRead,
        as: "document_read",
        required: false
    }
];
const async = require("async");

exports.get = {
    index: async (req, cb) => {
        try {
            const queryString = req.query;
            const limit = 10;
            let associationStack = _.cloneDeep(associationFindAllStack);
            const options = {
                ...(typeof queryString.page != "undefined" && queryString.page != "undefined" && queryString.page != "" ? { offset: limit * parseInt(queryString.page) - limit, limit } : {}),
                order: [["dateAdded", "DESC"]]
            };

            const documentLinkWhereObj = {
                ...(typeof queryString.linkId != "undefined" && queryString.linkId != "" ? { linkId: queryString.linkId } : {}),
                ...(typeof queryString.linkType != "undefined" && queryString.linkType != "" ? { linkType: queryString.linkType } : {}),
                ...(typeof queryString.documentId != "undefined" && queryString.documentId != "" ? { documentId: queryString.documentId } : {})
            };

            let documentWhereObj = {
                ...(typeof queryString.status != "undefined" && queryString.status != "" ? { status: queryString.status } : {}),
                ...(typeof queryString.type != "undefined" && queryString.type != "" ? { type: queryString.type } : {}),
                ...(typeof queryString.isDeleted != "undefined" && queryString.isDeleted != "" ? { isDeleted: parseInt(queryString.isDeleted) } : {}),
                ...(typeof queryString.isActive != "undefined" && queryString.isActive != "" ? { isActive: parseInt(queryString.isActive) } : {}),
                ...(typeof queryString.folderId != "undefined" && queryString.folderId != "undefined" && queryString.folderId != "" ? { folderId: queryString.folderId == "null" ? null : queryString.folderId } : {}),
                ...(typeof queryString.isCompleted != "undefined" && queryString.isCompleted != "" ? { isCompleted: parseInt(queryString.isCompleted) } : {}),
                ...(typeof queryString.isArchived != "undefined" && queryString.isArchived != "" ? { isArchived: parseInt(queryString.isArchived) } : {}),
                ...(typeof queryString.uploadFrom != "undefined" && typeof queryString.uploadTo != "undefined" && queryString.uploadFrom != "" && queryString.uploadTo != "" && queryString.uploadFrom != "undefined" && queryString.uploadTo != "undefined"
                    ? {
                        dateAdded: {
                            [Op.between]: [
                                moment(queryString.uploadFrom, "YYYY-MM-DD")
                                    .utc()
                                    .format("YYYY-MM-DD HH:mm"),
                                moment(queryString.uploadTo, "YYYY-MM-DD")
                                    .endOf("day")
                                    .utc()
                                    .format("YYYY-MM-DD HH:mm")
                            ]
                        }
                    }
                    : {})
            };


            if (typeof queryString.userId !== "undefined" && queryString.userId !== "") {
                _.find(associationStack, { as: "document_read" }).where = {
                    usersId: queryString.userId,
                    isDeleted: 0
                };
            }

            if (typeof queryString.starredUser !== "undefined" && queryString.starredUser !== "") {
                _.find(associationStack, { as: "document_starred" }).where = {
                    linkType: "document",
                    isActive: 1,
                    isDeleted: 0,
                    usersId: queryString.starredUser
                };
            }

            /* Filter request */
            if (typeof queryString.fileName !== "undefined" && queryString.fileName !== "") {
                documentWhereObj = {
                    ...documentWhereObj,
                    [Op.or]: [
                        Sequelize.where(Sequelize.fn("lower", Sequelize.col("origin")), {
                            [Op.like]: Sequelize.fn("lower", `%${queryString.fileName}%`)
                        })
                    ]
                };
            }

            /* Filter request */
            if (typeof queryString.workstream !== "undefined" && queryString.workstream !== "") {
                _.find(associationStack, { as: "tagDocumentWorkstream" }).where = {
                    linkId: queryString.workstream,
                    linkType: "workstream",
                    tagType: "document"
                };
                _.find(associationStack, { as: "tagDocumentWorkstream" }).required = true;
            } else {
                _.find(associationStack, { as: "tagDocumentWorkstream" }).required = false;
            }

            /* Filter request */
            if (typeof queryString.task !== "undefined" && queryString.task !== "") {
                _.find(associationStack, { as: "tagDocumentTask" }).where = {
                    linkId: queryString.task,
                    linkType: "task",
                    tagType: "document"
                };
                _.find(associationStack, { as: "tagDocumentTask" }).required = true;
            } else {
                _.find(associationStack, { as: "tagDocumentTask" }).required = false;
            }

            /* Filter request */
            if (typeof queryString.uploadedBy !== "undefined" && queryString.uploadedBy !== "") {
                _.find(associationStack, { as: "user" }).where = {
                    [Op.or]: [{ firstName: { [Op.like]: `%${queryString.uploadedBy}%` } }, { lastName: { [Op.like]: `%${queryString.uploadedBy}%` } }]
                };
                _.find(associationStack, { as: "user" }).required = true;
            } else {
                delete _.find(associationStack, { as: "user" }).required;
                delete _.find(associationStack, { as: "user" }).where;
            }

            /* Get all documents that are link to the project */
            const findDocumentLinkResult = await DocumentLink.findAndCountAll({
                ...options,
                where: documentLinkWhereObj,
                include: [
                    {
                        model: Document,
                        as: "document",
                        where: documentWhereObj,
                        include: associationStack,

                        hierarchy: true
                    }
                ]
            })

            const { rows, count } = { ...findDocumentLinkResult };

            /* Map all fields to return */
            const documentResult = rows.map((documentLink) => {
                const tagDocumentObj = documentLink.document.toJSON();
                const tagTaskArray = tagDocumentObj.tagDocumentTask
                    .map(e => {
                        if (e.tagTask) {
                            return { value: e.tagTask.id, label: e.tagTask.task };
                        }
                        return;
                    })
                    .filter(e => {
                        return e;
                    });
                let resToReturn = {
                    ...tagDocumentObj,
                    tagWorkstream: tagDocumentObj.tagDocumentWorkstream.filter(e => { return e.tagWorkstream; }).map(e => { return { value: e.tagWorkstream.id, label: e.tagWorkstream.workstream }; }),
                    tagTask: tagTaskArray.length ? tagTaskArray : [],
                    tagNote: tagDocumentObj.tagDocumentNotes.map(e => { return { value: e.TagNotes.id, label: e.TagNotes.note }; }),
                    isStarred: typeof queryString.starredUser !== "undefined" && queryString.starredUser !== "" && tagDocumentObj.document_starred.length > 0 ? tagDocumentObj.document_starred[0].isActive : 0,
                    isRead: tagDocumentObj.document_read.length > 0 ? 1 : 0
                };
                return _.omit(resToReturn, "tagDocumentWorkstream", "tagDocumentTask", "tagDocumentNotes");
            });

            const documentPaginationCount = {
                total_count: count,
                ...(typeof queryString.page != "undefined" && queryString.page != "" ? { current_page: count > 0 ? _.toNumber(queryString.page) : 0, last_page: _.ceil(count / limit) } : {})
            }
            const results = { count: documentPaginationCount, result: documentResult };

            cb({ status: true, data: results });

        } catch (error) {
            cb({ status: false, error: error });
        }

    },
    getById: (req, cb) => {
        const id = req.params.id;
        const queryString = req.query;
        const whereObj = {
            ...(typeof id !== "undefined" && id !== "" ? { id: id } : {})
        };

        Document.findOne({
            where: whereObj,
            include: associationFindAllStack
        }).then(res => {
            const documentObj = res.toJSON();
            let resToReturn = {
                ...documentObj,
                tagWorkstream: documentObj.tagDocumentWorkstream.map(e => {
                    return { value: e.tagWorkstream.id, label: e.tagWorkstream.workstream };
                }),
                tagTask: documentObj.tagDocumentTask.map(e => {
                    return { value: e.tagTask.id, label: e.tagTask.task };
                }),
                tagNote: documentObj.tagDocumentNotes.map(e => {
                    return { value: e.TagNotes.id, label: e.TagNotes.note };
                }),
                isStarred: typeof queryString.starredUser !== "undefined" && queryString.starredUser !== "" && documentObj.document_starred.length > 0 ? documentObj.document_starred[0].isActive : 0,
                isRead: documentObj.document_read.length > 0 ? 1 : 0
            };
            cb({ status: true, data: resToReturn });
        });
    },
    getDocumentCount: (req, cb) => {
        const queryString = req.query;
        const documentLinkWhereObj = {
            ...(typeof queryString.linkId != "undefined" && queryString.linkId != "" ? { linkId: queryString.linkId } : {}),
            ...(typeof queryString.linkType != "undefined" && queryString.linkType != "" ? { linkType: queryString.linkType } : {})
        };
        let documentWhereObj = {
            ...(typeof queryString.status != "undefined" && queryString.status != "" ? { status: queryString.status } : {}),
            ...(typeof queryString.isDeleted != "undefined" && queryString.isDeleted != "" ? { isDeleted: queryString.isDeleted } : {}),
            ...(typeof queryString.isCompleted != "undefined" && queryString.isCompleted != "" ? { isCompleted: queryString.isCompleted } : {}),
            ...(typeof queryString.type != "undefined" && queryString.type != "" ? { type: queryString.type } : {})
        };
        if (typeof queryString.userType != "undefined" && queryString.userType == "External" && typeof queryString.userId != "undefined" && queryString.userId != "") {
            documentWhereObj = {
                ...documentWhereObj,
                [Op.or]: {
                    ...(typeof queryString.userType != "undefined" && queryString.userType == "External" && typeof queryString.userId != "undefined" && queryString.userId != ""
                        ? {
                            [Op.or]: [
                                {
                                    id: {
                                        [Op.in]: Sequelize.literal(`(SELECT DISTINCT shareId FROM share where userTypeLinkId = ${queryString.userId})`)
                                    }
                                }
                            ]
                        }
                        : {}),
                    uploadedBy: queryString.userId
                }
            };
        }

        try {
            DocumentLink.findAndCountAll({
                where: documentLinkWhereObj,
                include: [
                    {
                        model: Document,
                        as: "document",
                        where: documentWhereObj,
                        include: associationFindAllStack
                    }
                ]
            }).then(res => {
                cb({ status: true, data: { count: res.count } });
            });
        } catch (err) {
            cb({ status: false, error: err });
        }
    },
    getTaggedDocument: (req, cb) => {
        const queryString = req.query;
        const limit = 10;

        const options = {
            ...(typeof queryString.page != "undefined" && queryString.page != "" ? { offset: limit * _.toNumber(queryString.page) - limit, limit } : {}),
            order: [["dateAdded", "DESC"]]
        };

        let documentWhereObj = {
            ...(typeof queryString.status != "undefined" && queryString.status != "" ? { status: queryString.status } : {}),
            ...(typeof queryString.isDeleted != "undefined" && queryString.isDeleted != "" ? { isDeleted: parseInt(queryString.isDeleted) } : {}),
            ...(typeof queryString.folderId != "undefined" && queryString.folderId != "undefined" && queryString.folderId != "" ? { folderId: queryString.folderId == "null" ? null : queryString.folderId } : {}),
            ...(typeof queryString.isCompleted != "undefined" && queryString.isCompleted != "" ? { isCompleted: parseInt(queryString.isCompleted) } : {}),
            ...(typeof queryString.type != "undefined" && queryString.type != "" ? { type: queryString.type } : {}),
            ...(typeof queryString.isArchived != "undefined" && queryString.isArchived != "" ? { isArchived: parseInt(queryString.isArchived) } : {}),
            ...(typeof queryString.isActive != "undefined" && queryString.isActive != "" ? { isActive: parseInt(queryString.isActive) } : {})
        };

        const tagWhereObj = {
            ...(typeof queryString.tagType != "undefined" && queryString.tagType != "" ? { tagType: queryString.tagType } : {}),
            ...(typeof queryString.workstreamId != "undefined" && queryString.workstreamId != ""
                ? {
                    [Op.or]: [
                        {
                            linkId: {
                                [Op.in]: Sequelize.literal(`(SELECT id FROM task where workstreamId = ${queryString.workstreamId} AND id = ${typeof queryString.taskId != "undefined" ? queryString.taskId : !null} )`)
                            },
                            linkType: "task"
                        },
                        {
                            linkId: queryString.workstreamId,
                            linkType: "workstream"
                        }
                    ]
                }
                : {})
        };

        if (typeof queryString.starredUser !== "undefined" && queryString.starredUser !== "") {
            _.find(associationFindAllStack, { as: "document_starred" }).where = {
                linkType: "document",
                isActive: 1,
                isDeleted: 0,
                usersId: queryString.starredUser
            };
        }

        sequence
            .create()
            .then(nextThen => {
                Tag.findAll({
                    where: tagWhereObj,
                    logging: true
                })
                    .map(res => {
                        return res.tagTypeId;
                    })
                    .then(res => {
                        nextThen(res);
                    });
            })
            .then((nextThen, result) => {
                async.parallel(
                    {
                        count: parallelCallback => {
                            try {
                                Document.findAndCountAll({
                                    where: { ...documentWhereObj, id: result },
                                    include: associationFindAllStack,
                                    ...options
                                }).then(res => {
                                    const pageData = {
                                        total_count: res.count,
                                        ...(typeof queryString.page != "undefined" && queryString.page != "" ? { current_page: res.count > 0 ? _.toNumber(queryString.page) : 0, last_page: _.ceil(res.count / limit) } : {})
                                    };
                                    parallelCallback(null, pageData);
                                });
                            } catch (err) {
                                parallelCallback(err);
                            }
                        },
                        result: parallelCallback => {
                            try {
                                Document.findAll({
                                    where: { ...documentWhereObj, id: result },
                                    include: associationFindAllStack,
                                    ...options
                                })
                                    .map(res => {
                                        const tagTaskArray = res.tagDocumentTask
                                            .map(e => {
                                                if (e.tagTask) {
                                                    return { value: e.tagTask.id, label: e.tagTask.task };
                                                }
                                                return;
                                            })
                                            .filter(e => {
                                                return e;
                                            });
                                        let resToReturn = {
                                            ...res.toJSON(),
                                            tagWorkstream: res.tagDocumentWorkstream.map(e => {
                                                return { value: e.tagWorkstream.id, label: e.tagWorkstream.workstream };
                                            }),
                                            tagTask: tagTaskArray.length ? tagTaskArray : [],
                                            tagNote: res.tagDocumentNotes.map(e => {
                                                return { value: e.TagNotes.id, label: e.TagNotes.note };
                                            }),
                                            isStarred: typeof queryString.starredUser !== "undefined" && queryString.starredUser !== "" && res.document_starred.length > 0 ? res.document_starred[0].isActive : 0,
                                            isRead: res.document_read.length > 0 ? 1 : 0
                                        };
                                        return _.omit(resToReturn, "tagDocumentWorkstream", "tagDocumentTask");
                                    })
                                    .then(res => {
                                        parallelCallback(null, res);
                                    });
                            } catch (err) {
                                parallelCallback(err);
                            }
                        }
                    },
                    (err, results) => {
                        if (err != null) {
                            cb({ status: false, error: err });
                        } else {
                            cb({ status: true, data: results });
                        }
                    }
                );
            });
    },
    getFiles: (req, cb) => {
        const queryString = req.query;
        const limit = 10;

        const options = {
            ...(typeof queryString.page != "undefined" && queryString.page != "" ? { offset: limit * _.toNumber(queryString.page) - limit, limit } : {}),
            order: [["dateAdded", "DESC"]]
        };
        let documentWhereObj = {
            ...(typeof queryString.status != "undefined" && queryString.status != "" ? { status: queryString.status } : {}),
            ...(typeof queryString.isDeleted != "undefined" && queryString.isDeleted != "" ? { isDeleted: parseInt(queryString.isDeleted) } : {}),
            ...(typeof queryString.folderId != "undefined" && queryString.folderId != "undefined" && queryString.folderId != "" ? { folderId: queryString.folderId == "null" ? null : queryString.folderId } : {}),
            ...(typeof queryString.isCompleted != "undefined" && queryString.isCompleted != "" ? { isCompleted: parseInt(queryString.isCompleted) } : {}),
            ...(typeof queryString.type != "undefined" && queryString.type != "" ? { type: queryString.type } : {}),
            ...(typeof queryString.isArchived != "undefined" && queryString.isArchived != "" ? { isArchived: parseInt(queryString.isArchived) } : {}),
            ...(typeof queryString.isActive != "undefined" && queryString.isActive != "" ? { isActive: parseInt(queryString.isActive) } : {})
        };

        const tagWhereObj = {
            ...(typeof queryString.linkType != "undefined" && queryString.linkType != "" ? { linkType: queryString.linkType } : {}),
            ...(typeof queryString.linkId != "undefined" && queryString.linkId != "" ? { linkId: parseInt(queryString.linkId) } : {})
        };
        const documentLinkWhereObj = {
            linkType: "project",
            ...(typeof queryString.projectId != "undefined" && queryString.projectId != "" ? { linkId: parseInt(queryString.projectId) } : {})
        };

        sequence
            .create()
            .then(nextThen => {
                try {
                    DocumentLink.findAll({ where: { ...documentLinkWhereObj } })
                        .map(res => {
                            return res.documentId;
                        })
                        .then(res => {
                            nextThen(res);
                        });
                } catch (err) {
                    cb({ status: false, error: err });
                }
            })
            .then((nextThen, result) => {
                try {
                    Tag.findAll({
                        where: { ...tagWhereObj },
                        logging: true
                    })
                        .map(res => {
                            return res.tagTypeId;
                        })
                        .then(res => {
                            const documentId = result.filter(e => {
                                return res.indexOf(e) < 0;
                            });
                            nextThen(documentId);
                        });
                } catch (err) {
                    cb({ status: false, error: err });
                }
            })
            .then((nextThen, result) => {
                async.parallel(
                    {
                        count: parallelCallback => {
                            try {
                                Document.findAndCountAll({
                                    where: { ...documentWhereObj, id: result },
                                    include: associationFindAllStack,
                                    ...options
                                }).then(res => {
                                    const pageData = {
                                        total_count: res.count,
                                        ...(typeof queryString.page != "undefined" && queryString.page != "" ? { current_page: res.count > 0 ? _.toNumber(queryString.page) : 0, last_page: _.ceil(res.count / limit) } : {})
                                    };
                                    parallelCallback(null, pageData);
                                });
                            } catch (err) {
                                parallelCallback(err);
                            }
                        },
                        result: parallelCallback => {
                            try {
                                Document.findAll({
                                    where: { ...documentWhereObj, id: result },
                                    include: associationFindAllStack,
                                    ...options
                                })
                                    .map(res => {
                                        const tagTaskArray = res.tagDocumentTask
                                            .map(e => {
                                                if (e.tagTask) {
                                                    return { value: e.tagTask.id, label: e.tagTask.task };
                                                }
                                                return;
                                            })
                                            .filter(e => {
                                                return e;
                                            });
                                        let resToReturn = {
                                            ...res.toJSON(),
                                            tagWorkstream: res.tagDocumentWorkstream.map(e => {
                                                return { value: e.tagWorkstream.id, label: e.tagWorkstream.workstream };
                                            }),
                                            tagTask: tagTaskArray.length ? tagTaskArray : [],
                                            tagNote: res.tagDocumentNotes.map(e => {
                                                return { value: e.TagNotes.id, label: e.TagNotes.note };
                                            }),
                                            isStarred: typeof queryString.starredUser !== "undefined" && queryString.starredUser !== "" && res.document_starred.length > 0 ? res.document_starred[0].isActive : 0,
                                            isRead: res.document_read.length > 0 ? 1 : 0
                                        };
                                        return _.omit(resToReturn, "tagDocumentWorkstream", "tagDocumentTask");
                                    })
                                    .then(res => {
                                        parallelCallback(null, res);
                                    });
                            } catch (err) {
                                parallelCallback(err);
                            }
                        }
                    },
                    (err, results) => {
                        if (err != null) {
                            cb({ status: false, error: err });
                        } else {
                            cb({ status: true, data: results });
                        }
                    }
                );
            });
    }
};

exports.post = {
    index: async (req, cb) => {

        try {
            const data = req.body;
            const projectId = data.projectId;
            const folderId = data.folderId;
            const usersId = data.usersId
            const isDuplicate = req.query.isDuplicate;

            /* Create Document */
            const documentBulkCreateResult = await createDocument({ documents: data.DocumentToSave, folderId, projectId });

            /* Document tags */
            if (typeof data.tagWorkstream !== "undefined") {
                await createDocumentTag({ documents: documentBulkCreateResult, tagWorkstream: data.tagWorkstream, projectId, });
            }

            /* Document activity logs */
            const documentActivityLogs = await createDocumentActivityLog({ documents: documentBulkCreateResult, projectId, isDuplicate, usersId });

            /* Document notification*/
            if (data.tagWorkstream) {
                await createDocumentNotification({ documents: documentBulkCreateResult, tagWorkstream: data.tagWorkstream, usersId, projectId, req });
            }

            const documentIds = documentBulkCreateResult.map((documentObj) => {
                return documentObj.id
            })
            const result = await getDocumentById({ documentIds });

            cb({ status: true, data: { result: result, activityLogs: documentActivityLogs } });

        } catch (error) {
            cb({ status: false, error: error })
        }
    },
    upload: (req, cb) => {
        let formidable = global.initRequire("formidable")
        let form = new formidable.IncomingForm();
        let filenameList = [],
            files = [],
            type = "upload";
        form.multiples = true;

        form.on("file", function (field, file) {
            files.push(
                new Promise((resolve, reject) => {
                    var date = new Date();
                    var Id = func.generatePassword(date.getTime() + file.name, "attachment");
                    var filename = Id + file.name.replace(/[^\w.]|_/g, "_");

                    filenameList.push({
                        filename: filename,
                        origin: file.name,
                        Id: Id
                    });

                    func.uploadFile(
                        {
                            file: file,
                            form: type,
                            filename: filename
                        },
                        response => {
                            if (response.Message == "Success") {
                                resolve(filenameList);
                            } else {
                                reject();
                            }
                        }
                    );
                })
            );
        });

        form.on("end", function () {
            Promise.all(files).then(e => {
                if (e.length > 0) {
                    cb({
                        status: true,
                        data: e[0]
                    });
                } else {
                    cb({
                        status: false,
                        data: []
                    });
                }
            });
        });

        // log any errors that occur
        form.on("error", function (err) { });

        // parse the incoming request containing the form data
        form.parse(req);
    },
    read: (req, cb) => {
        let data = req.body;
        DocumentRead.create({ ...data })
            .then(res => {
                cb({ status: true, data: res });
            })
            .catch(err => {
                cb({ status: false, error: err });
            });
    }
};

exports.put = {
    index: async (req, cb) => {
        let body = req.body;
        const id = req.params.id;
        const projectId = body.projectId;
        const usersId = body.usersId;
        const dataToUpdate = _.omit(body, "usersId", "oldDocument", "newDocument", "projectId", "type", "title", "actionType");

        try {
            await Document.update(dataToUpdate, { where: { id: id } });
            const documentFindResult = await getDocumentById({ documentIds: id });

            /* Document Activity logs */
            const document = [{
                id,
                title: body.title,
                actionType: body.actionType,
                oldDocument: body.oldDocument,
                newDocument: body.newDocument,
            }]

            const documentActivityLogs = await createDocumentActivityLog({ documents: document, projectId, usersId });

            cb({ status: true, data: { result: documentFindResult, activityLogs: documentActivityLogs } });


        } catch (error) {
            cb({ status: false, error: error });
        }
    },
    tag: async (req, cb) => {

        try {
            let body = req.body;
            const { projectId, usersId, oldDocument, newDocument, origin } = body;
            const queryString = req.query;

            body = _.omit(body, "projectId", "usersId", "oldDocument", "newDocument", "origin");

            // const documentWhereObj = {
            //     ...(typeof queryString.status != "undefined" && queryString.status != "" ? { status: queryString.status } : {}),
            //     ...(typeof queryString.isDeleted != "undefined" && queryString.isDeleted != "" ? { isDeleted: queryString.isDeleted } : {})
            // };

            const tagWhereObj = {
                ...(typeof queryString.tagTypeId != "undefined" && queryString.tagTypeId != "" ? { tagTypeId: queryString.tagTypeId } : {}),
                ...(typeof queryString.tagType != "undefined" && queryString.tagType != "" ? { tagType: queryString.tagType } : {})
            };

            await Tag.destroy({ where: tagWhereObj });

            /* Document tags */
            if (typeof body.tagWorkstream !== "undefined") {
                const document = [{
                    id: tagWhereObj.tagTypeId
                }]
                await createDocumentTag({ documents: document, tagWorkstream: body.tagWorkstream, projectId, });
            }

            /* Get document by id */
            const documentGetResult = await getDocumentById({ documentIds: tagWhereObj.tagTypeId });
            const documents = [
                {
                    linkType: "document",
                    linkId: tagWhereObj.tagTypeId,
                    actionType: "modified",
                    usersId: usersId,
                    title: `${origin} updated tag's`,
                    old: oldDocument,
                    new: newDocument
                }
            ]

            /* Document activity logs */
            const documentActivityLogs = await createDocumentActivityLog({ documents, projectId, usersId });

            cb({ status: true, data: { result: documentGetResult[0], activityLogs: documentActivityLogs } });

        } catch (error) {
            cb({ status: false, error: error });
        }
    },
    rename: async (req, cb) => {
        try {
            let body = req.body;
            const { usersId, oldDocument, newDocument, projectId, type } = { ...body };
            const id = req.params.id;
            body = _.omit(body, "usersId", "oldDocument", "newDocument", "projectId");

            const documentCheckDuplicateResult = Document.findAll({
                where: {
                    id: { [Op.ne]: id },
                    origin: body.origin
                },
                order: Sequelize.literal("documentNameCount DESC"),
                raw: true
            })

            if (documentCheckDuplicateResult.length > 0) {
                body.documentNameCount = res[0].documentNameCount + 1;
            } else {
                body.documentNameCount = 0;
            }

            /* Update document */
            await Document.update({ ...body }, { where: { id: id } });
            
            /* Get document by id */
            const documentGetResult = await getDocumentById({ documentIds: id });

            const documents = [{
                linkType: "document",
                linkId: id,
                actionType: "modified",
                usersId: usersId,
                title: `renamed a ${type}`,
                old: oldDocument,
                new: newDocument
            }]

            /* Document activity logs */
            const documentActivityLogs = await createDocumentActivityLog({ documents, projectId, usersId });

            cb({ status: true, data: { result: documentGetResult[0], activityLogs: documentActivityLogs } });
        } catch (error) {
            cb({ status: false, message: error });
        }
    },
    empty: (req, cb) => {
        const id = req.body.documentIds;
        const body = req.body.data;

        try {
            Document.update(body, { where: { id: id } }).then(res => {
                cb({ status: true });
            });
        } catch (err) {
            cb({ status: false, message: err });
        }
    },
    bulkUpdate: (req, cb) => {
        const body = req.body.data;
        const actionType = body.actionType;
        const usersId = body.usersId;
        const folder = body.folder;
        const projectId = body.projectId;
        const ids = req.body.documentIds;

        sequence.create().then(() => {
            try {
                Document.update(body, { where: { id: ids } }).then(res => {
                    try {
                        DocumentLink.findAll({
                            where: { documentId: ids },
                            include: [
                                {
                                    model: Document,
                                    as: "document",
                                    include: associationFindAllStack
                                }
                            ]
                        }).then(findRes => {
                            async.parallel(
                                {
                                    result: parallelCallback => {
                                        async.map(
                                            findRes,
                                            (f, mapCallback) => {
                                                const documentObj = f.document.toJSON();
                                                let returnDocumentObj = {
                                                    ...documentObj,
                                                    tagWorkstream: documentObj.tagDocumentWorkstream.map(e => {
                                                        return { value: e.tagWorkstream.id, label: e.tagWorkstream.workstream };
                                                    }),
                                                    tagTask: documentObj.tagDocumentTask.map(e => {
                                                        return { value: e.tagTask.id, label: e.tagTask.task };
                                                    }),
                                                    tagNote: documentObj.tagDocumentNotes.map(e => {
                                                        return { value: e.TagNotes.id, label: e.TagNotes.note };
                                                    }),
                                                    isRead: documentObj.document_read.length > 0 ? 1 : 0
                                                };
                                                mapCallback(null, _.omit(returnDocumentObj, "tagDocumentWorkstream", "tagDocumentTask"));
                                            },
                                            (err, mapCallbackResult) => {
                                                parallelCallback(null, { data: mapCallbackResult });
                                            }
                                        );
                                    },
                                    activityLogsDocument: parallelCallback => {
                                        async.map(
                                            findRes,
                                            (f, mapCallback) => {
                                                const documentObj = f.document.toJSON();
                                                const logData = {
                                                    linkType: "document",
                                                    linkId: documentObj.id,
                                                    projectId: projectId,
                                                    actionType: actionType,
                                                    title: actionType === "moved" ? `moved a document` : "",
                                                    new: documentObj.origin,
                                                    usersId: usersId,
                                                    old: ""
                                                };
                                                mapCallback(null, logData);
                                            },
                                            (err, mapCallbackResult) => {
                                                ActivityLogsDocument.bulkCreate(mapCallbackResult).then(c => {
                                                    ActivityLogsDocument.findAll({
                                                        where: { id: ids },
                                                        include: [
                                                            {
                                                                model: Users,
                                                                as: "user"
                                                            }
                                                        ]
                                                    }).then(findRes => {
                                                        parallelCallback(null, findRes);
                                                    });
                                                });
                                            }
                                        );
                                    }
                                },
                                (err, { result, activityLogsDocument }) => {
                                    if (err) {
                                        cb({ status: false, error: err });
                                    } else {
                                        cb({ status: true, data: { result: result.data, activityLogs: activityLogsDocument } });
                                    }
                                }
                            );
                        });
                    } catch (err) {
                        parallelCallback(err);
                    }
                });
            } catch (err) {
                cb({ status: false, error: err });
            }
        });
    }
};

exports.delete = {
    index: (req, cb) => {
        const id = req.params.id;
        try {
            Document.update({ isDeleted: 1 }, { where: { id: id } }).then(res => {
                cb({ status: true, data: res });
            });
        } catch (err) {
            cb({ status: false, error: err });
        }
    },
    read: (req, cb) => {
        const queryString = req.query;
        const whereObj = {
            ...(queryString.usersId ? { usersId: queryString.usersId } : {}),
            ...(queryString.documentId ? { documentId: queryString.documentId } : {})
        };

        DocumentRead.destroy({ where: { ...whereObj } }).then(() => {
            cb({ status: true });
        });
    }
};
