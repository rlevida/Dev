const sequence = require("sequence").Sequence;
const dbName = "document";
var { defaultGet, defaultGetId, defaultPost, defaultPut, defaultDelete } = require("./")

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
    }
}

exports.post = {
    index : (req,cb) => {
        let data = req.body;
        let projectId = req.body[0].project;
        let document = global.initModel("document");
        let tag = global.initModel("tag")

        sequence.create().then((nextThen) => {
            let newData = [];
                data.map( file => { 
                    newData.push( new Promise((resolve,reject) => {
                        document.getData("document", { origin: file.origin }, { orderBy: [{ fieldname: "documentNameCount", type: "DESC" }] }, (c) => {
                            if(c.status){
                                if (c.data.length > 0) {
                                    file.documentNameCount = c.data[0].documentNameCount + 1
                                    resolve(file)
                                } else {
                                    file.projectNameCount = 0;
                                    resolve(file)
                                }
                            }else{
                                reject()
                            }
                        })
                    }))
                })

                Promise.all(newData).then((values)=>{
                    nextThen(values)
                })

        }).then((nextThen,result) => {

            let tempResData = [];

            if(result.length > 0){
                result.map( file => {        
                    let tagList = file.tags
                    delete file.tags        
                    tempResData.push( new Promise((resolve,reject) => {
                        document.postData("document",file,(c)=>{
                            if(typeof c.id != "undefined" && c.id > 0) {
                                document.getData("document",{id:c.id},{},(e)=>{
                                    if(e.data.length > 0) {
                                        if(typeof tagList != "undefined"){
                                            JSON.parse(tagList).map( t => {
                                                let tagData = { linkType : t.value.split("-")[0], linkId : t.value.split("-")[1] , tagType : "document" , tagTypeId : e.data[0].id }
                                                    tag.postData("tag",tagData,(tagRes) =>{
                                                        if(tagRes.status){
                                                            // console.log("tag success")
                                                        }else{
                                                            // console.log("tag failed")
                                                        }
                                                    })
                                            })
                                         }

                                        let documentLink = global.initModel("document_link")
                                        let linkData = { documentId : e.data[0].id , linkType : "project", linkId: projectId } 
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
                        nextThen(resData)
                    }else{
                        nextThen(resData)
                    }
            })
        }).then((nextThen,result) => {
            tag.getData("tag", {}, {}, (c) => {
                if (c.status) {
                     cb({status:true , data:{ list: result , tagList: c.data }})
                }else{
                    cb({status:true , data:{ list: result , tagList: [] }})
                }
            })
        })    
    },
    upload : (req,cb) => {
        var formidable = global.initRequire("formidable"),
        modalFunc = global.initModelFunc(),
        func = global.initFunc();

        var form = new formidable.IncomingForm();
        var filenameList = [];
        var files = []
        form.multiples = true;


        let type = (typeof req.query.type != "undefined")?req.query.type:"others";
        let uploadType = (typeof req.query.uploadType != "undefined")?req.query.uploadType:"";
        let uploaded = false;
        // every time a file has been uploaded successfully copy to AWS
        
        files.push( new Promise((resolve,reject) =>{
            form.on('file', function(field, file) {
            var date = new Date();
            var Id = func.generatePassword(date.getTime()+file.name,"attachment");
            var filename = file.name + "_" + Id + "." + func.getFilePathExtension(file.name);
            // var filename = file.name;
            if(uploadType == "form"){
                filenameList.push({filename:filename,origin:file.name,Id:Id});
            }else{
                filenameList.push(filename);
            }
                // func.uploadFile({file : file, form : type, filename : filename},response =>{
                //     if(response.Message == 'Success'){
                //         resolve(filenameList)
                //     }else{
                //         reject()
                //     }
                // });
            });
        }))


        Promise.all(files).then( e =>{
            // if(e.length > 0){
            //     cb({ status:true, data: e[0] })
            // }else{
            //     cb({ status:false, data:[]})
            // }
        })
        // log any errors that occur
        // form.on('error', function(err) {
        //     console.log('An error has occured: \n' + err);
        // });
        // once all the files have been uploaded, send a response to the client
        form.on('end', function() {
            cb({ status:true, data: filenameList })
        });
        // parse the incoming request containing the form data
        form.parse(req);
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
    },
    rename: (req,cb) => {
        let document = global.initModel("document")
        let d = req.body
        let id = req.params.id
        sequence.create().then((nextThen) => {
            document.getData("document", { origin: d.origin }, { orderBy: [{ fieldname: "documentNameCount", type: "DESC" }] }, (c) => {
                if(c.data.length){
                    d.documentNameCount = c.data.length + 1
                    nextThen(d)
                }else{
                    d.documentNameCount = 0
                    nextThen(d)
                }
            })
        }).then((nextThen,result) => {
            document.putData("document",result,{id:id},(c)=>{
                if(c.status){
                    cb({ status:true, data:c.data })
                } else {
                    cb({ status:false, error:c.error })
                }
            })
        })
    },
    tags: (req,cb) => {
        let d = req.body;
        let filter = (typeof d.filter != "undefined") ? d.filter : {};
        let tag = global.initModel("tag");

            sequence.create().then((nextThen) => {
                tag.deleteData("tag",filter,(c)=>{
                    if(c.status){
                        if(JSON.parse(d.data.tags).length > 0){
                            nextThen(JSON.parse(d.data.tags) , d.data.id)
                        }else{
                            cb({ status:true, data:c.data })
                        }
                    }
                })

            }).then((nextThen, tags , id) => {
              let tagPromise = []
                tagPromise.push( new Promise((resolve,reject) => {  
                    tags.map( t => {
                        let tagData = { linkType : t.value.split("-")[0], linkId : t.value.split("-")[1] , tagType : "document" , tagTypeId : id }
                            tag.postData("tag",tagData,(res) =>{
                                if(res.status){
                                    resolve(res)
                                }else{
                                    reject()
                                }
                            })
                    })
                }))
            
                Promise.all(tagPromise).then(values => {
                    cb({ status:true, data: "" })
                })
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
