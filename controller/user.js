const dbName = "users";
const async = require('async');
const sequence = require('sequence').Sequence
const Sequelize = require("sequelize")
const Op = Sequelize.Op;

const models = require('../modelORM');
const {
    Users,
    UsersRole,
    UsersTeam,
    Roles,
    Teams,
    Members
} = models;
const associationStack = [
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
        as: 'team_as_teamLeader'
    },
    {
        model: UsersTeam,
        as: 'users_team',
        include: [{
            model: Teams,
            as: 'team'
        }]
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
        const options = {
            ...(typeof queryString.page != "undefined" && queryString.page != "") ? { offset: (limit * _.toNumber(queryString.page)) - limit, limit } : {},
        };

        async.parallel({
            count: (parallelCallback) => {
                try {
                    Users
                        .findAndCountAll({
                            include: associationStack,
                            ...options
                        })
                        .then((res) => {
                            const pageData = {
                                total_count: res.count,
                                ...(typeof queryString.page != "undefined" && queryString.page != "") ? { current_page: (res.count > 0) ? _.toNumber(queryString.page) : 0, last_page: _.ceil(res.count / limit) } : {}
                            }
                            parallelCallback(null, pageData);
                        })
                } catch (err) {
                    parallelCallback(err);
                }
            },
            result: (parallelCallback) => {
                try {
                    Users
                        .findAll({
                            include: associationStack,
                            attributes: ['id', 'username', 'firstName', 'lastName', 'emailAddress', 'phoneNumber', 'avatar', 'isActive', 'userType', 'company'],
                            ...options
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
                    parallelCallback(err);
                }
            }
        }, (err, results) => {
            if (err) {
                cb({ status: false, error: err });
            } else {
                cb({ status: true, data: results })
            }
        })
    },
    getById: (req, cb) => {
        defaultGetById(dbName, req, (res) => {
            if (res.status) {
                cb({
                    status: true,
                    data: res.data
                })
            } else {
                cb({
                    status: false,
                    error: res.error
                })
            }
        })
    }
}

exports.post = {
    index: (req, cb) => {
        const body = req.body;
        const teams = body.team;
        const role = body.userRole;
        delete body.team;
        delete body.userRole;

        sequence.create().then((nextThen) => {
            Users.findAll({
                where: {
                    [Op.or]: [{ emailAddress: body.emailAddress }, { username: body.username }]
                },
            }).then((res) => {
                if (res.length) {
                    cb({ status: true, data: { error: true, message: 'Username/Email address already exist' } })
                } else {
                    nextThen()
                }
            })
        }).then((nextThen) => {
            try {
                Users.create(body)
                    .then((res) => {
                        nextThen(res)
                    })
            } catch (err) {
                cb({ status: false, error: err })
            }
        }).then((nextThen, result) => {
            async.parallel({
                teams: (parallelCallback) => {
                    if (typeof teams != 'undefined') {
                        UsersTeam
                            .destroy({ where: { usersId: result.id } })
                            .then((res) => {
                                async.map(teams, (e, mapCallback) => {
                                    UsersTeam
                                        .create({ usersId: result.id, teamId: e.value })
                                        .then((createRes) => {
                                            mapCallback(null, createRes)
                                        })
                                }, (err, mapCallback) => {
                                    parallelCallback(null, mapCallback)
                                })
                            })
                    } else {
                        parallelCallback(null, [])
                    }
                },
                userRole: (parallelCallback) => {
                    if (typeof role != 'undefined') {
                        UsersRole
                            .destroy({ where: { usersId: result.id } })
                            .then((res) => {
                                UsersRole
                                    .create({ usersId: result.id, roleId: role })
                                    .then((createRes) => {
                                        parallelCallback(null, createRes)
                                    })
                            })
                    } else {
                        parallelCallback(null, [])
                    }
                }
            }, (err, parallelCallbackResult) => {
                nextThen(result)
            })
        }).then((nextThen, result) => {
            try {
                Users
                    .findOne({
                        where: { id: result.id },
                        include: associationStack,
                        attributes: ['id', 'username', 'firstName', 'lastName', 'emailAddress', 'phoneNumber', 'avatar', 'isActive', 'userType'],
                    })
                    .then((res) => {
                        let responseToReturn = {
                            ...res.toJSON(),
                            projectId: res.projectId.map((e) => { return e.linkId }),
                            userRole: res.user_role[0].roleId,
                            team: res.team_as_teamLeader.concat(res.users_team.map((e) => { return e.team }))
                        }
                        cb({ status: true, data: [_.omit(responseToReturn, "team_as_teamLeader", "users_team")] });
                    })
            } catch (err) {
                cb({ status: false, error: err });
            }
        })
    }
}

exports.put = {
    index: (req, cb) => {
        const body = req.body;
        const team = body.team;
        const role = body.userRole;
        sequence.create().then((nextThen) => {
            if (typeof body.username != 'undefined' && typeof body.emailAddress != 'undefined') {
                try {
                    Users.findAll({
                        logging: true,
                        where: {
                            [Op.and]: {
                                id: { [Op.ne]: 3 },
                                [Op.or]: [{ emailAddress: body.emailAddress }, { username: body.username }],
                            }
                        },
                    }).then((res) => {
                        if (res.length) {
                            cb({ status: true, data: { error: true, message: 'Username/Email address already exist' } })
                        } else {
                            nextThen()
                        }
                    })
                } catch (err) {
                    cb({ status: false, error: err })
                }
            } else {
                nextThen()
            }
        }).then((nextThen) => {
            try {
                Users
                    .update(body, { where: { id: body.id } })
                    .then((res) => {
                        nextThen()
                    })
            } catch (err) {
                cb({ status: false, error: err })
            }
        }).then((nextThen) => {
            async.parallel({
                teams: (parallelCallback) => {
                    if (typeof teams != 'undefined') {
                        UsersTeam
                            .destroy({ where: { usersId: body.id } })
                            .then((res) => {
                                async.map(teams, (e, mapCallback) => {
                                    UsersTeam
                                        .create({ usersId: body.id, teamId: e.value })
                                        .then((createRes) => {
                                            mapCallback(null, createRes)
                                        })
                                }, (err, mapCallback) => {
                                    parallelCallback(null, mapCallback)
                                })
                            })
                    } else {
                        parallelCallback(null, [])
                    }
                },
                userRole: (parallelCallback) => {
                    if (typeof role != 'undefined') {
                        UsersRole
                            .destroy({ where: { usersId: body.id } })
                            .then((res) => {
                                UsersRole
                                    .create({ usersId: body.id, roleId: role })
                                    .then((createRes) => {
                                        parallelCallback(null, createRes)
                                    })
                            })
                    } else {
                        parallelCallback(null, [])
                    }
                }
            }, (err, parallelCallbackResult) => {
                nextThen()
            })
        }).then((nextThen) => {
            try {
                Users
                    .findOne({
                        where: { id: body.id },
                        include: associationStack,
                        attributes: ['id', 'username', 'firstName', 'lastName', 'emailAddress', 'phoneNumber', 'avatar', 'isActive', 'userType'],
                    })
                    .then((res) => {
                        let responseToReturn = {
                            ...res.toJSON(),
                            projectId: res.projectId.map((e) => { return e.linkId }),
                            userRole: res.user_role[0].roleId,
                            team: res.team_as_teamLeader.concat(res.users_team.map((e) => { return e.team }))
                        }
                        cb({ status: true, data: _.omit(responseToReturn, "team_as_teamLeader", "users_team") });
                    })
            } catch (err) {
                cb({ status: false, error: err });
            }
        })
    },
    changePassword: (req, cb) => {
        const body = req.body
        const id = body.Id;
        const func = global.initFunc();
        let data = {}

        data.salt = func.randomString(32);
        data.password = func.generatePassword(body.password, data.salt);

        try {
            Users
                .update(data, { where: { id: id } })
                .then((res) => {
                    cb({ status: true, data: res })
                })
        } catch (err) {
            console.log(err)
        }
        // users.putData("users", data, { id: id }, (c) => {
        //     if (c.status) {
        //         socket.emit("RETURN_SUCCESS_MESSAGE", { message: "Password successfully changed." })
        //     } else {
        //         socket.emit("RETURN_ERROR_MESSAGE", { message: "Password change failed. Please Try again later." })
        //     }
        // })
    }
}

exports.delete = {
    index: (req, cb) => {
        const id = req.params.id


        sequence.create().then((nextThen) => {

        })
        UsersRole
            .findAll({ where: { roleId: 1 } })
            .then((res) => {
                if (res.length <= 1 && res[0].usersId == id) {
                    cb({ success: true, data: { error: true, message: 'Cant Delete, Last Master Admin user.' } })
                } else {
                    try {
                        Users.destroy({ where: { id: id } })
                            .then((destroyRes) => {
                                async.parallel({
                                    role: (parallelCallback) => {
                                        UsersRole
                                            .destroy({ where: { usersId: id } })
                                            .then((userRoleRes) => {
                                                parallelCallback(null, userRoleRes)
                                            })
                                    },
                                    team: (parallelCallback) => {
                                        UsersTeam
                                            .destroy({ where: { usersId: id } })
                                            .then((userTeamRes) => {
                                                parallelCallback(null, userTeamRes)
                                            })
                                    }
                                }, (err, parallelCallbackResult) => {
                                    if (err) {
                                        cb({ status: false, error: err })
                                    } else {
                                        cb({ status: true, data: { id: id } })
                                    }
                                })
                            })
                    } catch (err) {
                        cb({ status: false, error: err })
                    }
                }
            })
    }
}