var field = exports.field = {

    /**
     *  Id (Primary Key)
     */
    'id' : {type : 'bigint' , access : "public" },

    /**
     * projectId (BIGINT)
     */
    'projectId' : {type : 'bigint' , access : "public" },

    /**
     * workstream (VARCHAR(50))
     */
    'workstream' : {type : 'string' , access : "public" },

    /**
     * statusId (BIGINT)
     */
    'statusId' : {type : 'bigint' , access : "public" },

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
    'date_updated' :  {type : 'date' , access : "public" }

}

var { getData, putData, postData, deleteData } = require("./index");
exports.getData = getData;
exports.putData = putData;
exports.postData = postData;
exports.deleteData = deleteData;