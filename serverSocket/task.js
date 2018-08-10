var func = global.initFunc(),
    sequence = require("sequence").Sequence;

var init = exports.init = (socket) => {

    socket.on("GET_TASK_LIST",(d) => {
        let task = global.initModel("task")
        let filter = (typeof d.filter != "undefined")?d.filter:{};
        task.getData("task",filter,{},(c)=>{
            if(c.status) {
                socket.emit("FRONT_TASK_LIST",c.data)
            }else{
                if(c.error) { socket.emit("RETURN_ERROR_MESSAGE",{message:c.error.sqlMessage}) }
            }
        })
    })

    socket.on("GET_TASK_COUNT_LIST",(d) => {
        let task = global.initModel("task")
        let filter = (typeof d.filter != "undefined")?d.filter:{};
        task.getDataCount("task",filter,{},(c)=>{
            if(c.status) {
                socket.emit("FRONT_TASK_COUNT_LIST",c.data)
            }else{
                if(c.error) { socket.emit("RETURN_ERROR_MESSAGE",{message:c.error.sqlMessage}) }
            }
        })
    })

    socket.on("GET_ALL_TASK_COUNT_LIST",(d) => {
        let task = global.initModel("task")
        let filter = (typeof d.filter != "undefined")?d.filter:{};
        task.getUserTaskDataCount("task",filter,{},(c)=>{
            if(c.status) {
                socket.emit("FRONT_ALL_TASK_COUNT_LIST",c.data)
            }else{
                if(c.error) { socket.emit("RETURN_ERROR_MESSAGE",{message:c.error.sqlMessage}) }
            }
        })
    })
    
    socket.on("GET_TASK_DETAIL",(d) => {
        sequence.create().then((nextThen)=>{
            let task = global.initModel("task")
            task.getData("task",{id:d.id},{},(c)=>{
                if(c.data.length > 0) {
                    nextThen(c.data[0])
                }
            })
        }).then((nextThen,data)=>{
            let members = global.initModel("members")
            members.getData("members",{linkType:"task",linkId:data.id,usersType:"users",memberType:"assignedTo"},{},(e)=>{
                if(e.data.length > 0){
                    data.assignedTo = e.data[0].userTypeLinkId;
                }

                socket.emit("FRONT_TASK_SELECTED",data)
            })
        })
    })
    socket.on("SAVE_OR_UPDATE_TASK",(d) => {
        sequence.create().then((nextThen)=>{
            let task = global.initModel("task")
            if( typeof d.data.id != "undefined" && d.data.id != "" ){
                let id = d.data.id
                delete d.data.id
                task.putData("task",d.data,{id:id},(c)=>{
                    if(c.status) {
                        task.getData("task",{id:id},{},(e)=>{
                            if(e.data.length > 0) {
                                nextThen(e.data[0].id,"edit",e.data[0])
                            }else{
                                socket.emit("RETURN_ERROR_MESSAGE",{message:"Updating failed. Please Try again later."})
                            }
                        })
                    }else{
                        socket.emit("RETURN_ERROR_MESSAGE",{message:"Updating failed. Please Try again later."})
                    }
                })
            }else{
                task.postData("task",d.data,(c)=>{
                    if(typeof c.id != "undefined" && c.id > 0) {
                        task.getData("task",{id:c.id},{},(e)=>{
                            if(e.data.length > 0) {
                                nextThen(e.data.id,"add",e.data)
                            }else{
                                socket.emit("RETURN_ERROR_MESSAGE",{message:"Saving failed. Please Try again later."})
                            }
                        })
                    }else{
                        socket.emit("RETURN_ERROR_MESSAGE",{message:"Saving failed. Please Try again later."})
                    }
                })
            }
        }).then((nextThen,id,type,data)=>{
            if(d.data.assignedTo){
                let members = global.initModel("members")
                members.getData("members",{linkType:"task",linkId:d.data.id,usersType:"users",userTypeLinkId:d.data.assignedTo,memberType:"assignedTo"},{},(e)=>{
                    if(e.data.length > 0){
                         data.assignedTo = e.data[0].userTypeLinkId
                    }else{
                        members.deleteData("members",{linkType:"task",linkId:id,usersType:"users",memberType:"assignedTo"},(c)=>{
                            let assignedTo = {linkType:"task",linkId:data.id,usersType:"users",userTypeLinkId:d.data.assignedTo,memberType:"assignedTo"};
                            members.postData("members",assignedTo,(c)=>{
                                data.assignedTo = d.data.assignedTo
                                nextThen(type,data)
                            })
                        })
                    }
                })
            }else{
                nextThen(type,data)
            }
        }).then((nextThen,type,data)=>{
            if(type=="edit"){
                socket.emit("FRONT_TASK_EDIT",data)
                socket.emit("RETURN_SUCCESS_MESSAGE",{message:"Successfully updated"})
            }else{
                socket.emit("FRONT_TASK_ADD",data)
                socket.emit("RETURN_SUCCESS_MESSAGE",{message:"Successfully updated"})
            }
        })
        
    })

    socket.on("DELETE_TASK",(d) => {
        let task = global.initModel("task")

        task.getData("task",{},{},(b)=>{
            task.deleteData("task",{id:d.id},(c)=>{
                if(c.status) {
                    socket.emit("FRONT_TASK_DELETED",{id:d.id})
                }else{
                    socket.emit("RETURN_ERROR_MESSAGE","Delete failed. Please try again later.")
                }
            })
        })
    })
}