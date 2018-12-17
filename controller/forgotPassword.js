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
                        content = '<!doctype html><html><head> <meta name="viewport" content="width=device-width"> <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"> <title>Simple Transactional Email</title> <style media="all" type="text/css"> @media all{.btn-primary table td:hover{background-color: #34495e !important;}.btn-primary a:hover{background-color: #34495e !important; border-color: #34495e !important;}}@media all{.btn-secondary a:hover{border-color: #34495e !important; color: #34495e !important;}}@media only screen and (max-width: 620px){table[class=body] h1{font-size: 28px !important; margin-bottom: 10px !important;}table[class=body] h2{font-size: 22px !important; margin-bottom: 10px !important;}table[class=body] h3{font-size: 16px !important; margin-bottom: 10px !important;}table[class=body] p, table[class=body] ul, table[class=body] ol, table[class=body] td, table[class=body] span, table[class=body] a{font-size: 16px !important;}table[class=body] .wrapper, table[class=body] .article{padding: 10px !important;}table[class=body] .content{padding: 0 !important;}table[class=body] .container{padding: 0 !important; width: 100% !important;}table[class=body] .header{margin-bottom: 10px !important;}table[class=body] .main{border-left-width: 0 !important; border-radius: 0 !important; border-right-width: 0 !important;}table[class=body] .btn table{width: 100% !important;}table[class=body] .btn a{width: 100% !important;}table[class=body] .img-responsive{height: auto !important; max-width: 100% !important; width: auto !important;}table[class=body] .alert td{border-radius: 0 !important; padding: 10px !important;}table[class=body] .span-2, table[class=body] .span-3{max-width: none !important; width: 100% !important;}table[class=body] .receipt{width: 100% !important;}}@media all{.ExternalClass{width: 100%;}.ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div{line-height: 100%;}.apple-link a{color: inherit !important; font-family: inherit !important; font-size: inherit !important; font-weight: inherit !important; line-height: inherit !important; text-decoration: none !important;}}</style></head><body class="" style="font-family: sans-serif; -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.4; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; background-color: #f6f6f6; margin: 0; padding: 0;"> <table border="0" cellpadding="0" cellspacing="0" class="body" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background-color: #f6f6f6;" width="100%" bgcolor="#f6f6f6"> <tr> <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;" valign="top">&nbsp;</td><td class="container" style="font-family: sans-serif; font-size: 14px; vertical-align: top; display: block; Margin: 0 auto !important; max-width: 580px; padding: 10px; width: 580px;" width="580" valign="top"> <div class="content" style="box-sizing: border-box; display: block; Margin: 0 auto; max-width: 580px; padding: 10px;"> <span class="preheader" style="color: transparent; display: none; height: 0; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; mso-hide: all; visibility: hidden; width: 0;">This is preheader text. Some clients will show this text as a preview.</span> <table class="main" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background: #fff; border-radius: 3px;" width="100%"> <tr> <td class="wrapper" style="font-family: sans-serif; font-size: 14px; vertical-align: top; box-sizing: border-box; padding: 20px;" valign="top"> <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;" width="100%"> <tr> <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;" valign="top"> <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; Margin-bottom: 15px;">Hello ' + queryString.email + ',<br><br> We got a request to reset your password on ' + global.site_name + ' Account. ' + text + '</p></td></tr></table> </td></tr></table> <div class="footer" style="clear: both; padding-top: 10px; text-align: center; width: 100%;"> <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;" width="100%"> <tr> <td class="content-block" style="font-family: sans-serif; vertical-align: top; padding-top: 10px; padding-bottom: 10px; font-size: 12px; color: #999999; text-align: center;" valign="top" align="center"> <span class="apple-link" style="color: #999999; font-size: 12px; text-align: center;">' + global.site_name + ' - Powered by: <a style="text-decoration: underline !important; color: #999999; font-size: 12px; text-align: center;" href="www.mobbizsolutions.com">Mobbiz Solutions</a></span> </td></tr><tr> <td class="content-block powered-by" style="font-family: sans-serif; vertical-align: top; padding-top: 10px; padding-bottom: 10px; font-size: 12px; color: #999999; text-align: center;" valign="top" align="center"> </td></tr></table> </div></div></td><td style="font-family: sans-serif; font-size: 14px; vertical-align: top;" valign="top">&nbsp;</td></tr></table></body></html>';

                        UserForgotPassword
                            .destroy({ where: { usersId: res.id } })
                            .then((destroyRes) => {
                                UserForgotPassword
                                    .create({ hash: hash, usersId: res.id })
                                    .then((createRes) => {
                                        var mailOptions = {
                                            from: 'noreply<mobbizapps12345@gmail.com>',
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
                                    cb({ status: true, data: res });
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