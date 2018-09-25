var func = global.initFunc(),
    sequence = require("sequence").Sequence,
    async = require("async"),
    moment = require("moment"),
    _ = require("lodash");

var init = exports.init = (socket) => {

    socket.on("GET_TASK_LIST", (d) => {
        let task = global.initModel("task")
        let taskDependencies = global.initModel("task_dependency")
        let filter = (typeof d.filter != "undefined") ? d.filter : {};

        task.getTaskList("task", filter, {}, (c) => {
            async.map(c.data, (o, mapCallback) => {
                taskDependencies.getData("task_dependency", { taskId: o.id }, {}, (results) => {
                    mapCallback(null, { ...o, dependencies: results.data })
                });
            }, (err, result) => {
                socket.emit("FRONT_TASK_LIST", { data: result, type: d.type })
            });
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
            const members = global.initModel("members");
            const taskDependency = global.initModel("task_dependency");
            async.parallel({
                members: (parallelCallback) => {
                    members.getData("members", { linkType: "task", linkId: data.id, usersType: "users", memberType: "assignedTo" }, {}, (e) => {
                        if (e.data.length > 0) {
                            parallelCallback(null, e.data[0].userTypeLinkId);
                        } else {
                            parallelCallback(null, "");
                        }
                    })
                },
                dependencies: (parallelCallback) => {
                    taskDependency.getData("task_dependency", { taskId: data.id }, {}, (e) => {
                        parallelCallback(null, e.data);
                    })
                },
                responsible: (parallelCallback) => {
                    members.getData("members", { linkType: "workstream", linkId: data.workstreamId, usersType: "users", memberType: "responsible" }, {}, (e) => {
                        parallelCallback(null, e.data);
                    });
                },
                project_manager: (parallelCallback) => {
                    members.getData("members", { linkType: "project", linkId: data.projectId, usersType: "users", memberType: "project manager" }, {}, (e) => {
                        parallelCallback(null, e.data);
                    });
                }
            }, (err, results) => {
                let dataObject = {
                    ...data,
                    ...((typeof d.action != 'undefined') ? { action: d.action } : {}),
                    dependencyType: ((results.dependencies).length > 0) ? results.dependencies[0].dependencyType : "",
                    linkTaskIds: (results.dependencies).map((o) => { return { value: o.linkTaskId } }),
                    assignedTo: results.members,
                    workstream_responsible: (results.responsible).map((o) => { return o.userTypeLinkId }),
                    project_manager: (results.project_manager).map((o) => { return o.userTypeLinkId })
                }
                socket.emit("FRONT_TASK_SELECTED", dataObject)
            });
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
                        let id = d.data.id;

                        async.parallel({
                            task: function (parallelCallback) {
                                delete d.data.id;

                                task.putData("task", d.data, { id: id }, (c) => {
                                    if (c.status) {
                                        task.getData("task", { id: id }, {}, (e) => {
                                            if (e.data.length > 0) {
                                                parallelCallback(null, e.data);
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
                                let taskId = (d.data.periodTask == null) ? id : d.data.periodTask;

                                if (c.data[0].periodic == 1 && (typeof d.data.action != "undefined" && d.data.action == "complete")) {
                                    task.getData("task", { periodTask: taskId, status: "In Progress" }, {}, (e) => {
                                        let newTaskData = ((e.data).length > 0) ? _.orderBy(e.data, ['id'], ['desc']) : c.data;
                                        const nextDueDate = moment(newTaskData[0].dueDate).add(newTaskData[0].periodType, newTaskData[0].period).format('YYYY-MM-DD HH:mm:ss');
                                        const newPeriodTask = { ...newTaskData[0], id: "", startDate: newTaskData[0].dueDate, dueDate: nextDueDate, periodTask: taskId }

                                        task.postData("task", newPeriodTask, (c) => {
                                            task.getData("task", { id: c.id }, {}, (e) => {
                                                parallelCallback(null, e.data[0]);
                                            });
                                        })
                                    });
                                } else {
                                    parallelCallback(null, "")
                                }
                            }
                        }, function (err, params) {
                            let action = (typeof d.data.action != "undefined" && d.data.action == "complete") ? "complete" : "edit";
                            let data = params.task;

                            if (params.periodic != "") {
                                data.push(params.periodic);
                            }

                            nextThen(data, action)
                        });
                    }
                });
            } else {
                task.postData("task", d.data, (c) => {
                    if (typeof c.id != "undefined" && c.id > 0) {
                        async.parallel({
                            instance: (parallelCallback) => {
                                const taskPromises = _.times(d.data.periodInstance - 1, (o) => {
                                    return new Promise(function (resolve, reject) {
                                        const nextStartDate = moment(d.data.dueDate).add(d.data.periodType, o).format('YYYY-MM-DD HH:mm:ss');
                                        const nextDueDate = moment(d.data.dueDate).add(d.data.periodType, o + 1).format('YYYY-MM-DD HH:mm:ss');
                                        const newPeriodTask = { ...d.data, id: "", startDate: nextStartDate, dueDate: nextDueDate, periodTask: c.id, status: "In Progress" }

                                        task.postData("task", newPeriodTask, (c) => {
                                            if (typeof c.id != "undefined" && c.id > 0) {
                                                task.getData("task", { id: c.id }, {}, (e) => {
                                                    resolve(e.data[0]);
                                                });
                                            } else {
                                                reject("Task failed to be created.");
                                            }
                                        })
                                    });
                                });

                                Promise.all(taskPromises).then((values) => {
                                    parallelCallback(null, values)
                                }).catch(function (error) {
                                    parallelCallback(true)
                                })
                            },
                            task: (parallelCallback) => {
                                task.getData("task", { id: c.id }, {}, (e) => {
                                    if (e.status) {
                                        parallelCallback(null, e.data[0]);
                                    } else {
                                        parallelCallback(true);
                                    }
                                });
                            }
                        }, (err, data) => {
                            if (err == true) {
                                socket.emit("RETURN_ERROR_MESSAGE", { message: "Saving failed. Please Try again later." })
                            } else {
                                (data.instance).push(data.task)
                                nextThen(data.instance, "add");
                            }
                        })
                    } else {
                        socket.emit("RETURN_ERROR_MESSAGE", { message: "Saving failed. Please Try again later." })
                    }
                })
            }
        }).then((nextThen, data, type) => {
            const members = global.initModel("members");
            const taskDependency = global.initModel("task_dependency");
            const tag = global.initModel("tag");

            const taskAttributesPromises = _.map(data, (o) => {
                return new Promise(function (resolve, reject) {
                    async.parallel({
                        members: (parallelCallback) => {
                            if (typeof d.data.assignedTo != 'undefined' && d.data.assignedTo != '') {
                                members.deleteData("members", { linkType: "task", linkId: o.id, usersType: "users", memberType: "assignedTo" }, (c) => {
                                    let assignedTo = { linkType: "task", linkId: o.id, usersType: "users", userTypeLinkId: d.data.assignedTo, memberType: "assignedTo" };

                                    members.postData("members", assignedTo, (c) => {
                                        if (c.status) {
                                            parallelCallback(null, d.data.assignedTo);
                                        } else {
                                            parallelCallback(c.error.sqlMessage);
                                        }
                                    });
                                })
                            } else if (d.data.action == "complete") {
                                let taskId = (o.periodTask == null) ? o.id : o.periodTask;
                                members.getData("members", { linkType: "task", linkId: taskId, memberType: "assignedTo" }, {}, (e) => {
                                    if (e.status && e.data.length > 0) {
                                        if (o.status == "Completed") {
                                            if ((e.data).length > 0) {
                                                parallelCallback(null, e.data[0].userTypeLinkId)
                                            } else {
                                                parallelCallback(null, "")
                                            }
                                        } else {
                                            let assignedTo = { linkType: "task", linkId: o.id, usersType: "users", userTypeLinkId: e.data[0].userTypeLinkId, memberType: "assignedTo" };
                                            members.postData("members", assignedTo, (c) => {
                                                parallelCallback(null, e.data[0].userTypeLinkId);
                                            });
                                        }
                                    } else {
                                        parallelCallback(null, "")
                                    }
                                });
                            } else if (typeof d.data.assignedTo == 'undefined' || d.data.assignedTo == '') {
                                members.deleteData("members", { linkType: "task", linkId: o.id, usersType: "users", memberType: "assignedTo" }, (c) => {
                                    parallelCallback(null, "")
                                });
                            }
                        },
                        dependency: (parallelCallback) => {
                            if (typeof d.data.dependencyType != 'undefined' && d.data.dependencyType != '') {
                                taskDependency.deleteData("task_dependency", { taskId: o.id }, (c) => {
                                    async.map(d.data.linkTaskIds, (taskid, mapCallback) => {
                                        taskDependency.postData("task_dependency", {
                                            taskId: o.id,
                                            dependencyType: d.data.dependencyType,
                                            linkTaskId: taskid.value
                                        }, (c) => {
                                            if (c.status) {
                                                mapCallback(null, c.id);
                                            } else {
                                                mapCallback(c.error.sqlMessage);
                                            }
                                        });
                                    }, (err, results) => {
                                        if (err != null) {
                                            parallelCallback(err);
                                        } else {
                                            parallelCallback(null, results)
                                        }
                                    });
                                });
                            } else if (d.data.action == "complete") {
                                let taskId = (o.periodTask == null) ? o.id : o.periodTask;

                                taskDependency.getData("task_dependency", { taskId: taskId }, {}, (e) => {
                                    if (e.status && e.data.length > 0) {
                                        if (o.status == "Completed") {
                                            parallelCallback(null, e)
                                        } else {
                                            async.map(e.data, (task, mapCallback) => {
                                                taskDependency.postData("task_dependency", {
                                                    taskId: o.id,
                                                    dependencyType: task.dependencyType,
                                                    linkTaskId: task.linkTaskId
                                                }, (c) => {
                                                    mapCallback(null)
                                                });
                                            }, (err, results) => {
                                                parallelCallback(null, results)
                                            });
                                        }
                                    } else {
                                        parallelCallback(null)
                                    }
                                })
                            } else if (typeof d.data.dependencyType == 'undefined' || d.data.dependencyType == '') {
                                taskDependency.deleteData("task_dependency", { taskId: o.id }, (c) => {
                                    parallelCallback(null, []);
                                });
                            }
                        },
                        documents: (parallelCallback) => {
                            if (d.data.action == "complete") {
                                let taskId = (o.periodTask == null) ? o.id : o.periodTask;

                                if (o.status == "Completed") {
                                    tag.putData("tag", { isCompleted: 1 }, { linkId: o.id, tagType: "document", linkType: "task" }, (c) => {
                                        if (c.status && c.data.length > 0) {
                                            parallelCallback(null);
                                        } else {
                                            parallelCallback(null);
                                        }
                                    })
                                } else {
                                    tag.getData("tag", { linkId: taskId, tagType: "document", linkType: "task" }, {}, (e) => {
                                        if (e.status && e.data.length > 0) {
                                            async.map(e.data, (tg, mapCallback) => {
                                                tag.postData("tag", {
                                                    linkType: "task",
                                                    linkId: o.id,
                                                    tagType: "document",
                                                    tagTypeId: tg.tagTypeId
                                                }, (c) => {
                                                    mapCallback(null)
                                                });
                                            }, (err, results) => {
                                                parallelCallback(null, results)
                                            });
                                        } else {
                                            parallelCallback(null)
                                        }
                                    })
                                }
                            } else {
                                parallelCallback(null);
                            }
                        }
                    }, (err, results) => {
                        if (err != null) {
                            reject(err);
                        } else {
                            resolve({ ...o, assignedById: results.members })
                        }
                    });
                });
            });

            Promise.all(taskAttributesPromises).then((values) => {
                nextThen(values, type)
            }).catch(function (error) {
                socket.emit("RETURN_ERROR_MESSAGE", { message: "Saving failed. Please Try again later." })
            });

        }).then((nextThen, data, type) => {
            if (type == "add") {
                socket.emit("FRONT_TASK_ADD", { data: data, action: "add" })
            } else if (type == "edit" || type == "complete") {
                socket.emit("FRONT_TASK_EDIT", { data: data, action: "edit" })
            }
            socket.emit("RETURN_SUCCESS_MESSAGE", { message: "Successfully updated" })
        });
    })

    socket.on("ADD_TASK_DEPENDENCY", (d) => {
        const taskDependency = global.initModel("task_dependency");

        async.map(d.data.task_dependencies, (task, mapCallback) => {
            let insertData = {
                taskId: d.data.task_id,
                dependencyType: d.data.type,
                linkTaskId: task.value
            };
            taskDependency.postData("task_dependency", insertData, (c) => {
                mapCallback(null, { ...insertData, id: c.id })
            });
        }, (err, results) => {
            socket.emit("FRONT_ADD_TASK_DEPENDENCY", results)
        });
    })

    socket.on("DELETE_TASK", (d) => {
        let task = global.initModel("task")

        task.getData("task", {}, {}, (b) => {
            task.deleteData("task", { id: d.id }, (c) => {
                const members = global.initModel("members");
                const taskDependency = global.initModel("task_dependency");

                if (c.status) {
                    async.parallel({
                        members: (parallelCallback) => {
                            members.deleteData("members", { linkType: "task", linkId: d.id, usersType: "users", memberType: "assignedTo" }, (c) => {
                                parallelCallback(null);
                            });
                        },
                        dependency: (parallelCallback) => {
                            taskDependency.deleteData("task_dependency", { taskId: d.id }, (c) => {
                                parallelCallback(null);
                            });
                        }
                    }, (err, results) => {
                        socket.emit("FRONT_TASK_DELETED", { id: d.id })
                    });
                } else {
                    socket.emit("RETURN_ERROR_MESSAGE", "Delete failed. Please try again later.")
                }
            })
        })
    })
}