var func = global.initFunc(),
    sequence = require("sequence").Sequence;

var init = exports.init = (socket) => {

    socket.on("GET_STATUS_LIST",(d) => {
        let model = global.initModel("status")
        let filter = (typeof d.filter != "undefined")?d.filter:{};
        model.getData("status",filter,{},(c)=>{
            if(c.status) {
                socket.emit("FRONT_STATUS_LIST",c.data)
            }else{
                if(c.error) { socket.emit("RETURN_ERROR_MESSAGE",{message:c.error.sqlMessage}) }
            }
        })
    })
}