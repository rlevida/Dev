var func = global.initFunc(),
    sequence = require("sequence").Sequence;

var init = exports.init = (socket) => {

    socket.on("GET_DOCUMENT_LIST",(d) => {

        let documentLink = global.initModel("document_link")
        let filter = (typeof d.filter != "undefined") ? d.filter : {};
        documentLink.getData("document_link", filter , { linkId : d.project },(c)=>{
            
            if(c.status) {
                let docId = [];
                c.data.map( link => {
                    docId.push(link.documentId)
                })
               
                let document = global.initModel("document");
                document.getProjectDocument( filter, docId , ( doc )=>{
                    if(doc.status){
                        socket.emit("FRONT_DOCUMENT_LIST",doc.data)
                    }
                })

            }else{
                if(c.error) { socket.emit("RETURN_ERROR_MESSAGE",{message:c.error.sqlMessage}) }
            }

        })
    })
    
    socket.on("GET_DOCUMENT_DETAIL",(d) => {
        let document = global.initModel("document")
        document.getData("document",{id:d.id},{},(c)=>{
            if(c.data.length > 0) {
                socket.emit("FRONT_DOCUMENT_SELECTED",c.data[0])
            }
        })
    })
    
    socket.on("SAVE_OR_UPDATE_DOCUMENT",(d) => {
        let document = global.initModel("document")
        let tempResData = []
        if( typeof d.data.id != "undefined" && d.data.id != "" ){
            let id = d.data.id
            delete d.data.id
            document.putData("document",d.data,{id:id},(c)=>{
                if(c.status) {
                    document.getData("document",{id:id},{},(e)=>{
                        if(e.data.length > 0) {
                            socket.emit("FRONT_DOCUMENT_EDIT",e.data[0])
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
            if(d.data.length > 0){
                d.data.map( file => {
                    tempResData.push( new Promise((resolve,reject) => {
                        let tmpData = { name: file.filename ,  origin : file.origin , uploadedBy : d.userId }
                        document.postData("document",tmpData,(c)=>{
                            if(typeof c.id != "undefined" && c.id > 0) {
                                document.getData("document",{id:c.id},{},(e)=>{
                                    if(e.data.length > 0) {
                                        let documentLink = global.initModel("document_link")
                                        let linkData = { documentId : e.data[0].id , linkType : "project", linkId: d.project } 
                                        documentLink.postData("document_link",linkData ,(l)=>{
                                        })
                                        resolve(e.data)
                                    }else{
                                        reject()
                                    }
                                })
                            }else{
                                reject()
                            }
                        })
                    }))
                })
            }
            
            Promise.all(tempResData).then((values)=>{
                let resData = []
                if(values.length){
                    values.map( e =>{ resData.push(e[0]) })
                    socket.emit("FRONT_DOCUMENT_ADD",resData)
                    socket.emit("RETURN_SUCCESS_MESSAGE",{message:"Successfully updated"})
                }else{
                    socket.emit("RETURN_ERROR_MESSAGE",{message:"Saving failed. Please Try again later."})
                }
            })
        }
    })

    socket.on("DELETE_DOCUMENT",(d) => {
        let document = global.initModel("document")

        document.getData("document",{},{},(b)=>{
            document.deleteData("document",{id:d.id},(c)=>{
                if(c.status) {
                    socket.emit("FRONT_DOCUMENT_DELETED",{id:d.id})
                }else{
                    socket.emit("RETURN_ERROR_MESSAGE","Delete failed. Please try again later.")
                }
            })
        })
    })

    socket.on("ARCHIVE_DOCUMENT",(d) => {
        let data = { isDeleted : 1 } 

        let document = global.initModel("document")
        document.putData("document",data,{id:d.id},(c)=>{
            if(c.status) {
                document.getData("document",{id:d.id},{},(e)=>{
                    if(e.data.length > 0) {
                        socket.emit("FRONT_DOCUMENT_DELETED",{ id: d.id})
                        socket.emit("RETURN_SUCCESS_MESSAGE",{ message:"Successfully archive" })
                    }else{
                        socket.emit("RETURN_ERROR_MESSAGE",{message:"Archive failed. Please Try again later."})
                    }
                })
            }else{
                socket.emit("RETURN_ERROR_MESSAGE",{message:"Archive failed. Please Try again later."})
            }
        })
    })
}