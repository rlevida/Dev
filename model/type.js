var field = exports.field = {

    /**
     *  Id (Primary Key)
     */
    'id' : {type : 'bigint' , access : "public" },

    /**
     * name (VARCHAR(50))
     */
    'name' : {type : 'string' , access : "public" },
    
    /**
     * uploadedBy (BIGINT)
     */
    'uploadedBy' : {type : 'bigint' , access : "public" },

    /**
     * type (VARCHAR(50))
     */
    'type' : {type : 'string' , access : "public" },

    /**
     * linkType (ENUM("project","workstream","task"))
     */
    'linkType' : {type : 'string' , access : "public" },

    /**
     * linkId (BIGINT)
     */
    'linkId' : {type : 'bigint' , access : "public" },

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