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
    'workstreamId' : {type : 'bigint' , access : "public",  database: "workstream", relation: "one-to-one" },

     /**
     * task (TEXT)
     */
    'task' : {type : 'text' , access : "public" },

     /**
     * dueDate (DATETIME)
     */
    'dueDate' : {type : 'date' , access : "public" },

    /**
     * statusId (BIGINT)
     */
    'statusId' : {type : 'bigint' , access : "public", database: "status", relation: "one-to-one" },

    /**
     * typeId (BIGINT)
     */
    'typeId' : {type : 'bigint' , access : "public" },

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