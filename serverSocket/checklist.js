var func = global.initFunc(),
    sequence = require("sequence").Sequence,
    async = require("async"),
    _ = require("lodash"),
    moment = require("moment");

var init = exports.init = (socket) => {

    socket.on("GET_CHECK_LIST", (d) => {
        let taskCheckList = global.initModel("task_checklist")
        let filter = (typeof d.filter != "undefined") ? d.filter : {};
        let taskCheckListType = global.initModel("checklist_type");
        let document = global.initModel("document");
        let tag = global.initModel("tag");

        taskCheckList.getData("task_checklist", filter, {}, (c) => {
            async.parallel({
                types: (parallelCallback) => {
                    taskCheckListType.getData("checklist_type", {
                        checklistId: { value: _.map(c.data, (o) => { return o.id }), condition: " IN " }
                    }, {}, (e) => {
                        if (e.status) {
                            parallelCallback(null, e.data)
                        } else {
                            parallelCallback(e.error.sqlMessage)
                        }
                    });
                },
                documents: (parallelCallback) => {
                    let documents = _(c.data)
                        .filter((o) => { return o.documents != null || o.documents != "" })
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
                            parallelCallback(err);
                        } else {
                            let documentList = _(result.documentData)
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
                            parallelCallback(null, documentList)
                        }
                    })
                }
            }, (err, result) => {
                if (err != null) {
                    socket.emit("RETURN_ERROR_MESSAGE", { message: "Error Fetching checklist data." })
                } else {
                    const resultList = _.map(c.data, (checklist) => {
                        const checkListTypes = _(result.types).filter((o) => { return o.checklistId == checklist.id })
                            .map((o) => { return { value: o.type } })
                            .value();
                        const documents = (checklist.documents != null || checklist.documents != "") ?
                            _(result.documents).filter((doc) => {
                                return _.findIndex(JSON.parse(checklist.documents), (o) => { return o == doc.id }) >= 0
                            })
                                .map((o) => { return { ...(_.omit(o, ['id'])), project: checklist.task_projectId } })
                                .value()
                            : []
                        return { ...checklist, types: checkListTypes, documents }
                    })
                    socket.emit("FRONT_CHECK_LIST", resultList);
                }
            });
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
                nextThen(result, JSON.stringify(documentIds))
            }).then((nextThen, result, documentIds) => {
                let taskCheckList = global.initModel("task_checklist");
                let taskCheckListType = global.initModel("checklist_type");

                if (typeof d.data.id != "undefined" && d.data.id != "") {
                    taskCheckList.putData("task_checklist", d.data, { id: d.data.id }, (c) => {
                        if (c.status) {
                            taskCheckList.getData("task_checklist", { id: d.data.id }, {}, (c) => {
                                let taskDetails = c.data[0];

                                async.parallel({
                                    checklist: (parallelCallback) => {
                                        taskCheckListType.deleteData("checklist_type", { checklistId: d.data.id }, (res) => {
                                            if (res.status) {
                                                taskCheckList.putData("task_checklist", { ...d.data, documents: documentIds }, { id: d.data.id }, (c) => {
                                                    if ((d.data.types).length > 0) {
                                                        const checkListType = _.map(d.data.types, (o) => {
                                                            return new Promise((resolve, reject) => {
                                                                taskCheckListType.postData("checklist_type", { type: o.value, checklistId: d.data.id }, (res) => {
                                                                    if (res.status) {
                                                                        resolve(res);
                                                                    } else {
                                                                        reject(res.error.sqlMessage);
                                                                    }
                                                                });
                                                            });
                                                        });

                                                        Promise.all(checkListType).then((values) => {
                                                            taskCheckList.getData("task_checklist", { id: d.data.id }, {}, (e) => {
                                                                parallelCallback(null, e.data[0]);
                                                            });
                                                        }).catch((err) => {
                                                            socket.emit("RETURN_ERROR_MESSAGE", { message: "Error in updating checklist." });
                                                        });

                                                    } else {
                                                        taskCheckList.getData("task_checklist", { id: d.data.id }, {}, (e) => {
                                                            parallelCallback(null, e.data[0])
                                                        })
                                                    }
                                                });
                                            } else {
                                                parallelCallback(res.error.sqlMessage);
                                            }
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
                                                            taskCheckList.getData("task_checklist", { periodChecklist: checkListPeriodId, taskId: task.id }, {}, (e) => {
                                                                taskCheckListType.deleteData("checklist_type", { checklistId: e.data[0].id }, (res) => {
                                                                    if ((d.data.types).length > 0) {
                                                                        async.map(d.data.types, (o, mapCallback) => {
                                                                            taskCheckListType.postData("checklist_type", { type: o.value, checklistId: e.data[0].id }, (res) => {
                                                                                mapCallback(null);
                                                                            });
                                                                        }, (err, res) => {
                                                                            resolve(c);
                                                                        });
                                                                    } else {
                                                                        resolve(c);
                                                                    }
                                                                });
                                                            });
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
                                    socket.emit("FRONT_UPDATE_CHECK_LIST", { ...data.checklist, types: d.data.types, completed: 0, documents: d.documents })
                                });
                            });
                        } else {
                            socket.emit("RETURN_ERROR_MESSAGE", { message: c.error.sqlMessage })
                        }
                    });
                } else {
                    taskCheckList.postData("task_checklist", { description: d.data.description, taskId: d.data.taskId, documents: documentIds, createdBy: d.data.createdBy }, (data) => {
                        if (data.status) {
                            taskCheckList.getData("task_checklist", { id: data.id }, {}, (c) => {
                                let taskDetails = c.data[0];
                                async.parallel({
                                    types: (parallelCallback) => {
                                        if ((d.data.types).length > 0) {
                                            async.map(d.data.types, (o, mapCallback) => {
                                                taskCheckListType.postData("checklist_type", { type: o.value, checklistId: data.id }, (res) => {
                                                    mapCallback(null);
                                                });
                                            }, (err, res) => {
                                                parallelCallback(null, res);
                                            });
                                        } else {
                                            parallelCallback(null, "");
                                        }
                                    },
                                    periodic: (parallelCallback) => {
                                        if (d.data.isPeriodicTask == 1) {
                                            task.getData("task", {
                                                periodTask: d.data.periodTask,
                                                dueDate: { value: moment(d.data.taskDueDate).format('YYYY-MM-DD HH:mm:ss'), condition: " > " }
                                            }, {}, (e) => {
                                                const taskPromise = _.map(e.data, (o) => {
                                                    return new Promise((resolve, reject) => {
                                                        taskCheckList.postData("task_checklist", { description: d.data.description, taskId: o.id, createdBy: d.data.createdBy, periodChecklist: taskDetails.id }, (data) => {
                                                            if ((d.data.types).length > 0) {
                                                                async.map(d.data.types, (o, mapCallback) => {
                                                                    taskCheckListType.postData("checklist_type", { type: o.value, checklistId: data.id }, (res) => {
                                                                        mapCallback(null);
                                                                    });
                                                                }, (err, res) => {
                                                                    resolve(res);
                                                                });
                                                            } else {
                                                                resolve(data);
                                                            }
                                                        });
                                                    });
                                                });

                                                Promise.all(taskPromise).then((values) => {
                                                    parallelCallback(null, values);
                                                });
                                            });
                                        } else {
                                            parallelCallback(null, "");
                                        }
                                    }
                                }, (err, res) => {
                                    socket.emit("FRONT_DOCUMENT_ADD", result);
                                    socket.emit("FRONT_SAVE_CHECK_LIST", { ...taskDetails, id: data.id, completed: 0, documents: d.documents, types: d.data.types });
                                });
                            });
                        } else {
                            if (data.error) { socket.emit("RETURN_ERROR_MESSAGE", { message: data.error.sqlMessage }) }
                        }
                    });
                }
            });
        } else {
            let taskCheckList = global.initModel("task_checklist");
            let taskCheckListType = global.initModel("checklist_type");
            let task = global.initModel("task");

            if (typeof d.data.id != "undefined" && d.data.id != "") {
                if (typeof d.data.completed != "undefined") {
                    taskCheckList.putData("task_checklist", d.data, { id: d.data.id }, (data) => {
                        taskCheckList.getData("task_checklist", { id: d.data.id }, {}, (c) => {
                            socket.emit("FRONT_UPDATE_CHECK_LIST", { ...c.data[0], action: "complete" })
                        })
                    });
                } else {
                    async.parallel({
                        checklist: (parallelCallback) => {
                            taskCheckListType.deleteData("checklist_type", { checklistId: d.data.id }, (res) => {
                                if (res.status) {
                                    taskCheckList.putData("task_checklist", d.data, { id: d.data.id }, (c) => {
                                        if ((d.data.types).length > 0) {
                                            const checkListType = _.map(d.data.types, (o) => {
                                                return new Promise((resolve, reject) => {
                                                    taskCheckListType.postData("checklist_type", { type: o.value, checklistId: d.data.id }, (res) => {
                                                        if (res.status) {
                                                            resolve(res);
                                                        } else {
                                                            reject(res.error.sqlMessage);
                                                        }
                                                    });
                                                });
                                            });

                                            Promise.all(checkListType).then((values) => {
                                                taskCheckList.getData("task_checklist", { id: d.data.id }, {}, (e) => {
                                                    parallelCallback(null, e.data[0]);
                                                });
                                            }).catch((err) => {
                                                socket.emit("RETURN_ERROR_MESSAGE", { message: "Error in updating checklist." });
                                            });

                                        } else {
                                            taskCheckList.getData("task_checklist", { id: d.data.id }, {}, (e) => {
                                                parallelCallback(null, e.data[0])
                                            })
                                        }
                                    });
                                } else {
                                    parallelCallback(res.error.sqlMessage);
                                }
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
                                                taskCheckList.getData("task_checklist", { periodChecklist: checkListPeriodId, taskId: task.id }, {}, (e) => {
                                                    taskCheckListType.deleteData("checklist_type", { checklistId: e.data[0].id }, (res) => {
                                                        if ((d.data.types).length > 0) {
                                                            async.map(d.data.types, (o, mapCallback) => {
                                                                taskCheckListType.postData("checklist_type", { type: o.value, checklistId: e.data[0].id }, (res) => {
                                                                    mapCallback(null);
                                                                });
                                                            }, (err, res) => {
                                                                resolve(c);
                                                            });
                                                        } else {
                                                            resolve(c);
                                                        }
                                                    });
                                                });
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
                taskCheckList.postData("task_checklist", { description: d.data.description, taskId: d.data.taskId, createdBy: d.data.createdBy }, (data) => {
                    if (data.status) {
                        taskCheckList.getData("task_checklist", { id: data.id }, {}, (c) => {
                            let taskDetails = c.data[0];
                            async.parallel({
                                types: (parallelCallback) => {
                                    if ((d.data.types).length > 0) {
                                        async.map(d.data.types, (o, mapCallback) => {
                                            taskCheckListType.postData("checklist_type", { type: o.value, checklistId: data.id }, (res) => {
                                                mapCallback(null);
                                            });
                                        }, (err, res) => {
                                            parallelCallback(null, res);
                                        });
                                    } else {
                                        parallelCallback(null, "");
                                    }
                                },
                                periodic: (parallelCallback) => {
                                    if (d.data.isPeriodicTask == 1) {
                                        task.getData("task", {
                                            periodTask: d.data.periodTask,
                                            dueDate: { value: moment(d.data.taskDueDate).format('YYYY-MM-DD HH:mm:ss'), condition: " > " }
                                        }, {}, (e) => {
                                            const taskPromise = _.map(e.data, (o) => {
                                                return new Promise((resolve, reject) => {
                                                    taskCheckList.postData("task_checklist", { description: d.data.description, taskId: o.id, periodChecklist: data.id, createdBy: d.data.createdBy }, (data) => {
                                                        if ((d.data.types).length > 0) {
                                                            async.map(d.data.types, (o, mapCallback) => {
                                                                taskCheckListType.postData("checklist_type", { type: o.value, checklistId: data.id }, (res) => {
                                                                    mapCallback(null);
                                                                });
                                                            }, (err, res) => {
                                                                resolve(res);
                                                            });
                                                        } else {
                                                            resolve(data);
                                                        }
                                                    });
                                                });
                                            });

                                            Promise.all(taskPromise).then((values) => {
                                                parallelCallback(null, values);
                                            });
                                        });
                                    } else {
                                        parallelCallback(null, "");
                                    }
                                }
                            }, (err, result) => {
                                socket.emit("FRONT_SAVE_CHECK_LIST", { ...taskDetails, id: data.id, completed: 0, types: d.data.types })
                            });
                        });
                    } else {
                        if (c.error) { socket.emit("RETURN_ERROR_MESSAGE", { message: data.error.sqlMessage }) }
                    }
                });
            }
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