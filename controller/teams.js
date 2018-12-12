const dbName = "team";
var { defaultPut, defaultDelete } = require("./")
const sequence = require('sequence').Sequence;
const Sequelize = require("sequelize")
const Op = Sequelize.Op;
const _ = require("lodash");
const models = require('../modelORM');

const {
    Members,
    Project,
    Teams,
    Users,
    UsersTeam,
    UsersRole,
    Roles,
} = models;

const associationStack = [
    {
        model: Users,
        as: 'teamLeader',
        where: { isDeleted: 0 },
        required: false
    },
    {
        model: UsersTeam,
        as: 'users_team',
        include: [{
            model: Users,
            as: 'user',
        }],
        where: { isDeleted: 0 },
        required: false
    }
]
const usersAssociationStack = [
    {
        model: UsersRole,
        as: 'user_role',
        include: [{
            model: Roles,
            as: 'role',
        }]
    },
    {
        model: Teams,
        as: 'team_as_teamLeader',
        where: { isDeleted: 0 },
        required: false
    },
    {
        model: UsersTeam,
        as: 'users_team',
        include: [{
            model: Teams,
            as: 'team'
        }],
        where: { isDeleted: 0 },
        required: false
    },
    {
        model: Members,
        as: 'projectId',
        where: { usersType: 'users', linkType: 'project' },
        required: false,
        attributes: ['linkId']
    },
]

exports.get = {
    index: (req, cb) => {
        const queryString = req.query;
        const limit = 10;
        const whereObj = {
            ...(typeof queryString.isDeleted !== 'undefined' && queryString.isDeleted !== '') ? { isDeleted: queryString.isDeleted } : {},
            ...(typeof queryString.userId !== 'undefined' && queryString.userId !== '') ? {
                [Op.or]: [
                    { id: { [Op.in]: Sequelize.literal(`(SELECT DISTINCT id FROM team where teamLeaderId = ${queryString.userId})`) } },
                    { id: { [Op.in]: Sequelize.literal(`(SELECT DISTINCT teamId FROM users_team where usersId = ${queryString.userId})`) } }
                ]
            } : {}
        }
        const options = {
            ...(typeof queryString.page != "undefined" && queryString.page != "") ? { offset: (limit * _.toNumber(queryString.page)) - limit, limit } : {},
        };

        async.parallel({
            count: (parallelCallback) => {
                Teams
                    .findAndCountAll({
                        include: associationStack,
                        ...options,
                        distinct: true,
                        where: whereObj
                    })
                    .then((res) => {
                        const pageData = {
                            total_count: res.count,
                            ...(typeof queryString.page != "undefined" && queryString.page != "") ? { current_page: (res.count > 0) ? _.toNumber(queryString.page) : 0, last_page: _.ceil(res.count / limit) } : {}
                        }
                        parallelCallback(null, pageData);
                    })
            },
            result: (parallelCallback) => {
                Teams
                    .findAll({
                        include: associationStack,
                        ...options,
                        distinct: true,
                        where: whereObj
                    })
                    .then((res) => {
                        parallelCallback(null, res)
                    })
            }
        }, (err, results) => {
            if (err) {
                cb({ status: false, error: err })
            } else {
                cb({ status: true, data: results })
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
        sequence.create().then((nextThen) => {
            try {
                Teams
                    .create(body)
                    .then((res) => {
                        nextThen(res)
                    })
            } catch (err) {
                cb({ status: true, error: err })
            }
        }).then((nextThen, result) => {
            if (typeof body.users_team !== 'undefined') {
                async.map(body.users_team, (e, mapCallback) => {
                    UsersTeam
                        .create({ teamId: result.id, usersId: e.value })
                        .then((res) => {
                            mapCallback(null, res)
                        })
                }, (err, mapCallbackResult) => {
                    if (err) {
                        cb({ status: false, error: err })
                    } else {
                        nextThen(result)
                    }
                })
            } else {
                nextThen(result)
            }
        }).then((nextThen, result) => {
            async.parallel({
                team: (parallelCallback) => {
                    try {
                        Teams
                            .findOne({
                                where: { id: result.id },
                                include: associationStack,
                            })
                            .then((res) => {
                                parallelCallback(null, [res])
                            })
                    } catch (err) {
                        parallelCallback(err)
                    }
                },
                user: (parallelCallback) => {
                    try {
                        Users
                            .findAll({
                                where: {
                                    id: body.users_team.map((e) => { return e.value }).concat([body.teamLeaderId])
                                },
                                include: usersAssociationStack,
                                attributes: ['id', 'username', 'firstName', 'lastName', 'emailAddress', 'phoneNumber', 'avatar', 'isActive', 'userType', 'company']
                            })
                            .map((res) => {
                                let responseToReturn = {
                                    ...res.toJSON(),
                                    projectId: res.projectId.map((e) => { return e.linkId }),
                                    userRole: res.user_role[0].roleId,
                                    team: res.team_as_teamLeader.concat(res.users_team.map((e) => { return e.team }))
                                }
                                return _.omit(responseToReturn, "team_as_teamLeader", "users_team")
                            })
                            .then((res) => {
                                parallelCallback(null, res);
                            })
                    } catch (err) {
                        parallelCallback(err)
                    }
                }
            }, (err, parallelCallbackResult) => {
                if (err) {
                    cb({ status: false, error: err })
                } else {
                    cb({ status: true, data: parallelCallbackResult })
                }
            })
        })
    }
}

exports.put = {
    index: (req, cb) => {
        const body = req.body;
        sequence.create().then((nextThen) => {
            async.parallel({
                userTeams: (parallelCallback) => {
                    UsersTeam
                        .findAll({ where: { teamId: body.id } })
                        .map((res) => {
                            return res.usersId
                        })
                        .then((res) => {
                            parallelCallback(null, res) //OLD USERS TO GET UPDATED DATA
                        })
                },
                teamLeader: (parallelCallback) => {
                    if (req.body.teamLeaderId !== 'undefined') {
                        Teams
                            .findOne({ where: { id: body.id } })
                            .then((res) => {
                                if (res.teamLeaderId != body.teamLeaderId) {
                                    parallelCallback(null, [res.teamLeaderId]) // OLD TEAM LEADER TO GET UPDATED DATA
                                } else {
                                    parallelCallback(null, [])
                                }
                            })
                    }
                }
            }, (err, results) => {
                nextThen(results.userTeams, results.teamLeader)
            })
        }).then((nextThen, oldUsers, oldLeader) => {
            Teams
                .update(body, { where: { id: body.id } })
                .then((res) => {
                    nextThen(oldUsers, oldLeader)
                })
        }).then((nextThen, oldUsers, oldLeader) => {
            UsersTeam
                .destroy({ where: { teamId: body.id } })
                .then((res) => {
                    if (typeof body.users_team !== 'undefined' && body.users_team.length > 0) {
                        async.map(body.users_team, (e, mapCallback) => {
                            UsersTeam
                                .create({ teamId: body.id, usersId: e.value })
                                .then((createRes) => {
                                    mapCallback(null, createRes.usersId) // NEW USERS TO GET UPDATED DATA
                                })
                        }, (err, mapCallbackResult) => {
                            nextThen(oldUsers, oldLeader, mapCallbackResult)
                        })
                    } else {
                        nextThen(oldUsers, oldLeader, [])
                    }
                })
        }).then((nextThen, oldUsers, oldLeader, newUsers) => {
            async.parallel({
                team: (parallelCallback) => {
                    try {
                        Teams
                            .findOne({
                                where: { id: body.id },
                                include: associationStack,
                            })
                            .then((res) => {
                                parallelCallback(null, res)
                            })
                    } catch (err) {
                        parallelCallback(err)
                    }
                },
                user: (parallelCallback) => {
                    try {
                        Users
                            .findAll({
                                where: {
                                    id: _.union(oldUsers, oldLeader, newUsers, [body.teamLeaderId])
                                },
                                include: usersAssociationStack,
                                attributes: ['id', 'username', 'firstName', 'lastName', 'emailAddress', 'phoneNumber', 'avatar', 'isActive', 'userType', 'company']
                            })
                            .map((res) => {
                                let responseToReturn = {
                                    ...res.toJSON(),
                                    projectId: res.projectId.map((e) => { return e.linkId }),
                                    userRole: res.user_role[0].roleId,
                                    team: res.team_as_teamLeader.concat(res.users_team.map((e) => { return e.team }))
                                }
                                return _.omit(responseToReturn, "team_as_teamLeader", "users_team")
                            })
                            .then((res) => {
                                parallelCallback(null, res);
                            })
                    } catch (err) {
                        parallelCallback(err)
                    }
                }
            }, (err, parallelCallbackResult) => {
                if (err) {
                    cb({ status: false, error: err })
                } else {
                    cb({ status: true, data: parallelCallbackResult })
                }
            })
        })
    },
    deleteTeam: (req, cb) => {
        const body = req.body;
        const id = req.params.id
        sequence.create().then((nextThen) => {
            UsersTeam
                .findAll({ where: { teamId: id } })
                .map((res) => {
                    return res.usersId
                })
                .then((res) => {
                    nextThen(res)
                })
        }).then((nextThen, result) => {
            try {
                Teams
                    .update(body, { where: { id: id } })
                    .then((res) => {
                        UsersTeam
                            .update(body, { where: { teamId: id } })
                            .then((usersTeamResult) => {
                                nextThen(result)
                            })
                    })
            } catch (err) {
                cb({ status: false, error: err })
            }
        }).then((nextThen, result) => {
            try {
                Users
                    .findAll({
                        where: {
                            id: result
                        },
                        include: usersAssociationStack,
                        attributes: ['id', 'username', 'firstName', 'lastName', 'emailAddress', 'phoneNumber', 'avatar', 'isActive', 'userType', 'company']
                    })
                    .map((res) => {
                        let responseToReturn = {
                            ...res.toJSON(),
                            projectId: res.projectId.map((e) => { return e.linkId }),
                            userRole: res.user_role[0].roleId,
                            team: res.team_as_teamLeader.concat(res.users_team.map((e) => { return e.team }))
                        }
                        return _.omit(responseToReturn, "team_as_teamLeader", "users_team")
                    })
                    .then((res) => {
                        cb({ status: true, data: res })
                    })
            } catch (err) {
                cb({ status: false, error: err })
            }
        })
    }

}

exports.delete = {
    index: (req, cb) => {
    }
}