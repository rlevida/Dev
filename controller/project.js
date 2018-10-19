const sequence = require("sequence").Sequence;
const dbName = "project";
var {
    defaultGet,
    defaultGetId,
    defaultPost,
    defaultPut,
    defaultDelete
} = require("./")


const models = require('../modelORM');
const {
    Project,
    Status,
    Type
} = models;

exports.get = {
    index: (req, cb) => {
        let d = req.query;
        let filter = (typeof d.filter != "undefined") ? JSON.parse(d.filter) : {};

        Project.
            findAll({
                raw:true,
                include: [
                    {
                        model: Status,
                        as: 'status'
                    },
                    {
                        model: Type,
                        as: 'type'
                    }
                ]
            })
            .then(res => {
                cb({ status: true , data: res })
            })
            .catch(err => {
                console.log(err)
                cb({ status: false, data: res })
            })

        // defaultGet(dbName, req, (res) => {
        //     if (res.status) {
        //         cb({
        //             status: true,
        //             data: res.data
        //         })
        //     } else {
        //         cb({
        //             status: false,
        //             error: res.error
        //         })
        //     }
        // })
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
        defaultPost(dbName, req, (res) => {
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
    archive: (req, cb) => {
        let dataToSubmit = req.body
        let id = req.params.id

        sequence.create().then((nextThen) => {
            Project.update({
                    ...dataToSubmit
                }, {
                    where: {
                        id: id
                    },
                })
                .then(res => {
                    nextThen(res)
                })
                .catch(err => {
                    cb({
                        status: false,
                        error: err
                    })
                })
        }).then((nextThen, result) => {
            Project.findById(result[0])
                .then(res => {
                    cb({
                        status: true,
                        data: res
                    })
                }).catch(err => {
                    cb({
                        status: false,
                        error: err
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