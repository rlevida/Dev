global.environment = process.env.NODE_ENV || "development";

global.site_name = "CloudCFO";

if (global.environment === "development") {
    global.site_url = "//localhost:3008/";
}
if (global.environment === "staging") {
    global.site_url = "//ui-cloudcfo.mobbizapp.com/";
}

if (global.environment === "production") {
    global.site_url = "//cloudcfo.mobbizapps.com/";
}

/*
    This functions calls indicated model to avoid require on each file
*/

global.initModel = exports.initModel = function(model) {
    return require("../model/" + model);
};

/*
    This functions calls indicated model to avoid require on each file
*/

global.initModelORM = exports.initModelORM = function(model) {
    return require("../modelORM/" + model);
};

/*
    This functions calls indicated controller to avoid require on each file
*/

global.initController = exports.initController = function(controller) {
    return require("../controller/" + controller);
};

/*
    This function initialize database setup to avoid require on each file
*/

global.initDB = exports.initDB = function() {
    return require("./database");
};

/*
    This global config initialize database setup to avoid require on each file
*/

const Sequelize = require("sequelize");
global.connectionDb = exports.connectionDb = new Sequelize(process.env.CLOUD_CFO_DB, process.env.CLOUD_CFO_DB_USER, process.env.CLOUD_CFO_DB_PASSWORD, {
    host: process.env.CLOUD_CFO_DB_HOST,
    dialect: "mysql",
    operatorsAliases: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

/*
    This function initialize reusable function to avoid require on each file
*/

global.initModelFunc = exports.initModelFunc = function() {
    return require("../model");
};

/*
    This function initialize reusable function to avoid require on each file
*/

global.initFunc = exports.initFunc = function() {
    return require("./function");
};
/*
    This function is used to initialize node modules
*/
global.initRequire = exports.initRequire = function(name) {
    return require(name);
};

/*
    This function is used to initialize email
*/
global.emailtransport = exports.emailtransport = function(mailOptions) {
    var nodemailer = global.initRequire("nodemailer");
    var deferred = global.initRequire("deferred");
    var response = deferred();

    var transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: "mobbizapps12345@gmail.com",
            pass: "!qa@ws#ed"
        }
    });

    transporter.sendMail(mailOptions, function(error, info) {
        response.resolve("Successfully Sent.");
    });

    return response.promise;
};

/*
    token secret
 */
exports.secret = "volenday-secret";

/**
 * Ths function use for AWS uploading and deleting
 */
global.AWSBucket = "cloud-cfo";
global.AWSAccessKey = "AKIAI5UVURKMM4LYE5YA";
global.AWSSecretAccessKey = "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";
global.AWSLink = "https://s3-ap-southeast-1.amazonaws.com/cloud-cfo/";
global.initAWS = exports.initAWS = function() {
    var AWS = global.initRequire("aws-sdk");

    AWS.config.update({
        accessKeyId: global.AWSAccessKey,
        secretAccessKey: global.AWSSecretAccessKey
    });
    return AWS;
};

global.initAWSClient = exports.initAWSClient = function() {
    var knox = global.initRequire("knox");

    var client = knox.createClient({
        key: global.AWSAccessKey,
        secret: global.AWSSecretAccessKey,
        bucket: global.AWSBucket
    });

    return client;
};
