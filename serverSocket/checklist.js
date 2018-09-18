var func = global.initFunc(),
    sequence = require("sequence").Sequence,
    async = require("async");

var init = exports.init = (socket) => {

    socket.on("GET_CHECK_LIST", (d) => {
        let taskCheckList = global.initModel("task_checklist")
        let filter = (typeof d.filter != "undefined") ? d.filter : {};
        members.getData("members", filter, {}, (c) => {
            if (c.status) {
                socket.emit("FRONT_CHECK_LIST", c.data)
            } else {
                if (c.error) { socket.emit("RETURN_ERROR_MESSAGE", { message: c.error.sqlMessage }) }
            }
        })
    })

    // socket.on("GET_MEMBERS_DETAIL", (d) => {
    //     let members = global.initModel("members")
    //     members.getData("members", { id: d.id }, {}, (c) => {
    //         if (c.data.length > 0) {
    //             socket.emit("FRONT_MEMBERS_SELECTED", c.data[0])
    //         }
    //     })
    // })

    socket.on("SAVE_OR_UPDATE_CHECKLIST", (d) => {
        let taskCheckList = global.initModel("task_checklist");

        if (typeof d.data.id != "undefined" && d.data.id != "") {

        } else {
            taskCheckList.postData("task_checklist", d.data, (o) => {
                socket.emit("FRONT_SAVE_OR_UPDATE_CHECK_LIST", { ...d.data, id: o.id, completed: 0 })
            });
        }
    })

    // socket.on("DELETE_MEMBERS", (d) => {
    //     let members = global.initModel("members")
    //     let filter = (typeof d.filter != "undefined") ? d.filter : {};
    //     members.getData("members", filter, {}, (b) => {
    //         members.deleteData("members", filter, (c) => {
    //             if (c.status) {
    //                 socket.emit("FRONT_MEMBERS_DELETED", { id: d.type != "workstream" ? filter.userTypeLinkId : "", type: d.usersType })
    //             } else {
    //                 socket.emit("RETURN_ERROR_MESSAGE", "Delete failed. Please try again later.")
    //             }
    //         })
    //     })
    // })
}