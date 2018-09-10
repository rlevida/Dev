var func = global.initFunc(),
    sequence = require("sequence").Sequence;

var init = exports.init = (socket) => {

    socket.on("GET_FOLDER_LIST", (d) => {
        let folder = global.initModel("folder")
        let filter = (typeof d.filter != "undefined") ? d.filter : {};
        folder.getData("folder", filter, {}, (c) => {
            if (c.status) {
                socket.emit("FRONT_FOLDER_LIST", c.data)
            } else {
                if (c.error) { socket.emit("RETURN_ERROR_MESSAGE", { message: c.error.sqlMessage }) }
            }
        })
    })

    socket.on("SAVE_OR_UPDATE_FOLDER", (d) => {
        let folder = global.initModel("folder")
        if (typeof d.data.id != "undefined" && d.data.id != "") {
            let id = d.data.id
            delete d.data.id
            folder.putData("folder", d.data, { id: id }, (c) => {
                if (c.status) {
                    folder.getData("folder", { id: id }, {}, (e) => {
                        if (e.data.length > 0) {
                            socket.emit("FRONT_FOLDER_EDIT", e.data[0] )
                            socket.emit("RETURN_SUCCESS_MESSAGE", { message: "Successfully updated" })
                        } else {
                            socket.emit("RETURN_ERROR_MESSAGE", { message: "Updating failed. Please Try again later." })
                        }
                    })
                } else {
                    socket.emit("RETURN_ERROR_MESSAGE", { message: "Updating failed. Please Try again later." })
                }
            })
        } else {
            folder.postData("folder", d.data, (c) => {
                if (typeof c.id != "undefined" && c.id > 0) {
                    folder.getData("folder", { id: c.id }, {}, (e) => {
                        if (e.data.length > 0) {
                            socket.emit("FRONT_FOLDER_ADD", e.data )
                            socket.emit("RETURN_SUCCESS_MESSAGE", { message: "Successfully Added" })
                        } else {
                            socket.emit("RETURN_ERROR_MESSAGE", { message: "Saving failed. Please Try again later." })
                        }
                    })
                } else {
                    socket.emit("RETURN_ERROR_MESSAGE", { message: "Saving failed. Please Try again later." })
                }
            })
        }
    })

    socket.on("DELETE_FOLDER", (d) => {
        let folder = global.initModel("folder")
        let filter = (typeof d.filter != "undefined") ? d.filter : {};
            folder.getData("folder", filter, {}, (b) => {
                folder.deleteData("folder", filter, (c) => {
                    if (c.status) {
                        socket.emit("FRONT_DELETE_FOLDER", { id: d.filter.id })
                        socket.emit("RETURN_SUCCESS_MESSAGE", { message: "Successfully Deleted" })
                    } else {
                        socket.emit("RETURN_ERROR_MESSAGE", "Delete failed. Please try again later.")
                    }
                })
            })
    })

    socket.on("SAVE_OR_UPDATE_FOLDER_TAG",(d) =>{
        let tag = global.initModel("tag")
        let filter = (typeof d.filter != "undefined") ? d.filter : {};
            sequence.create().then((nextThen) => {
                tag.deleteData("tag",filter,(c)=>{
                    if(c.status){
                        nextThen(d.data)
                    }
                })
            }).then((nextThen,data) => {
                let hasError = false , errorMessage = "" , tempResData = []
                if(JSON.parse(data.tags).length){
                    JSON.parse(data.tags).map( e => {
                        let tagData = { linkType : e.value.split("-")[0], linkId : e.value.split("-")[1] , tagType : "folder" , tagTypeId : data.id }
                            tempResData.push( new Promise((resolve,reject) => {
                                tag.postData("tag",tagData,(res) =>{
                                    if(res.status){
                                        resolve(res)
                                    }else{
                                        hasError = true
                                        reject()
                                    }
                                })
                            }))
                    })
                    Promise.all(tempResData).then((values)=>{
                        let resData = []
                        if(values.length){
                            socket.emit("FRONT_SAVE_OR_UPDATE_FOLDER_TAG",{})
                            socket.emit("RETURN_SUCCESS_MESSAGE",{message:"Successfully Updated"})
                        }else{
                            socket.emit("RETURN_ERROR_MESSAGE",{message:"Updating failed. Please Try again later."})
                        }
                    })
                }else{
                    socket.emit("FRONT_SAVE_OR_UPDATE_FOLDER_TAG", {})
                }
            })
    })
}

