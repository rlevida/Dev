var field = exports.field = {

    /**
     *  Id (Primary Key)
     */
    'id' : {type : 'bigint' , access : "public" },

    /**
     * taskId (BIGINT)
     */
    'taskId' : {type : 'bigint' , access : "public" },

    /**
     * dependencyType (ENUM("Preceeding","Succeeding"))
     */
    'dependencyType' : {type : 'string' , access : "public" },

    /**
     * linkTaskId (BIGINT)
     */
    'linkTaskId' : {type : 'bigint' , access : "public" },

    /**
     * typeId (BIGINT)
     */
    'typeId' : {type : 'bigint' , access : "public" },

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