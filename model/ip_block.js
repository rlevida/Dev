var field = exports.field = {
    /**
     *  Id (Primary Key)
     */
    'id' : {type : 'bigint' , access : "public" },

    /**
     * companyName (VARCHAR 30)
     */
    'ipAddress' : {type : 'string' , access : "public" },

    /**
     * industry (Int 2)
     */
    'failedTimes' : {type : 'int' , access : "public" },

    /**
     * isActive (DATETIME)
     */
    'dateFailed' : {type : 'tinyint' , access : "public" },

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