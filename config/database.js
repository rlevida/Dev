var mysql = require("mysql");

var connectionCredentials = (exports.connectionCredentials = {
    host: process.env.CLOUD_CFO_DB_HOST,
    port: process.env.CLOUD_CFO_DB_PORT,
    user: process.env.CLOUD_CFO_DB_USER,
    password: process.env.CLOUD_CFO_DB_PASSWORD,
    database: process.env.CLOUD_CFO_DB,
    charset: "utf8mb4"
});

var connection = mysql.createConnection(connectionCredentials);
connection.connect();

connection.query("SET GLOBAL sql_mode=''", {}, function(err1, rows1, fields1) {});

exports.query = function(query, values, cb) {
    connection.query(query, values, function(err, rows, fields) {
        cb(err, rows, fields);
    });
};
