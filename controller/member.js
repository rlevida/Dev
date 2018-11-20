const _ = require("lodash");
const { defaultPost, defaultPut, defaultDelete } = require("./");
const Sequelize = require("sequelize")
const Op = Sequelize.Op;
const models = require('../modelORM');
const { Members, Users, UsersRole, Roles, UsersTeam, Teams } = models;


exports.get = {
    index: (req, cb) => {
        const queryString = req.query;
        const limit = 5;
        const associationArray = [
            {
                model: Users,
                as: 'user',
                attributes: ["firstName", "lastName", "username", "emailAddress", "userType"],
                include: [
                    {
                        model: UsersRole,
                        as: 'user_role',
                        include: [
                            {
                                model: Roles,
                                as: 'role'
                            }
                        ]
                    },
                    {
                        model: UsersTeam,
                        as: 'users_team',
                        include: [
                            {
                                model: Teams,
                                as: 'team'
                            }
                        ]
                    }
                ]
            }
        ]
        const whereObj = {
            ...(typeof queryString.linkType != "undefined" && queryString.linkType != "") ? { linkType: queryString.linkType } : {},
            ...(typeof queryString.linkId != "undefined" && queryString.linkId != "") ? { linkId: queryString.linkId } : {},
            ...(typeof queryString.userTypeLinkId != "undefined" && queryString.userTypeLinkId != "") ? { userTypeLinkId: queryString.userTypeLinkId } : {},
            ...(typeof queryString.memberType != "undefined" && queryString.memberType != "") ? { memberType: queryString.memberType } : {},
            ...(typeof queryString.usersType != "undefined" && queryString.usersType != "") ? { usersType: queryString.usersType } : {},
            ...(typeof queryString.workstreamId != "undefined" && queryString.workstreamId != "") ? {
                [Sequelize.Op.or]: [
                    {
                        userTypeLinkId: {
                            [Sequelize.Op.in]: Sequelize.literal(`(SELECT DISTINCT userTypeLinkId FROM members WHERE linkType = "workstream" AND members.linkId = ${queryString.workstreamId})`)
                        }
                    },
                    {
                        userTypeLinkId: {
                            [Sequelize.Op.in]: Sequelize.literal(`(SELECT DISTINCT members.userTypeLinkId FROM task LEFT JOIN members on task.id = members.linkId WHERE members.linkType = "task" AND task.workstreamId = ${queryString.workstreamId})`)
                        }
                    }
                ],
                linkType: {
                    [Sequelize.Op.or]: [
                        {
                            [Sequelize.Op.eq]: "workstream"
                        },
                        {
                            [Sequelize.Op.eq]: "task"
                        }
                    ]
                },
                memberType: "assignedTo"
            } : {},
            ...(typeof queryString.memberName != "undefined" && queryString.memberName != "") ? {
                [Sequelize.Op.and]: [
                    {
                        userTypeLinkId: {
                            [Sequelize.Op.in]: Sequelize.literal(`(SELECT DISTINCT users.id FROM members INNER JOIN users ON members.userTypeLinkId = users.id WHERE LOWER(users.firstName) like "%${(queryString.memberName).toLowerCase()}%" OR LOWER(users.lastName) like "%${(queryString.memberName).toLowerCase()}%")`)
                        }
                    }
                ]
            } : {}
        }
        const options = {
            ...(typeof queryString.page != "undefined" && queryString.page != "") ? { offset: (limit * _.toNumber(queryString.page)) - limit, limit } : {},
            include: associationArray
        }

        try {
            async.parallel({
                count: function (callback) {
                    try {
                        Members.findAndCountAll({
                            ...options,
                            where: _.omit(whereObj, ["offset", "limit"]),
                            distinct: true,
                            col: "userTypeLinkId"
                        }).then((response) => {
                            const pageData = {
                                total_count: response.count,
                                ...(typeof queryString.page != "undefined" && queryString.page != "") ? { current_page: (response.count > 0) ? _.toNumber(queryString.page) : 0, last_page: _.ceil(response.count / limit) } : {}
                            };
                            callback(null, pageData)
                        });
                    } catch (err) {
                        callback(err)
                    }
                },
                result: function (callback) {
                    try {
                        Members.findAll({
                            where: whereObj,
                            ...options,
                            group: ['userTypeLinkId']
                        }).map((mapObject) => {
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

        } catch (err) {
            cb({ status: false, error: err })
        }
    }
}

exports.post = {
    index: (req, cb) => {
        const association = [
            {
                model: Users,
                as: 'user',
                attributes: ['firstName', 'lastName']
            }
        ]
        const options = {
            ...(typeof req.body.includes != "undefined" && req.body.includes != "") ? { include: _.filter(association, (associationObj) => { return _.findIndex((req.body.includes).split(','), (includesObj) => { return includesObj == associationObj.as }) >= 0 }) } : {}
        }
        try {
            Members.create(req.body.data).then((response) => {
                Members.findOne({ ...options, where: { id: response.dataValues.id } }).then((response) => {
                    cb({ status: true, data: response.toJSON() });
                });
            });
        } catch (err) {
            cb({ status: false, error: err })
        }
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
        const queryString = req.query;
        const whereObj = {
            ...(typeof queryString.linkType != "undefined" && queryString.linkType != "") ? { linkType: queryString.linkType } : {},
            ...(typeof queryString.linkId != "undefined" && queryString.linkId != "") ? { linkId: queryString.linkId } : {},
            ...(typeof queryString.memberType != "undefined" && queryString.memberType != "") ? { memberType: queryString.memberType } : {},
            ...(typeof queryString.usersType != "undefined" && queryString.usersType != "") ? { usersType: queryString.usersType } : {},
        };
        const options = {
            raw: true
        };
        try {
            Members.destroy(
                { ...options, where: whereObj }
            ).then((response) => {
                cb({ status: true, data: response });
            });
        } catch (err) {
            cb({ status: false, error: err })
        }
    }
}