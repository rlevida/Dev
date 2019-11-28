const async = require("async");
const _ = require("lodash");
const Sequelize = require("sequelize")
const Op = Sequelize.Op;
const models = require('../modelORM');
const { Users, UserForgotPassword } = models;

exports.get = {
    index: (req, cb) => {
        const queryString = req.query;
        try {
            Users
                .findOne({ where: { emailAddress: queryString.email } })
                .then((res) => {
                    if (res) {
                        let func = global.initFunc(),
                            salt = func.randomString(32),
                            d = new Date(),
                            securityCode = func.randomString(4),
                            hash = func.generatePassword(d.getFullYear() + "-" + d.getMonth() + "-" + d.getDay() + "-" + d.getHours() + "-" + d.getMinutes() + "-" + d.getSeconds(), salt),
                            text = (queryString == 'mobile') ? 'Here is your 4 digit security code: ' + securityCode : 'Please visit the provided link in order to complete this request.<br><br><a href="http:' + global.site_url + 'forgotPassword/?hash=' + hash + '">http:' + global.site_url + 'forgotPassword/?hash=' + hash + '</a>';
                        content = '<p>Hello</p></br><p>We got a request to reset your password on ' + global.site_name + ' Account. ' + text + '</p>';

                        UserForgotPassword
                            .destroy({ where: { usersId: res.id } })
                            .then(() => {
                                UserForgotPassword
                                    .create({ hash: hash, usersId: res.id })
                                    .then(() => {
                                        var mailOptions = {
                                            from: 'noreply<no-reply@cloudcfo.ph>',
                                            to: queryString.email,
                                            subject: "Reset " + global.site_name + " Account",
                                            html: content
                                        };
                                        global.emailtransport(mailOptions).then((response) => {
                                            cb({ status: true, data: { security_code: securityCode, hash: hash } })
                                        });
                                    })
                            })
                    } else {
                        cb({ status: true })
                    }
                })
        } catch (err) {
            cb({ status: false, error: err })
        }
    }
}
exports.put = {
    index: (req, cb) => {
        const body = req.body;
        const func = global.initFunc();
        try {
            UserForgotPassword
                .findOne({ where: { hash: body.hash } })
                .then((res) => {
                    if (res) {
                        let data = {};
                        data.salt = func.randomString(32);
                        data.password = func.generatePassword(body.newPassword, data.salt);

                        Users
                            .update(data, { where: { id: res.usersId } })
                            .then((updateRes) => {
                                if (updateRes.length) {
                                    UserForgotPassword
                                        .destroy({ where: { hash: body.hash, usersId: res.usersId } })
                                        .then((createRes) => {
                                            cb({ status: true, data: res });
                                        });
                                }else{
                                    cb({ status: true, error: "Something went wrong. Please try again later." });
                                }
                            })
                    } else {
                        cb({ status: true });
                    }
                })
        } catch (err) {
            cb({ status: true, error: err });
        }
    }
}