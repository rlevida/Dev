var func = global.initFunc(),
    sequence = require("sequence").Sequence;

var init = exports.init = (socket) => {

    socket.on("GET_COMMENT_LIST",(d) => {
        let conversation = global.initModel("conversation")
        let filter = (typeof d.filter != "undefined") ? d.filter : {};
        conversation.getData("conversation", filter ,{},(c)=>{
            if(c.status) {
                socket.emit("FRONT_COMMENT_LIST",c.data)
            }else{
                if(c.error) { socket.emit("RETURN_ERROR_MESSAGE",{message:c.error.sqlMessage}) }
            }

        })
    })

    socket.on("SAVE_OR_UPDATE_CONVERSATION",(d) => {
        let conversation = global.initModel("conversation")
        sequence.create().then((nextThen) => {
            if( typeof d.data.id != "undefined" && d.data.id != "" ){
              
            }else{
                conversation.postData("conversation",d.data,(c)=>{
                    conversation.getData("conversation",{id:c.id},{},(e)=>{
                        if(e.data.length > 0) {
                            nextThen(e.data , "Add")
                        }
                    })
                })
            }
        }).then((nextThen,result,action) => {
            if(JSON.parse(d.reminderList).length){
                let filter = (typeof d.filter != "undefined") ? d.filter : {};
                let reminder = global.initModel("reminder");
                let tempResData = []
                tempResData.push( new Promise((resolve,reject) => {
                    JSON.parse(d.reminderList).map( r =>{
                        let data = { ...d.reminder , usersId : r.userId } 
                        reminder.postData("reminder", data ,(res)=>{
                            if(res.status) {
                                filter.usersId = r.userId
                                reminder.getReminderList(filter,(e)=>{
                                    if(e.data.length > 0) {
                                        resolve(e.data)
                                    }else{
                                        reject()
                                    }
                                })
                            }else{
                                reject()
                            }
                        })
                    })
                }))

                Promise.all(tempResData).then((values)=>{
                    socket.emit("FRONT_REMINDER_LIST", values)
                    
                    if(action == "Edit"){
                        socket.emit("FRONT_CONVERSATION_EDIT",result)
                        socket.emit("RETURN_SUCCESS_MESSAGE",{message:"Successfully updated"})
                    }else{
                        socket.emit("FRONT_COMMENT_ADD",result)
                    }
                })
            }else{
                if(action == "Edit"){
                    socket.emit("FRONT_CONVERSATION_EDIT",result)
                    socket.emit("RETURN_SUCCESS_MESSAGE",{message:"Successfully updated"})
                }else{
                    socket.emit("FRONT_COMMENT_ADD",result)
                }
            }
        })
    })
}