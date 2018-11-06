const sequence = require("sequence").Sequence,
    toPdf = require("office-to-pdf"),
    mime = require('mime-types'),
    path = require('path'),
    Printer = require('node-printer');
const _ = require("lodash");
const dbName = "document";
const Sequelize = require("sequelize")
const Op = Sequelize.Op;
const models = require('../modelORM');
const {
    Document,
    Tag,
    DocumentLink,
    Workstream,
    Tasks,
    Users,
    Share
} = models;

var {
    defaultPut,
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
            ...(typeof queryString.folderId != "undefined" && queryString.folderId != "") ? { folderId: queryString.folderId } : { folderId: null },
            ...(typeof queryString.isCompleted != "undefined" && queryString.isCompleted != "") ? { isCompleted: queryString.isCompleted } : {},
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

        async.parallel({
            count: function (parallelCallback) {
                DocumentLink
                    .findAndCountAll({
                        ...options,
                        where: documentLinkWhereObj,
                        include: [{
                            model: Document,
                            as: 'document',
                            where: documentWhereObj,
                            include: associationFindAllStack
                        }],
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
                            include: [{
                                model: Document,
                                as: 'document',
                                where: documentWhereObj,
                                include: associationFindAllStack
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
    getPrinterList: (req, cb) => {
        cb({
            status: 200,
            data: Printer.list()
        })
    }
}

exports.post = {
    index: (req, cb) => {
        let data = req.body;
        let projectId = req.body[0].project;

        sequence.create().then((nextThen) => {
            let newData = [];
            async.map(data, (e, mapCallback) => {
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
                            include: associationFindAllStack
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
                        cb({ status: true, data: res })
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
        let fileStream = fs.createWriteStream(`${__dirname}/../public/temp/${originName}`);
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
                var wordBuffer = fs.readFileSync(`${__dirname}/../public/temp/${data}`)
                toPdf(wordBuffer).then(
                    (pdfBuffer) => {
                        let pdfdata = new Promise(function (resolve, reject) {
                            let convertedData = fs.writeFileSync(`${__dirname}/../public/temp/${data}.pdf`, pdfBuffer)
                            resolve(convertedData)
                        })

                        pdfdata.then((newpdf) => {
                            fs.unlink(`${__dirname}/../public/temp/${data}`, (t) => { });
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
        fs.unlink(`${__dirname}/../public/temp/${req.body.data}`, (t) => { });
    }
}

exports.put = {
    index: (req, cb) => {
        const dataToSubmit = req.body
        const id = req.params.id
        try {
            Document
                .update(dataToSubmit, { where: { id: id } })
                .then((res) => {
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
                                ...findRes.dataValues.document.toJSON(),
                                tags: findRes.dataValues.document.tagDocumentWorkstream.map((e) => { return { value: `workstream-${e.tagWorkstream.id}`, label: e.tagWorkstream.workstream } })
                                    .concat(findRes.dataValues.document.tagDocumentTask.map((e) => { return { value: `task-${e.tagTask.id}`, label: e.tagTask.task } }))
                            }
                            cb({ status: true, data: _.omit(resToReturn, "tagDocumentWorkstream", "tagDocumentTask") })
                        })
                })
        } catch (err) {
            cb({ status: false, error: err })
        }
    },
    documentTag: (req, cb) => {
        const dataToSubmit = req.body
        const id = req.params.id
        const queryString = req.query

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
                    nextThen(dataToSubmit.tags)
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
                            ...res.dataValues.document.toJSON(),
                            tags: res.dataValues.document.tagDocumentWorkstream.map((e) => { return { value: `workstream-${e.tagWorkstream.id}`, label: e.tagWorkstream.workstream } })
                                .concat(res.dataValues.document.tagDocumentTask.map((e) => { return { value: `task-${e.tagTask.id}`, label: e.tagTask.task } }))
                        }
                        cb({ status: true, data: _.omit(resToReturn, "tagDocumentWorkstream", "tagDocumentTask") })
                    })
            } catch (err) {
                console.log(err)
                cb({ status: false, error: err })
            }
        })
    },
    putDocumentName: (req, cb) => {
        let d = req.body
        let id = req.params.id

        sequence.create().then((nextThen) => {
            Document
                .findAll({
                    where: {
                        origin: d.origin
                    },
                    order: Sequelize.literal('documentNameCount DESC'),
                    raw: true,
                })
                .then(res => {
                    if (res.length > 0) {
                        d.documentNameCount = res[0].documentNameCount + 1
                        nextThen(d)
                    } else {
                        d.projectNameCount = 0;
                        nextThen(d)
                    }
                })
                .catch(err => {
                    console.log(err)
                })
        }).then((nextThen, result) => {
            Document.update({
                ...result,
            }, {
                    where: {
                        id: id
                    }
                })
                .then(res => {
                    cb({
                        status: true,
                        data: res.data
                    })
                }).catch(err => {
                    console.log(err)
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