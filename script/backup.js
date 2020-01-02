
const CronJob = require("cron").CronJob;
const moment = require('moment');
const tar = require("tar");
const fs = require("graceful-fs");
const path = require('path');
const database = require('../config/database');
const mysqlDump = require('mysqldump');
const AWS = global.initAWS();


var job = new CronJob(
    "59 23 * * *",
    async () => {
        try {
            const s3 = new AWS.S3();
            const environment = global.environment || "development";
            const config = {
                connection: database.connectionCredentials
            };
            const currentName = moment(new Date()).utc().tz("Asia/Manila").format("YYYYMMDDHHmmss");
            config['dumpToFile'] = './temp/' + currentName + '.sql';

            mysqlDump(config).then(() => {
                const writeStream = tar.c(
                    {
                        gzip: "gzip",
                    },
                    [config.dumpToFile]
                ).pipe(fs.createWriteStream('./temp/' + currentName + '.tgz'))
                writeStream.on('finish', (e) => {
                    const backupDataStream = fs.createReadStream('./temp/' + currentName + '.tgz');
                    backupDataStream.on('open', function () {
                        s3.upload({
                            Bucket: global.AWSBucket,
                            Key: environment + "/backup/" + currentName + ".tgz",
                            Body: backupDataStream,
                            ContentType: "tgz"
                        }, function (s3Err, res) {
                            fs.readdir('./temp/', (err, files) => {
                                if (err) throw err;

                                for (const file of files) {
                                    fs.unlink(path.join('./temp/', file), err => { });
                                }
                            });
                        });
                    });
                });
            });
        } catch (error) {
            console.error(error);
        }
    },
    null,
    true,
    "Asia/Manila"
);