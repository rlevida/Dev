const _ = require("lodash");
const dbName = "starred";
const { defaultGet, defaultPut, defaultDelete } = require("./")
const models = require('../modelORM');
const { Starred } = models;

exports.get = {
    index: (req, cb) => {
        defaultGet(dbName, req, (res) => {
            if (res.status) {
                cb({ status: true, data: res.data })
            } else {
                cb({ status: false, error: res.error })
            }
        })
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

        Starred.findOne({
            where: body
        }).then((response) => {
            const responseResult = (response != null) ? response.toJSON() : "";

            if (responseResult == "") {
                Starred.create({ ...body, isActive: 1 }).then((response) => {
                    cb({ status: true, data: _.omit(response.toJSON(), ["dateUpdated"]) })
                });
            } else {
                Starred.update(
                    { ...body, isActive: (responseResult.isActive != 1) ? 1 : 0 },
                    { where: body }
                ).then((response) => {
                    return Starred.findOne({ where: body });
                }).then((findRes) => {
                    cb({ status: true, data: findRes.toJSON() })
                });
            }
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