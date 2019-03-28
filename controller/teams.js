const dbName = "team";
var { defaultPut, defaultDelete } = require("./")
const sequence = require('sequence').Sequence;
const async = require("async");
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
    Sequelize,
    sequelize
} = models;

const Op = Sequelize.Op;
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

        const orStack = [];

        if (typeof queryString.userId !== 'undefined' && queryString.userId !== '') {
            orStack.push(
                { id: { [Op.in]: Sequelize.literal(`(SELECT DISTINCT id FROM team where teamLeaderId = ${queryString.userId})`) } },
                { id: { [Op.in]: Sequelize.literal(`(SELECT DISTINCT teamId FROM users_team where usersId = ${queryString.userId})`) } }
            );
        }

        if (typeof queryString.userRole !== 'undefined' && queryString.userRole <= 2) {
            orStack.push(
                {
                    id: {
                        [Op.ne]: 0
                    }
                }
            );
        }

        const whereObj = {
            ...(typeof queryString.isDeleted !== 'undefined' && queryString.isDeleted !== '') ? { isDeleted: queryString.isDeleted } : { isDeleted: 0 },
            ...(orStack.length > 0) ? {
                [Op.or]: orStack
            } : {},
            ...(typeof queryString.name !== 'undefined' && queryString.name != "") ? {
                [Op.and]: Sequelize.where(
                    Sequelize.fn('lower', Sequelize.col('team.team')),
                    {
                        [Sequelize.Op.like]: sequelize.fn('lower', `%${queryString.name}%`)
                    }
                )
            } : {}
        };
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
                    .map((o) => { return o.toJSON() })
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
                                where: { id: result.id, isDeleted: 0 },
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
                                where: { id: body.id, isDeleted: 0 },
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
    deleteTeam: async (req, cb) => {
        const body = req.body;
        const id = req.params.id
        try {
            const toBeDeleted = await Teams
                .findOne({
                    where: { id, isDeleted: 0 },
                    include: associationStack,
                }).then((res) => {
                    const response = res.toJSON();
                    return response;
                });
            const userTeam = await UsersTeam.findAll({ where: { teamId: id } })
                .map((res) => {
                    return res.usersId
                })
                .then((res) => {
                    return res;
                });
            const allMembers = [...userTeam, ...[toBeDeleted.teamLeaderId]]

            async.parallel({
                team: (parallelCallback) => {
                    Teams
                        .update(body, { where: { id: id } })
                        .then(() => {
                            parallelCallback(null, "");
                        });
                },
                members: (parallelCallback) => {
                    UsersTeam
                        .update(body, { where: { teamId: id } })
                        .then(() => {
                            parallelCallback(null, "");
                        });
                }
            }, () => {
                Users
                    .findAll({
                        where: {
                            id: allMembers
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
                        return _.omit(responseToReturn, "team_as_teamLeader", "users_team");
                    })
                    .then((res) => {
                        cb({ status: true, data: res });
                    });
            })

        } catch (err) {
            cb({ status: false, error: err });
        }
    }

}