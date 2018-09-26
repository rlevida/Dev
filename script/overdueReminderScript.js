var schedule = require('node-schedule'),
    sequence = require("sequence").Sequence,
    async = require("async"),
    moment = require("moment"),
    _ = require("lodash");
/**
 * 
 * Comment : Manage reminder for overdue task
 *   *    *    *    *    *    *
 *   s    i    H    DM    M   DW 
 * 
 **/
var j = schedule.scheduleJob('0 0 * * *', () => {
    const task = global.initModel("task");
    const reminder = global.initModel("reminder");
    const members = global.initModel("members");
    const taskDependency = global.initModel("task_dependency");
    let dateToday = new Date();

    task.getTaskOverdue((ret) => {
        if (ret.data.length > 0) {
            const dataToBeProcessed = _.map(ret.data, (e, i) => {
                return new Promise((resolve, reject) => {
                    async.parallel({
                        reminder: (parallelCallback) => {
                            sequence.create().then((nextThen) => {
                                task.getTaskOverdue((ret) => {
                                    if (ret.data.length > 0) {
                                        async.map(ret.data, (e, mapCallback) => {
                                            reminder.postData("reminder", {
                                                taskId: e.id,
                                                usersId: e.usersId,
                                                reminderDetail: "Task Overdue"
                                            }, () => { mapCallback(null) })

                                        }, (err, result) => {
                                            nextThen(ret)
                                        });
                                    }
                                })
                            }).then((nextThen, result) => {
                                let taskIds = result.data.map((e, index) => { return e.workstreamId })
                                members.getWorkstreamResponsible(taskIds, (responsible) => {
                                    if (responsible.data.length > 0) {
                                        async.map(responsible.data, (e, mapCallback) => {
                                            reminder.postData("reminder", {
                                                taskId: e.taskId,
                                                usersId: e.usersId,
                                                reminderDetail: "Task Overdue"
                                            }, () => { mapCallback(null) })

                                        }, (err, res) => {
                                            nextThen(result)
                                        });
                                    }
                                })
                            }).then((nextThen, result) => {
                                let taskIds = result.data.map((e, index) => { return e.id })
                                members.getTaskFollower(taskIds, (responsible) => {
                                    if (responsible.data.length > 0) {
                                        async.map(responsible.data, (e, mapCallback) => {
                                            reminder.postData("reminder", {
                                                taskId: e.taskId,
                                                usersId: e.usersId,
                                                reminderDetail: "Task Overdue"
                                            }, () => { mapCallback(null) })

                                        }, (err, res) => {
                                            resolve(result)
                                        });
                                    }
                                })
                            })
                        },
                        periodic: (parallelCallback) => {
                            if (e.periodic == 1) {
                                const taskId = (e.periodTask == null) ? e.id : e.periodTask;
                                const nextDueDate = moment(e.dueDate).add(e.periodType, e.period).format('YYYY-MM-DD HH:mm:ss');
                                const newPeriodTask = { ...e, id: "", startDate: e.dueDate, dueDate: nextDueDate, periodTask: taskId, status: "In Progress" };


                                task.getData("task", { dueDate: nextDueDate, periodTask: taskId }, {}, (e) => {
                                    if ((e.data).length > 0) {
                                        parallelCallback(null, "");
                                    } else {
                                        task.postData("task", newPeriodTask, (c) => {
                                            async.parallel({
                                                members: (parallelCallback) => {
                                                    members.getData("members", { linkType: "task", linkId: taskId, memberType: "assignedTo" }, {}, (e) => {
                                                        if (e.status && e.data.length > 0) {
                                                            let assignedTo = { linkType: "task", linkId: c.id, usersType: "users", userTypeLinkId: e.data[0].userTypeLinkId, memberType: "assignedTo" };
                                                            members.postData("members", assignedTo, (c) => {
                                                                parallelCallback(null, e.data[0].userTypeLinkId);
                                                            });
                                                        } else {
                                                            parallelCallback(null, "")
                                                        }
                                                    });
                                                },
                                                dependency: (parallelCallback) => {
                                                    taskDependency.getData("task_dependency", { taskId: taskId }, {}, (e) => {
                                                        if (e.status && e.data.length > 0) {
                                                            async.map(e.data, (task, mapCallback) => {
                                                                taskDependency.postData("task_dependency", {
                                                                    taskId: c.id,
                                                                    dependencyType: task.dependencyType,
                                                                    linkTaskId: task.linkTaskId
                                                                }, (c) => {
                                                                    mapCallback(null)
                                                                });
                                                            }, (err, results) => {
                                                                parallelCallback(null, results)
                                                            });
                                                        } else {
                                                            parallelCallback(null, "")
                                                        }
                                                    });
                                                }
                                            }, (err, result) => {
                                                parallelCallback(null, { ...c, result })
                                            })
                                        })
                                    }
                                });
                            } else {
                                parallelCallback(null, "");
                            }
                        }
                    }, (error, result) => {
                        if (error != null) {
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    })
                })

            });

            Promise.all(dataToBeProcessed).then((values) => {
                console.log(values)
            }).catch((err) => { })
        }
    })
});