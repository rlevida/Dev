const sequence = require("sequence").Sequence,
        async  = require("async")

const dbName = "task";
var { defaultGet, defaultGetId, defaultPost, defaultPut, defaultDelete } = require("./")

exports.get = {
    index : (req,cb) => {
        defaultGet(dbName,req,(res)=>{
            if(res.status){
                cb({ status:true, data:res.data })
            }else{
                cb({ status:false, error:res.error })
            }
        })
    },
    getById : (req,cb) => {
        defaultGetById(dbName,req,(res)=>{
            if(res.status){
                cb({ status:true, data:res.data })
            } else {
                cb({ status:false, error:res.error })
            }
        })
    },
    getTaskDetails : (req,cb) => {
        let d = req.query
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
                cb({ status: true , data: dataObject })
                // socket.emit("FRONT_TASK_SELECTED", dataObject)
            });
        })
    },
    getTaskList: (req,cb) => {
        let d = req.query
        let task = global.initModel("task")
        let taskDependencies = global.initModel("task_dependency")
        let filter = (typeof d.filter != "undefined")?JSON.parse(d.filter):{};
        task.getTaskList("task", filter, {}, (c) => {
            async.map(c.data, (o, mapCallback) => {
                taskDependencies.getData("task_dependency", { taskId: o.id }, {}, (results) => {
                    mapCallback(null, { ...o, dependencies: results.data })
                });
            }, (err, result) => {
                cb({ status: true , data: result})
            });
        })
    }
}

exports.post = {
    index : (req,cb) => {
        defaultPost(dbName,req,(res)=>{
            if(res.success){
                cb({ status:true, data:res.data })
            }else{
                cb({ status:false, error:res.error })
            }
        })
    }
}

exports.put = {
    index : (req,cb) => {
        defaultPut(dbName,req,(res)=>{
            if(res.success){
                cb({ status:true, data:res.data })
            } else {
                cb({ status:false, error:c.error })
            }
        })
    }
}

exports.delete =  {
    index : (req,cb) => {
        defaultDelete(dbName,req,(res)=>{
            if(res.success){
                cb({ status:true, data:res.data })
            } else {
                cb({ status:false, error:res.error })
            }
        })
    }
}