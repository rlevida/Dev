const Sequelize = require("sequelize");
const async = require("async");
const Op = Sequelize.Op;
const _ = require("lodash")
const models = require('../modelORM');

const {
    Document,
    DocumentLink,
    Members,
    Project,
    Tag,
    Tasks,
    Teams,
    Type,
    Users,
    UsersTeam,
    UsersRole,
    Workstream,
} = models;

exports.get = {
    selectList: (req, cb) => {
        const queryString = req.query

        const whereObj = {
            ...(typeof queryString.linkType != "undefined" && queryString.linkType != "") ? {
                linkType: queryString.linkType
            } : {},
            ...(typeof queryString.linkId != "undefined" && queryString.linkId != "") ? {
                linkId: queryString.linkId
            } : {},
            ...(typeof queryString.usersType != "undefined" && queryString.usersType != "") ? {
                usersType: queryString.usersType
            } : {},
            ...(typeof queryString.projectId != "undefined" && queryString.projectId != "") ? {
                projectId: queryString.projectId
            } : {},
        }

        const modelList = {
            teamList: "Teams",
            roleList: "Roles",
            projectMemberList: "Project"
        }

        modelName = modelList[queryString.selectName];

        if (modelName != "") {
            const model = models[modelName]
            switch (queryString.selectName) {
                case "projectMemberList":
                    {
                        async.parallel({
                            members: (parallelCallback) => {
                                try {
                                    Members
                                        .findAll({
                                            where: { ...whereObj,
                                                usersType: 'users'
                                            },
                                            include: [{
                                                model: Users,
                                                as: 'user'
                                            }]
                                        })
                                        .map((res) => {
                                            return res.user.toJSON()
                                        })
                                        .then((res) => {
                                            parallelCallback(null, res)
                                        })
                                } catch (err) {
                                    parallelCallback(null, [])
                                }
                            },
                            teamMembers: (parallelCallback) => {
                                try {
                                    Members
                                        .findAll({
                                            where: { ...whereObj,
                                                usersType: 'team'
                                            },
                                            include: [{
                                                model: Teams,
                                                as: 'team',
                                                include: [{
                                                    model: UsersTeam,
                                                    as: 'users_team',
                                                    include: [{
                                                        model: Users,
                                                        as: 'user'
                                                    }]
                                                }]
                                            }]
                                        })
                                        .map((res) => {
                                            return res.team.toJSON()
                                        })
                                        .then((res) => {
                                            async.map(res, (o, mapCallback) => {
                                                let users = [];
                                                o.users_team.map((e) => {
                                                    users.push(e.user)
                                                })
                                                mapCallback(null, users)
                                            }, (err, result) => {
                                                parallelCallback(null, _.uniqBy(_.flatten(result), 'id'))
                                            });
                                        })
                                } catch (err) {
                                    parallelCallback(null, [])
                                }
                            }
                        }, (err, result) => {
                            let memberList = _.merge(result.members, result.teamMembers)
                            cb({
                                status: true,
                                data: memberList
                            })
                        })
                        break;
                    }
                case "teamList":
                    {
                        try {
                            Teams
                                .findAll({
                                    include: [{
                                            model: Users,
                                            as: 'teamLeader'
                                        },
                                        {
                                            model: UsersTeam,
                                            as: 'users_team',
                                            include: [{
                                                model: Users,
                                                as: 'user'
                                            }]
                                        }
                                    ]
                                })
                                .then((res) => {
                                    cb({
                                        status: 200,
                                        data: res
                                    })
                                })
                        } catch (err) {
                            cb({
                                status: false,
                                data: res
                            })
                        }
                    }
                    break;
                default:
                    {
                        try {
                            model
                                .findAll({
                                    where: whereObj
                                })
                                .then((res) => {
                                    cb({
                                        status: true,
                                        data: res
                                    })
                                })
                        } catch (err) {
                            cb({
                                status: true,
                                data: err
                            })
                        }
                        break;
                    }
            }
        }
    }
}