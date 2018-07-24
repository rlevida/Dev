var field = exports.field = {

    /**
     *  Id (Primary Key)
     */
    'id' : {type : 'bigint' , access : "public" },

    /**
     * team (VARCHAR(50))
     */
    'team' : {type : 'string' , access : "public" },
    
    /**
     * date_added (DATETIME)
     */
    'date_added' : {type : 'date' , access : "public" },

    /**
     * date_updated (TIMESTAMP)
     */
    'date_updated' :  {type : 'date' , access : "public" },

    /**
     * isDeleted (tinyint )
     */
    'isDeleted' :  {type : 'date' , access : "public" }

}

var { getData, putData, postData, deleteData } = require("./index");
exports.getData = getData;
exports.putData = putData;
exports.postData = postData;
exports.deleteData = deleteData;