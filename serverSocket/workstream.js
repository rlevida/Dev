var func = global.initFunc(),
    sequence = require("sequence").Sequence;

var init = exports.init = (socket) => {

    socket.on("GET_WORKSTREAM_LIST",(d) => {
        let workstream = global.initModel("workstream")
        let filter = (typeof d.filter != "undefined")?d.filter:{};
        workstream.getData("workstream",filter,{},(c)=>{
            if(c.status) {
                socket.emit("FRONT_WORKSTREAM_LIST",c.data)
            }else{
                if(c.error) { socket.emit("RETURN_ERROR_MESSAGE",{message:c.error.sqlMessage}) }
            }
        })
    })
    
    socket.on("GET_WORKSTREAM_DETAIL",(d) => {
        let workstream = global.initModel("workstream")
        workstream.getData("workstream",{id:d.id},{},(c)=>{
            if(c.data.length > 0) {
                socket.emit("FRONT_WORKSTREAM_SELECTED",c.data[0])
            }
        })
    })
    socket.on("SAVE_OR_UPDATE_WORKSTREAM",(d) => {
        let workstream = global.initModel("workstream")
        if( typeof d.data.id != "undefined" && d.data.id != "" ){
            let id = d.data.id
            delete d.data.id
            workstream.putData("workstream",d.data,{id:id},(c)=>{
                if(c.status) {
                    workstream.getData("workstream",{id:id},{},(e)=>{
                        if(e.data.length > 0) {
                            socket.emit("FRONT_WORKSTREAM_EDIT",e.data[0])
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
            workstream.postData("workstream",d.data,(c)=>{
                if(typeof c.id != "undefined" && c.id > 0) {
                    workstream.getData("workstream",{id:c.id},{},(e)=>{
                        if(e.data.length > 0) {
                            socket.emit("FRONT_WORKSTREAM_ADD",e.data)
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

    socket.on("DELETE_WORKSTREAM",(d) => {
        let workstream = global.initModel("workstream")
        let members = global.initModel("members")

        workstream.getData("workstream",{},{},(b)=>{
            workstream.deleteData("workstream",{id:d.id},(c)=>{
                if(c.status) {
                    members.deleteData("workstream",{linkId:d.id, linkType:'workstream'},(c)=>{
                        socket.emit("FRONT_WORKSTREAM_DELETED",{id:d.id})
                    });
                }else{
                    socket.emit("RETURN_ERROR_MESSAGE","Delete failed. Please try again later.")
                }
            })
        })
    })
}