const async = require("async");
const sequence = require("sequence").Sequence;
const _ = require("lodash");
const models = require('../modelORM');
const { Users, IpBlock, Teams, UsersTeam, Members, UsersRole, Session } = models;
const func = global.initFunc();


var updateIpBlock = (ipBlockData, ipAddress) => {
    let data = {}
    if (ipBlockData.length > 0) {
        data = ipBlockData[0];
        data.failedTimes = data.failedTimes + 1;
        data.dateFailed = new Date();
        IpBlock
            .update(data.toJSON(), { where: { id: data.id } })
            .then((res) => {
                return
            })
    } else {
        data = {
            ipAddress: ipAddress,
            failedTimes: 1,
            dateFailed: new Date()
        }
        IpBlock
            .create(data)
            .then((res) => {
                return
            })
    }
}

exports.get = {
    index: (req, cb) => {
        const queryString = req.query;

        sequence.create().then((nextThen) => {
            let ipBlockData = [], failedTimes = 0, dateFailed = new Date();
            IpBlock
                .findAll({ where: { ipAddress: queryString.ipAddress } })
                .then((res) => {
                    if (res.length > 0) {
                        ipBlockData = res;
                        failedTimes = ipBlockData[0].failedTimes
                        dateFailed = new Date(res[0].dateFailed)
                    }
                    if (failedTimes < 5) {
                        nextThen(ipBlockData)
                    } else if (failedTimes >= 5 && (dateFailed.getTime() + 300000) < ((new Date()).getTime())) {// blocking of ip by 5 mins
                        nextThen(ipBlockData)
                    } else {
                        cb({ status: false, data: res, message: 'Your login attempts reached. Please try again in a few minutes.' })
                    }
                })
        }).then((nextThen, ipBlockData) => {
            try {
                Users
                    .findOne({
                        where: { username: queryString.username },
                        include: [
                            {
                                model: UsersRole,
                                as: 'user_role'
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
                                as: 'team_as_teamLeader'
                            },
                            {
                                model: UsersTeam,
                                as: 'users_team',
                                include: [{
                                    model: Teams,
                                    as: 'team'
                                }]
                            }
                        ]
                    })
                    .then((res) => {
                        if (res == null) {
                            updateIpBlock(ipBlockData, queryString.ipAddress)
                            cb({ status: false, message: "Incorrect username/password." })
                            return;
                        } else {
                            let responseToReturn = {
                                ...res.dataValues,
                                projectId: res.projectId.map((e) => { return e.linkId }),
                                userRole: res.dataValues.user_role[0].roleId,
                                team: res.dataValues.team_as_teamLeader.concat(res.dataValues.users_team.map((e) => { return e.team }))
                            }
                            nextThen(_.omit(responseToReturn, "team_as_teamLeader", "users_team"), ipBlockData)
                        }
                    })
            } catch (err) {
                if (err) {
                    cb({ status: false, message: 'Something went wrong. Please try again.' })
                } else {
                    updateIpBlock(ipBlockData, queryString.ipAddress)
                    cb({ status: false, message: "Incorrect username/password." })
                }
            }
        }).then((nextThen, user, ipBlockData) => {
            if (!user.salt || typeof user.salt == "undefined") {
                updateIpBlock(ipBlockData, queryString.ipAddress)
                cb({ status: false, message: "Incorrect username/password." })
            }

            if (user.isActive == 0) {
                cb({ status: false, message: "Account is inactive. Please contact your administrator." })
            }

            // manage password hash here
            var inputPassword = func.generatePassword(queryString.password, user.salt);
            if (user.password == inputPassword) {
                if (typeof req.cookies['app.sid'] === 'undefined') {
                    // manage token if app.sid is not yet set by the server/mobile access directly to socket during login
                    const TokenGenerator = require('uuid-token-generator');
                    req.cookies['app.sid'] = new TokenGenerator(256).generate();
                }

                Session
                    .findAll({ where: { usersId: user.id } })
                    .then((res) => {
                        if (ipBlockData.length > 0) {
                            IpBlock
                                .destroy({ where: { id: ipBlockData[0].id } })
                                .then((destroyRes) => {
                                })
                        }
                        if (res.length == 0) {
                            delete user.password;
                            delete user.salt;
                            Session
                                .create({ usersId: user.id, session: req.cookies["app.sid"], data: JSON.stringify(user), dateAdded: new Date() })
                                .then((createRes) => {
                                    nextThen(user)
                                })
                        } else {
                            delete user.password;
                            delete user.salt;
                            Session
                                .update({ session: req.cookies["app.sid"], data: JSON.stringify(user), dateAdded: new Date() },
                                    {
                                        where: { usersId: user.id }
                                    })
                                .then((updateRes) => {
                                    nextThen(user)
                                })
                        }
                    })

            } else {
                updateIpBlock(ipBlockData, queryString.ipAddress)
                cb({ status: false, message: "Incorrect username/password." })
            }
        }).then((nextThen, userDetails) => {
            if (userDetails.userType == "External") {
                try {
                    Members
                        .findAll({ where: { userTypeLinkId: userDetails.id, linkType: "project" } })
                        .then((res) => {
                            cb({ status: true, data: res, type: userDetails.userType, message: "Successfully Login" })

                        })
                } catch (err) {
                    cb({ status: false, error: err });
                }
            } else {
                cb({ status: true, message: "Successfully Login", type: userDetails.userType });
            }
        })
    }
}

exports.post = {
    index: (req, cb) => {
        console.log(`here`)
    }

}

exports.delete = {
    index: (req, cb) => {
        try {
            Session
                .destroy({ where: { session: req.cookies['app.sid'] } })
                .then((res) => {
                    cb({ status: true })
                })
        } catch (err) {
            cb({ status: false, error: err })
        }
    }
}

