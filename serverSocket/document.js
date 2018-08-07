var func = global.initFunc(),
    sequence = require("sequence").Sequence;

var init = exports.init = (socket) => {

    socket.on("GET_DOCUMENT_LIST",(d) => {
        let documentLink = global.initModel("document_link")
        let filter = (typeof d.filter != "undefined") ? d.filter : {};
        
        documentLink.getData("document_link", filter ,{},(c)=>{
            if(c.status) {

                if(filter.linkType == "project"){
                    let docLinkId = [];
                        c.data.map( link => {
                            docLinkId.push(link.id)
                        })
                        
                    let document = global.initModel("document");
                    document.getProjectDocument( filter, docLinkId , ( doc )=>{
                        if(doc.status){
                            socket.emit("FRONT_DOCUMENT_LIST",doc.data)
                        }
                    })
                }

            if(filter.linkType == "workstream"){
                let tag = global.initModel("tag")
                    tag.getData("tag",d.filter,{},(tagRes)=>{
                        let tagId = []
                        if(tagRes.status){
                            tagRes.data.map(tag =>{
                                tagId.push(tag.tagTypeId)
                            })
                            if(tagId.length){
                                let document = global.initModel("document");
                                document.getProjectDocument( filter, tagId , ( doc )=>{
                                    if(doc.status){
                                        socket.emit("FRONT_DOCUMENT_LIST",doc.data)
                                    }
                                })
                            }else{
                                socket.emit("FRONT_DOCUMENT_LIST",[])
                            }
                        }
                })
            }
                       
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
        let filter = (typeof d.filter != "undefined") ? d.filter : {};

        if( typeof d.data.id != "undefined" && d.data.id != "" ){
            let id = d.data.id
            let newTags = d.data.tags
            delete d.data.id
            delete d.data.tags
            sequence.create().then((nextThen) => {
                document.putData("document",d.data,{ id : id },(res)=>{
                    if(res.status) {
                        document.getData("document",{id:id},{},(e)=>{
                            if(e.data.length > 0) {
                                nextThen(e.data[0])
                            }
                        })
                    }else{
                        socket.emit("RETURN_ERROR_MESSAGE",{message:"Update failed. Please Try again later."})
                    }
                })
            }).then((nextThen,result) => {
                let tag = global.initModel("tag");
                tag.deleteData("tag",filter,(res)=>{
                    if(res.status){
                        nextThen(result)
                    }else{
                        socket.emit("RETURN_ERROR_MESSAGE",{message:"Delete failed. Please Try again later."})
                    }
                })
            }).then((nextThen,result) =>{
                let tagId = [];
                if(JSON.parse(newTags).length > 0){
                    let tag = global.initModel("tag");
                        JSON.parse(newTags).map( t => {
                            let tagData = { linkType : "workstream", linkId : t.value , tagType : "document" , tagTypeId : id }
                                tag.postData("tag",tagData,(res) =>{
                                    if(res.status){
                                        nextThen(result)
                                    }else{
                                        socket.emit("RETURN_ERROR_MESSAGE",{message:"Tag failed. Please Try again later."})
                                    }
                                })
                        })
                }else{
                   nextThen(result)
                }
            }).then((nextThen,result)=>{
                if(d.type == "project"){
                    socket.emit("FRONT_DOCUMENT_EDIT",result)
                    socket.emit("RETURN_SUCCESS_MESSAGE",{message:"Successfully updated"})
                }
                if(d.type == "workstream"){
                    let tag = global.initModel("tag")
                        tag.getData("tag",{ linkId : d.linkId }, {} ,(tagRes)=>{
                            let tagId = []
                            if(tagRes.status){
                                tagRes.data.map(tag =>{
                                    tagId.push(tag.tagTypeId)
                                })
                                if(tagId.length){
                                    document.getProjectDocument( filter, tagId , ( doc )=>{
                                        if(doc.status){
                                            socket.emit("FRONT_DOCUMENT_LIST",doc.data)
                                            socket.emit("RETURN_SUCCESS_MESSAGE",{message:"Successfully updated"})
                                        }
                                    })
                                }else{
                                    socket.emit("FRONT_DOCUMENT_LIST",[])
                                    socket.emit("RETURN_SUCCESS_MESSAGE",{message:"Successfully updated"})
                                }
                            }
                        })
                }
            })
        }else{
            if(d.data.length > 0){
                d.data.map( file => {        
                    let tagList = file.tags
                    delete file.tags        
                    tempResData.push( new Promise((resolve,reject) => {
                        document.postData("document",file,(c)=>{
                            if(typeof c.id != "undefined" && c.id > 0) {
                                document.getData("document",{id:c.id},{},(e)=>{
                                    if(e.data.length > 0) {
                                       
                                        if(typeof tagList != "undefined"){
                                            JSON.parse(tagList).map( t => {
                                                let tag = global.initModel("tag")
                                                let tagData = { linkType : "workstream", linkId : t.value , tagType : "document" , tagTypeId : e.data[0].id }
                                                    tag.postData("tag",tagData,(tagRes) =>{
                                                        if(tagRes.status){
                                                            console.log("tag success")
                                                        }else{
                                                            console.log("tag failed")
                                                        }
                                                    })
                                            })
                                         }

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

    // socket.on("DELETE_DOCUMENT",(d) => {
    //     let document = global.initModel("document")

    //     document.getData("document",{},{},(b)=>{
    //         document.deleteData("document",{id:d.id},(c)=>{
    //             if(c.status) {
    //                 socket.emit("FRONT_DOCUMENT_DELETED",{id:d.id})
    //             }else{
    //                 socket.emit("RETURN_ERROR_MESSAGE","Delete failed. Please try again later.")
    //             }
    //         })
    //     })
    // })

    socket.on("DELETE_DOCUMENT",(d) => {
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
                socket.emit("RETURN_ERROR_MESSAGE",{message:"Delete failed. Please Try again later."})
            }
        })
    })
}