var field = exports.field = {

    /**
     *  Id (Primary Key)
     */
    'id' : {type : 'bigint' , access : "public" },

    /**
     * status (VARCHAR(50))
     */
    'status' : {type : 'string' , access : "public" },

    /**
     * linkType (ENUM("project","workstream","task"))
     */
    'linkType' : {type : 'string' , access : "public", database: "users" , relation: "one-to-one" },

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