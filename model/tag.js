var field = exports.field = {

    /**
     *  Id (Primary Key)
     */
    'id' : {type : 'bigint' , access : "public" },

    /**
     * conversationId (BIGINT)
     */
    'conversationId' : {type : 'bigint' , access : "public" },

    /**
     * taguserId (BIGINT)
     */
    'taguserId' : {type : 'int' , access : "public" },

    /**
     * indicator (VARCHAR(50))
     */
    'indicator' : {type : 'string' , access : "public" },

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