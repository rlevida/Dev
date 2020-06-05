const { find, omit, toNumber, ceil } = require("lodash");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const models = require("../../modelORM");
const moment = require("moment");
const { Document, DocumentLink, DocumentRead, Tag, Users, ActivityLogsDocument, Conversation } = models;

const createDocument = require("./utils/createDocument");
const createDocumentTag = require("./utils/createDocumentTag");
const createDocumentActivityLog = require("./utils/createDocumentActivityLog");
const createDocumentNotification = require("./utils/createDocumentNotification");
const getDocumentById = require("./utils/getDocumentById");
const getDocumentWorkstream = require("./utils/getDocumentWorkstream");

const { documentIncludes } = require("../includes/document");

exports.get = {
    index: async (req, cb) => {
        try {
            const queryString = req.query;
            const limit = 10;
            let associationStack = documentIncludes();
            const options = {
                ...(typeof queryString.page != "undefined" && queryString.page != "undefined" && queryString.page != "" ? { offset: limit * parseInt(queryString.page) - limit, limit } : {}),
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
                find(associationStack, { as: "document_read" }).where = {
                    usersId: queryString.userId,
                    isDeleted: 0
                };
            }

            if (typeof queryString.starredUser !== "undefined" && queryString.starredUser !== "") {
                find(associationStack, { as: "document_starred" }).where = {
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
                find(associationStack, { as: "tagDocumentWorkstream" }).where = {
                    linkId: queryString.workstream,
                    linkType: "workstream",
                    tagType: "document"
                };
                find(associationStack, { as: "tagDocumentWorkstream" }).required = true;
            } else {
                find(associationStack, { as: "tagDocumentWorkstream" }).required = false;
            }

            /* Filter request */
            if (typeof queryString.task !== "undefined" && queryString.task !== "") {
                find(associationStack, { as: "tagDocumentTask" }).where = {
                    linkId: queryString.task,
                    linkType: "task",
                    tagType: "document"
                };
                find(associationStack, { as: "tagDocumentTask" }).required = true;
            } else {
                find(associationStack, { as: "tagDocumentTask" }).required = false;
            }

            /* Filter request */
            if (typeof queryString.uploadedBy !== "undefined" && queryString.uploadedBy !== "") {
                find(associationStack, { as: "user" }).where = {
                    [Op.or]: [{ firstName: { [Op.like]: `%${queryString.uploadedBy}%` } }, { lastName: { [Op.like]: `%${queryString.uploadedBy}%` } }]
                };
                find(associationStack, { as: "user" }).required = true;
            } else {
                delete find(associationStack, { as: "user" }).required;
                delete find(associationStack, { as: "user" }).where;
            }

            if (typeof queryString.comment != 'undefined' && queryString.comment !== '' && queryString.activeTab !== 'library') {
                const searchComment = {
                    model: Conversation,
                    as: 'document_conversation',
                    where: {
                        linkType: 'document',
                        isDeleted: 0,
                        [Op.or]: [
                            Sequelize.where(Sequelize.fn("lower", Sequelize.col("comment")), {
                                [Op.like]: Sequelize.fn("lower", `%${queryString.comment}%`)
                            })
                        ]
                    },
                    attributes: [],
                    required: true
                }
                associationStack.push(searchComment)
            } else {
                delete find(associationStack, { as: "document_conversation" });
            }

            if (typeof queryString.comment !== 'undefined' && queryString.comment !== '' && queryString.activeTab === 'library') {
                find(associationStack, { as: "folder_document" })['include'] = [{
                    model: Conversation,
                    as: 'document_conversation',
                    where: {
                        linkType: 'document',
                        isDeleted: 0,
                        [Op.or]: [
                            Sequelize.where(Sequelize.fn("lower", Sequelize.col("comment")), {
                                [Op.like]: Sequelize.fn("lower", `%${queryString.comment}%`)
                            })
                        ]
                    },
                    required: true
                }]
                find(associationStack, { as: "folder_document" }).required = true
            } else {
                documentWhereObj = {
                    ...documentWhereObj,
                    ...(typeof queryString.folderId != "undefined" && queryString.folderId != "undefined" && queryString.folderId != "" ? { folderId: queryString.folderId == "null" ? null : queryString.folderId } : {}),
                }
            }

            const findDocument = await Document.findAndCountAll({
                ...options,
                where: documentWhereObj,
                include: [
                    ...associationStack,
                    {
                        model: DocumentLink,
                        as: 'document_link',
                        where: documentLinkWhereObj,
                        required: true
                    }],
                order: [typeof queryString.sortBy !== 'undefined'
                    ? [Sequelize.fn("lower", Sequelize.col(`document.${queryString.sortBy.split("-")[0]}`)), queryString.sortBy.split("-")[1]]
                    : ["dateAdded", "desc"]],
            })

            /* Get all documents that are link to the project */
            // const findDocumentLinkResult = await DocumentLink.findAndCountAll({
            //     ...options,
            //     where: documentLinkWhereObj,
            //     include: [
            //         {
            //             model: Document,
            //             as: "document",
            //             where: documentWhereObj,
            //             required: true,
            //             include: associationStack,
            //             // order: [typeof queryString.sortBy !== 'undefined' ? queryString.sortBy.split("-") : ["dateAdded", "desc"]],
            //         }
            //     ],
            //     order: [[Document, 'id', 'desc']]
            // })

            // console.log(findDocumentLinkResult)

            const { rows, count } = { ...findDocument };

            const documentResult = rows.map((documentObj) => {
                const tagDocumentObj = documentObj.toJSON();
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
                return omit(resToReturn, "tagDocumentWorkstream", "tagDocumentTask", "tagDocumentNotes");
            });



            const documentPaginationCount = {
                total_count: count,
                ...(typeof queryString.page != "undefined" && queryString.page != "" ? { current_page: count > 0 ? toNumber(queryString.page) : 0, last_page: ceil(count / limit) } : {})
            }

            const results = { count: documentPaginationCount, result: documentResult };

            cb({ status: true, data: results });
        } catch (error) {
            console.error(error)
            cb({ status: false, error: error });
        }

    },
    getById: async (req, cb) => {
        try {
            const id = req.params.id;
            const result = await getDocumentById({ documentIds: id });
            cb({ status: true, data: result[0] });
        } catch (error) {
            cb({ status: true, message: error })
        }
    },
    getWorkstreamDocument: async (req, cb) => {
        try {
            const queryString = req.query;
            const limit = 10;

            const options = {
                ...(typeof queryString.page != "undefined" && queryString.page != "" ? { offset: limit * toNumber(queryString.page) - limit, limit } : {}),
                order: [["dateAdded", "DESC"]]
            };

            let documentWhereObj = {
                ...(typeof queryString.status != "undefined" && queryString.status != "" ? { status: queryString.status } : {}),
                ...(typeof queryString.isDeleted != "undefined" && queryString.isDeleted != "" ? { isDeleted: parseInt(queryString.isDeleted) } : {}),
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
                find(documentIncludes(), { as: "document_starred" }).where = {
                    linkType: "document",
                    isActive: 1,
                    isDeleted: 0,
                    usersId: queryString.starredUser
                };
            }

            const results = await getDocumentWorkstream({ tagWhereObj, documentWhereObj, options, starredUser: queryString.stqueryString, page: queryString.page });
            cb({ status: true, data: results });

        } catch (error) {
            cb({ status: false, error: error });
        }
    },
    getTaskDocument: async (req, cb) => {
        try {
            const queryString = req.query;
            const limit = 10;

            const options = {
                ...(typeof queryString.page != "undefined" && queryString.page != "" ? { offset: limit * toNumber(queryString.page) - limit, limit } : {}),
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

            const results = await getDocumentWorkstream({ tagWhereObj, documentWhereObj, options, starredUser: queryString.stqueryString, page: queryString.page });
            cb({ status: true, data: results });
        } catch (error) {
            cb({ status: false, error: error });
        }
    },
    getDocumentActivityLog: async (req, cb) => {
        const limit = 10;
        const queryString = req.query;

        const documentActivityLogIncludes = [
            {
                model: Users,
                as: "user"
            },
            {
                model: Document,
                as: "document",
                attributes: ["id", "origin", "documentNameCount"]
            }
        ];

        let whereObj = {
            ...(typeof queryString.projectId !== "undefined" && queryString.projectId !== "" ? { projectId: queryString.projectId } : {}),
            ...(typeof queryString.userType != "undefined" && queryString.userType == "External" && typeof queryString.userId != "undefined" && queryString.userId != ""
                ? {
                    [Op.or]: [
                        {
                            linkId: {
                                [Op.in]: Sequelize.literal(`(SELECT DISTINCT shareId FROM share where userTypeLinkId = ${queryString.userId})`)
                            }
                        },
                        {
                            linkId: {
                                [Op.in]: Sequelize.literal(`(SELECT DISTINCT document.id FROM document LEFT JOIN share ON document.folderId = share.shareId where share.shareType = 'folder' AND share.userTypeLinkId = ${queryString.userId} )`)
                            }
                        },
                        {
                            linkId: {
                                [Op.in]: Sequelize.literal(`(SELECT DISTINCT document.id FROM document WHERE uploadedBy = ${queryString.userId})`)
                            }
                        }
                    ]
                }
                : {}),
            ...(typeof queryString.search !== "undefined" && queryString.search !== ""
                ? {
                    [Op.or]: [{ new: { [Op.like]: `%${queryString.search}%` } }, { old: { [Op.like]: `%${queryString.search}%` } }]
                }
                : {})
        };

        if (typeof queryString.uploadedBy !== "undefined" && queryString.uploadedBy !== "") {
            _.find(documentActivityLogIncludes, { as: "user" }).where = {
                [Op.or]: [{ emailAddress: { [Op.like]: `%${queryString.uploadedBy}%` } }]
            };
            _.find(documentActivityLogIncludes, { as: "user" }).required = true;
        } else {
            delete _.find(documentActivityLogIncludes, { as: "user" }).required;
            delete _.find(documentActivityLogIncludes, { as: "user" }).where;
        }

        const options = {
            ...(typeof queryString !== "undefined" && queryString.page != "" ? { offset: limit * _.toNumber(queryString.page) - limit, limit } : {}),
            order: [["dateAdded", "DESC"]]
        };

        async.parallel(
            {
                result: parallelCallback => {
                    try {
                        ActivityLogsDocument.findAll({
                            ...options,
                            where: whereObj,
                            include: documentActivityLogIncludes
                        }).then(res => {
                            parallelCallback(null, res);
                        });
                    } catch (err) {
                        cb({ status: false, error: err });
                    }
                },
                count: parallelCallback => {
                    ActivityLogsDocument.findAndCountAll({
                        ...options,
                        where: whereObj,
                        include: [
                            {
                                model: Users,
                                as: "user"
                            }
                        ]
                    }).then(res => {
                        const pageData = {
                            total_count: res.count,
                            ...(typeof queryString.page !== "undefined" && queryString.page !== "" ? { current_page: res.count > 0 ? _.toNumber(queryString.page) : 0, last_page: _.ceil(res.count / limit) } : {})
                        };
                        parallelCallback(null, pageData);
                    });
                }
            },
            (err, results) => {
                if (err) {
                    cb({ status: false, error: err });
                } else {
                    cb({ status: true, data: results });
                }
            }
        );
    }
};

exports.post = {
    index: async (req, cb) => {

        try {
            const data = req.body;
            const projectId = data.projectId;
            const usersId = req.user.id
            const isDuplicate = req.query.isDuplicate;
            const documents = data.DocumentToSave.filter((documentObj) => {
                return documentObj.name && documentObj.origin && documentObj.project && documentObj.status && documentObj.type
            })

            /* Create Document */
            const documentBulkCreateResult = await createDocument({ documents, projectId });

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
        const func = global.initFunc();
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
    read: async (req, cb) => {
        try {
            let data = req.body;
            const documentCreateResult = DocumentRead.create({ ...data })

            cb({ status: true, data: documentCreateResult });
        } catch (error) {
            cb({ status: false, error: error });
        }
    }
};

exports.put = {
    index: async (req, cb) => {
        let body = req.body;
        const id = req.params.id;
        const projectId = body.projectId;
        const usersId = body.usersId;
        const dataToUpdate = omit(body, "usersId", "oldDocument", "newDocument", "projectId", "type", "title", "actionType");

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

            body = omit(body, "projectId", "usersId", "oldDocument", "newDocument", "origin");

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
            body = omit(body, "usersId", "oldDocument", "newDocument", "projectId");

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
    empty: async (req, cb) => {
        try {
            const id = req.body.documentIds;
            const body = req.body.data;

            await Document.update(body, { where: { id: id } });
            cb({ status: true });

        } catch (err) {
            cb({ status: false, message: err });
        }
    },
    bulkUpdate: async (req, cb) => {
        try {
            const body = req.body.data;
            const { actionType, projectId, usersId } = { ...body };
            const documentIds = req.body.documentIds;

            await Document.update(body, { where: { id: documentIds } });

            const result = await getDocumentById({ documentIds });

            const activityLogsData = result.map((documentObj) => {
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
                return logData;
            })

            const documentActivityLogs = await createDocumentActivityLog({ documents: activityLogsData, projectId, usersId });

            cb({ status: true, data: { result: result, activityLogs: documentActivityLogs } });
        } catch (error) {
            cb({ status: false, error: error });
        }
    }
};

exports.delete = {
    index: async (req, cb) => {
        try {
            const id = req.params.id;
            const documentUpdateResult = await Document.update({ isDeleted: 1 }, { where: { id: id } })
            cb({ status: true, data: documentUpdateResult });
        } catch (error) {
            cb({ status: false, error: error });
        }
    },
    read: async (req, cb) => {
        try {
            const queryString = req.query;
            const whereObj = {
                ...(queryString.usersId ? { usersId: queryString.usersId } : {}),
                ...(queryString.documentId ? { documentId: queryString.documentId } : {})
            };
            await DocumentRead.destroy({ where: { ...whereObj } });
            cb({ status: true });
        } catch (error) {
            cb({ status: false, error: error });
        }
    }
};
