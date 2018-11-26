const models = require('../modelORM');
const { TaskTimeLogs, sequelize, Users, Tasks } = models;
const associationArray = [
    {
        model: Users,
        as: 'user',
        attributes: ['firstName', 'lastName']
    }
];

exports.post = {
    index: (req, cb) => {
        const body = req.body;
        try {
            TaskTimeLogs.create(body).then((response) => {
                const newTaskTime = response.toJSON();
                const options = {
                    include: associationArray
                };
                return TaskTimeLogs.findOne({ ...options, where: { id: newTaskTime.id } });
            }).then((response) => {
                cb({ status: true, data: response.toJSON() });
            });
        } catch (err) {
            cb({ status: false, error: err })
        }
    }
}

exports.get = {
    index: (req, cb) => {
        const queryString = req.query;
        const limit = 10;
        const options = {
            include: associationArray,
            ...(typeof queryString.page != "undefined" && queryString.page != "") ? { offset: (limit * _.toNumber(queryString.page)) - limit, limit } : {},
            order: [['dateAdded', 'desc']]
        };
        const whereObj = {
            ...(typeof queryString.taskId != "undefined" && queryString.taskId != "") ? { taskId: queryString.taskId } : {},
            ...(typeof queryString.userId != "undefined" && queryString.userId != "") ? { usersId: queryString.userId } : {},
        }

        async.parallel({
            count: (callback) => {
                try {
                    TaskTimeLogs.findAndCountAll({ ..._.omit(options, ['offset', 'limit']), where: whereObj, distinct: true }).then((response) => {
                        const pageData = {
                            total_count: response.count,
                            ...(typeof queryString.page != "undefined" && queryString.page != "") ? {
                                current_page: (response.count > 0) ? _.toNumber(queryString.page) : 0,
                                last_page: _.ceil(response.count / limit)
                            } : {}
                        }

                        callback(null, pageData)
                    });
                } catch (err) {
                    callback(err)
                }
            },
            result: (callback) => {
                try {
                    TaskTimeLogs.findAll({ ...options, where: whereObj, order: [['dateAdded', 'DESC']] }).map((mapObject) => {
                        return mapObject.toJSON();
                    }).then((resultArray) => {
                        callback(null, resultArray);
                    });
                } catch (err) {
                    callback(err)
                }
            },
            total_hours: (callback) => {
                try {
                    sequelize.query(`
                    SELECT
                        period,
                        SUM(time) as value
                    FROM
                        task_time_logs
                    WHERE 
                        taskId = :taskId
                        ${(typeof queryString.userId != "undefined" && queryString.userId != "") ? `
                    AND
                        usersId = :userId` : ``}
                    GROUP BY period
                    `,
                        {
                            replacements: {
                                taskId: queryString.taskId,
                                ...(typeof queryString.userId != "undefined" && queryString.userId != "") ? { userId: queryString.userId } : {}
                            },
                            type: sequelize.QueryTypes.SELECT
                        }
                    ).then((response) => {
                        callback(null, response);
                    })
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