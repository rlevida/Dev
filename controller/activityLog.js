const async = require("async");
const _ = require("lodash");
const models = require('../modelORM');
const { ActivityLog } = models;

exports.post = (req, cb) => {
    try {
        ActivityLog.create(req.body).then((response) => {
            cb({ status: true, data: response })
        })
    } catch (err) {
        cb({ status: false, error: err })
    }
}

exports.get = {
    index: (req, cb) => {
        const queryString = req.query;
        const limit = 2;
        let whereObj = {
            linkType: "task",
            ...(typeof queryString.taskId != "undefined" && queryString.taskId != "") ? { linkId: queryString.taskId } : {},
        };
        const options = {
            raw: true,
            ...(typeof queryString.page != "undefined" && queryString.page != "") ? { offset: (limit * _.toNumber(queryString.page)) - limit, limit } : {}
        }

        async.parallel({
            count: function (callback) {
                try {
                    ActivityLog.findAndCountAll({ ...options, where: _.omit(whereObj, ['offset', 'limit']) }).then((response) => {
                        const pageData = {
                            total_count: response.count,
                            ...(typeof queryString.page != "undefined" && queryString.page != "") ? { current_page: _.toNumber(queryString.page), last_page: _.round(response.count / limit) } : {}
                        }

                        callback(null, pageData)
                    });
                } catch (err) {
                    callback(err)
                }
            },
            result: function (callback) {
                try {
                    ActivityLog.findAll({ ...options, where: whereObj }).then((response) => {
                        callback(null, response)
                    });
                } catch (err) {
                    callback(err)
                }
            }
        }, function (err, results) {
            if (err != null) {
                cb({ status: false, error: err });
            } else {
                cb({ status: true, data: results })
            }
        });
    }
}