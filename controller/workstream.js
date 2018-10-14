const dbName = "workstream";
var { defaultGet, defaultGetId, defaultPost, defaultPut, defaultDelete } = require("./")
const sequence = require("sequence").Sequence;

exports.get = {
    index : (req,cb) => {
        defaultGet(dbName,req,(res)=>{
            if(res.status){
                cb({ status:true, data:res.data })
            }else{
                cb({ status:false, error:res.error })
            }
        })
    },
    getById : (req,cb) => {
        defaultGetById(dbName,req,(res)=>{
            if(res.status){
                cb({ status:true, data:res.data })
            } else {
                cb({ status:false, error:res.error })
            }
        })
    },
    getWorkstreamDetail :(req,cb) => {
        let d = req.query
        sequence.create().then((nextThen) => {
            let workstream = global.initModel("workstream")
            workstream.getData("workstream", { id: d.id }, {}, (c) => {
                if (c.data.length > 0) {
                    nextThen(c.data[0])
                }
            })
        }).then((nextThen, data) => {
            let members = global.initModel("members")
            members.getData("members", { linkType: "workstream", linkId: data.id, usersType: "users", memberType: "responsible" }, {}, (e) => {
                if (e.data.length > 0) {
                    data.responsible = e.data[0].userTypeLinkId;
                }
                nextThen(data)
            })

        }).then((nextThen, data) => {
            let members = global.initModel("members")
            let filter = (typeof d.filter != "undefined") ? d.filter : {};
            members.getWorkstreamTaskMembers({ id: d.id }, (c) => {
                if (c.status) {
                    data.taskMemberList = c.data
                    cb({ status: true , data : data })
                    // socket.emit("FRONT_WORKSTREAM_SELECTED", data)
                } else {
                    cb({ status: false , error : c.error })
                    // socket.emit("RETURN_ERROR_MESSAGE", "Delete failed. Please try again later.")
                }
            })
        })
    }
}

exports.post = {
    index : (req,cb) => {
        defaultPost(dbName,req,(res)=>{
            if(res.success){
                cb({ status:true, data:res.data })
            }else{
                cb({ status:false, error:res.error })
            }
        })
    }
}

exports.put = {
    index : (req,cb) => {
        defaultPut(dbName,req,(res)=>{
            if(res.success){
                cb({ status:true, data:res.data })
            } else {
                cb({ status:false, error:c.error })
            }
        })
    }
}

exports.delete =  {
    index : (req,cb) => {
        defaultDelete(dbName,req,(res)=>{
            if(res.success){
                cb({ status:true, data:res.data })
            } else {
                cb({ status:false, error:res.error })
            }
        })
    }
}