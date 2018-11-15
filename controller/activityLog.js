const async = require("async");
const _ = require("lodash");
const models = require('../modelORM');
const { ActivityLogs, Users, Sequelize } = models;

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
        const queryString = req.query;
        const limit = 5;
        const association = [
            {
                model: Users,
                as: 'user',
                attributes: ['firstName', 'lastName']
            }
        ];
        let whereObj = {
            ...(typeof queryString.taskId != "undefined" && queryString.taskId != "") ? {
                [Sequelize.Op.or]: [
                    {
                        linkId: {
                            [Sequelize.Op.in]: Sequelize.literal(`(SELECT DISTINCT task_checklist.id FROM task LEFT JOIN task_checklist on task.id = task_checklist.taskId WHERE task.id = ${queryString.taskId})`)
                        }
                    },
                    {
                        [Sequelize.Op.and]: [
                            {
                                linkId: queryString.taskId
                            },
                            {
                                linkType: "task"
                            }
                        ]
                    }
                ]
            } : {},
        };

        _.filter(association, (associationObj) => {
            return _.findIndex((queryString.includes).split(','), (includesObj) => { return includesObj == associationObj.as }) >= 0
        })
        const options = {
            ...(typeof queryString.page != "undefined" && queryString.page != "") ? { offset: (limit * _.toNumber(queryString.page)) - limit, limit } : {},
            ...(typeof queryString.includes != "undefined" && queryString.includes != "") ? { include: _.filter(association, (associationObj) => { return _.findIndex((queryString.includes).split(','), (includesObj) => { return includesObj == associationObj.as }) >= 0 }) } : {}
        };
        async.parallel({
            count: function (callback) {
                try {
                    ActivityLogs.findAndCountAll({ where: _.omit(whereObj, ['offset', 'limit']) }).then((response) => {
                        const pageData = {
                            total_count: response.count,
                            ...(typeof queryString.page != "undefined" && queryString.page != "") ? { current_page: (response.count > 0) ? _.toNumber(queryString.page) : 0, last_page: _.ceil(response.count / limit) } : {}
                        }

                        callback(null, pageData)
                    });
                } catch (err) {
                    callback(err)
                }
            },
            result: function (callback) {
                try {
                    ActivityLogs.findAll({ ...options, where: whereObj, order: [['dateAdded', 'DESC']], logging: true }).map((mapObject) => {
                        return mapObject.toJSON();
                    }).then((resultArray) => {
                        callback(null, resultArray);
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