var field = exports.field = {

    /**
     *  Id (Primary Key)
     */
    'id' : {type : 'bigint' , access : "public" },

    /**
     * usersType (ENUM("Mandatory","Document"))
     */
    'type' : {type : 'string' , access : "public" },

    /**
     * checklistId (BIGINT)
     */
    'checklistId' : {type : 'bigint' , access : "public" },

    /**
     * dateAdded (DATETIME)
     */
    'dateAdded' : {type : 'date' , access : "public" },

    /**
     * dateUpdated (TIMESTAMP)
     */
    'dateUpdated' : {type : 'date' , access : "public" },

}

var { getData, putData, postData, deleteData, countData, getPublicField } = require("./index");
exports.getData = getData;
exports.putData = putData;
exports.postData = postData;
exports.deleteData = deleteData;
exports.countData = countData;