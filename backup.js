var schedule = require('node-schedule')
var j = schedule.scheduleJob('0 0 0 * * *', () => {
  var mysqlDump = require('mysqldump');
  var moment = require('moment');
  var database = require('./config/database');
  var dbConfig = database.connectionCredentials;
  var currentName = moment().format("YYYYMMDDHH:mm:ss");
  dbConfig['dropTable'] = true;
  dbConfig['ifNotExist'] = true;
  dbConfig['dest'] = './temp/cloudcfo.sql';
  mysqlDump(dbConfig, function (response, dump) {
     var AWS = global.initAWS();
    
    var tar = require("tar"),
        fs = require("graceful-fs")
    
    var writeStream  = tar.c(
        {
            gzip: "gzip",
        },
        ["./temp/cloudcfo.sql"]
    ).pipe(fs.createWriteStream('./temp/backup.tgz'))
    writeStream.on('finish', () => {
        var fileStream = fs.createReadStream('./temp/backup.tgz');
        fileStream.on('error', function(err){
            console.log("Error in creating file stream. [" + err + "]");
        });
        fileStream.on('open', function(){
            var s3 = new AWS.S3();
                s3.putObject({
                    Bucket: global.AWSBucket,
                    Key: "backup/"+global.environment+"/cloudcfo"+currentName+".tgz",
                    Body: fileStream,
                    ContentType : "tgz"
                }, function(err){
                    console.log("Error in Uploading to AWS. [" + err + "]");
                });
        });
    })
      
  });
});