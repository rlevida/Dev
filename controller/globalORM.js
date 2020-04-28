const async = require("async");
const _ = require("lodash")
const models = require('../modelORM');

const {
    Members,
    Teams,
    Users,
    UsersTeam,
    UsersRole,
    Roles,
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
            ...(typeof queryString.isActive != "undefined" && queryString.isActive != "") ? {
                isActive: queryString.isActive
            } : {},
            isDeleted: 0
        }

        const modelList = {
            teamList: "Teams",
            roleList: "Roles",
            projectMemberList: "Project",
            shareList: "Share",
            workstreamList: "Workstream",
            taskList: "Tasks",
            type: "Type",
            usersList: "Users",
            projectList: "Projects"
        }

        modelName = modelList[queryString.selectName];
        if (modelName != "") {
            const model = models[modelName];
            switch (queryString.selectName) {
                case "projectMemberList":
                    {
                        async.parallel({
                            members: (parallelCallback) => {
                                try {
                                    Members
                                        .findAll({
                                            where: {
                                                ...whereObj,
                                                usersType: 'users'
                                            },
                                            include: [{
                                                model: Users,
                                                as: 'user',
                                                include: [{
                                                    model: UsersRole,
                                                    as: 'user_role',
                                                }]
                                            }]
                                        })
                                        .map((res) => {
                                            let resToReturn = {
                                                ...res.user.toJSON(),
                                                receiveNotification: res.dataValues.receiveNotification
                                            }
                                            return resToReturn

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
                                            where: {
                                                ...whereObj,
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
                                                        as: 'user',
                                                        include: [{
                                                            model: UsersRole,
                                                            as: 'user_role',
                                                        }]
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
                            let memberList = [...result.members, ...result.teamMembers];
                            cb({
                                status: true,
                                data: memberList
                            })
                        })
                    }
                    break;
                case "usersList":
                    {
                        Users
                            .findAll({
                                include: [
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
                                            as: 'team',
                                            where: { isDeleted: 0 },
                                            required: false
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
                                ],
                                attributes: ['id', 'username', 'firstName', 'lastName', 'emailAddress', 'phoneNumber', 'avatar', 'isActive', 'userType', 'company'],
                                distinct: true,
                                where: whereObj
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
                    }
                    break;
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
    },
    settings: (req, cb) => {
        cb({
            status: true,
            data: { value: { imageUrl: `${global.AWSLink}${global.environment || "development"}`, token: req.cookies['app.sid'], site_url: global.site_url } }
        })
    }
}