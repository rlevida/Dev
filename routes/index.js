const express = require('express');
const sess = require('express-session');
const jwt = require('jsonwebtoken');
const router = express();
const models = require('../modelORM');
const {
    Roles,
    Session,
    Members,
    Users,
    UsersRole,
    Teams,
    UsersTeam
} = models;

router.use(function (req, res, next) {
    try {
        Session
            .findOne({ where: { session: req.cookies["app.sid"] } })
            .then((ret) => {
                if (ret) {
                    Session
                        .update({ dateUpdated: new Date() }, { where: { id: ret.toJSON().id } })
                        .then((updateRes) => {
                            req.userDetails = ret.toJSON();
                            req.userDetails.userType = JSON.parse(ret.toJSON().data).userType;
                            Users
                                .findOne({
                                    where: { id: ret.toJSON().usersId },
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
                                            model: Members,
                                            as: 'projectId',
                                            where: { usersType: 'users', linkType: 'project' },
                                            required: false,
                                            attributes: ['linkId']
                                        },
                                        {
                                            model: Members,
                                            as: 'user_projects',
                                            where: { usersType: 'users', linkType: 'project' },
                                            required: false,
                                        },
                                        {
                                            model: Teams,
                                            as: 'team_as_teamLeader',
                                            where: { isDeleted: 0 },
                                            required: false,
                                        },
                                        {
                                            model: UsersTeam,
                                            as: 'users_team',
                                            where: { isDeleted: 0 },
                                            required: false,
                                            include: [{
                                                model: Teams,
                                                as: 'team',
                                                where: { isDeleted: 0 }
                                            }]
                                        }
                                    ]
                                })
                                .then((res) => {
                                    let responseToReturn = {
                                        ...res.dataValues,
                                        projectId: res.projectId.map((e) => { return e.linkId }),
                                        userRole: res.dataValues.user_role[0].roleId,
                                        team: res.dataValues.team_as_teamLeader.concat(res.dataValues.users_team.map((e) => { return e.team }))
                                    }
                                    req.loggedData = _.omit(responseToReturn, "team_as_teamLeader", "users_team")
                                    next();
                                });
                        })
                } else {
                    res.redirect('/auth');
                }
            })
    } catch (err) {
        console.error(err)
    }
});

router.use(function (req, res, next) {
    if (req.loggedData.projectId.length === 0 && req.loggedData.userRole >= 4) {
        try {
            Members
                .findAll({ where: { userTypeLinkId: req.userDetails.usersId, linkType: "project" } })
                .then((ret) => {
                    if (ret.length > 0) {
                        req.memberDetails = ret
                        next()
                    } else {
                        res.render('index', {
                            title: global.site_name,
                            page: 'projectNotAvailable',
                            body: "./template/index",
                            user: JSON.stringify(req.loggedData)
                        });
                    }
                })
        } catch (err) {
            console.error(err)
        }
    } else {
        next()
    }
})

router.get('/', function (req, res, next) {
    res.redirect('/account');
});

router.get('/account', function (req, res, next) {
    res.render('index', {
        title: global.site_name,
        page: 'account',
        body: "./template/index",
        user: JSON.stringify(req.loggedData)
    });
});

module.exports = router;
