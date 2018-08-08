var func = global.initFunc(),
    sequence = require("sequence").Sequence;

var init = exports.init = (socket) => {

    socket.on("GET_PROJECT_LIST",(d) => {
        let project = global.initModel("project")
        let filter = (typeof d.filter != "undefined")?d.filter:{};
        project.getProjectList("project",filter,{},(c)=>{
            if(c.status) {
                socket.emit("FRONT_PROJECT_LIST",c.data)
            }else{
                if(c.error) { socket.emit("RETURN_ERROR_MESSAGE",{message:c.error.sqlMessage}) }
            }
        })
    })

    socket.on("GET_PROJECT_COUNT_LIST",(d) => {
        let project = global.initModel("project")
        
        let filter = (typeof d.filter != "undefined")?d.filter:{};
        project.getDataCount("project",filter,{},(c)=>{
            if(c.status) {
                socket.emit("FRONT_PROJECT_COUNT_LIST",c.data)
            }else{
                if(c.error) { socket.emit("RETURN_ERROR_MESSAGE",{message:c.error.sqlMessage}) }
            }
        })
    })
    
    socket.on("GET_PROJECT_DETAIL",(d) => {
        let project = global.initModel("project")
        project.getData("project",{id:d.id},{},(c)=>{
            if(c.data.length > 0) {
                socket.emit("FRONT_PROJECT_SELECTED",c.data[0])
            }
        })
    })
    
    socket.on("SAVE_OR_UPDATE_PROJECT",(d) => {
        let project = global.initModel("project")
        if( typeof d.data.id != "undefined" && d.data.id != "" ){
            let id = d.data.id
            delete d.data.id
            project.putData("project",d.data,{id:id},(c)=>{
                if( d.data.typeId == 3 ){// if private delete all user tag
                    let members = global.initModel("members")
                    members.deleteData("members", { linktype: "project", linkId: id }, (c) => {})
                }

                if(c.status) {
                    project.getData("project",{id:id},{},(e)=>{
                        if(e.data.length > 0) {
                            socket.emit("FRONT_PROJECT_EDIT",e.data[0])
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
            project.postData("project",d.data,(c)=>{
                if(typeof c.id != "undefined" && c.id > 0) {
                    let workstream = global.initModel("workstream")
                    let workstreamData = {
                        projectId: c.id,
                        workstream: "Default Workstream",
                        typeId: 4
                    }
                    // save a default workstream for every creation of project
                    workstream.postData("workstream",workstreamData,(f)=>{ })

                    project.getData("project",{id:c.id},{},(e)=>{
                        if(e.data.length > 0) {
                            socket.emit("FRONT_PROJECT_ADD",e.data)
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

    socket.on("DELETE_PROJECT",(d) => {
        let project = global.initModel("project")

        project.getData("project",{},{},(b)=>{
            project.deleteData("project",{id:d.id},(c)=>{
                if(c.status) {
                    socket.emit("FRONT_PROJECT_DELETED",{id:d.id})
                }else{
                    socket.emit("RETURN_ERROR_MESSAGE","Delete failed. Please try again later.")
                }
            })
        })
    })
}