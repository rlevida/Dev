var func = global.initFunc(),
    sequence = require("sequence").Sequence,
    async = require("async");

const models = require('../modelORM');
const {
    Users,
    UsersRole,
    UsersTeam,
    Members,
    Teams
} = models;

var init = exports.init = (socket) => {

    var updateIpBlock = (ipBlockData, ipAddress) => {
        let ipBlock = global.initModel("ip_block");
        let data = {}
        if (ipBlockData.length > 0) {
            data = ipBlockData[0];
            data.failedTimes = data.failedTimes + 1;
            data.dateFailed = new Date();
            ipBlock.putData("ip_block", data, { id: data.id }, () => { })
        } else {
            data = {
                ipAddress: ipAddress,
                failedTimes: 1,
                dateFailed: new Date()
            }
            ipBlock.postData("ip_block", data, () => { })
        }
    }

    socket.on('USER_LOGGED_IN', function (data) {
        let users = global.initModel("users");
        let ipBlock = global.initModel("ip_block");
        sequence.create().then((nextThen) => {
            let ipBlockData = [], failedTimes = 0, dateFailed = new Date();
            ipBlock.getData("ip_block", { ipAddress: data.ipAddress }, {}, (retIpBlock) => {
                if (retIpBlock.data.length > 0) {
                    ipBlockData = retIpBlock.data;
                    failedTimes = ipBlockData[0].failedTimes
                    dateFailed = new Date(ipBlockData[0].dateFailed)
                }
                if (failedTimes < 5) {
                    nextThen(ipBlockData)
                } else if (failedTimes >= 5 && (dateFailed.getTime() + 300000) < ((new Date()).getTime())) {// blocking of ip by 5 mins
                    nextThen(ipBlockData)
                } else {
                    socket.emit("RETURN_ERROR_MESSAGE", { message: "Your login attempts reached. Please try again in a few minutes." })
                    return;
                }
            })
        }).then((nextThen, ipBlockData) => {
            try {
                Users
                    .findOne({
                        where: { username: data.username },
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
                        if(res == null){
                            updateIpBlock(ipBlockData, data.ipAddress)
                            socket.emit("RETURN_ERROR_MESSAGE", { message: "Incorrect username/password." })
                            return;
                        }else{
                            let responseToReturn = {
                                ...res.dataValues,
                                projectId: res.projectId.map((e) => { return e.linkId }),
                                userRole: res.dataValues.user_role[0].roleId,
                                team: res.dataValues.team_as_teamLeader.concat(res.dataValues.users_team.map((e) => { return e.team }))
                            }
                            nextThen(_.omit(responseToReturn, "team_as_teamLeader","users_team"), ipBlockData)
                        }
                    })
            } catch (err) {
                if (err) { socket.emit("RETURN_ERROR_MESSAGE", { message: (err.error.sqlMessage) ? err.error.sqlMessage : err.error.code }); return }
                updateIpBlock(ipBlockData, data.ipAddress)
                socket.emit("RETURN_ERROR_MESSAGE", { message: "Incorrect username/password." })
                return;
            }

        }).then((nextThen, user, ipBlockData) => {
            if (!user.salt || typeof user.salt == "undefined") {
                updateIpBlock(ipBlockData, data.ipAddress)
                socket.emit("RETURN_ERROR_MESSAGE", { message: "Incorrect username/password." })
                return;
            }
            // check if user is Active
            if (user.isActive == 0) {
                socket.emit("RETURN_ERROR_MESSAGE", { message: "Account is inactive. Please contact your administrator." })
                return;
            }

            // manage password hash here
            var inputPassword = func.generatePassword(data.password, user.salt);
            if (user.password == inputPassword) {
                if (typeof socket.request.cookies["app.sid"] == "undefined") {
                    // manage token if app.sid is not yet set by the server/mobile access directly to socket during login
                    const TokenGenerator = require('uuid-token-generator');
                    socket.request.cookies["app.sid"] = new TokenGenerator(256).generate();
                }

                let session = global.initModel("session");
                session.getData("session", { usersId: user.id }, {}, (sess) => {
                    if (ipBlockData.length > 0) {
                        ipBlock.deleteData("ip_block", { id: ipBlockData[0].id }, () => { })
                    }
                    if (sess.data.length == 0) {
                        delete user.password;
                        delete user.salt;
                        session.postData("session", { usersId: user.id, session: socket.request.cookies["app.sid"], data: JSON.stringify(user), dateAdded: new Date() }, () => {
                            nextThen(user)
                            return;
                        })
                    } else {
                        delete user.password;
                        delete user.salt;
                        session.putData(
                            "session",
                            { session: socket.request.cookies["app.sid"], data: JSON.stringify(user), dateAdded: new Date() },
                            { id: sess.data[0].id },
                            () => {
                                nextThen(user)
                                return;
                            })
                    }
                })
            } else {
                updateIpBlock(ipBlockData, data.ipAddress)
                socket.emit("RETURN_ERROR_MESSAGE", { message: "Incorrect username/password." })
                return;
            }
        }).then((nextThen, userDetails) => {
            if (userDetails.userType == "External") {
                let members = global.initModel("members")
                members.getData("members", { userTypeLinkId: userDetails.id, linkType: "project" }, {}, (c) => {
                    if (c.status) {
                        if (c.data.length) {

                            socket.emit("AUTHENTICATION_RETURN", { data: c.data, type: userDetails.userType })
                            socket.emit("RETURN_SUCCESS_MESSAGE", { message: "Successfully Login" })

                        } else {
                            socket.emit("AUTHENTICATION_RETURN", { data: c.data, type: userDetails.userType })
                            socket.emit("RETURN_SUCCESS_MESSAGE", { message: "Successfully Login" })
                        }
                    } else {
                        if (c.error) { socket.emit("RETURN_ERROR_MESSAGE", { message: c.error.sqlMessage }) }
                    }
                })
            } else {
                socket.emit("AUTHENTICATION_RETURN", { type: userDetails.userType })
                socket.emit("RETURN_SUCCESS_MESSAGE", { message: "Successfully Login" })
            }
        })

    });

    socket.on('LOGGED_USER', function (data) {
        sequence.create().then((nextThen) => {
            let users = global.initModel("users");
            users.getData("users", { id: socket.handshake.query.UserId }, {}, (user) => {
                if (user.data.length > 0 && user.status) {
                    let retData = Object.assign({}, user.data[0])
                    delete retData.password
                    delete retData.salt
                    retData.LastLoggedIn = socket.handshake.query.LastLoggedIn
                    nextThen(retData)
                }
            })
        }).then((nextThen, retData) => {
            let usersRole = global.initModel("users_role")
            usersRole.getData("users_role", { usersId: retData.id }, {}, (e) => {
                retData.userRole = (e.data.length > 0) ? e.data[0].roleId : 0;
                nextThen(retData)
            })
        }).then((nextThen, retData) => {
            let usersTeam = global.initModel("users_team")
            usersTeam.getData("users_team", { usersId: retData.id }, {}, (e) => {
                retData.team = JSON.stringify(e.data.map((e, i) => { return { value: e.teamId, label: e.team_team }; }));
                nextThen(retData)
            })
        }).then((nextThen, retData) => {
            let project = global.initModel("project")
            project.getProjectAllowedAccess("project", { usersId: retData.id, userRole: retData.userRole }, {}, (e) => {
                retData.projectIds = e.data.map((f) => { return f.projectId })
                nextThen(retData)
            })
        }).then((nextThen, retData) => {
            let task = global.initModel("task")
            task.getTaskAllowedAccess("task", { usersId: retData.id, userRole: retData.userRole }, {}, (e) => {
                retData.taskIds = e.data.map((f) => { return f.taskId });

                async.map(e.data, (id, mapCallback) => {
                    task.getData("task", { id: id.taskId }, {}, (e) => {
                        mapCallback(null, e.data[0].workstream_id)
                    });
                }, (err, results) => {
                    retData.worksteamIds = results
                    socket.emit("RETURN_LOGGED_USER", { data: retData })
                })

            })
        })
    });

    socket.on('LOGOUT', function (data) {
        let session = global.initModel("session");
        session.deleteData("session", { session: socket.handshake.query.Token }, (sess) => {
            socket.emit("RETURN_LOGOUT", { message: "Successfully logout." })
        })
    });

    socket.on('IS_USER_LOGGED_IN', function (data) {
        let session = global.initModel("session");
        session.getData("session", { session: data.Token }, {}, (ret) => {
            if (ret.status && ret.data.length > 0) {
                socket.emit("FRONT_IS_USER_LOGGED_IN", { status: true });
            } else {
                socket.emit("FRONT_IS_USER_LOGGED_IN", { status: false });
            }
        })
    });

}