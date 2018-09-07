var func = global.initFunc(),
    sequence = require("sequence").Sequence,
    async = require("async");

var init = exports.init = (socket) => {

    socket.on("GET_TEAM_LIST", (d) => {
        let team = global.initModel("team");
        let usersTeam = global.initModel("users_team");
        let filter = (typeof d.filter != "undefined") ? d.filter : {};

        team.getData("team", filter, {}, (c) => {
            if (c.status) {
                async.map(c.data, (team, mapCallback) => {
                    usersTeam.getData("users_team", { teamId: team.id }, {}, (c) => {
                        mapCallback(null, team)
                    });
                }, function (err, teamResults) {
                    socket.emit("FRONT_TEAM_LIST",teamResults)
                });

            } else {
                if (c.error) { socket.emit("RETURN_ERROR_MESSAGE", { message: c.error.sqlMessage }) }
            }
        })
    })

    socket.on("GET_TEAM_DETAIL", (d) => {
        let team = global.initModel("team")
        team.getData("team", { id: d.id }, {}, (c) => {
            if (c.data.length > 0) {
                let usersTeam = global.initModel("users_team")
                usersTeam.getData("users_team", { teamId: c.data[0].id }, {}, (e) => {
                    c.data[0].users = JSON.stringify(e.data.map((e, i) => { return { value: e.usersId }; }));
                    socket.emit("FRONT_TEAM_SELECTED", c.data[0])
                })
            }
        })
    })

    socket.on("SAVE_OR_UPDATE_TEAM", (d) => {
        let team = global.initModel("team")
        sequence.create().then(function (nextThen) {
            if (typeof d.data.id != "undefined" && d.data.id != "") {
                let id = d.data.id
                delete d.data.id
                team.putData("team", d.data, { id: id }, (c) => {
                    if (c.status) {
                        team.getData("team", { id: id }, {}, (e) => {
                            if (e.data.length > 0) {
                                nextThen({ id: id, type: "edit", data: e.data[0], message: "Successfully updated." })
                            } else {
                                socket.emit("RETURN_ERROR_MESSAGE", { message: "Updating failed. Please Try again later." })
                            }
                        })
                    } else {
                        socket.emit("RETURN_ERROR_MESSAGE", { message: "Updating failed. Please Try again later." })
                    }
                })
            } else {
                team.postData("team", d.data, (c) => {
                    if (typeof c.id != "undefined" && c.id > 0) {
                        team.getData("team", { id: c.id }, {}, (e) => {
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
                socket.emit("FRONT_TEAM_EDIT", retData.data)
            } else {
                socket.emit("FRONT_TEAM_ADD", retData.data)
            }
            socket.emit("RETURN_SUCCESS_MESSAGE", { message: retData.message })
            if (typeof d.data.users != "undefined") {
                let model = global.initModel("users_team");

                model.deleteData("users_team", { teamId: retData.id }, (a) => {
                    let users = JSON.parse(d.data.users);
                    users.map((e, i) => {
                        model.postData("users_team", { teamId: retData.id, usersId: e.value }, () => { })
                    })
                })
            }
        })
    })

    socket.on("DELETE_TEAM", (d) => {
        let team = global.initModel("team")

        team.getData("team", {}, {}, (b) => {
            team.deleteData("team", { id: d.id }, (c) => {
                if (c.status) {
                    socket.emit("FRONT_TEAM_DELETED", { id: d.id })
                } else {
                    socket.emit("RETURN_ERROR_MESSAGE", "Delete failed. Please try again later.")
                }
            })
        })
    })
}