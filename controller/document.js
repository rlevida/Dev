const sequence = require("sequence").Sequence,
    toPdf = require("office-to-pdf"),
    mime = require('mime-types'),
    path = require('path'),
    Printer = require('node-printer');
const dbName = "document";
const Sequelize = require("sequelize")

const models = require('../modelORM');
const {
    Document,
    Tag,
    DocumentLink,
    Workstream,
    Task
} = models;

var {
    defaultGet,
    defaultPut,
    defaultDelete
} = require("./")

exports.get = {
    index: (req, cb) => {
        let d = req.query
        let filter = (typeof d.filter != "undefined") ? JSON.parse(d.filter) : {};
        let documentLinkFilter = filter.documentLinkFilter
        let documentFilter = filter.documentFilter

        sequence.create().then((nextThen) => {
            // GET ALL DOCUMENTS LINK TO PROJECT
            DocumentLink
                .findAll({
                    where: documentLinkFilter,
                    raw: true
                })
                .map(res => {
                    return res.documentId
                })
                .then(res => {
                    nextThen(res)
                })
                .catch(err => {
                    console.log(err)
                })
        }).then((nextThen, result) => {
            Document
                .findAll({
                    where: {
                        id: {
                            [Sequelize.Op.in]: result
                        },
                        ...documentFilter,
                    },
                    include: [{
                            model: Tag,
                            where: {
                                linkType: 'workstream'
                            },
                            as: 'tagWorkstream',
                            required: false,
                            include: [{
                                model: Workstream,
                                as: 'workstream',
                                attributes: ['id','workstream']
                            }],
                            attributes: ['id']
                        },
                        {
                            model: Tag,
                            where: {
                                linkType: 'task'
                            },
                            as: 'tagTask',
                            required: false,
                            include: [{
                                model: Task,
                                as: 'task',
                                attributes: ['id','task']
                            }],
                            attributes: ['id']
                        }
                    ],
                })
                .map(res => {
                    return res.toJSON()
                })
                .then(res => {
                    cb({
                        status: true,
                        data: res
                    })
                }).catch(err => {
                    console.log(err)
                    cb({
                        status: false,
                        error: err
                    })
                })
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

            data.map(file => {
                newData.push(new Promise((resolve, reject) => {
                    Document
                        .findAll({
                            where: {
                                origin: file.origin
                            },
                            order: Sequelize.literal('documentNameCount DESC'),
                            raw: true,
                        })
                        .then(res => {
                            if (res.length > 0) {
                                file.documentNameCount = res[0].documentNameCount + 1
                                resolve(file)
                            } else {
                                file.projectNameCount = 0;
                                resolve(file)
                            }
                        })
                        .catch(err => {
                            reject()
                        })
                }))
            })

            Promise.all(newData).then((values) => {
                nextThen(values)
            })

        }).then((nextThen, result) => {
            let dataToReturn = []
            if (result.length > 0) {
                result.map(file => {
                    dataToReturn.push(new Promise((resolve, reject) => {
                        let tagList = file.tags
                        delete file.tags
                        Document.create(file)
                            .then(res => {
                                let resData = res.toJSON();

                                async.parallel({
                                    documentLink: (parallelCallback) => {
                                        let linkData = {
                                            documentId: resData.id,
                                            linkType: "project",
                                            linkId: projectId
                                        }
                                        DocumentLink.create(linkData)
                                            .then(c => {
                                                parallelCallback(null, c)
                                            })
                                            .catch(err => {
                                                parallelCallback(null, "")
                                            })
                                    },
                                    documentTag: (parallelCallback) => {
                                        if (typeof tagList != "undefined") {
                                            JSON.parse(tagList).map(t => {
                                                let tagData = {
                                                    linkType: t.value.split("-")[0],
                                                    linkId: t.value.split("-")[1],
                                                    tagType: "document",
                                                    tagTypeId: resData.id,
                                                    projectId: projectId
                                                }
                                                Tag.create(tagData)
                                                    .then(c => {})
                                                    .catch(err => {})
                                            })
                                            parallelCallback(null, "")
                                        } else {
                                            parallelCallback(null, "")
                                        }
                                    }
                                }, (err, parallelResults) => {
                                    resolve(resData)
                                })
                            })
                            .catch(err => {
                                reject()
                            })
                    }))
                })

                Promise.all(dataToReturn).then(values => {
                    nextThen(values)
                })
            }
        }).then((nextThen, result) => {
            Tag.findAll({
                raw: true
            }).then(res => {
                cb({
                    status: true,
                    data: {
                        list: result,
                        tagList: res
                    }
                })
            }).catch(err => {
                cb({
                    status: true,
                    data: {
                        list: result,
                        tagList: []
                    }
                })
            })
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
                            fs.unlink(`${__dirname}/../public/temp/${data}`, (t) => {});
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
        fs.unlink(`${__dirname}/../public/temp/${req.body.data}`, (t) => {});
    }
}

exports.put = {
    index: (req, cb) => {
        defaultPut(dbName, req, (res) => {
            if (res.success) {
                cb({
                    status: true,
                    data: res.data
                })
            } else {
                cb({
                    status: false,
                    error: c.error
                })
            }
        })
    },
    putDocumentName: (req, cb) => {
        // let document = global.initModel("document")
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
    },
    putDocumentTags: (req, cb) => {
        let d = req.body;
        let filter = (typeof d.filter != "undefined") ? d.filter : {};
        sequence.create().then((nextThen) => {
            Tag.destroy({
                where: { ...filter
                }
            }).then(res => {
                if (JSON.parse(d.data.tags).length > 0) {
                    nextThen(JSON.parse(d.data.tags), d.data.id)
                } else {
                    cb({
                        status: true,
                        data: res.data
                    })
                }
            }).catch(err => {
                console.log(err)
            })

        }).then((nextThen, tags, id) => {
            let tagPromise = []
            tagPromise.push(new Promise((resolve, reject) => {
                tags.map(t => {
                    let tagData = {
                        linkType: t.value.split("-")[0],
                        linkId: t.value.split("-")[1],
                        tagType: "document",
                        tagTypeId: id,
                        projectId: d.project
                    }
                    Tag.create(tagData)
                        .then(res => {
                            resolve(res)
                        }).catch(err => {
                            reject()
                            console.log(err)
                        })
                })
            }))

            Promise.all(tagPromise).then(values => {
                cb({
                    status: true,
                    data: ""
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