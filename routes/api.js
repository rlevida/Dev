var express = require('express');
var sess = require('express-session');
var jwt = require('jsonwebtoken');
var router = express();

router.use(function (req, res, next) {
    let session = global.initModel("session");
    session.getData("session",{session:req.cookies["app.sid"]},{},(ret)=>{
        if(ret.status && ret.data.length > 0){
            session.putData("session",{dateUpdated:new Date()},{id:ret.data[0].id},()=>{
                next();
            })
        } else {
            res.redirect('/auth');
        }
    })
});

router.post('/upload', (req, res, next) => {
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
                //     }
                // });
            });
        }))


        Promise.all(files).then( e =>{
            res.send({files : e[0], status : "end" });
        })
        // log any errors that occur
        // form.on('error', function(err) {
        //     console.log('An error has occured: \n' + err);
        // });
        // once all the files have been uploaded, send a response to the client
        form.on('end', function() {
           res.send({files : filenameList, status : "end" });
        });
        // parse the incoming request containing the form data
        form.parse(req);
});

module.exports = router;
