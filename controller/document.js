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
        defaultPost(dbName,req,(res)=>{
            if(res.success){
                cb({ status:true, data:res.data })
            }else{
                cb({ status:false, error:res.error })
            }
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
                func.uploadFile({file : file, form : type, filename : filename},response =>{
                    if(response.Message == 'Success'){
                        resolve(filenameList)
                    }
                });
            });
        }))


        Promise.all(files).then( e =>{
            cb({ status:true, data: e[0] })
        })
        // log any errors that occur
        form.on('error', function(err) {
            console.log('An error has occured: \n' + err);
        });
        // once all the files have been uploaded, send a response to the client
        // form.on('end', function() {
        //     cb({ status:true, data: filenameList })
        // });
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
