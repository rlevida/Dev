var field = exports.field = {

    /**
     *  Id (Primary Key)
     */
    'id' : {type : 'bigint' , access : "public" },

    /**
     * indicator (VARCHAR(50))
     */
    'indicator' : {type : 'string' , access : "public" },
     /**
     * linkType ENUM("user","workstream","task","conversation","document","others")
     */
    'linkType' : {type : 'string' , access : "public" },

    /**
     * linkId (BIGINT)
     */
    'linkId' : {type : 'bigint' , access : "public" },

    /**
     * tagType ENUM("user","workstream","task","conversation","document")
     */
    'tagType' : {type : 'string' , access : "public" },
    
    /**
     * tagTypeId (BIGINT)
     */
    'tagTypeId' : {type : 'bigint' , access : "public" },
    
    /**
     * dateAdded (DATETIME)
     */
    'dateAdded' : {type : 'date' , access : "public" },

    /**
     * dateUpdated (TIMESTAMP)
     */
    'dateUpdated' :  {type : 'date' , access : "public" },

    /**
     * isDeleted (tinyint )
     */
    'isDeleted' :  {type : 'tinyint' , access : "public" }
}

var { getData, putData, postData, deleteData } = require("./index");
exports.getData = getData;
exports.putData = putData;
exports.postData = postData;
exports.deleteData = deleteData;