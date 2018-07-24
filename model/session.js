var field = exports.field = {

    /**
     *  Id (Primary Key)
     */
    'id' : {type : 'bigint' , access : "public" },

    /**
     * session (VARCHAR 50)
     */
    'session' : {type : 'string' , access : "public" },

    /**
     * session (BIGINT 20)
     */
    'usersId' : {type : 'bigint' , access : "public", database: "users" , relation: "one-to-one" },

    /**
     * data (Text)
     */
    'data' : {type : 'string' , access : "public" },

    /**
     * expiredDate (DATETIME)
     */
    'expiredDate' : {type : 'date' , access : "public" },

    /**
     * dateAdded (DATETIME)
     */
    'dateAdded' : {type : 'date' , access : "public" },

    /**
     * dateUpdated (TIMESTAMP)
     */
    'dateUpdated' :  {type : 'date' , access : "public" }

}

var { getData, putData, postData, deleteData } = require("./index");
exports.getData = getData;
exports.putData = putData;
exports.postData = postData;
exports.deleteData = deleteData;