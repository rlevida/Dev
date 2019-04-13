const schedule = require('node-schedule');
const moment = require('moment');
const database = require('./config/database');

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
                if (response.Message != 'Success') {
                    var mailOptions = {
                        from: 'noreply<mobbizapps12345@gmail.com>',
                        to: 'andrien.pecson@volenday.com',
                        subject: "CloudCFO Database Backup",
                        html: "Error in database backup for the CloudCFO website."
                    };
                    global.emailtransport(mailOptions)
                }
            });
        });
    });
});