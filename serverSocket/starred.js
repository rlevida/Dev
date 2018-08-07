var func = global.initFunc(),
    sequence = require("sequence").Sequence;

var init = exports.init = (socket) => {

    socket.on("GET_STARRED_LIST",(d) => {
        let starred = global.initModel("starred")
        let filter = (typeof d.filter != "undefined")?d.filter:{};
        starred.getData("starred",filter,{},(c)=>{
            if(c.status) {
                socket.emit("FRONT_STARRED_LIST",c.data)
            }else{
                if(c.error) { socket.emit("RETURN_ERROR_MESSAGE",{message:c.error.sqlMessage}) }
            }
        })
    })
    
    socket.on("SAVE_STARRED",(d) => {
        let starred = global.initModel("starred")
        starred.postData("starred",d.data,(c)=>{
            if(typeof c.id != "starred" && c.id > 0) {
                starred.getData("starred",{},{},(e)=>{
                    if(e.data.length > 0) {
                        socket.emit("FRONT_STARRED_LIST",e.data)
                    }else{
                        if(c.error) { socket.emit("RETURN_ERROR_MESSAGE",{message:c.error.sqlMessage}) }
                    }
                })
            }else{
                if(c.error) { socket.emit("RETURN_ERROR_MESSAGE",{message:c.error.sqlMessage}) }
            }
        })
    })

    socket.on("DELETE_STARRED",(d) => {
        let starred = global.initModel("starred")
        starred.getData("starred",{},{},(b)=>{
            starred.deleteData("starred",{linkId:d.id},(c)=>{
                if(c.status) {
                    socket.emit("FRONT_DELETE_STARRED",{ id:d.id })
                }else{
                    socket.emit("RETURN_ERROR_MESSAGE","Delete failed. Please try again later.")
                }
            })
        })
    })
}