const _ = require("lodash");
const async = require("async");
const models = require('../modelORM');
const { Members, Users, UsersRole, Roles, UsersTeam, Teams, TaskMemberReminder, Sequelize, sequelize } = models;
const associationArray = [
    {
        model: Users,
        as: 'user',
        attributes: ["id", "firstName", "lastName", "username", "emailAddress", "userType"],
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
                where: { isDeleted: 0 },
                as: 'users_team',
                include: [
                    {
                        model: Teams,
                        as: 'team'
                    }
                ]
            },
            {
                model: TaskMemberReminder,
                as: 'task_member_reminder',
                required: false
            }
        ]
    }
]

exports.get = {
    index: (req, cb) => {
        const queryString = req.query;
        const limit = 5;
        const orObj = []
        if (typeof queryString.taskId != "undefined" && queryString.taskId != "") {
            orObj.push({
                userTypeLinkId: {
                    [Sequelize.Op.in]: Sequelize.literal(`(SELECT DISTINCT userTypeLinkId FROM members WHERE linkType = "workstream" AND members.linkId = ${queryString.workstreamId} AND members.memberType ="responsible") `)
                }
            },
                {
                    userTypeLinkId: {
                        [Sequelize.Op.in]: Sequelize.literal(`(SELECT DISTINCT members.userTypeLinkId FROM task LEFT JOIN members on task.id = members.linkId WHERE members.linkType = "task" AND task.workstreamId = ${queryString.workstreamId} AND task.id = ${queryString.taskId})`)
                    }
                })
        } else {
            orObj.push(
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
            )
        }

        const linkIdObj = {
            ...(typeof queryString.taskId != "undefined" && queryString.taskId != "") ? { linkId: [queryString.taskId, queryString.workstreamId] } : {}
        }
        const whereObj = {
            ...(typeof queryString.isDeleted != "undefined" && queryString.isDeleted != "") ? { isDeleted: queryString.isDeleted } : {},
            ...(typeof queryString.linkType != "undefined" && queryString.linkType != "") ? { linkType: queryString.linkType } : {},
            ...(typeof queryString.linkId != "undefined" && queryString.linkId != "") ? { linkId: queryString.linkId } : {},
            ...(typeof queryString.userTypeLinkId != "undefined" && queryString.userTypeLinkId != "") ? { userTypeLinkId: queryString.userTypeLinkId } : {},
            ...(typeof queryString.memberType != "undefined" && queryString.memberType != "") ? { memberType: queryString.memberType } : {},
            ...(typeof queryString.usersType != "undefined" && queryString.usersType != "") ? { usersType: queryString.usersType } : {},
            ...(typeof queryString.workstreamId != "undefined" && queryString.workstreamId != "") ? {
                [Sequelize.Op.or]: orObj,
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
                ...linkIdObj
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

        if (typeof queryString.taskId !== 'undefined' && queryString.taskId !== '') {
            _.find(_.find(associationArray, { as: 'user' }).include, { as: 'task_member_reminder' }).where = {
                taskId: queryString.taskId
            };
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
    },
    selectList: (req, cb) => {
        const queryString = req.query;
        const limit = 5;
        let query = `SELECT * FROM members WHERE id <> 0 `;
        let userTypeQuery = `SELECT * FROM users `

        if (typeof queryString.linkType != "undefined" && queryString.linkType != "") {
            query += `AND linkType = "${queryString.linkType}" `
        }

        if (typeof queryString.linkId != "undefined" && queryString.linkId != "") {
            query += `AND linkId = "${queryString.linkId}" `
        }

        if (typeof queryString.userType != "undefined" && queryString.userType != "") {
            userTypeQuery += `WHERE userType = '${queryString.userType}'`
        }

        const constructQuery = (column) => {
            return `
                SELECT ${column} FROM (
                    SELECT users.* , role.role , role.id as roleId FROM (
                            SELECT * FROM (` + query + `) as prjMembersUsers WHERE usersType = "users") as tb1
                    LEFT JOIN ( ${userTypeQuery} ) as users ON tb1.userTypeLinkId = users.id
                    LEFT JOIN users_role ON users.id = users_role.usersId
                    LEFT JOIN role ON users_role.roleId = role.id
                    WHERE users.id IS NOT NULL
                    UNION ALL
                    SELECT users.* , role.role , role.id as roleId FROM  ( SELECT * FROM (` + query + `) as prjMembersTeam WHERE usersType = "team") as tb2
                    LEFT JOIN users_team ON tb2.userTypeLinkId = users_team.teamId
                    LEFT JOIN users ON users_team.usersId = users.id 
                    LEFT JOIN users_role ON users.id = users_role.usersId
                    LEFT JOIN role ON users_role.roleId = role.id
                    WHERE users.id IS NOT NULL
                    ${(typeof queryString.memberName != "undefined" && queryString.memberName != "") ? `
                    AND
                    (LOWER(users.firstName) like "%${(queryString.memberName).toLowerCase()}%" OR LOWER(users.lastName) like "%${(queryString.memberName).toLowerCase()}%")
                    ` : ``}
                ) as mainTable `
        };

        async.parallel({
            count: function (callback) {
                try {
                    sequelize
                        .query(constructQuery("COUNT(*) as count"), { type: sequelize.QueryTypes.SELECT })
                        .then((response) => {
                            const pageData = {
                                total_count: response[0].count,
                                ...(typeof queryString.page != "undefined" && queryString.page != "") ? { current_page: (response[0].count > 0) ? _.toNumber(queryString.page) : 0, last_page: _.ceil(response[0].count / limit) } : {}
                            }
                            callback(null, pageData)
                        });

                } catch (err) {
                    callback(err)
                }
            },
            result: function (callback) {
                try {
                    if (typeof queryString.page != "undefined" && queryString.page != "") {
                        query += `limit ${limit} offset ${(limit * _.toNumber(queryString.page)) - limit}`
                    }
                    sequelize
                        .query(`${constructQuery("*")} GROUP BY id`, { type: sequelize.QueryTypes.SELECT })
                        .then((response) => {
                            callback(null, _.map(response, (responseObj) => { return _.omit(responseObj, ["password", "salt"]) }))
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

exports.post = {
    index: (req, cb) => {
        const association = [
            {
                model: Users,
                as: 'user',
                attributes: ['id','firstName', 'lastName']
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
        const body = req.body;
        const queryString = req.query;
        const whereObj = {
            ...(typeof queryString.linkType !== 'undefined' && queryString.linkType !== '') ? { linkType: queryString.linkType } : {},
            ...(typeof queryString.linkId !== 'undefined' && queryString.linkId !== '') ? { linkId: queryString.linkId } : {},
            ...(typeof queryString.usersType !== 'undefined' && queryString.usersType !== '') ? { usersType: queryString.usersType } : {},
            ...(typeof queryString.userTypeLinkId !== 'undefined' && queryString.userTypeLinkId !== '') ? { userTypeLinkId: queryString.userTypeLinkId } : {},
            id: req.params.id
        };

        try {
            Members
                .update(body, { where: whereObj })
                .then((res) => {
                    Members
                        .findOne({
                            where: whereObj,
                            include: associationArray
                        })
                        .then((findRes) => {
                            cb({ status: true, data: [findRes] })
                        })
                })
        } catch (err) {
            cb({ status: false, error: err })
        }
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