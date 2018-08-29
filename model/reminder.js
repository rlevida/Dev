var field = exports.field = {

    /**
     *  Id (Primary Key)
     */
    'id' : {type : 'bigint' , access : "public" },

    /**
     * reminderDetail (VARCHAR(50))
     */
    'reminderDetail' : {type : 'string' , access : "public" },

     /**
     * usersId (BIGINT)
     */
    'usersId' : {type : 'int' , access : "public" },

    /**
     * taskId (BIGINT)
     */
    'taskId' : {type : 'int' , access : "public" },

    /**
     * seen (TINYINT)
     */
    'seen' : {type : 'int' , access : "public" },
    
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