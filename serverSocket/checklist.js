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
        if(typeof d.documents != "undefined"){
            let document = global.initModel("document")
            let filter = (typeof d.filter != "undefined") ? d.filter : {};
            sequence.create().then((nextThen) => {
                let newData = [];
                if(d.documents.length > 0 ){
                    d.documents.map( file => { 
                        newData.push( new Promise((resolve,reject) => {
                            document.getData("document", { origin: file.origin }, { orderBy: [{ fieldname: "documentNameCount", type: "DESC" }] }, (c) => {
                                if(c.status){
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
                                }else{
                                    reject()
                                }
                            })
                        }))
                    })

                    Promise.all(newData).then((values)=>{
                        nextThen(values)
                    })
                }

            }).then((nextThen,result) => {
                let tempResData = [];
                if(result.length > 0){
                    result.map( file => {        
                        let tagList = file.tags
                        delete file.tags        
                        tempResData.push( new Promise((resolve,reject) => {
                            document.postData("document",file,(c)=>{
                                if(typeof c.id != "undefined" && c.id > 0) {
                                    document.getData("document",{id:c.id},{},(e)=>{
                                        if(e.data.length > 0) {
                                            if(typeof tagList != "undefined"){
                                                JSON.parse(tagList).map( t => {
                                                    let tag = global.initModel("tag")
                                                    let tagData = { linkType : t.value.split("-")[0], linkId : t.value.split("-")[1] , tagType : "document" , tagTypeId : e.data[0].id }
                                                        tag.postData("tag",tagData,(tagRes) =>{
                                                            if(tagRes.status){
                                                            }else{
                                                                console.log("tag failed")
                                                            }
                                                        })
                                                })
                                                }
                                            let documentLink = global.initModel("document_link")
                                            let linkData = { documentId : e.data[0].id , linkType : "project", linkId: d.project } 
                                                documentLink.postData("document_link",linkData ,(l)=>{
                                                })
                                            
                                            resolve(e.data)
                                        }else{
                                            reject()
                                        }
                                    })
                                }else{
                                    reject()
                                }
                            })
                        }))
                    })
                }
                
                Promise.all(tempResData).then((values)=>{
                    let resData = []
                    if(values.length){
                        values.map( e =>{ resData.push(e[0]) })
                        nextThen(resData)
                    }else{
                        socket.emit("RETURN_ERROR_MESSAGE",{message:"Saving failed. Please Try again later."})
                    }
                })
            }).then((nextThen,result) =>{
                let documentIds = result.map( e =>{ return e.id} )
                    nextThen(result,JSON.stringify(documentIds))
            }).then((nextThen,result,documentIds) =>{

                let taskCheckList = global.initModel("task_checklist");
                let taskCheckListType = global.initModel("checklist_type");

                if (typeof d.data.id != "undefined" && d.data.id != "") {
                    taskCheckList.putData("task_checklist", d.data, { id: d.data.id }, (c) => {
                        socket.emit("FRONT_UPDATE_CHECK_LIST", d.data)
                    });
                } else {
                    taskCheckList.postData("task_checklist", { description: d.data.description, taskId: d.data.taskId , documents : documentIds}, (data) => {
                        async.map(d.data.types, (o, mapCallback) => {
                            taskCheckListType.postData("checklist_type", { type: o.value, checklistId: data.id }, (res) => {
                                mapCallback(null);
                            });
                        }, (err, res) => {
                            socket.emit("FRONT_DOCUMENT_ADD",result)
                            socket.emit("FRONT_SAVE_CHECK_LIST", { ...d.data, id: data.id, completed: 0 , documents : documentIds})
                        });
                    });
                }
            })    
        }else{
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