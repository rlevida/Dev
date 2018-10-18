var func = global.initFunc(),
    sequence = require("sequence").Sequence,
    async = require("async"),
    _ = require("lodash"),
    moment = require("moment");

var init = exports.init = (socket) => {

    socket.on("GET_CHECK_LIST", (d) => {
        let taskCheckList = global.initModel("task_checklist")
        let filter = (typeof d.filter != "undefined") ? d.filter : {};
        let document = global.initModel("document");
        let tag = global.initModel("tag");

        taskCheckList.getData("task_checklist", filter, {}, (c) => {
            let documents = _(c.data)
                .filter((o) => { return o.documents != null && o.documents != "" })
                .map((o) => { return JSON.parse(o.documents) })
                .flattenDeep()
                .uniq()
                .value();
            async.parallel({
                documentData: (documentParallelCallback) => {
                    document.getData("document", {
                        id: { value: documents, condition: " IN " }
                    }, {}, (e) => {
                        if (e.status) {
                            documentParallelCallback(null, e.data)
                        } else {
                            documentParallelCallback(e.error.sqlMessage)
                        }
                    });
                },
                tags: (documentParallelCallback) => {
                    tag.getData("tag", {
                        tagTypeId: { value: documents, condition: " IN " },
                        linkType: "task",
                        linkId: { value: _.map((c.data), (o) => { return o.taskId }), condition: " IN " },
                    }, {}, (e) => {
                        if (e.status) {
                            documentParallelCallback(null, e.data)
                        } else {
                            documentParallelCallback(e.error.sqlMessage)
                        }
                    });
                }
            }, (err, result) => {
                if (err != null) {
                    socket.emit("RETURN_ERROR_MESSAGE", { message: "Error Fetching checklist data." })
                } else {
                    const documentList = _(result.documentData)
                        .map((o) => {
                            return {
                                id: o.id,
                                name: o.name,
                                origin: o.origin,
                                uploadedBy: o.uploadedBy,
                                status: o.status,
                                tags: JSON.stringify(_(result.tags)
                                    .filter((tag) => { return tag.tagTypeId == o.id })
                                    .map((tag) => { return { value: tag.linkType + "-" + tag.linkId } })),
                                type: o.type
                            }
                        })
                        .value();
                    const resultList = _.map(c.data, (checklist) => {
                        const documents = (checklist.documents != null && checklist.documents != "") ?
                            _(documentList).filter((doc) => {
                                return _.findIndex(JSON.parse(checklist.documents), (o) => { return o == doc.id }) >= 0
                            })
                                .map((o) => { return { ...(o), project: checklist.task_projectId } })
                                .value()
                            : []
                        return { ...checklist, documents }
                    })
                    socket.emit("FRONT_CHECK_LIST", resultList);
                }
            })
        });
    })

    socket.on("SAVE_OR_UPDATE_CHECKLIST", (d) => {
        if (typeof d.documents != "undefined" && d.documents.length > 0) {
            let document = global.initModel("document");
            let task = global.initModel("task");
            let filter = (typeof d.filter != "undefined") ? d.filter : {};

            sequence.create().then((nextThen) => {
                let newData = d.documents.map(file => {
                    return new Promise((resolve, reject) => {
                        document.getData("document", { origin: file.origin }, { orderBy: [{ fieldname: "documentNameCount", type: "DESC" }] }, (c) => {
                            if (c.status) {
                                if (c.data.length > 0) {
                                    let existingData = c.data.filter(f => f.id == d.documents.id)
                                    if (existingData.length == 0) {
                                        file.documentNameCount = c.data[0].documentNameCount + 1
                                        resolve(file)
                                    }
                                } else {
                                    file.projectNameCount = 0;
                                    resolve(file)
                                }
                            } else {
                                reject()
                            }
                        });
                    });
                });

                Promise.all(newData).then((values) => {
                    nextThen(values);
                });
            }).then((nextThen, result) => {
                let tempResData = [];
                if (result.length > 0) {
                    tempResData = result.map(file => {
                        let tagList = file.tags;

                        return new Promise((resolve, reject) => {
                            document.postData("document", _.omit(file, ['tags']), (c) => {
                                if (typeof c.id != "undefined" && c.id > 0) {
                                    document.getData("document", { id: c.id }, {}, (e) => {
                                        if (e.data.length > 0) {
                                            if (typeof tagList != "undefined") {
                                                JSON.parse(tagList).map(t => {
                                                    let tag = global.initModel("tag")
                                                    let tagData = { linkType: t.value.split("-")[0], linkId: t.value.split("-")[1], tagType: "document", tagTypeId: e.data[0].id }
                                                    tag.postData("tag", tagData, (tagRes) => {
                                                        if (tagRes.status) {
                                                        } else {
                                                            console.log("tag failed")
                                                        }
                                                    })
                                                })
                                            }
                                            let documentLink = global.initModel("document_link")
                                            let linkData = { documentId: e.data[0].id, linkType: "project", linkId: d.project }
                                            documentLink.postData("document_link", linkData, (l) => {
                                            })

                                            resolve(e.data)
                                        } else {
                                            reject()
                                        }
                                    })
                                } else {
                                    reject()
                                }
                            })
                        });
                    });
                }

                Promise.all(tempResData).then((values) => {
                    let resData = []
                    if (values.length) {
                        values.map(e => { resData.push(e[0]) })
                        nextThen(resData)
                    } else {
                        socket.emit("RETURN_ERROR_MESSAGE", { message: "Saving failed. Please Try again later." })
                    }
                }).catch((error) => {
                    socket.emit("RETURN_ERROR_MESSAGE", { message: "Error in uploading document for the checklist." });
                })

            }).then((nextThen, result) => {
                let documentIds = result.map(e => { return e.id })
                if( typeof d.documentIds != "undefined" ){
                    documentIds = documentIds.concat(d.documentIds)
                }
                nextThen(result, JSON.stringify(documentIds))

            }).then((nextThen, result, documentIds) => {
                let taskCheckList = global.initModel("task_checklist");
                if (typeof d.data.id != "undefined" && d.data.id != "") {
                    taskCheckList.putData("task_checklist", { ...d.data, documents: documentIds }, { id: d.data.id }, (c) => {
                        if (c.status) {
                            taskCheckList.getData("task_checklist", { id: d.data.id }, {}, (c) => {
                                let taskCheckListDetails = c.data[0];

                                if (d.data.isPeriodicTask == 1) {
                                    let checkListPeriodId = (d.data.periodChecklist != null) ? d.data.periodChecklist : d.data.id;

                                    task.getData("task", {
                                        periodTask: d.data.periodTask,
                                        dueDate: { value: moment(d.data.taskDueDate).format('YYYY-MM-DD HH:mm:ss'), condition: " > " }
                                    }, {}, (e) => {
                                        const taskPromise = _.map(e.data, (task) => {
                                            return new Promise((resolve, reject) => {
                                                taskCheckList.putData("task_checklist", _.omit(d.data, ['id', 'taskId', 'periodChecklist']), { periodChecklist: checkListPeriodId, taskId: task.id }, (c) => {
                                                    taskCheckList.getData("task_checklist", { periodChecklist: checkListPeriodId, taskId: task.id }, {}, (e) => {
                                                        resolve(c);
                                                    });
                                                });
                                            });
                                        });
                                        Promise.all(taskPromise).then((values) => {
                                            socket.emit("FRONT_UPDATE_CHECK_LIST", { ...taskCheckListDetails, documents: d.documents })
                                        }).catch((err) => {
                                            socket.emit("RETURN_ERROR_MESSAGE", { message: "Error in updating checklist." });
                                        });
                                    });
                                } else {
                                    socket.emit("FRONT_UPDATE_CHECK_LIST", { ...taskCheckListDetails, documents: d.documents })
                                }
                            });
                        } else {
                            socket.emit("RETURN_ERROR_MESSAGE", { message: c.error.sqlMessage });
                        }
                    });
                } else {
                    taskCheckList.postData("task_checklist", { description: d.data.description, isDocument: d.data.isDocument, taskId: d.data.taskId, documents: documentIds, createdBy: d.data.createdBy }, (data) => {
                        if (data.status) {
                            taskCheckList.getData("task_checklist", { id: data.id }, {}, (c) => {
                                let taskDetails = c.data[0];

                                if (d.data.isPeriodicTask == 1) {
                                    task.getData("task", {
                                        periodTask: d.data.periodTask,
                                        dueDate: { value: moment(d.data.taskDueDate).format('YYYY-MM-DD HH:mm:ss'), condition: " > " }
                                    }, {}, (e) => {
                                        const taskPromise = _.map(e.data, (o) => {
                                            return new Promise((resolve, reject) => {
                                                taskCheckList.postData("task_checklist", { description: d.data.description, isDocument: d.data.isDocument, taskId: o.id, createdBy: d.data.createdBy, periodChecklist: taskDetails.id }, (data) => {
                                                    resolve(data);
                                                });
                                            });
                                        });

                                        Promise.all(taskPromise).then((values) => {
                                            socket.emit("FRONT_DOCUMENT_ADD", result);
                                            socket.emit("FRONT_SAVE_CHECK_LIST", { ...taskDetails, id: data.id, completed: 0, documents: d.documents, types: d.data.types });
                                        });
                                    });
                                } else {
                                    socket.emit("FRONT_DOCUMENT_ADD", result);
                                    socket.emit("FRONT_SAVE_CHECK_LIST", { ...taskDetails, id: data.id, completed: 0, documents: d.documents, types: d.data.types });
                                }
                            });
                        } else {
                            if (data.error) { socket.emit("RETURN_ERROR_MESSAGE", { message: data.error.sqlMessage }) }
                        }
                    });
                }
            });
        } else {
            let taskCheckList = global.initModel("task_checklist");
            let task = global.initModel("task");

            if (typeof d.data.id != "undefined" && d.data.id != "") {
                if (typeof d.data.completed != "undefined") {
                    taskCheckList.putData("task_checklist", { ...d.data }, { id: d.data.id }, (data) => {
                        taskCheckList.getData("task_checklist", { id: d.data.id }, {}, (c) => {
                            socket.emit("FRONT_UPDATE_CHECK_LIST", { ...c.data[0], action: "complete" })
                        })
                    });
                } else {
                    async.parallel({
                        checklist: (parallelCallback) => {
                            taskCheckList.putData("task_checklist", { ...d.data, documents: "" }, { id: d.data.id }, (c) => {
                                taskCheckList.getData("task_checklist", { id: d.data.id }, {}, (e) => {
                                    parallelCallback(null, e.data[0]);
                                });
                            });
                        },
                        periodic: (parallelCallback) => {
                            if (d.data.isPeriodicTask == 1) {
                                let checkListPeriodId = (d.data.periodChecklist != null) ? d.data.periodChecklist : d.data.id;

                                task.getData("task", {
                                    periodTask: d.data.periodTask,
                                    dueDate: { value: moment(d.data.taskDueDate).format('YYYY-MM-DD HH:mm:ss'), condition: " > " }
                                }, {}, (e) => {
                                    const taskPromise = _.map(e.data, (task) => {
                                        return new Promise((resolve, reject) => {
                                            taskCheckList.putData("task_checklist", _.omit(d.data, ['id', 'taskId', 'periodChecklist']), { periodChecklist: checkListPeriodId, taskId: task.id }, (c) => {
                                                resolve(c);
                                            });
                                        });
                                    });

                                    Promise.all(taskPromise).then((values) => {
                                        parallelCallback(null, values);
                                    }).catch((err) => {
                                        socket.emit("RETURN_ERROR_MESSAGE", { message: "Error in updating checklist." });
                                    });

                                });
                            } else {
                                parallelCallback(null, "");
                            }
                        }
                    }, (error, data) => {
                        socket.emit("FRONT_UPDATE_CHECK_LIST", { ...data.checklist, types: d.data.types })
                    })
                }
            } else {
                taskCheckList.postData("task_checklist", { description: d.data.description, isDocument: d.data.isDocument, taskId: d.data.taskId, createdBy: d.data.createdBy }, (data) => {
                    if (data.status) {
                        taskCheckList.getData("task_checklist", { id: data.id }, {}, (c) => {
                            let taskCheckListDetails = c.data[0];

                            if (d.data.isPeriodicTask == 1) {
                                task.getData("task", {
                                    periodTask: d.data.periodTask,
                                    dueDate: { value: moment(d.data.taskDueDate).format('YYYY-MM-DD HH:mm:ss'), condition: " > " }
                                }, {}, (e) => {
                                    const taskPromise = _.map(e.data, (o) => {
                                        return new Promise((resolve, reject) => {
                                            taskCheckList.postData("task_checklist", { description: d.data.description, isDocument: d.data.isDocument, taskId: o.id, periodChecklist: data.id, createdBy: d.data.createdBy }, (data) => {
                                                resolve(data);
                                            });
                                        });
                                    });

                                    Promise.all(taskPromise).then((values) => {
                                        socket.emit("FRONT_SAVE_CHECK_LIST", { ...taskCheckListDetails, id: data.id, completed: 0, types: d.data.types })
                                    });
                                });
                            } else {
                                socket.emit("FRONT_SAVE_CHECK_LIST", { ...taskCheckListDetails, id: data.id, completed: 0, types: d.data.types })
                            }
                        });
                    } else {
                        if (c.error) { socket.emit("RETURN_ERROR_MESSAGE", { message: data.error.sqlMessage }) }
                    }
                });
            }
        }
    });

    socket.on("DELETE_CHECKLIST", (d) => {
        let task = global.initModel("task");
        let taskCheckList = global.initModel("task_checklist");

        taskCheckList.getData("task_checklist", { id: d.data }, {}, (c) => {
            const periodChecklist = (c.data[0].periodChecklist != null) ? c.data[0].periodChecklist : c.data[0].id;
            const checklistTaskId = c.data[0].taskId;

            taskCheckList.getData("task_checklist", {
                periodChecklist: periodChecklist,
                taskId: { value: checklistTaskId, condition: " > " }
            }, {}, (e) => {
                taskCheckList.deleteData("task_checklist", { id: d.data }, (c) => {
                    if ((e.data.length > 0)) {
                        let checklistDeletePromises = _.map(e.data, (checklistObj, index) => {
                            return new Promise((resolve, reject) => {
                                taskCheckList.deleteData("task_checklist", { id: checklistObj.id }, (c) => {
                                    resolve(c);
                                });
                            });
                        });

                        Promise.all(checklistDeletePromises).then((values) => {
                            socket.emit("FRONT_CHECKLIST_DELETED", { id: d.data });
                        }).catch((err) => {
                            socket.emit("RETURN_ERROR_MESSAGE", { message: "Error in updating checklist." });
                        });

                    } else {
                        socket.emit("FRONT_CHECKLIST_DELETED", { id: d.data });
                    }
                });
            });
        })
    });
}