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
        let tempResData = []
        if( typeof d.data.id != "undefined" && d.data.id != "" ){
            let id = d.data.id
            delete d.data.id
            document.putData("conversation",d.data,{id:id},(c)=>{
                if(c.status) {
                    document.getData("conversation",{id:id},{},(e)=>{
                        if(e.data.length > 0) {
                            socket.emit("FRONT_CONVERSATION_EDIT",e.data[0])
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
            conversation.postData("conversation",d.data,(c)=>{
                conversation.getData("conversation",{id:c.id},{},(e)=>{
                    if(e.data.length > 0) {
                        socket.emit("FRONT_COMMENT_ADD",e.data)
                    }
                })
            })
        }
    })
}