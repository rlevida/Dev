var func = global.initFunc(),
    sequence = require("sequence").Sequence,
    async = require("async"),
    moment = require("moment");

var init = exports.init = (socket) => {

    socket.on("GET_TASK_LIST", (d) => {
        let task = global.initModel("task")
        let filter = (typeof d.filter != "undefined") ? d.filter : {};
        task.getTaskList("task", filter, {}, (c) => {
            if (c.status) {
                socket.emit("FRONT_TASK_LIST", { data: c.data, type: d.type })
            } else {
                if (c.error) { socket.emit("RETURN_ERROR_MESSAGE", { message: c.error.sqlMessage }) }
            }
        })
    })

    socket.on("GET_TASK_COUNT_LIST", (d) => {
        let task = global.initModel("task")
        let filter = (typeof d.filter != "undefined") ? d.filter : {};
        task.getDataCount("task", filter, {}, (c) => {
            if (c.status) {
                socket.emit("FRONT_TASK_COUNT_LIST", c.data)
            } else {
                if (c.error) { socket.emit("RETURN_ERROR_MESSAGE", { message: c.error.sqlMessage }) }
            }
        })
    })

    socket.on("GET_ALL_TASK_COUNT_LIST", (d) => {
        let task = global.initModel("task")
        let filter = (typeof d.filter != "undefined") ? d.filter : {};
        task.getUserTaskDataCount("task", filter, {}, (c) => {
            if (c.status) {
                socket.emit("FRONT_ALL_TASK_COUNT_LIST", c.data)
            } else {
                if (c.error) { socket.emit("RETURN_ERROR_MESSAGE", { message: c.error.sqlMessage }) }
            }
        })
    })

    socket.on("GET_TASK_DETAIL", (d) => {
        sequence.create().then((nextThen) => {
            let task = global.initModel("task")
            task.getTaskList("task", { id: d.id }, {}, (c) => {
                if (c.data.length > 0) {
                    nextThen(c.data[0])
                }
            })
        }).then((nextThen, data) => {
            let members = global.initModel("members")
            members.getData("members", { linkType: "task", linkId: data.id, usersType: "users", memberType: "assignedTo" }, {}, (e) => {
                if (e.data.length > 0) {
                    data.assignedTo = e.data[0].userTypeLinkId;
                }
                let dataObject = { ...data, ...((typeof d.action != 'undefined') ? { action: d.action } : {}) }
                socket.emit("FRONT_TASK_SELECTED", dataObject)
            })
        })
    })
    socket.on("SAVE_OR_UPDATE_TASK", (d) => {
        sequence.create().then((nextThen) => {
            let task = global.initModel("task");

            if (typeof d.data.id != "undefined" && d.data.id != "") {
                task.getTaskList("task", { id: d.data.id }, {}, (c) => {

                    if (c.status == false || c.data.length == 0) {
                        socket.emit("RETURN_ERROR_MESSAGE", { message: "Updating failed. Please Try again later." });
                    } else {
                        async.parallel({
                            task: function (parallelCallback) {
                                let id = d.data.id;
                                delete d.data.id;

                                task.putData("task", d.data, { id: id }, (c) => {
                                    if (c.status) {
                                        task.getData("task", { id: id }, {}, (e) => {
                                            if (e.data.length > 0) {
                                                parallelCallback(null, e.data[0]);
                                            } else {
                                                socket.emit("RETURN_ERROR_MESSAGE", { message: "Updating failed. Please Try again later." })
                                            }
                                        })
                                    } else {
                                        socket.emit("RETURN_ERROR_MESSAGE", { message: "Updating failed. Please Try again later." })
                                    }
                                })
                            },
                            periodic: function (parallelCallback) {
                                if (c.data[0].periodic == 1 && (typeof d.data.action != "undefined" && d.data.action == "complete")) {
                                    const nextDueDate = moment(c.data[0].dueDate).add(c.data[0].periodType, c.data[0].period).format('YYYY-MM-DD HH:mm:ss');
                                    const newPeriodTask = { ...c.data[0], id: "", startDate: c.data[0].dueDate, dueDate: nextDueDate }

                                    task.postData("task", newPeriodTask, (c) => {
                                        task.getData("task", { id: c.id }, {}, (e) => {
                                            parallelCallback(null, e.data[0]);
                                        });
                                    })
                                } else {
                                    parallelCallback(null, "")
                                }
                            }
                        }, function (err, params) {
                            nextThen(params.task.id, "edit", params)
                        });
                    }
                })
            } else {
                task.postData("task", d.data, (c) => {
                    if (typeof c.id != "undefined" && c.id > 0) {
                        task.getData("task", { id: c.id }, {}, (e) => {
                            if (e.data.length > 0) {
                                nextThen(e.data[0].id, "add", { task: e.data[0] })
                            } else {
                                socket.emit("RETURN_ERROR_MESSAGE", { message: "Saving failed. Please Try again later." })
                            }
                        })
                    } else {
                        socket.emit("RETURN_ERROR_MESSAGE", { message: "Saving failed. Please Try again later." })
                    }
                })
            }
        }).then((nextThen, id, type, data) => {
            const members = global.initModel("members");

            if (typeof d.data.assignedTo != 'undefined' && d.data.assignedTo != '') {
                members.deleteData("members", { linkType: "task", linkId: id, usersType: "users", memberType: "assignedTo" }, (c) => {
                    let assignedTo = { linkType: "task", linkId: id, usersType: "users", userTypeLinkId: d.data.assignedTo, memberType: "assignedTo" };

                    members.postData("members", assignedTo, (c) => {
                        data.task.assignedById = d.data.assignedTo;
                        nextThen(type, data);
                    });
                })
            } else if (d.data.action == "complete") {
                members.getData("members", { linkType: "task", linkId: data.task.id, memberType: "assignedTo" }, {}, (e) => {
                    if (e.status && e.data.length > 0) {
                        let assignedTo = { linkType: "task", linkId: data.periodic.id, usersType: "users", userTypeLinkId: e.data[0].userTypeLinkId, memberType: "assignedTo" };

                        if ((typeof data.periodic != "undefined" && data.periodic != "")) {
                            members.postData("members", assignedTo, (c) => {
                                data.periodic.assignedById = e.data[0].userTypeLinkId;
                                data.task.assignedById = e.data[0].userTypeLinkId;
                                nextThen(type, data)
                            });
                        } else {
                            data.task.assignedById = e.data[0].userTypeLinkId;
                            nextThen(type, data)
                        }

                    } else {
                        nextThen(type, data)
                    }
                });
            } else if (typeof d.data.assignedTo == 'undefined' || d.data.assignedTo == '') {
                members.deleteData("members", { linkType: "task", linkId: id, usersType: "users", memberType: "assignedTo" }, (c) => {
                    data.task.assignedById = "";
                    nextThen(type, data)
                });
            }
        }).then((nextThen, type, data) => {
            if (data.periodic != "" && type == "edit") {
                socket.emit("FRONT_TASK_EDIT", data.task)
                socket.emit("FRONT_TASK_ADD", data.periodic)
            } else if (type == "add") {
                socket.emit("FRONT_TASK_ADD", data)
            } else if (type == "edit") {
                socket.emit("FRONT_TASK_EDIT", data.task)
            }

            socket.emit("RETURN_SUCCESS_MESSAGE", { message: "Successfully updated" })
        })

    })

    socket.on("DELETE_TASK", (d) => {
        let task = global.initModel("task")

        task.getData("task", {}, {}, (b) => {
            task.deleteData("task", { id: d.id }, (c) => {
                if (c.status) {
                    socket.emit("FRONT_TASK_DELETED", { id: d.id })
                } else {
                    socket.emit("RETURN_ERROR_MESSAGE", "Delete failed. Please try again later.")
                }
            })
        })
    })
}