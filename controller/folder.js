const dbName = "folder";
var {
    defaultGet,
    defaultGetId,
    defaultPost,
    defaultPut,
    defaultDelete
} = require("./")
var sequence = require("sequence").Sequence;
const Sequelize = require("sequelize")

const models = require('../modelORM');
const {
    Folder,
    Tag
} = models;

exports.get = {
    index: (req, cb) => {
        let d = req.query;
        let filter = (typeof d.filter != "undefined") ? JSON.parse(d.filter) : {};
        Folder
            .findAll({
                where: filter
            })
            .then(res => {
                cb({
                    status: true,
                    data: res
                })
            })
            .catch(err => {
                cb({
                    status: false,
                    error: err
                })
            })
    },
    getById: (req, cb) => {
        defaultGetById(dbName, req, (res) => {
            if (res.status) {
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

exports.post = {
    index: (req, cb) => {
        let d = req.body
        Folder.create(d)
            .then(res => {
                cb({
                    status: true,
                    data: [res]
                })
            })
            .catch(err => {
                cb({
                    status: false,
                    error: err
                })
            })
    },
    postFolderTag: (req, cb) => {
        let d = req.body
        let filter = (typeof d.filter != "undefined") ? d.filter : {};
        sequence.create().then((nextThen) => {
            Tag.destroy({
                    where: filter
                })
                .then(res => {
                    nextThen(d.data)
                })
                .catch(err => {
                    cb({
                        status: false,
                        error: err
                    })
                })
        }).then((nextThen, data) => {
            let dataToReturn = []

            if (JSON.parse(data.tags).length) {
                JSON.parse(data.tags).map(e => {
                    let tagData = {
                        linkType: e.value.split("-")[0],
                        linkId: e.value.split("-")[1],
                        tagType: "folder",
                        tagTypeId: data.id
                    }

                    dataToReturn.push(new Promise((resolve, reject) => {
                        Tag.create(tagData)
                            .then(res => {
                                resolve(res)
                            })
                            .catch(err => {
                                reject()
                            })
                    }))
                })
                Promise.all(dataToReturn).then((values) => {
                    cb({
                        status: true,
                        data: []
                    })
                })
            } else {
                cb({
                    status: true,
                    data: []
                })
            }
        })
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