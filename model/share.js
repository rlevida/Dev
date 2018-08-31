var field = exports.field = {

    /**
     *  Id (Primary Key)
     */
    'id' : {type : 'bigint' , access : "public" },

    /**
     * usersType (ENUM("users","team"))
     */
    'usersType' : {type : 'string' , access : "public" },

    /**
     * userTypeLinkId (BIGINT)
     */
    'userTypeLinkId' : {type : 'bigint' , access : "public" },

    /**
     * linkType (ENUM("project","workstream","task"))
     */
    'linkType' : {type : 'string' , access : "public" },

    /**
     * linkId (BIGINT)
     */
    'linkId' : {type : 'bigint' , access : "public" },

    /**
     * shareType (ENUM("document","folder"))
     */
    'shareType' : {type : 'string' , access : "public" },
    
    /**
     * shareId (BIGINT)
     */
    'shareId' : {type : 'bigint' , access : "public" },

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