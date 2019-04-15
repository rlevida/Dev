const schedule = require('node-schedule');
const moment = require('moment');
const database = require('./config/database');
const mysqlDump = require('mysqldump');

schedule.scheduleJob('0 0 0 * * *', () => {
    const config = database.connectionCredentials;
    const currentName = moment(new Date()).utc().tz("Asia/Manila").format("YYYYMMDDHH:mm:ss");
    const func = global.initFunc();
    config['dest'] = './temp/' + currentName + '.sql';
    config['getDump'] = true;

    mysqlDump(config, function (response, dump) {
        func.uploadFile({
            file: dump,
            form: "backup",
            filename: currentName
        }, response => {
            empty('./temp', false, (o) => {
                let mailOptions = {
                    from: 'noreply<mobbizapps12345@gmail.com>',
                    to: 'andrien.pecson@volenday.com',
                    subject: "CloudCFO Database Backup"
                };
                if (response.Message != 'Success') {
                    mailOptions['html'] = "Error in database backup for the CloudCFO website."
                } else {
                    mailOptions['html'] = "Database successfully backup for the CloudCFO website."
                }
                global.emailtransport(mailOptions);
            });
        });
    });
});