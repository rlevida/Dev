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
    
    socket.on("GET_TASK_DETAIL",(d) => {
        let task = global.initModel("task")
        task.getData("task",{id:d.id},{},(c)=>{
            if(c.data.length > 0) {
                socket.emit("FRONT_TASK_SELECTED",c.data[0])
            }
        })
    })
    socket.on("SAVE_OR_UPDATE_TASK",(d) => {
        let task = global.initModel("task")
        if( typeof d.data.id != "undefined" && d.data.id != "" ){
            let id = d.data.id
            delete d.data.id
            task.putData("task",d.data,{id:id},(c)=>{
                if(c.status) {
                    task.getData("task",{id:id},{},(e)=>{
                        if(e.data.length > 0) {
                            socket.emit("FRONT_TASK_EDIT",e.data[0])
                            socket.emit("RETURN_SUCCESS_MESSAGE",{message:"Successfully updated"})
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
                            socket.emit("FRONT_TASK_ADD",e.data)
                            socket.emit("RETURN_SUCCESS_MESSAGE",{message:"Successfully updated"})
                        }else{
                            socket.emit("RETURN_ERROR_MESSAGE",{message:"Saving failed. Please Try again later."})
                        }
                    })
                }else{
                    socket.emit("RETURN_ERROR_MESSAGE",{message:"Saving failed. Please Try again later."})
                }
            })
        }
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