var func = global.initFunc(),
    sequence = require("sequence").Sequence;

var init = exports.init = (socket) => {

    socket.on("GET_COMPANY_LIST",(d) => {
        let company = global.initModel("company")
        let filter = (typeof d.filter != "undefined")?d.filter:{};
        company.getData("company",filter,{},(c)=>{
            if(c.status) {
                socket.emit("FRONT_COMPANY_LIST",c.data)
            }else{
                if(c.error) { socket.emit("RETURN_ERROR_MESSAGE",{message:c.error.sqlMessage}) }
            }
        })
    })
    
    socket.on("GET_COMPANY_DETAIL",(d) => {
        let company = global.initModel("company")
        company.getData("company",{id:d.id},{},(c)=>{
            if(c.data.length > 0) {
                socket.emit("FRONT_COMPANY_SELECTED",c.data[0])
            }
        })
    })
    
    socket.on("SAVE_OR_UPDATE_COMPANY",(d) => {
        let company = global.initModel("company")
        if( typeof d.data.id != "undefined" && d.data.id != "" ){
            let id = d.data.id
            delete d.data.id
            company.putData("company",d.data,{id:id},(c)=>{
                if(c.status) {
                    company.getData("company",{id:id},{},(e)=>{
                        if(e.data.length > 0) {
                            socket.emit("FRONT_COMPANY_EDIT",e.data[0])
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
            company.postData("company",d.data,(c)=>{
                if(typeof c.id != "undefined" && c.id > 0) {
                    company.getData("company",{id:c.id},{},(e)=>{
                        if(e.data.length > 0) {
                            socket.emit("FRONT_COMPANY_ADD",e.data)
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

    socket.on("DELETE_COMPANY",(d) => {
        let company = global.initModel("company")

        company.getData("company",{},{},(b)=>{
            company.deleteData("company",{id:d.id},(c)=>{
                if(c.status) {
                    socket.emit("FRONT_COMPANY_DELETED",{id:d.id})
                }else{
                    socket.emit("RETURN_ERROR_MESSAGE","Delete failed. Please try again later.")
                }
            })
        })
    })
}