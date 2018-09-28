exports.defaultGet = defaultGet = ( tablename, req, cb  ) => {
    let model = global.initModel(tablename)
    let d = req.query
    let filter = (typeof d.filter != "undefined")?JSON.parse(d.filter):{};
    model.getData(tablename,filter,{},(c)=>{
        if(c.status) {
            cb({status:true,data:c.data})
        } else {
            if(c.error) { cb({status:false,error:c.error.sqlMessage}); return; }

            cb({status:true,data:[]})
        }
    })
}

exports.defaultGetById = defaultGetById = ( tablename, req, cb ) => {
    if(!req.params.id){
        res.send({success:false,message:"Id is requird."})
        return;
    }
    let model = global.initModel("project")
    model.getData(tablename,{id:req.params.id},{},(c)=>{
        if(c.data.length > 0) {
            cb({status:true,data:c.data[0]})
        } else {
            cb({status:false,data:{}})
        }
    })
}

exports.defaultPost = defaultPost = (tablename, req, cb) => {
    if(!req.body){
        cb({success:false,data:[],message:"Adding data failed."})
        return;
    }
    let postData = req.body;
    let model = global.initModel(tablename)
    delete postData.id
    model.postData(tablename,postData,(c)=>{
        if(typeof c.id != "undefined" && c.id > 0) {
            model.getData(tablename,{id:c.id},{},(e)=>{
                if(e.data.length > 0) {
                    cb({success:true,data:e.data,message:"Successfully added."})
                }else{
                    cb({success:false,data:[],message:"Adding failed. Please Try again later."})
                }
            })
        }else{
            cb({success:false,data:[],message:"Adding failed. Please Try again later."})
        }
    })
}

exports.defaultPut = defaultPut = (tablename, req, cb) => {
    if(!req.body || !req.params.id){
        cb({success:false,data:[],message:"Updating data failed."})
        return
    }
    let model = global.initModel(tablename)
    let postData = req.body
    let id = req.params.id
    delete postData.id
    model.putData(tablename,postData,{id:id},(c)=>{
        if(c.status) {
            model.getData(tablename,{id:id},{},(e)=>{
                if(e.data.length > 0) {
                    cb({success:true,data:e.data[0],message:"Successfully updated."})
                } else {
                    cb({success:false,data:[],message:"Updating failed. Please Try again later."})
                }
            })
        }else{
            cb({success:false,data:[],message:"Updating failed. Please Try again later."})
        }
    })
}

exports.defaultDelete = defaultDelete = (tablename, req, cb) => {
    if(!req.params.id){
        cb({success:false,data:[],message:"Id is required."})
        return;
    }
    let model = global.initModel(tablename)
    model.getData(tablename,{},{},(b)=>{
        model.deleteData(tablename,{id:req.params.id},(c)=>{
            if(c.status) {
                cb({success:true,id:req.params.id,message:"Successfully deleted."})
            } else {
                if(c.error) { cb({success:false,id:0,message:c.error.sqlMessage}); return; }

                cb({success:false,id:0,message:"Delete failed. Please try again later."})
            }
        })
    })
}