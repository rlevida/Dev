var func = global.initFunc(),
    sequence = require("sequence").Sequence,
    async = require("async"),
    _ = require("lodash");

var init = exports.init = (socket) => {

    function isUserExist(id, username, email, cb) {
        let users = global.initModel("users");

        let filter = {
            "|||or|||": [{ name: "username", value: username, condition: "=" },
            { name: "email", value: email, condition: "=" }
            ]
        }
        if (id != "") {
            filter = {
                "|||or|||": [{ name: "username", value: username, condition: "=" },
                { name: "email", value: email, condition: "=" }
                ], id: { value: id, condition: " != " }
            }
        }

        users.getData("users", filter, {}, (c) => {
            if (c.data.length > 0) {
                cb(true)
            } else {
                cb(false)
            }
        })
    }

    socket.on("GET_USER_LIST", (d) => {
        let users = global.initModel("users")
        let filter = (typeof d.filter != "undefined") ? d.filter : {};
        let usersRole = global.initModel("users_role");
        let usersTeam = global.initModel("users_team")
        let members = global.initModel("members")

        users.getData("users", filter, {}, (c) => {
            if (c.status) {
                async.map(c.data, (user, mapCallback) => {
                    async.parallel({
                        role: function (parallelCallback) {
                            usersRole.getData("users_role", { usersId: user.id }, {}, (role) => {
                                parallelCallback(null, role.data)
                            });
                        },
                        team: function (parallelCallback) {
                            usersTeam.getData("users_team", { usersId: user.id }, {}, (team) => {
                                parallelCallback(null, team.data)
                            });
                        }
                    }, function (err, { role, team }) {
                        let memberList = [user.id];
                        let getMember = _.map(team, (o) => { return o.teamId });
                        let allMember = memberList.concat(getMember);
                        members.getProjectMember({ ids: allMember }, (result) => {
                            mapCallback(null, { ...user, role, team, projects: result.data })

                        })
                    });
                }, function (err, usersResult) {
                    socket.emit("FRONT_USER_LIST", usersResult)
                })
            } else {
                if (c.error) { socket.emit("RETURN_ERROR_MESSAGE", { message: c.error.sqlMessage }) }
            }
        })
    })

    socket.on("GET_USER_DETAIL", (d) => {
        let users = global.initModel("users")
        users.getData("users", { id: d.id }, {}, (c) => {
            if (c.status && c.data.length > 0) {

                let usersRole = global.initModel("users_role")

                usersRole.getData("users_role", { usersId: c.data[0].id }, {}, (e) => {
                    let usersTeam = global.initModel("users_team");
                    let members = global.initModel("members");
                    c.data[0].userRole = (e.data.length > 0) ? e.data[0].roleId : 0;

                    async.parallel({
                        usersTeam: (parallelCallback) => {
                            usersTeam.getData("users_team", { usersId: c.data[0].id }, {}, (e) => {
                                parallelCallback(null, e.data)
                            });
                        },
                        members: (parallelCallback) => {
                            members.getData("members", { userTypeLinkId: c.data[0].id, usersType: "users", linkType: "project", memberType: "assignedTo" }, {}, (e) => {
                                parallelCallback(null, e.data)
                            });
                        }
                    }, (err, result) => {
                        c.data[0].team = (result.usersTeam).map((e, i) => { return { value: e.teamId, label: e.team_team }; });
                        c.data[0].project = (result.members).map((e, i) => { return { value: e.linkId }; });
                        socket.emit("FRONT_USER_SELECTED", c.data[0]);

                    })



                })
            } else {
                if (c.error) { socket.emit("RETURN_ERROR_MESSAGE", { message: c.error.sqlMessage }) }
            }
        })
    })

    socket.on("SAVE_OR_UPDATE_USER", (d) => {
        let users = global.initModel("users")
        let usersRole = global.initModel("users_role")
        sequence.create().then(function (nextThen) {
            usersRole.getData("users_role", { roleId: 1 }, {}, (b) => {
                if (b.data.length == 1 && b.data[0].usersId == d.data.id && (typeof d.data.isActive != "undefined" && d.data.isActive == "0")) {
                    socket.emit("RETURN_ERROR_MESSAGE", { message: "Cant set to inactive, Last Master admin user." })
                    socket.emit("FRONT_USER_ACTIVE", { id: d.data.id, status: 1 })
                } else {
                    nextThen()
                }
            })
        }).then(function (nextThen) {
            if (typeof d.data.username != "undefined" || typeof d.data.email != "undefined") {
                isUserExist(d.data.id, d.data.username, d.data.email, (e) => {
                    if (e) {
                        socket.emit("RETURN_ERROR_MESSAGE", { message: "Username/Email address already exist" })
                    } else {
                        nextThen()
                    }
                })
            } else {
                nextThen()
            }
        }).then(function (nextThen) {
            if (typeof d.data.id != "undefined" && d.data.id != "") {
                let id = d.data.id
                delete d.data.id
                users.putData("users", d.data, { id: id }, (c) => {
                    if (c.status) {
                        users.getData("users", { id: id }, {}, (e) => {
                            if (e.data.length > 0) {
                                nextThen({ id: id, type: "edit", data: e.data[0], message: "Successfully updated." })
                            } else {
                                socket.emit("RETURN_ERROR_MESSAGE", { message: "Updating failed. Please Try again later." })
                            }
                        })
                    } else {
                        if (c.error) { socket.emit("RETURN_ERROR_MESSAGE", { message: c.error.sqlMessage }); return; }

                        socket.emit("RETURN_ERROR_MESSAGE", { message: "Updating failed. Please Try again later." })
                    }
                })
            } else {
                users.postData("users", d.data, (c) => {
                    if (typeof c.id != "undefined" && c.id > 0) {
                        users.getData("users", { id: c.id }, {}, (e) => {
                            if (e.data.length > 0) {
                                nextThen({ id: c.id, type: "add", data: e.data, message: "Successfully added." })
                            } else {
                                socket.emit("RETURN_ERROR_MESSAGE", { message: "Saving failed. Please Try again later." })
                            }
                        })
                    } else {
                        socket.emit("RETURN_ERROR_MESSAGE", { message: "Saving failed. Please Try again later." })
                    }
                })
            }
        }).then(function (nextThen, retData) {
            if (retData.type == "edit") {
                socket.emit("FRONT_USER_EDIT", retData.data)
            } else {
                socket.emit("FRONT_USER_ADD", retData.data)
            }
            socket.emit("RETURN_SUCCESS_MESSAGE", { message: retData.message })
            if (typeof d.data.userRole != "undefined") {
                let model = global.initModel("users_role");
                model.deleteData("users_role", { usersId: retData.id }, (a) => {
                    model.postData("users_role", { usersId: retData.id, roleId: d.data.userRole }, () => { })
                })
            }
            if (typeof d.data.team != "undefined") {
                let model = global.initModel("users_team");
                model.deleteData("users_team", { usersId: retData.id }, (a) => {
                    let teams = d.data.team;
                    teams.map((e, i) => {
                        model.postData("users_team", { usersId: retData.id, teamId: e.value }, () => { })
                    })
                })
            }

            if (typeof d.data.project != "undefined") {
                let model = global.initModel("members");
                model.deleteData("members", { usersType: "users", userTypeLinkId: retData.id, linkType: "project", memberType: "assignedTo" }, (a) => {
                    let projects = d.data.project;
                    projects.map((e, i) => {
                        model.postData("members", { usersType: "users", userTypeLinkId: retData.id, linkType: "project", linkId: e.value, memberType: "assignedTo" }, () => { })
                    })
                })
            }

        })
    })

    socket.on("DELETE_USER", (d) => {
        let usersRole = global.initModel("users_role")
        let users = global.initModel("users")

        usersRole.getData("users_role", { roleId: 1 }, {}, (b) => {
            if (b.data.length <= 1 && b.data[0].usersId == d.id) {
                socket.emit("RETURN_ERROR_MESSAGE", { message: "Cant Delete, Last Master Admin user." })
            } else {
                users.deleteData("users", { id: d.id }, (c) => {
                    if (c.status) {
                        usersRole.deleteData("users_role", { usersId: d.id }, () => { })
                        socket.emit("FRONT_USER_DELETED", { id: d.id })
                    } else {
                        socket.emit("RETURN_ERROR_MESSAGE", "Delete failed. Please try again later.")
                    }
                })
            }
        })
    })

    socket.on("CHANGE_USER_PASSWORD", function (d) {
        let users = global.initModel("users");
        let id = d.Id;
        let data = {}
        data.salt = func.randomString(32);
        data.password = func.generatePassword(d.password, data.salt);
        users.putData("users", data, { id: id }, (c) => {
            if (c.status) {
                socket.emit("RETURN_SUCCESS_MESSAGE", { message: "Password successfully changed." })
            } else {
                socket.emit("RETURN_ERROR_MESSAGE", { message: "Password change failed. Please Try again later." })
            }
        })
    })

    socket.on("UPLOAD_AVATAR", (image, cb) => {
        let users = global.initModel("users");
        let AWS = global.initAWS();
        let s3 = new AWS.S3();
        const base64Data = new Buffer((image.source.uri).replace(/^data:image\/\w+;base64,/, ""), 'base64');
        const type = (image.source.uri).split(';')[0].split('/')[1]

        s3.putObject({
            Bucket: global.AWSBucket,
            Key: 'avatars/' + image.source.file_name,
            Body: base64Data,
            ContentType: 'image/' + type,
            ACL: 'public-read-write',
        }, (response) => {
            users.putData("users", { avatar: 'https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/' + image.source.file_name }, { id: image.Id }, (c) => {
                cb({ avatar: 'https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/' + image.source.file_name })
            })
        });
    })

    socket.on("UPDATE_ONE_SIGNAL_ID", function (d) {
        let users = global.initModel("users");
        let id = d.id;
        let data = { oneSignalId: d.oneSignalId }
        users.putData("users", data, { id: id }, (c) => {
            //console.log(c); 
        })
    })
}