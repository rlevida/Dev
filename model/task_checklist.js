var field = exports.field = {

    /**
     *  Id (Primary Key)
     */
    'id' : {type : 'bigint' , access : "public" },

     /**
     *  completed (TINYINT)
     */
    'completed' : {type : 'completed' , access : "public" },


    /**
     * description (TEXT)
     */
    'description' : {type : 'string' , access : "public" },

    /**
     *  taskId (Foreign Key)
     */
    'taskId' : {type : 'bigint' , access : "public" },
    
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