var sequence = require("sequence").Sequence;
var moment = require('moment');
var randomString = exports.randomString = (length) => {
    var result = '';
    var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

var generateHash = exports.generateHash = (name) => {
    var crypto = global.initRequire("crypto");
    var moment = global.initRequire("moment");
    return crypto.createHmac("sha1", ("" + moment().format()) + (name + "")).update("" + Math.random()).digest('hex');
}

var generatePassword = exports.generatePassword = (password, salt) => {
    var crypto = global.initRequire("crypto");
    return crypto.createHmac("sha1", salt).update(password).digest('hex');;
}

var sendForgotPasswordmail = exports.sendForgotPasswordmail = (responseId, email, type, cb) => {
    let func = global.initFunc(),
        salt = func.randomString(32),
        assertData = require("assert"),
        d = new Date(),
        securityCode = randomString(4),
        hash = func.generatePassword(d.getFullYear() + "-" + d.getMonth() + "-" + d.getDay() + "-" + d.getHours() + "-" + d.getMinutes() + "-" + d.getSeconds(), salt),
        text = (type == 'mobile') ? 'Here is your 4 digit security code: ' + securityCode : 'Please visit the provided link in order to complete this request.<br><br><a href="http:' + global.site_url + 'forgotPassword/?hash=' + hash + '">http:' + global.site_url + 'forgotPassword/?hash=' + hash + '</a>';

    content = '<!doctype html><html><head> <meta name="viewport" content="width=device-width"> <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"> <title>Simple Transactional Email</title> <style media="all" type="text/css"> @media all{.btn-primary table td:hover{background-color: #34495e !important;}.btn-primary a:hover{background-color: #34495e !important; border-color: #34495e !important;}}@media all{.btn-secondary a:hover{border-color: #34495e !important; color: #34495e !important;}}@media only screen and (max-width: 620px){table[class=body] h1{font-size: 28px !important; margin-bottom: 10px !important;}table[class=body] h2{font-size: 22px !important; margin-bottom: 10px !important;}table[class=body] h3{font-size: 16px !important; margin-bottom: 10px !important;}table[class=body] p, table[class=body] ul, table[class=body] ol, table[class=body] td, table[class=body] span, table[class=body] a{font-size: 16px !important;}table[class=body] .wrapper, table[class=body] .article{padding: 10px !important;}table[class=body] .content{padding: 0 !important;}table[class=body] .container{padding: 0 !important; width: 100% !important;}table[class=body] .header{margin-bottom: 10px !important;}table[class=body] .main{border-left-width: 0 !important; border-radius: 0 !important; border-right-width: 0 !important;}table[class=body] .btn table{width: 100% !important;}table[class=body] .btn a{width: 100% !important;}table[class=body] .img-responsive{height: auto !important; max-width: 100% !important; width: auto !important;}table[class=body] .alert td{border-radius: 0 !important; padding: 10px !important;}table[class=body] .span-2, table[class=body] .span-3{max-width: none !important; width: 100% !important;}table[class=body] .receipt{width: 100% !important;}}@media all{.ExternalClass{width: 100%;}.ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div{line-height: 100%;}.apple-link a{color: inherit !important; font-family: inherit !important; font-size: inherit !important; font-weight: inherit !important; line-height: inherit !important; text-decoration: none !important;}}</style></head><body class="" style="font-family: sans-serif; -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.4; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; background-color: #f6f6f6; margin: 0; padding: 0;"> <table border="0" cellpadding="0" cellspacing="0" class="body" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background-color: #f6f6f6;" width="100%" bgcolor="#f6f6f6"> <tr> <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;" valign="top">&nbsp;</td><td class="container" style="font-family: sans-serif; font-size: 14px; vertical-align: top; display: block; Margin: 0 auto !important; max-width: 580px; padding: 10px; width: 580px;" width="580" valign="top"> <div class="content" style="box-sizing: border-box; display: block; Margin: 0 auto; max-width: 580px; padding: 10px;"> <span class="preheader" style="color: transparent; display: none; height: 0; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; mso-hide: all; visibility: hidden; width: 0;">This is preheader text. Some clients will show this text as a preview.</span> <table class="main" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background: #fff; border-radius: 3px;" width="100%"> <tr> <td class="wrapper" style="font-family: sans-serif; font-size: 14px; vertical-align: top; box-sizing: border-box; padding: 20px;" valign="top"> <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;" width="100%"> <tr> <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;" valign="top"> <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; Margin-bottom: 15px;">Hello ' + email + ',<br><br> We got a request to reset your password on ' + global.site_name + ' Account. ' + text + '</p></td></tr></table> </td></tr></table> <div class="footer" style="clear: both; padding-top: 10px; text-align: center; width: 100%;"> <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;" width="100%"> <tr> <td class="content-block" style="font-family: sans-serif; vertical-align: top; padding-top: 10px; padding-bottom: 10px; font-size: 12px; color: #999999; text-align: center;" valign="top" align="center"> <span class="apple-link" style="color: #999999; font-size: 12px; text-align: center;">' + global.site_name + ' - Powered by: <a style="text-decoration: underline !important; color: #999999; font-size: 12px; text-align: center;" href="www.mobbizsolutions.com">Mobbiz Solutions</a></span> </td></tr><tr> <td class="content-block powered-by" style="font-family: sans-serif; vertical-align: top; padding-top: 10px; padding-bottom: 10px; font-size: 12px; color: #999999; text-align: center;" valign="top" align="center"> </td></tr></table> </div></div></td><td style="font-family: sans-serif; font-size: 14px; vertical-align: top;" valign="top">&nbsp;</td></tr></table></body></html>';

    let ufp = global.initModel("users_forgot_password");
    ufp.deleteData("users_forgot_password",{usersId:responseId},()=>{
        ufp.postData("users_forgot_password",{hash_word:hash,usersId:responseId},(c)=>{
            var mailOptions = {
                from: 'noreply<mobbizapps12345@gmail.com>',
                to: email,
                subject: "Reset "+ global.site_name +" Account",
                html: content
            };
            global.emailtransport(mailOptions).then((response) => {
                cb(response,{security_code:securityCode,hash:hash});
            });
        })
    })
}

var getFilePathExtension = exports.getFilePathExtension = (path) => {
    var filename = path.split('\\').pop().split('/').pop();
    return filename.substr((Math.max(0, filename.lastIndexOf(".")) || Infinity) + 1);
}

var uploadFile = exports.uploadFile = (params,cb) => {
    var fs = global.initRequire('fs'),
        AWS = global.initAWS();
    var fileStream = fs.createReadStream(params.file.path);
    fileStream.on('error', (err) => {
       console.log("Error in creating file stream. [" + err + "]");
    });
    
    fileStream.on('open', () => {
        var s3 = new AWS.S3();
            s3.putObject({
                Bucket: global.AWSBucket,
                Key: global.environment + "/" + params.form + "/" + params.filename,
                ACL: 'public-read-write',
                Body: fileStream,
                ContentType : params.file.type
            }, (err) => {
                if(err){
                    console.log("Error in Uploading to AWS. [" + err + "]");
                    cb({Message:'Failed to upload'})
                }else{
                    cb({Message:'Success'})
                }
            });
    });
}