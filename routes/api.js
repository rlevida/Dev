var express = require('express');
var sess = require('express-session');
var jwt = require('jsonwebtoken');
var router = express();
var mime = require('mime-types')
var docxConverter = require('docx-pdf');

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
                func.uploadFile({file : file, form : type, filename : filename},response =>{
                    if(response.Message == 'Success'){
                        resolve(filenameList)
                    }
                });
            });
        }))


        Promise.all(files).then( e =>{
            res.send({files : e[0], status : "end" });
        })
        // log any errors that occur
        form.on('error', function(err) {
            console.log('An error has occured: \n' + err);
        });
        // once all the files have been uploaded, send a response to the client
        // form.on('end', function() {
        //    res.send({files : filenameList, status : "end" });
        // });
        // parse the incoming request containing the form data
        form.parse(req);
});

router.get('/downloadFolder',(req,res,next)=>{
    var fs = global.initRequire('fs'),
        AWS = global.initAWS();

    let fileList = JSON.parse(req.query.data)
    let folderName = req.query.folderName
    let tempFolderName = new Date().getTime()
    let path = `${folderName}`
    fs.mkdir(path,function(e){
      
        let promise = new Promise(function(resolve,reject){
            fileList.map( file =>{
                var s3 = new AWS.S3();
                let fileStream = fs.createWriteStream( `${path}/${file.origin}` ) ;
                    s3.getObject({
                        Bucket: global.AWSBucket,
                        Key: global.environment + "/upload/" + file.name,
                    }, (err,data) => {
                        if(err){
                            console.log("Error in Uploading to AWS. [" + err + "]");
                        }else{
                            fileStream.write(data.Body)
                            resolve(folderName)
                            fileStream.end()
                        }
                    });
            })}
        )
        promise.then((data)=>{
            var tar = require("tar")
            var writeStream  = tar.c(
                {
                    gzip: "gzip",
                },
                [`${folderName}`]
            ).pipe(fs.createWriteStream(`${folderName}.tgz`))
            writeStream.on('finish', () => {

                var deleteFolderRecursive = function(path) { // remove temp files
                    if( fs.existsSync(path) ) {
                        fs.readdirSync(path).forEach(function(file,index){
                            var curPath = path + "/" + file;
                            if(fs.lstatSync(curPath).isDirectory()) { // recurse
                            deleteFolderRecursive(curPath);
                            } else { // delete file
                            fs.unlinkSync(curPath);
                            }
                        });
                        fs.rmdirSync(path);
                    }
                  };
                  deleteFolderRecursive(path)
                
                res.download(`${folderName}.tgz` , `${folderName}.tgz`,(c)=>{
                    fs.unlink(`${folderName}.tgz`,(t)=>{
                    })
                })
            })
        }).catch((err)=>{
            console.log(`promise error `, err )
        })
    })
})

router.get('/printDocument',(req,res,next)=>{
    let fileName = req.query.fileName
    let originName = req.query.fileOrigin
    let fs = global.initRequire('fs'), AWS = global.initAWS();
    let fileStream = fs.createWriteStream( `${originName}` ) ;
    let s3 = new AWS.S3();

    let promise = new Promise(function(resolve,reject){
        s3.getObject({
            Bucket: global.AWSBucket,
            Key: global.environment + "/upload/" + fileName,
        }, (err,data) => {
            if(err){
                console.log("Error in Uploading to AWS. [" + err + "]");
            }else{
                fileStream.write(data.Body)
                resolve(originName)
                fileStream.end()

            }
        });
    })
    promise.then((data)=>{
        docxConverter(`${__dirname}/../${data}`,'output.pdf',function(err,result){
            if(err){
              console.log(err);
            }
            console.log('result'+result);
          });
        // let fileContentType = mime.contentType(data)
        // let file = fs.readFileSync(`${__dirname}/../${data}`);
        //     // fs.unlink(`${data}`,(t)=>{})
        //     res.contentType(fileContentType);
        //     res.send(file);
    })
   
})

module.exports = router;
