const async = require("async");
const _ = require("lodash");
const Sequelize = require("sequelize")
const Op = Sequelize.Op;
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
        const queryString = req.query
        let whereObj = {
            ...(typeof queryString.projectId !== 'undefined' && queryString.projectId !== '') ? { projectId: queryString.projectId } : {},
            ...(typeof queryString.userType != "undefined" && queryString.userType == "External" && typeof queryString.userId != "undefined" && queryString.userId != "") ? {
                [Op.or]: [
                    {
                        linkId: {
                            [Op.in]: Sequelize.literal(`(SELECT DISTINCT shareId FROM share where userTypeLinkId = ${queryString.userId})`)
                        },

                    }, {
                        linkId: {
                            [Op.in]: Sequelize.literal(`(SELECT DISTINCT document.id FROM document LEFT JOIN share ON document.folderId = share.shareId where share.shareType = 'folder' AND share.userTypeLinkId = ${queryString.userId} )`)
                        }
                    }
                    , {
                        linkId: {
                            [Op.in]: Sequelize.literal(`(SELECT DISTINCT document.id FROM document WHERE uploadedBy = ${queryString.userId})`)
                        }
                    }
                ]
            } : {}
        }

        const options = {
            ...(typeof queryString !== 'undefined' && queryString.page != "") ? { offset: (limit * _.toNumber(queryString.page)) - limit, limit } : {},
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
                            ...(typeof queryString.page !== 'undefined' && queryString.page !== '') ? { current_page: (res.count > 0) ? _.toNumber(queryString.page) : 0, last_page: _.ceil(res.count / limit) } : {}
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