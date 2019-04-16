const schedule = require('node-schedule');
const moment = require('moment');
const database = require('./config/database');
const mysqlDump = require('mysqldump');
const AWS = global.initAWS();

schedule.scheduleJob('0 0 0 * * *', () => {
    const config = database.connectionCredentials;
    const currentName = moment(new Date()).utc().tz("Asia/Manila").format("YYYYMMDDHHmmss");
    config['dest'] = './temp/' + currentName + '.sql';
    config['getDump'] = true;

    mysqlDump(config, function (response, dump) {
        const s3 = new AWS.S3();
        const environment = global.environment || "development";

        s3.putObject({
            Bucket: global.AWSBucket,
            Key: environment + "/backup/" + currentName + ".sql",
            Body: dump,
            ContentType: "sql"
        }, function (err) {
            empty('./temp', false, (o) => {
                let mailOptions = {
                    from: 'noreply<mobbizapps12345@gmail.com>',
                    to: (err != null) ? 'support@mobbizsolutions.com' : 'andrien.pecson@volenday.com',
                    subject: "CloudCFO Database Backup"
                };
                if (err != null) {
                    mailOptions['html'] = "Error in database backup for the CloudCFO website. " + err;
                } else {
                    mailOptions['html'] = "Database successfully backup for the CloudCFO website."
                }
                global.emailtransport(mailOptions);
            });
        });
    });
});