var func = global.initFunc(),
    sequence = require("sequence").Sequence;

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
                            socket.emit("FRONT_MEMBERS_EDIT", e.data[0])
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
            members.postData("members", d.data, (c) => {
                if (typeof c.id != "undefined" && c.id > 0) {
                    members.getData("members", { id: c.id }, {}, (e) => {
                        if (e.data.length > 0) {
                            socket.emit("FRONT_MEMBERS_ADD", e.data)
                            socket.emit("RETURN_SUCCESS_MESSAGE", { message: "Successfully updated" })
                        } else {
                            socket.emit("RETURN_ERROR_MESSAGE", { message: "Saving failed. Please Try again later." })
                        }
                    })
                } else {
                    socket.emit("RETURN_ERROR_MESSAGE", { message: "Saving failed. Please Try again later." })
                }
            })
        }
    })

    socket.on("DELETE_MEMBERS", (d) => {
        let members = global.initModel("members")

        members.getData("members", {}, {}, (b) => {
            members.deleteData("members", { id: d.id }, (c) => {
                if (c.status) {
                    socket.emit("FRONT_MEMBERS_DELETED", { id: d.id })
                } else {
                    socket.emit("RETURN_ERROR_MESSAGE", "Delete failed. Please try again later.")
                }
            })
        })
    })
}