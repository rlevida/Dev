var func = global.initFunc(),
    sequence = require("sequence").Sequence,
    async = require("async");

var init = exports.init = (socket) => {

    socket.on("GET_WORKSTREAM_LIST",(d) => {
        let workstream = global.initModel("workstream")
        let members = global.initModel("members")
        let filter = (typeof d.filter != "undefined")?d.filter:{};

        workstream.getWorkstreamList("workstream",filter,{},(c)=>{
            if(c.status) {
                async.map(c.data, function (result, workstreamCallback) {
                    members.countData("members",{linkId:result.id,linkType: 'workstream'}, 'member_count',(e) =>{
                        workstreamCallback(null, Object.assign({}, result, {member_count:e.data.member_count}))
                    })
                }, function (err, results) {
                    socket.emit("FRONT_WORKSTREAM_LIST",results)
                });
            }else{
                if(c.error) { socket.emit("RETURN_ERROR_MESSAGE",{message:c.error.sqlMessage}) }
            }
        })
    })

    socket.on("GET_WORKSTREAM_COUNT_LIST",(d) => {
        let workstream = global.initModel("workstream")
        let filter = (typeof d.filter != "undefined")?d.filter:{};
        workstream.getDataCount("workstream",filter,{},(c)=>{
            if(c.status) {
                socket.emit("FRONT_WORKSTREAM_COUNT_LIST",c.data)
            }else{
                if(c.error) { socket.emit("RETURN_ERROR_MESSAGE",{message:c.error.sqlMessage}) }
            }
        })
    })
    
    socket.on("GET_WORKSTREAM_DETAIL",(d) => {
        sequence.create().then((nextThen)=>{
            let workstream = global.initModel("workstream")
            workstream.getData("workstream",{id:d.id},{},(c)=>{
                if(c.data.length > 0) {
                    nextThen(c.data[0])
                }
            })
        }).then((nextThen,data)=>{
            let members = global.initModel("members")
            members.getData("members",{linkType:"workstream",linkId:data.id,usersType:"users",memberType:"responsible"},{},(e)=>{
                if(e.data.length > 0){
                    data.responsible = e.data[0].userTypeLinkId;
                }
                nextThen(data)
            })
            
        }).then((nextThen,data)=>{
            let members = global.initModel("members")
                let filter = (typeof d.filter != "undefined")?d.filter:{};
                    members.getWorkstreamTaskMembers({ id : d.id},(c)=>{
                        if(c.status) {
                            if(c.data.length > 0){
                                data.taskMemberList = c.data
                                socket.emit("FRONT_WORKSTREAM_SELECTED",data)
                            }else{
                                socket.emit("FRONT_WORKSTREAM_SELECTED",data)
                            }
                        }else{
                            socket.emit("RETURN_ERROR_MESSAGE","Delete failed. Please try again later.")
                        }
                    })
        })
    })

    socket.on("SAVE_OR_UPDATE_WORKSTREAM",(d) => {
        sequence.create().then((nextThen)=>{
            let workstream = global.initModel("workstream")
            if( typeof d.data.id != "undefined" && d.data.id != "" ){
                let id = d.data.id
                delete d.data.id
                workstream.putData("workstream",d.data,{id:id},(c)=>{
                    if(c.status) {
                        workstream.getData("workstream",{id:id},{},(e)=>{
                            if(e.data.length > 0) {
                                nextThen(e.data[0].id,"edit",e.data[0])
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
                                nextThen(e.data.id,"add",e.data)
                            }else{
                                socket.emit("RETURN_ERROR_MESSAGE",{message:"Saving failed. Please Try again later."})
                            }
                        })
                    }else{
                        socket.emit("RETURN_ERROR_MESSAGE",{message:"Saving failed. Please Try again later."})
                    }
                })
            }
        }).then((nextThen,id,type,data)=>{
            if(d.data.responsible){
                let members = global.initModel("members")
                members.getData("members",{linkType:"workstream",linkId:d.data.id,usersType:"users",userTypeLinkId:d.data.responsible,memberType:"responsible"},{},(e)=>{
                    if(e.data.length > 0){
                         data.responsible = e.data[0].userTypeLinkId
                    }else{
                        members.deleteData("members",{linkType:"workstream",linkId:id,usersType:"users",memberType:"responsible"},(c)=>{
                            let responsible = {linkType:"workstream",linkId:data.id,usersType:"users",userTypeLinkId:d.data.responsible,memberType:"responsible"};
                            members.postData("members",responsible,(c)=>{
                                data.responsible = d.data.responsible
                                nextThen(type,data)
                            })
                        })
                    }
                })
            }else{
                nextThen(type,data)
            }
        }).then((nextThen,type,data)=>{
            if(type=="edit"){
                socket.emit("FRONT_WORKSTREAM_EDIT",data)
                socket.emit("RETURN_SUCCESS_MESSAGE",{message:"Successfully updated"})
            }else{
                socket.emit("FRONT_WORKSTREAM_ADD",data)
                socket.emit("RETURN_SUCCESS_MESSAGE",{message:"Successfully updated"})
            }
        })
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