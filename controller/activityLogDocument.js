const async = require("async");
const _ = require("lodash");
const models = require('../modelORM');
const { ActivityLogsDocument, Users } = models;

exports.post = (req, cb) => {
    try {
        ActivityLogs.create(req.body).then((response) => {
            cb({ status: true, data: response })
        })
    } catch (err) {
        cb({ status: false, error: err })
    }
}

exports.get = {
    index: (req, cb) => {
        const { projectId = '' } = req.query
        const whereObj = {
            ...(projectId !== '') ? { projectId: projectId } : {}
        }
        try {
            ActivityLogsDocument
                .findAll({
                    where: whereObj,
                    include: [{
                        model: Users,
                        as: 'user'
                    }]
                })
                .then((res) => {
                    cb({ status: true, data: res })
                })
        } catch (err) {
            cb({ status: false, error: err })
        }
    }
}