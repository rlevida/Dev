var mysql = require('mysql');

var connectionCredentials = exports.connectionCredentials = {
    host: process.env.MYSQL_SERVICE_HOST || 'localhost',
    port: process.env.MYSQL_SERVICE_PORT || '3306',
    user:  process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_ROOT_PASSWORD || '1234',
    database: process.env.MYSQL_DATABASE || 'cloud_cfo',
    charset : 'utf8mb4'
};

exports.query = function(query, values, cb){

    var connection = mysql.createConnection(connectionCredentials);

    connection.connect();
    
    connection.query("SET GLOBAL sql_mode=''", values, function(err1, rows1, fields1){
        connection.query(query, values, function(err, rows, fields){
            connection.destroy();
            cb(err, rows, fields);
        });
    });
    
};