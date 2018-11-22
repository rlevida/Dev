var field = exports.field = {

    /**
     *  Id (Primary Key)
     */
    'id' : {type : 'bigint' , access : "public" },
    /**
     * note (VARCHAR(255))
     */
    'note' : {type : 'string' , access : "public" },
    /**
     * privacyType (VARCHAR(20))
     */
    'privacyType' : {type : 'string' , access : "public" },
    /**
     * isStarred (TINYINT)
     */
    'isStarred' : {type : 'tinyint' , access : "public" },
    /**
     * createdBy (BIGINT)
     */
    'isStarred' : {type : 'bigint' , access : "public" },
    /**
     * dateAdded (DATETIME)
     */
    'dateAdded' : {type : 'date' , access : "public" },

    /**
     * dateUpdated (TIMESTAMP)
     */
    'dateUpdated' : {type : 'date' , access : "public" },

}

var { getData, putData, postData, deleteData } = require("./index");
exports.getData = getData;
exports.putData = putData;
exports.postData = postData;
exports.deleteData = deleteData;