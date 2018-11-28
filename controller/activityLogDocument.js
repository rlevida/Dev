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
        const limit = 10;
        const { projectId = '', page } = req.query
        const whereObj = {
            ...(projectId !== '') ? { projectId: projectId } : {}
        }

        const options = {
            ...(page != "") ? { offset: (limit * _.toNumber(page)) - limit, limit } : {},
            order: [['dateAdded', 'DESC']]
        };



        async.parallel({
            result: (parallelCallback) => {
                try {
                    ActivityLogsDocument
                        .findAll({
                            ...options,
                            where: whereObj,
                            include: [{
                                model: Users,
                                as: 'user'
                            }]
                        })
                        .then((res) => {
                            parallelCallback(null, res)
                            // cb({ status: true, data: res })
                        })
                } catch (err) {
                    cb({ status: false, error: err })
                }
            },
            count: (parallelCallback) => {
                ActivityLogsDocument
                    .findAndCountAll({
                        ...options,
                        where: whereObj,
                        include: [{
                            model: Users,
                            as: 'user'
                        }]
                    })
                    .then((res) => {
                        const pageData = {
                            total_count: res.count,
                            ...(page != "") ? { current_page: (res.count > 0) ? _.toNumber(page) : 0, last_page: _.ceil(res.count / limit) } : {}
                        }
                        parallelCallback(null, pageData)
                    })
            }
        }, (err, results) => {
            if (err) {
                cb({ status: false, error: err })
            } else {
                cb({ status: true, data: results })
            }
        })
    }
}