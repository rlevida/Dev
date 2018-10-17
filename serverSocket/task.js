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
        const task = global.initModel("task");
        const controller = global.initController("activityLog");

        sequence.create().then((nextThen) => {
            if (typeof d.data.id != "undefined" && d.data.id != "") {
                task.getData("task", { id: d.data.id }, {}, (c) => {
                    const currentTask = c;
                    if (currentTask.status == false || currentTask.data.length == 0) {
                        socket.emit("RETURN_ERROR_MESSAGE", { message: "Updating failed. Please Try again later." });
                    } else {
                        let id = d.data.id;
                        async.parallel({
                            task: function (parallelCallback) {
                                task.putData("task", _.omit(d.data, ['id']), { id: id }, (c) => {
                                    if (c.status) {
                                        task.getData("task", { id: id }, {}, (e) => {
                                            if (e.data.length > 0) {
                                                const newTask = e.data;

                                                try {
                                                    const prevObject = _.omit(currentTask.data[0], ['dateAdded', 'dateUpdated', 'project_dateAdded', 'project_dateUpdated', 'workstream_dateAdded', 'workstream_dateUpdated', 'currentState']);
                                                    const baseObject = _.omit(newTask[0], ['dateAdded', 'dateUpdated', 'project_dateAdded', 'project_dateUpdated', 'workstream_dateAdded', 'workstream_dateUpdated', 'currentState']);
                                                    const newObject = func.changedObjAttributes(baseObject, prevObject)
                                                    const objectKeys = _.map(newObject, function (value, key) {
                                                        return key;
                                                    });

                                                    if (_.isEmpty(newObject)) {
                                                        parallelCallback(null, newTask);
                                                    } else {
                                                        controller.post({
                                                            body: {
                                                                usersId: d.data.userId,
                                                                linkType: "task",
                                                                linkId: newTask[0].id,
                                                                actionType: "modified",
                                                                old: JSON.stringify(_.pick(prevObject, objectKeys)),
                                                                new: JSON.stringify(newObject)
                                                            }
                                                        }, (c) => {
                                                            parallelCallback(null, newTask);
                                                        });
                                                    }

                                                } catch (err) {
                                                    parallelCallback(null, newTask)
                                                }
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

                                if (currentTask.data[0].periodic == 1 && (typeof d.data.action != "undefined" && d.data.action == "complete")) {
                                    task.getData("task", {
                                        periodTask: taskId,
                                        id: { value: id, condition: " >= " }
                                    }, {}, (e) => {
                                        let taskList = ((e.data).length > 0) ? _.orderBy(e.data, ['id'], ['desc']) : currentTask.data;
                                        const latestTaskDate = _.omit(taskList[0], ["status"]);
                                        const nextDueDate = moment(latestTaskDate.dueDate).add(latestTaskDate.periodType, latestTaskDate.period).format('YYYY-MM-DD HH:mm:ss');
                                        const newPeriodTask = { ...latestTaskDate, id: "", dueDate: nextDueDate, periodTask: taskId, ...(latestTaskDate.startDate != null && latestTaskDate.startDate != "") ? { startDate: moment(latestTaskDate.startDate).add(latestTaskDate.periodType, latestTaskDate.period).format('YYYY-MM-DD HH:mm:ss') } : {} }

                                        task.postData("task", newPeriodTask, (c) => {
                                            task.getData("task", { id: c.id }, {}, (e) => {
                                                parallelCallback(null, e.data[0]);
                                            });
                                        })
                                    });
                                } else {
                                    parallelCallback(null, "")
                                }
                            },
                            reminder: function (parallelCallback) {
                                let reminder = global.initModel("reminder");

                                if ((d.data.action == "For Approval" || d.data.action == "Reject Task" || d.data.action == "complete") && typeof d.reminder != "undefined") {
                                    reminder.postData("reminder", d.reminder, (c) => {
                                        if (c.status) {
                                            reminder.getReminderList({}, (e) => {
                                                if (e.data.length > 0) {
                                                    socket.broadcast.emit("FRONT_REMINDER_LIST", e.data)
                                                    parallelCallback(null, "")
                                                } else {
                                                    parallelCallback(null, "")
                                                }
                                            })
                                        }
                                    })
                                } else {
                                    parallelCallback(null, "")
                                }
                            },
                            sendEmailNotification: function (parallelCallback) {
                                if (d.data.action == "For Approval" || d.data.action == "Reject Task") {
                                    if (d.receiveNotification) {
                                        global.emailtransport(d.mailOptions)
                                        parallelCallback(null, "")
                                    } else {
                                        parallelCallback(null, "")
                                    }
                                } else {
                                    parallelCallback(null, "")
                                }
                            },
                            isActivePeriodicTask: function (parallelCallback) {
                                if (currentTask.data[0].periodic == 1) {
                                    task.putData("task", { isActive: d.data.isActive }, { periodTask: id }, (c) => {
                                        parallelCallback(null, "")
                                    })
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
                                        const nextDueDate = moment(d.data.dueDate).add(d.data.periodType, o + 1).format('YYYY-MM-DD HH:mm:ss');
                                        const newPeriodTask = { ...d.data, id: "", dueDate: nextDueDate, periodTask: c.id, ...(d.data.startDate != null && d.data.startDate != "") ? { startDate: moment(d.data.startDate).add(d.data.periodType, o + 1).format('YYYY-MM-DD HH:mm:ss') } : {} }

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
                                        const newTask = e.data[0];
                                        try {
                                            controller.post({ body: { usersId: d.data.userId, linkType: "task", linkId: newTask.id, actionType: "created", new: JSON.stringify(newTask) } }, (c) => {
                                                parallelCallback(null, newTask);
                                            })
                                        } catch (err) {
                                            parallelCallback(true);
                                        }
                                    } else {
                                        parallelCallback(true);
                                    }
                                });
                            }
                        }, (err, data) => {
                            if (err == true) {
                                socket.emit("RETURN_ERROR_MESSAGE", { message: "Saving failed. Please Try again later." })
                            } else {
                                (data.instance).unshift(data.task)
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

            const taskAttributesPromises = _.map(data, (o) => {
                return new Promise(function (resolve, reject) {
                    async.parallel({
                        members: (parallelCallback) => {
                            if (d.data.action == "complete") {
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
                            } else if (d.data.action == "For Approval" || d.data.action == "Reject Task") {
                                parallelCallback(null, "")
                            } else {
                                let taskId = (o.periodTask == null) ? o.id : o.periodTask;

                                async.waterfall([
                                    function (callback) {
                                        members.getData("members", { linkType: "task", linkId: taskId, memberType: "assignedTo" }, {}, (e) => {
                                            const oldMembers = ((e.data).length > 0) ? e.data : [];
                                            members.deleteData("members", { linkType: "task", linkId: o.id, usersType: "users", memberType: "assignedTo" }, (c) => {
                                                callback(null, oldMembers);
                                            });
                                        });
                                    },
                                    function (oldMemberArgs, callback) {
                                        if (typeof d.data.assignedTo == 'undefined' || d.data.assignedTo == '') {
                                            callback(null, { oldMemberArgs, newMembers: [] });
                                        } else {
                                            const assignedTo = { linkType: "task", linkId: o.id, usersType: "users", userTypeLinkId: d.data.assignedTo, memberType: "assignedTo" };

                                            members.postData("members", assignedTo, (c) => {
                                                if (c.status) {
                                                    members.getData("members", { id: c.id }, {}, (e) => {
                                                        const newMembers = e.data;
                                                        callback(null, { oldMemberArgs, newMembers });
                                                    })
                                                } else {
                                                    callback(c.error.sqlMessage)
                                                }
                                            });
                                        }
                                    },
                                    function (membersObj, callback) {
                                        const { oldMemberArgs, newMembers } = { ...membersObj };
                                        const oldMembersStack = _.map(oldMemberArgs, (oldMemberObj, index) => { return _.omit(oldMemberObj, ['id', 'dateAdded', 'dateUpdated']) });
                                        const newMembersStack = _.map(newMembers, (newMemberObj, index) => { return _.omit(newMemberObj, ['id', 'dateAdded', 'dateUpdated']) });
                                        const isEqualMembers = func.isArrayEqual(oldMembersStack, newMembersStack);

                                        if (isEqualMembers == false) {
                                            try {
                                                controller.post({ body: { usersId: d.data.userId, linkType: "task", linkId: taskId, actionType: "modified", old: JSON.stringify({ members: oldMemberArgs }), new: JSON.stringify({ members: newMembers }) } }, (c) => {
                                                    callback(null);
                                                });
                                            } catch (err) {
                                                callback(null)
                                            }
                                        } else {
                                            callback(null)
                                        }
                                    }
                                ], function (err, result) {
                                    parallelCallback(null, d.data.assignedTo);
                                });
                            }
                        },
                        dependency: (parallelCallback) => {
                            const parentTaskId = o.id;

                            if (d.data.action == "complete") {
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
                            } else if (d.data.action == "For Approval" || d.data.action == "Reject Task") {
                                parallelCallback(null, "")
                            } else {
                                async.waterfall([
                                    function (callback) {
                                        taskDependency.getData("task_dependency", { taskId: parentTaskId }, {}, (e) => {
                                            const oldTaskDependency = ((e.data).length > 0) ? e.data : [];
                                            taskDependency.deleteData("task_dependency", { taskId: parentTaskId }, (c) => {
                                                callback(null, oldTaskDependency);
                                            });
                                        });
                                    },
                                    function (oldTaskDependencyArgs, callback) {
                                        if (typeof d.data.dependencyType == 'undefined' || d.data.dependencyType == '') {
                                            callback(null, { oldTaskDependencyArgs, newTaskDependencyArgs: [] });
                                        } else {
                                            async.map(d.data.linkTaskIds, (taskid, mapCallback) => {
                                                taskDependency.postData("task_dependency", {
                                                    taskId: parentTaskId,
                                                    dependencyType: d.data.dependencyType,
                                                    linkTaskId: taskid.value
                                                }, (c) => {
                                                    if (c.status) {
                                                        members.getData("task_dependency", { id: c.id }, {}, (e) => {
                                                            mapCallback(null, e.data[0]);
                                                        });
                                                    } else {
                                                        callback(c.error.sqlMessage);
                                                    }
                                                });
                                            }, (err, res) => {
                                                callback(null, { oldTaskDependencyArgs, newTaskDependencyArgs: res });
                                            });
                                        }

                                    },
                                    function (taskDependencyObj, callback) {
                                        const { oldTaskDependencyArgs, newTaskDependencyArgs } = { ...taskDependencyObj }
                                        const oldTaskDependencyStack = _.map(oldTaskDependencyArgs, (oldTaskDependencyObj, index) => { return _.omit(oldTaskDependencyObj, ['id', 'dateAdded', 'dateUpdated']) });
                                        const newTaskDependencyStack = _.map(newTaskDependencyArgs, (newTaskDependencyObj, index) => { return _.omit(newTaskDependencyObj, ['id', 'dateAdded', 'dateUpdated']) });
                                        const isEqualTaskDependency = func.isArrayEqual(oldTaskDependencyStack, newTaskDependencyStack);

                                        if (isEqualTaskDependency == false) {
                                            try {
                                                controller.post({ body: { usersId: d.data.userId, linkType: "task", linkId: parentTaskId, actionType: "modified", old: JSON.stringify({ task_dependencies: oldTaskDependencyArgs }), new: JSON.stringify({ task_dependencies: newTaskDependencyStack }) } }, (c) => {
                                                    callback(null, newTaskDependencyArgs);
                                                });
                                            } catch (err) {
                                                callback(null, newTaskDependencyArgs)
                                            }
                                        } else {
                                            callback(null, newTaskDependencyArgs)
                                        }
                                    }
                                ], function (err, result) {
                                    parallelCallback(null, result)
                                });
                            }
                        }
                    }, (err, results) => {
                        if (err != null) {
                            reject(err);
                        } else {
                            if (d.data.action == "For Approval" || d.data.action == "Reject Task") {
                                resolve({ ...o })
                            } else {
                                resolve({ ...o, assignedById: results.members, assignedTo: results.members })
                            }
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
                socket.emit("FRONT_TASK_EDIT", { data: data, action: type })
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