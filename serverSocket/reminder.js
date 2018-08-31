var func = global.initFunc(),
    sequence = require("sequence").Sequence;

var init = exports.init = (socket) => {

    socket.on("GET_REMINDER_LIST", (d) => {
        let reminder = global.initModel("reminder")
        let filter = (typeof d.filter != "undefined") ? d.filter : {};
            reminder.getReminderList(filter, (c) => {
                if (c.status) {
                    socket.emit("FRONT_REMINDER_LIST", c.data)
                } else {
                    if (c.error) { socket.emit("RETURN_ERROR_MESSAGE", { message: c.error.sqlMessage }) }
                }
            })
    })

    socket.on("SAVE_OR_UPDATE_REMINDER",(d)=>{
        let reminder = global.initModel("reminder")
        let filter = (typeof d.filter != "undefined") ? d.filter : {};
        let id = d.data.id;
            reminder.putData("reminder",d.data,{ id : id },(res)=>{
                if(res.status) {
                    reminder.getReminderList(filter,(e)=>{
                        if(e.data.length > 0) {
                            socket.emit("FRONT_REMINDER_LIST", e.data)
                        }else{
                            socket.emit("FRONT_REMINDER_LIST", [])
                        }
                    })
                }else{
                    socket.emit("RETURN_ERROR_MESSAGE",{message:"Update failed. Please Try again later."})
                }
            })
    })
}