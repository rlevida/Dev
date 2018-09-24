var func = global.initFunc(),
    sequence = require("sequence").Sequence,
    async = require("async"),
    moment = require("moment");

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
            const taskDependency = global.initModel("task_dependency");

            async.parallel({
                members: (parallelCallback) => {
                    if (typeof d.data.assignedTo != 'undefined' && d.data.assignedTo != '') {
                        members.deleteData("members", { linkType: "task", linkId: id, usersType: "users", memberType: "assignedTo" }, (c) => {
                            let assignedTo = { linkType: "task", linkId: id, usersType: "users", userTypeLinkId: d.data.assignedTo, memberType: "assignedTo" };

                            members.postData("members", assignedTo, (c) => {
                                data.task.assignedById = d.data.assignedTo;
                                parallelCallback(null, data);
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
                                        parallelCallback(null, data)
                                    });
                                } else {
                                    data.task.assignedById = e.data[0].userTypeLinkId;
                                    parallelCallback(null, data)
                                }

                            } else {
                                parallelCallback(null, data)
                            }
                        });
                    } else if (typeof d.data.assignedTo == 'undefined' || d.data.assignedTo == '') {
                        members.deleteData("members", { linkType: "task", linkId: id, usersType: "users", memberType: "assignedTo" }, (c) => {
                            data.task.assignedById = "";
                            parallelCallback(null, data)
                        });
                    }
                },
                dependency: (parallelCallback) => {
                    if (typeof d.data.dependencyType != 'undefined' && d.data.dependencyType != '') {
                        taskDependency.deleteData("task_dependency", { taskId: id }, (c) => {
                            async.map(d.data.linkTaskIds, (taskid, mapCallback) => {
                                taskDependency.postData("task_dependency", {
                                    taskId: id,
                                    dependencyType: d.data.dependencyType,
                                    linkTaskId: taskid.value
                                }, (c) => {
                                    mapCallback(null)
                                });
                            }, (err, results) => {
                                parallelCallback(null, results)
                            });
                        });
                    } else if (d.data.action == "complete") {
                        taskDependency.getData("task_dependency", { taskId: id }, {}, (e) => {
                            if (e.status && e.data.length > 0) {
                                if ((typeof data.periodic != "undefined" && data.periodic != "")) {
                                    async.map(e.data, (task, mapCallback) => {
                                        taskDependency.postData("task_dependency", {
                                            taskId: data.periodic.id,
                                            dependencyType: task.dependencyType,
                                            linkTaskId: task.linkTaskId
                                        }, (c) => {
                                            mapCallback(null)
                                        });
                                    }, (err, results) => {
                                        parallelCallback(null, results)
                                    });
                                } else {
                                    parallelCallback(null)
                                }
                            } else {
                                parallelCallback(null)
                            }
                        })
                    } else if (typeof d.data.dependencyType == 'undefined' || d.data.dependencyType == '') {
                        taskDependency.deleteData("task_dependency", { taskId: id }, (c) => {
                            parallelCallback(null);
                        });
                    }
                }
            }, (err, results) => {
                nextThen(type, results.members)
            })
        }).then((nextThen, type, data) => {
            if(type != "edit"){
                if (data.periodic != "" && type == "edit") {
                    socket.emit("FRONT_TASK_EDIT", data.task)
                    socket.emit("FRONT_TASK_ADD", data.periodic)
                } else if (type == "add") {
                    socket.emit("FRONT_TASK_ADD", data.task)
                } 
                socket.emit("RETURN_SUCCESS_MESSAGE", { message: "Successfully updated" })
            }else{
                nextThen(data)
            }
        }).then((nextThen,data) =>{
            let tag = global.initModel("tag");
                tag.getData("tag",{ linkId : data.task.id , tagType : "document" , linkType : "task"},{},(c)=>{
                    if(c.status){
                        if(c.data.length > 0){
                            nextThen(data,c.data)
                        }else{
                            socket.emit("FRONT_TASK_EDIT", data.task)
                            socket.emit("RETURN_SUCCESS_MESSAGE", { message: "Successfully updated" })
                        }
                    }else{
                        socket.emit("RETURN_ERROR_MESSAGE", { message: "Updating document failed. Please Try again later." });
                    }
                })
        }).then((nextThen,result,data)=>{
            let document = global.initModel("document");
            let tempDocumentRes = [];
                tempDocumentRes.push( new Promise((resolve,reject)=>{
                    data.map( e =>{
                        document.putData("document",{ isCompleted : 1 },{ id : e.tagTypeId },(c)=>{
                            if(c.status){
                                resolve(c)
                            }else{
                                reject()
                            }
                        })
                    })
                }))
                Promise.all(tempDocumentRes).then((values)=>{
                    socket.emit("FRONT_TASK_EDIT", result.task)
                    socket.emit("RETURN_SUCCESS_MESSAGE", { message: "Successfully updated" })
                    
                })
        })
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