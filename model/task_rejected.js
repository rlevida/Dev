var field = exports.field = {

    /**
     *  Id (Primary Key)
     */
    'id': { type: 'bigint', access: "public" },

    /**
     * projectId (BIGINT)
     */
    'projectId': { type: 'bigint', access: "public", database: "project", relation: "one-to-one" },

    /**
     * workstream (BIGINT)
     */
    'workstreamId': { type: 'bigint', access: "public", database: "workstream", relation: "one-to-one" },

    /**
    * taskID (BIGINT)
    */
    'taskId': { type: 'bigint', access: "public" },

    /**
    * taskID (BIGINT)
    */
    'reminderId': { type: 'bigint', access: "public" },

    /**
     * approverId (BIGINT)
     */
    'approverId': { type: 'bigint', access: "public"},

    /**
     * approvalDueDate (data)
     */
    'approvalDueDate': { type: 'date', access: "public"},

    /**
     * message (VARCHAR(50))
     */
    'message' : {type : 'string' , access : "public" },

    /**
     * dateAdded (DATETIME)
     */
    'dateAdded': { type: 'date', access: "public" },
    /**
     * dateUpdated (TIMESTAMP)
     */
    'dateUpdated': { type: 'date', access: "public" },
}

var { getData, putData, postData, deleteData, getPublicField } = require("./index");
exports.getData = getData;
exports.putData = putData;
exports.postData = postData;
exports.deleteData = deleteData;