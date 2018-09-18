var func = global.initFunc(),
    sequence = require("sequence").Sequence,
    async = require("async");

var init = exports.init = (socket) => {

    socket.on("GET_CHECK_LIST", (d) => {
        let taskCheckList = global.initModel("task_checklist")
        let filter = (typeof d.filter != "undefined") ? d.filter : {};

        taskCheckList.getData("task_checklist", filter, {}, (c) => {
            if (c.status) {
                socket.emit("FRONT_CHECK_LIST", c.data)
            } else {
                if (c.error) { socket.emit("RETURN_ERROR_MESSAGE", { message: c.error.sqlMessage }) }
            }
        })
    })

    socket.on("SAVE_OR_UPDATE_CHECKLIST", (d) => {
        let taskCheckList = global.initModel("task_checklist");

        if (typeof d.data.id != "undefined" && d.data.id != "") {
            taskCheckList.putData("task_checklist", d.data, { id: d.data.id }, (c) => {
                socket.emit("FRONT_UPDATE_CHECK_LIST", d.data)
            });
        } else {
            taskCheckList.postData("task_checklist", d.data, (o) => {
                socket.emit("FRONT_SAVE_CHECK_LIST", { ...d.data, id: o.id, completed: 0 })
            });
        }
    });

    socket.on("DELETE_CHECKLIST", (d) => {
        let taskCheckList = global.initModel("task_checklist");

        taskCheckList.deleteData("task_checklist", { id: d.data }, (c) => {
            socket.emit("FRONT_CHECKLIST_DELETED", { id: d.data })
        });
    });
}