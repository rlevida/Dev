var func = global.initFunc(),
    sequence = require("sequence").Sequence,
    async = require("async");

var init = exports.init = (socket) => {

    socket.on("GET_MEMBERS_LIST", (d) => {
        let members = global.initModel("members")
        let filter = (typeof d.filter != "undefined") ? d.filter : {};
        members.getData("members", filter, {}, (c) => {
            if (c.status) {
                socket.emit("FRONT_MEMBERS_LIST", c.data)
            } else {
                if (c.error) { socket.emit("RETURN_ERROR_MESSAGE", { message: c.error.sqlMessage }) }
            }
        })
    })

    socket.on("GET_MEMBERS_DETAIL", (d) => {
        let members = global.initModel("members")
        members.getData("members", { id: d.id }, {}, (c) => {
            if (c.data.length > 0) {
                socket.emit("FRONT_MEMBERS_SELECTED", c.data[0])
            }
        })
    })

    socket.on("SAVE_OR_UPDATE_MEMBERS", (d) => {
        let members = global.initModel("members")
        if (typeof d.data.id != "undefined" && d.data.id != "") {
            let id = d.data.id
            delete d.data.id
            members.putData("members", d.data, { id: id }, (c) => {
                if (c.status) {
                    members.getData("members", { id: id }, {}, (e) => {
                        if (e.data.length > 0) {
                            socket.emit("FRONT_MEMBERS_EDIT", { data: e.data[0], type: d.type })
                            socket.emit("RETURN_SUCCESS_MESSAGE", { message: "Successfully updated" })
                        } else {
                            socket.emit("RETURN_ERROR_MESSAGE", { message: "Updating failed. Please Try again later." })
                        }
                    })
                } else {
                    socket.emit("RETURN_ERROR_MESSAGE", { message: "Updating failed. Please Try again later." })
                }
            })
        } else {
            const insertMember = () => {
                members.postData("members", d.data, (c) => {
                    if (typeof c.id != "undefined" && c.id > 0) {
                        members.getData("members", { id: c.id }, {}, (e) => {
                            if (e.data.length > 0) {
                                socket.emit("FRONT_MEMBERS_ADD", { data: e.data, type: d.type })
                                socket.emit("RETURN_SUCCESS_MESSAGE", { message: "Successfully updated" })
                            } else {
                                socket.emit("RETURN_ERROR_MESSAGE", { message: "Saving failed. Please Try again later." })
                            }
                        })
                    } else {
                        socket.emit("RETURN_ERROR_MESSAGE", { message: "Saving failed. Please Try again later." })
                    }
                })
            };

            if (d.data.usersType == "team") {
                let usersTeam = global.initModel("users_team");

                usersTeam.getData("users_team", { teamId: d.data.userTypeLinkId }, {}, (e) => {
                    if ((e.data).length > 0) {
                        async.each(e.data, function (mem, callback) {
                            members.deleteData("members", { usersType: "users", userTypeLinkId: mem.usersId, linkType: d.data.linkType, linkId: d.data.linkId }, (c) => {
                                callback(null)
                            });
                        }, function (err) {
                            members.getData("members", { linkType: d.data.linkType, linkId: d.data.linkId }, {}, (c) => {
                                if (c.status) {
                                    socket.emit("FRONT_MEMBERS_LIST", c.data);
                                    insertMember();
                                } else {
                                    if (c.error) { socket.emit("RETURN_ERROR_MESSAGE", { message: c.error.sqlMessage }) }
                                }
                            })
                        });
                    } else {
                        insertMember();
                    }
                });
            } else {
                insertMember();
            }
        }
    })

    socket.on("DELETE_MEMBERS", (d) => {
        let members = global.initModel("members")
        let filter = (typeof d.filter != "undefined") ? d.filter : {};
        members.getData("members", filter, {}, (b) => {
            members.deleteData("members", filter, (c) => {
                if (c.status) {
                    socket.emit("FRONT_MEMBERS_DELETED", { id: d.type != "workstream" ? filter.userTypeLinkId : "", type: d.usersType })
                } else {
                    socket.emit("RETURN_ERROR_MESSAGE", "Delete failed. Please try again later.")
                }
            })
        })
    })
}