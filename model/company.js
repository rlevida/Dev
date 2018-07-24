var field = exports.field = {

    /**
     *  Id (Primary Key)
     */
    'id' : {type : 'bigint' , access : "public" },

    /**
     * companyName (VARCHAR 50)
     */
    'companyName' : {type : 'string' , access : "public" },

    /**
     * industry (VARCHAR 50)
     */
    'industry' : {type : 'string' , access : "public" },

    /**
     * active (TinyInt 1)
     */
    'active' : {type : 'tinyint' , access : "public" },

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