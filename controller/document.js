const sequence = require("sequence").Sequence,
    toPdf = require("office-to-pdf"),
    mime = require('mime-types'),
    path = require('path');
const _ = require("lodash");
const dbName = "document";
const Sequelize = require("sequelize")
const Op = Sequelize.Op;
const models = require('../modelORM');
const moment = require('moment');
const {
    ActivityLogsDocument,
    Document,
    DocumentLink,
    Members,
    Share,
    Starred,
    Tasks,
    Tag,
    Users,
    UsersRole,
    Workstream
} = models;

var {
    defaultDelete
} = require("./")

const associationFindAllStack = [
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
        required: false,
        as: 'tagDocumentTask',
        include: [{
            model: Tasks,
            as: 'tagTask',
        }],
    },
    {
        model: Tag,
        where: {
            linkType: 'notes', tagType: 'document'
        },
        required: false,
        as: 'tagDocumentNotes',
    },
    {
        model: Users,
        as: 'user',
    },
    {
        model: Share,
        as: 'share',
        include: [{
            model: Users,
            as: 'user',
            include: [{
                model: UsersRole,
                as: 'user_role',
            }]
        }],
    },
    {
        model: Starred,
        as: 'document_starred',
        where: { linkType: 'document', isActive: 1 },
        required: false,
        include: [
            {
                model: Users,
                as: 'user',
                attributes: ['id', 'firstName', 'lastName', 'emailAddress']
            }
        ]
    }, {
        model: Document,
        as: 'document_folder',
        where: { type: 'folder'},
        required: false
    }
]


exports.get = {
    index: (req, cb) => {

        const queryString = req.query;
        const limit = 10;

        const options = {
            ...(typeof queryString.page != "undefined" && queryString.page != "") ? { offset: (limit * _.toNumber(queryString.page)) - limit, limit } : {},
            order: [['dateAdded', 'DESC']]
        };
        const documentLinkWhereObj = {
            ...(typeof queryString.linkId != "undefined" && queryString.linkId != "") ? { linkId: queryString.linkId } : {},
            ...(typeof queryString.linkType != "undefined" && queryString.linkType != "") ? { linkType: queryString.linkType } : {}
        };
        let documentWhereObj = {
            ...(typeof queryString.status != "undefined" && queryString.status != "") ? { status: queryString.status } : {},
            ...(typeof queryString.isDeleted != "undefined" && queryString.isDeleted != "") ? { isDeleted: queryString.isDeleted } : {},
            ...(typeof queryString.folderId != "undefined" && queryString.folderId != "undefined" && queryString.folderId != "") ? { folderId: queryString.folderId } : { folderId: null },
            ...(typeof queryString.isCompleted != "undefined" && queryString.isCompleted != "") ? { isCompleted: queryString.isCompleted } : {},
            ...(typeof queryString.uploadFrom != "undefined" && typeof queryString.uploadTo != "undefined" && queryString.uploadFrom != "" && queryString.uploadTo != "" && queryString.uploadFrom != "undefined" && queryString.uploadTo != "undefined")
                ? { dateAdded: { [Op.between]: [moment(queryString.uploadFrom).add(8, 'hours').toDate(), moment(queryString.uploadTo).add(8, 'hours').toDate()] } } : {},
            ...(typeof queryString.userType != "undefined" && queryString.userType == "External") ? {
                [Op.or]: {
                    ...(typeof queryString.userType != "undefined" && queryString.userType == "External" && typeof queryString.userId != "undefined" && queryString.userId != "") ? {
                        [Op.or]: [
                            { id: { [Op.in]: Sequelize.literal(`(SELECT DISTINCT shareId FROM share where userTypeLinkId = ${queryString.userId})`) } },
                            { id: { [Op.in]: Sequelize.literal(`(SELECT DISTINCT document.id FROM document LEFT JOIN share ON document.folderId = share.shareId where share.shareType = 'folder' AND share.userTypeLinkId = ${queryString.userId} )`) } }
                        ]
                    } : {},
                    uploadedBy: queryString.userId
                }
            } : {}
        }

        if (typeof queryString.search !== 'undefined' && queryString.search !== '') {
            documentWhereObj = {
                ...documentWhereObj,
                [Op.or]: [
                    { origin: { [Op.like]: `%${queryString.search}%` } },
                ]
            }
        }

        if (typeof queryString.workstream !== 'undefined' && queryString.workstream !== '') {
            _.find(associationFindAllStack, { as: 'tagDocumentWorkstream' }).where = {
                linkId: queryString.workstream,
                linkType: 'workstream',
                tagType: 'document'
            };
            _.find(associationFindAllStack, { as: 'tagDocumentWorkstream' }).required = true;
        } else {
            _.find(associationFindAllStack, { as: 'tagDocumentWorkstream' }).required = false;
        }
        if (typeof queryString.task !== 'undefined' && queryString.task !== '') {
            _.find(associationFindAllStack, { as: 'tagDocumentTask' }).where = {
                linkId: queryString.task,
                linkType: 'task',
                tagType: 'document'
            };
            _.find(associationFindAllStack, { as: 'tagDocumentTask' }).required = true;
        } else {
            _.find(associationFindAllStack, { as: 'tagDocumentTask' }).required = false;
        }

        if (typeof queryString.uploadedBy !== 'undefined' && queryString.uploadedBy !== '') {
            _.find(associationFindAllStack, { as: 'user' }).where = {
                [Op.or]: [
                    { emailAddress: { [Op.like]: `%${queryString.uploadedBy}%` } },
                ]
            };
            _.find(associationFindAllStack, { as: 'user' }).required = true;
        } else {
            _.find(associationFindAllStack, { as: 'user' }).required = false;
        }

        if (typeof queryString.members !== 'undefined' && queryString.members !== '') {
            _.find(associationFindAllStack, { as: 'share' }).where = {
                linkType: 'project',
                usersType: 'users',
                userTypeLinkId: queryString.members
            }
            _.find(associationFindAllStack, { as: 'share' }).required = true;
        } else {
            _.find(associationFindAllStack, { as: 'share' }).required = false;
        }

        if (typeof queryString.starredUser !== 'undefined' && queryString.starredUser !== '') {
            _.find(associationFindAllStack, { as: 'document_starred' }).where = {
                linkType: 'document',
                isActive: 1,
                usersId: queryString.starredUser
            };
        }

        async.parallel({
            count: function (parallelCallback) {
                DocumentLink
                    .findAndCountAll({
                        ...options,
                        where: documentLinkWhereObj,
                        include: [
                            {
                                model: Document,
                                as: 'document',
                                where: documentWhereObj,
                                include: associationFindAllStack,
                                required: true
                            },
                        ],
                    })
                    .then((res) => {
                        const pageData = {
                            total_count: res.count,
                            ...(typeof queryString.page != "undefined" && queryString.page != "") ? { current_page: (res.count > 0) ? _.toNumber(queryString.page) : 0, last_page: _.ceil(res.count / limit) } : {}
                        }
                        parallelCallback(null, pageData)
                    })
            },
            result: function (parallelCallback) {
                try {
                    DocumentLink
                        .findAll({
                            ...options,
                            where: documentLinkWhereObj,
                            include: [
                                {
                                    model: Document,
                                    as: 'document',
                                    where: documentWhereObj,
                                    include: associationFindAllStack,
                                    required: true
                                }
                            ],
                        })
                        .map((res) => {
                            let resToReturn = {
                                ...res.document.toJSON(),
                                tags: res.document.tagDocumentWorkstream.map((e) => { return { value: `workstream-${e.tagWorkstream.id}`, label: e.tagWorkstream.workstream } })
                                    .concat(res.document.tagDocumentTask.map((e) => { return { value: `task-${e.tagTask.id}`, label: e.tagTask.task } })),
                                members: res.document.share.map((e) => { return e.user }),
                                share: JSON.stringify(res.document.share.map((e) => { return { value: e.user.id, label: e.user.firstName } })),
                                isStarred: (typeof queryString.starredUser !== 'undefined' && queryString.starredUser !== '' && (res.document.document_starred).length > 0) ? res.document.document_starred[0].isActive : 0
                            }
                            return _.omit(resToReturn, 'tagDocumentWorkstream', 'tagDocumentTask')
                        })
                        .then((res) => {
                            parallelCallback(null, res)
                        })
                } catch (err) {
                    parallelCallback(err)
                }
            }
        }, (err, results) => {
            if (err != null) {
                cb({ status: false, error: err });
            } else {
                cb({ status: true, data: results })
            }
        })
    },
    getDocumentCount: (req, cb) => {
        const queryString = req.query
        const documentLinkWhereObj = {
            ...(typeof queryString.linkId != "undefined" && queryString.linkId != "") ? { linkId: queryString.linkId } : {},
            ...(typeof queryString.linkType != "undefined" && queryString.linkType != "") ? { linkType: queryString.linkType } : {}
        };
        let documentWhereObj = {
            ...(typeof queryString.status != "undefined" && queryString.status != "") ? { status: queryString.status } : {},
            ...(typeof queryString.isDeleted != "undefined" && queryString.isDeleted != "") ? { isDeleted: queryString.isDeleted } : {},
            ...(typeof queryString.isCompleted != "undefined" && queryString.isCompleted != "") ? { isCompleted: queryString.isCompleted } : {},
            ...(typeof queryString.type != "undefined" && queryString.type != "") ? { type: queryString.type } : {}
        }
        if (typeof queryString.userType != "undefined" && queryString.userType == "External" && typeof queryString.userId != "undefined" && queryString.userId != "") {
            documentWhereObj = {
                ...documentWhereObj,
                [Op.or]: {
                    ...(typeof queryString.userType != "undefined" && queryString.userType == "External" && typeof queryString.userId != "undefined" && queryString.userId != "") ? {
                        [Op.or]: [
                            {
                                id: {
                                    [Op.in]: Sequelize.literal(`(SELECT DISTINCT shareId FROM share where userTypeLinkId = ${queryString.userId})`)
                                },
                            },
                        ]
                    } : {},
                    uploadedBy: queryString.userId
                },
            }
        }


        try {
            DocumentLink
                .findAndCountAll({
                    where: documentLinkWhereObj,
                    include: [{
                        model: Document,
                        as: 'document',
                        where: documentWhereObj,
                        include: associationFindAllStack
                    }],
                })
                .then((res) => {
                    cb({ status: true, data: { newUploadCount: res.count } })
                })
        } catch (err) {
            cb({ status: false, error: err })
        }
    },
    getTaggedDocument: (req, cb) => {
        const queryString = req.query;
        const limit = 10;

        const options = {
            ...(typeof queryString.page != "undefined" && queryString.page != "") ? { offset: (limit * _.toNumber(queryString.page)) - limit, limit } : {},
            order: [['dateAdded', 'DESC']]
        };

        let documentWhereObj = {
            ...(typeof queryString.status != "undefined" && queryString.status != "") ? { status: queryString.status } : {},
            ...(typeof queryString.isDeleted != "undefined" && queryString.isDeleted != "") ? { isDeleted: queryString.isDeleted } : {},
            ...(typeof queryString.folderId != "undefined" && queryString.folderId != "undefined" && queryString.folderId != "") ? { folderId: queryString.folderId } : {},
            ...(typeof queryString.isCompleted != "undefined" && queryString.isCompleted != "") ? { isCompleted: queryString.isCompleted } : {},
        }

        const tagWhereObj = {
            ...(typeof queryString.tagType != "undefined" && queryString.tagType != "") ? { tagType: queryString.tagType } : {},
            ...(typeof queryString.workstreamId != "undefined" && queryString.workstreamId != "") ? {
                [Op.or]: [
                    {
                        linkId: {
                            [Op.in]: Sequelize.literal(`(SELECT id FROM task where workstreamId = ${queryString.workstreamId} AND id = ${typeof queryString.taskId != "undefined" ? queryString.taskId : !null} )`)
                        },
                        linkType: 'task'
                    },
                    {
                        linkId: queryString.workstreamId,
                        linkType: 'workstream'
                    }
                ]
            } : {},
        }

        sequence.create().then((nextThen) => {
            Tag
                .findAll({
                    where: tagWhereObj
                })
                .map((res) => { return res.tagTypeId })
                .then((res) => {
                    nextThen(res)
                })
        }).then((nextThen, result) => {
            async.parallel({
                count: (parallelCallback) => {
                    try {
                        Document
                            .findAndCountAll({
                                where: { ...documentWhereObj, id: result },
                                include: associationFindAllStack,
                                ...options
                            })
                            .then((res) => {
                                const pageData = {
                                    total_count: res.count,
                                    ...(typeof queryString.page != "undefined" && queryString.page != "") ? { current_page: (res.count > 0) ? _.toNumber(queryString.page) : 0, last_page: _.ceil(res.count / limit) } : {}
                                }
                                parallelCallback(null, pageData)
                            })
                    } catch (err) {
                        parallelCallback(err)
                    }
                },
                result: (parallelCallback) => {
                    try {
                        Document
                            .findAll({
                                where: { ...documentWhereObj, id: result },
                                include: associationFindAllStack,
                                ...options
                            })
                            .map((res) => {
                                let resToReturn = {
                                    ...res.toJSON(),
                                    tags: res.tagDocumentWorkstream.map((e) => { return { value: `workstream-${e.tagWorkstream.id}`, label: e.tagWorkstream.workstream } })
                                        .concat(res.tagDocumentTask.map((e) => { return { value: `task-${e.tagTask.id}`, label: e.tagTask.task } })),
                                    members: res.share.map((e) => { return e.user }),
                                    share: JSON.stringify(res.share.map((e) => { return { value: e.user.id, label: e.user.firstName } })),
                                    isStarred: (typeof queryString.starredUser !== 'undefined' && queryString.starredUser !== '' && (res.document_starred).length > 0) ? res.document_starred[0].isActive : 0
                                }
                                return _.omit(resToReturn, "tagDocumentWorkstream", "tagDocumentTask")
                            })
                            .then((res) => {
                                parallelCallback(null, res)
                            })
                    } catch (err) {
                        parallelCallback(err)
                    }
                }
            }, (err, results) => {
                if (err != null) {
                    cb({ status: false, error: err });
                } else {
                    cb({ status: true, data: results })
                }
            })
        })
    }
}

exports.post = {
    index: (req, cb) => {
        const data = req.body;
        const projectId = req.body[0].project;
        const isDuplicate = req.query.isDuplicate;

        sequence.create().then((nextThen) => {
            async.map(data, (e, mapCallback) => {
                let whereObj = {
                    ...(typeof e.origin != "undefined" && e.origin != "") ? { origin: e.origin } : {},
                    ...(typeof e.folderId != "undefined" && e.folderId != "") ? { folderId: e.folderId } : { folderId: null },
                    ...(typeof e.status != "undefined" && e.status != "") ? { status: e.status } : {},
                    ...(typeof e.type != "undefined" && e.type != "") ? { type: e.type } : {}
                }
                try {
                    Document
                        .findAll({
                            where: whereObj,
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
                            activityLogsDocument: (parallelCallback) => {
                                try {
                                    const logData = {
                                        projectId: projectId,
                                        linkType: `document`,
                                        linkId: res.id,
                                        actionType: (typeof isDuplicate !== 'undefined' && isDuplicate) ? 'duplicated' : 'created',
                                        old: '',
                                        new: res.origin,
                                        title: (typeof isDuplicate !== 'undefined' && isDuplicate) ? (e.type === 'document') ? "Document duplicated" : "Folder duplicated"
                                            : (e.type === 'document') ? 'Document uploaded' : "Folder created",
                                        usersId: e.uploadedBy
                                    }

                                    ActivityLogsDocument
                                        .create(logData)
                                        .then((c) => {
                                            ActivityLogsDocument
                                                .findOne({
                                                    where: { id: c.id },
                                                    include: [{
                                                        model: Users,
                                                        as: 'user'
                                                    }]
                                                })
                                                .then((findRes) => {
                                                    parallelCallback(null, findRes)
                                                })
                                        })
                                } catch (err) {
                                    console.log(err)
                                    parallelCallback(err)
                                }
                            }
                        }, (err, { documentLink, activityLogsDocument }) => {
                            if (err != null) {
                                mapCallback(err)
                            } else {
                                mapCallback(null, { documentIds: documentLink.documentId, activityLogs: activityLogsDocument })
                            }
                        })
                    })
            }, (err, mapCallbackResult) => {
                nextThen(mapCallbackResult.map((e) => { return e.documentIds }), mapCallbackResult.map((e) => { return e.activityLogs }))
            })
        }).then((nextThen, result, activityLogs) => {
            try {
                DocumentLink
                    .findAll({
                        where: { documentId: result },
                        include: [{
                            model: Document,
                            as: 'document',
                            include: associationFindAllStack
                        }],
                    })
                    .map((res) => {
                        let resToReturn = {
                            ...res.document.toJSON(),
                            tags: res.document.tagDocumentWorkstream.map((e) => { return { value: `workstream-${e.tagWorkstream.id}`, label: e.tagWorkstream.workstream } })
                                .concat(res.document.tagDocumentTask.map((e) => { return { value: `task-${e.tagTask.id}`, label: e.tagTask.task } })),
                            members: res.document.share.map((e) => { return e.user }),
                            share: JSON.stringify(res.document.share.map((e) => { return { value: e.user.id, label: e.user.firstName } }))
                        }
                        return _.omit(resToReturn, "tagDocumentWorkstream", "tagDocumentTask")
                    })
                    .then((res) => {
                        cb({ status: true, data: { result: res, activityLogs: activityLogs } })
                    })

            } catch (err) {
                cb({ status: false, error: err })
            }
        })
    },
    upload: (req, cb) => {
        let formidable = global.initRequire("formidable"),
            func = global.initFunc();

        let form = new formidable.IncomingForm();
        let filenameList = [],
            files = [],
            type = "upload";
        form.multiples = true;

        files.push(new Promise((resolve, reject) => {
            form.on('file', function (field, file) {
                var date = new Date();
                var Id = func.generatePassword(date.getTime() + file.name, "attachment");
                var filename = file.name + "_" + Id + "." + func.getFilePathExtension(file.name);

                filenameList.push({
                    filename: filename,
                    origin: file.name,
                    Id: Id
                });

                func.uploadFile({
                    file: file,
                    form: type,
                    filename: filename
                }, response => {
                    if (response.Message == 'Success') {
                        resolve(filenameList)
                    } else {
                        reject()
                    }
                });
            });
        }))

        Promise.all(files).then(e => {
            if (e.length > 0) {
                cb({
                    status: true,
                    data: e[0]
                })
            } else {
                cb({
                    status: false,
                    data: []
                })
            }
        })
        // log any errors that occur
        form.on('error', function (err) {
            console.log('An error has occured: \n' + err);
        });
        // once all the files have been uploaded, send a response to the client
        // form.on('end', function () {
        //     cb({
        //         status: true,
        //         data: filenameList
        //     })
        // });
        // once all the files have been uploaded, send a response to the client
        // form.on('end', function () {
        //     cb({ status: true, data: filenameList })
        // });
        // parse the incoming request containing the form data
        form.parse(req);
    },
    printDocument: (req, cb) => {
        let fileName = req.body.fileName
        let originName = req.body.fileOrigin
        let printerName = req.body.printer
        let fs = global.initRequire('fs'),
            AWS = global.initAWS();
        let fileStream = fs.createWriteStream(`${__dirname} /../ public / temp / ${originName}`);
        let s3 = new AWS.S3();

        let promise = new Promise(function (resolve, reject) {
            s3.getObject({
                Bucket: global.AWSBucket,
                Key: global.environment + "/upload/" + fileName,
            }, (err, data) => {
                if (err) {
                    console.log("Error in Uploading to AWS. [" + err + "]");
                } else {
                    fileStream.write(data.Body)
                    resolve(originName)
                    fileStream.end()

                }
            });
        })

        promise.then((data) => {
            if (mime.contentType(path.extname(`${data}`)) == "application/pdf") {
                cb({
                    status: true,
                    data: `${data}`
                })
            } else {
                var wordBuffer = fs.readFileSync(`${__dirname} /../ public / temp / ${data}`)
                toPdf(wordBuffer).then(
                    (pdfBuffer) => {
                        let pdfdata = new Promise(function (resolve, reject) {
                            let convertedData = fs.writeFileSync(`${__dirname} /../ public / temp / ${data}.pdf`, pdfBuffer)
                            resolve(convertedData)
                        })

                        pdfdata.then((newpdf) => {
                            fs.unlink(`${__dirname} /../ public / temp / ${data}`, (t) => { });
                            cb({
                                status: true,
                                data: `${data}.pdf`
                            })
                        })

                    }, (err) => {
                        console.log(err)
                    }
                )
            }
        })
    },
    removeTempFile: (req, cb) => {
        let fs = global.initRequire('fs')
        fs.unlink(`${__dirname} /../ public / temp / ${req.body.data}`, (t) => { });
    }
}

exports.put = {
    index: (req, cb) => {
        let body = req.body;
        const { usersId, oldDocument, newDocument, projectId, actionType, title } = body;
        const id = req.params.id;
        body = _.omit(body, 'usersId', 'oldDocument', 'newDocument', 'projectId', 'type', 'title', 'actionType');

        try {
            Document
                .update(body, { where: { id: id } })
                .then((res) => {
                    async.parallel({
                        result: (parallelCallback) => {
                            try {
                                DocumentLink
                                    .findOne({
                                        where: { documentId: id },
                                        include: [{
                                            model: Document,
                                            as: 'document',
                                            include: associationFindAllStack
                                        }]
                                    })
                                    .then((findRes) => {
                                        let resToReturn = {
                                            ...findRes.document.toJSON(),
                                            tags: findRes.document.tagDocumentWorkstream.map((e) => { return { value: `workstream-${e.tagWorkstream.id}`, label: e.tagWorkstream.workstream } })
                                                .concat(findRes.document.tagDocumentTask.map((e) => { return { value: `task-${e.tagTask.id}`, label: e.tagTask.task } })),
                                            members: findRes.document.share.map((e) => { return e.user }),
                                            share: JSON.stringify(findRes.document.share.map((e) => { return { value: e.user.id, label: e.user.firstName } }))
                                        }
                                        parallelCallback(null, { data: _.omit(resToReturn, "tagDocumentWorkstream", "tagDocumentTask") })
                                    })
                            } catch (err) {
                                parallelCallback(err)
                            }
                        },
                        activityLogsDocument: (parallelCallback) => {
                            try {
                                const logData = {
                                    projectId: projectId,
                                    linkType: 'document',
                                    linkId: id,
                                    actionType: actionType,
                                    usersId: usersId,
                                    title: title,
                                    old: oldDocument,
                                    new: newDocument
                                }
                                ActivityLogsDocument
                                    .create(logData)
                                    .then((c) => {
                                        ActivityLogsDocument
                                            .findOne({
                                                where: { id: c.id },
                                                include: [{
                                                    model: Users,
                                                    as: 'user'
                                                }]
                                            })
                                            .then((findRes) => {
                                                parallelCallback(null, [findRes])
                                            })
                                    })
                            } catch (err) {
                                parallelCallback(err)
                            }
                        }
                    }, (err, results) => {
                        if (err) {
                            cb({ status: false, error: err })
                        } else {
                            cb({ status: true, data: { result: results.result.data, activityLogs: results.activityLogsDocument } })
                        }
                    })
                })
        } catch (err) {
            cb({ status: false, error: err })
        }
    },
    tag: (req, cb) => {
        let body = req.body;
        const { projectId, usersId, oldDocument, newDocument, origin } = body;
        const id = req.params.id;
        const queryString = req.query;

        body = _.omit(body, 'projectId', 'usersId', 'oldDocument', 'newDocument', 'origin');

        const documentWhereObj = {
            ...(typeof queryString.status != "undefined" && queryString.status != "") ? { status: queryString.status } : {},
            ...(typeof queryString.isDeleted != "undefined" && queryString.isDeleted != "") ? { isDeleted: queryString.isDeleted } : {}
        }

        const tagWhereObj = {
            ...(typeof queryString.tagTypeId != "undefined" && queryString.tagTypeId != "") ? { tagTypeId: queryString.tagTypeId } : {},
            ...(typeof queryString.tagType != "undefined" && queryString.tagType != "") ? { tagType: queryString.tagType } : {}
        };

        sequence.create().then((nextThen) => {
            try {
                Tag.destroy({
                    where: tagWhereObj
                }).then(res => {
                    nextThen(body.tags)
                })
            } catch (err) {
                cb({ status: false, error: err })
            }
        }).then((nextThen, data) => {
            if (JSON.parse(data).length > 0) {
                async.map(JSON.parse(data), (e, mapCallback) => {
                    let tagData = {
                        ...tagWhereObj,
                        linkType: e.value.split("-")[0],
                        linkId: e.value.split("-")[1],
                    }
                    Tag.create(tagData)
                        .then(res => {
                            mapCallback(null, res)
                        })

                }, (err, result) => {
                    if (err != null) {
                        cb({ status: false, error: err })
                    } else {
                        nextThen()
                    }
                })
            } else {
                nextThen()
            }
        }).then((nextThen, result) => {
            async.parallel({
                result: (parallelCallback) => {
                    try {
                        DocumentLink
                            .findOne({
                                where: { documentId: queryString.tagTypeId },
                                include: [{
                                    model: Document,
                                    as: 'document',
                                    where: documentWhereObj,
                                    include: associationFindAllStack
                                }]
                            }).then((res) => {
                                let resToReturn = {
                                    ...res.document.toJSON(),
                                    tags: res.document.tagDocumentWorkstream.map((e) => { return { value: `workstream-${e.tagWorkstream.id}`, label: e.tagWorkstream.workstream } })
                                        .concat(res.document.tagDocumentTask.map((e) => { return { value: `task-${e.tagTask.id}`, label: e.tagTask.task } })),
                                    members: res.document.share.map((e) => { return e.user }),
                                    share: JSON.stringify(res.document.share.map((e) => { return { value: e.user.id, label: e.user.firstName } }))
                                }
                                parallelCallback(null, { data: _.omit(resToReturn, "tagDocumentWorkstream", "tagDocumentTask") })
                            })
                    } catch (err) {
                        parallelCallback(err)
                    }
                },
                ActivityLogsDocument: (parallelCallback) => {
                    try {
                        const logData = {
                            projectId: projectId,
                            linkType: 'document',
                            linkId: id,
                            actionType: 'modified',
                            usersId: usersId,
                            title: `Document ${origin} tags updated`,
                            old: oldDocument,
                            new: newDocument,
                        }
                        ActivityLogsDocument
                            .create(logData)
                            .then((c) => {
                                ActivityLogsDocument
                                    .findOne({
                                        where: { id: c.id },
                                        include: [{
                                            model: Users,
                                            as: 'user'
                                        }]
                                    })
                                    .then((findRes) => {
                                        parallelCallback(null, [findRes])
                                    })
                            })
                    } catch (err) {
                        parallelCallback(err)
                    }
                }
            }, (err, results) => {
                if (err) {
                    cb({ status: false, error: err })
                } else {
                    cb({ status: true, data: { result: results.result.data, activityLogs: results.ActivityLogsDocument } })
                }
            })
        })
    },
    rename: (req, cb) => {
        let body = req.body;
        const { usersId, oldDocument, newDocument, projectId } = body;
        let id = req.params.id;
        body = _.omit(body, 'usersId', 'oldDocument', 'newDocument', 'projectId');

        sequence.create().then((nextThen) => {
            try {
                Document
                    .findAll({
                        where: {
                            origin: body.origin
                        },
                        order: Sequelize.literal('documentNameCount DESC'),
                        raw: true,
                    })
                    .then(res => {
                        if (res.length > 0) {
                            body.documentNameCount = res[0].documentNameCount + 1
                            nextThen(body)
                        } else {
                            body.documentNameCount = 0;
                            nextThen(body)
                        }
                    })
            } catch (err) {
                cb({ status: false, error: err })
            }
        }).then((nextThen, result) => {
            Document
                .update({
                    ...result,
                }, { where: { id: id } })
                .then(res => {
                    async.parallel({
                        results: (parallelCallback) => {
                            try {
                                DocumentLink
                                    .findOne({
                                        where: { documentId: id },
                                        include: [{
                                            model: Document,
                                            as: 'document',
                                            include: associationFindAllStack
                                        }]
                                    })
                                    .then((findRes) => {
                                        let dataToReturn = {
                                            ...findRes.document.toJSON(),
                                            tags: findRes.document.tagDocumentWorkstream.map((e) => { return { value: `workstream-${e.tagWorkstream.id}`, label: e.tagWorkstream.workstream } })
                                                .concat(findRes.document.tagDocumentTask.map((e) => { return { value: `task-${e.tagTask.id}`, label: e.tagTask.task } })),
                                            members: findRes.document.share.map((e) => { return e.user }),
                                            share: JSON.stringify(findRes.document.share.map((e) => { return { value: e.user.id, label: e.user.firstName } }))
                                        }
                                        parallelCallback(null, { data: _.omit(dataToReturn, "tagDocumentWorkstream", "tagDocumentTask") })
                                    })
                            } catch (err) {
                                parallelCallback(err)
                            }
                        },
                        activityLogsDocument: (parallelCallback) => {
                            try {
                                let logData = {
                                    projectId: projectId,
                                    linkType: 'document',
                                    linkId: id,
                                    actionType: 'modified',
                                    usersId: usersId,
                                    title: 'Document renamed',
                                    old: oldDocument,
                                    new: newDocument,
                                }
                                ActivityLogsDocument
                                    .create(logData)
                                    .then((c) => {
                                        ActivityLogsDocument
                                            .findOne({
                                                where: { id: c.id },
                                                include: [{
                                                    model: Users,
                                                    as: 'user'
                                                }]
                                            })
                                            .then((findRes) => {
                                                parallelCallback(null, [findRes])
                                            })
                                    })
                            } catch (err) {
                                parallelCallback(err)
                            }
                        }
                    }, (err, result) => {
                        if (err) {
                            cb({ status: false, errror: err })
                        } else {
                            cb({ status: true, data: { result: result.results.data, activityLogs: result.activityLogsDocument } })
                        }
                    })
                })
        })
    }
}

exports.delete = {
    index: (req, cb) => {
        defaultDelete(dbName, req, (res) => {
            if (res.success) {
                cb({
                    status: true,
                    data: res.data
                })
            } else {
                cb({
                    status: false,
                    error: res.error
                })
            }
        })
    }
}