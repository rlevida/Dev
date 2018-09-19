var func = global.initFunc(),
    sequence = require("sequence").Sequence,
    async = require("async");

var init = exports.init = (socket) => {

    socket.on("GET_CHECK_LIST", (d) => {
        let taskCheckList = global.initModel("task_checklist")
        let filter = (typeof d.filter != "undefined") ? d.filter : {};
        let taskCheckListType = global.initModel("checklist_type");

        taskCheckList.getData("task_checklist", filter, {}, (c) => {
            if (c.status) {
                async.map(c.data, (o, mapCallback) => {
                    taskCheckListType.getData("checklist_type", { checklistId: o.id }, {}, (res) => {
                        mapCallback(null, { ...o, types: (res.data).map((o) => { return { value: o.type, name: o.type } }) });
                    })
                }, (err, o) => {
                    socket.emit("FRONT_CHECK_LIST", o)
                })
            } else {
                if (c.error) { socket.emit("RETURN_ERROR_MESSAGE", { message: c.error.sqlMessage }) }
            }
        })
    })

    socket.on("SAVE_OR_UPDATE_CHECKLIST", (d) => {
        let taskCheckList = global.initModel("task_checklist");
        let taskCheckListType = global.initModel("checklist_type");

        if (typeof d.data.id != "undefined" && d.data.id != "") {
            taskCheckList.putData("task_checklist", d.data, { id: d.data.id }, (c) => {
                socket.emit("FRONT_UPDATE_CHECK_LIST", d.data)
            });
        } else {
            taskCheckList.postData("task_checklist", { description: d.data.description, taskId: d.data.taskId }, (data) => {
                async.map(d.data.types, (o, mapCallback) => {
                    taskCheckListType.postData("checklist_type", { type: o.value, checklistId: data.id }, (res) => {
                        mapCallback(null);
                    });
                }, (err, res) => {
                    socket.emit("FRONT_SAVE_CHECK_LIST", { ...d.data, id: data.id, completed: 0 })
                });
            });
        }
    });

    socket.on("DELETE_CHECKLIST", (d) => {
        let taskCheckList = global.initModel("task_checklist");
        let taskCheckListType = global.initModel("checklist_type");

        taskCheckList.deleteData("task_checklist", { id: d.data }, (c) => {
            taskCheckListType.deleteData("checklist_type", { checklistId: d.data }, (res) => {
                socket.emit("FRONT_CHECKLIST_DELETED", { id: d.data })
            });
        });
    });
}