var field = exports.field = {

    /**
     *  Id (Primary Key)
     */
    'id' : {type : 'bigint' , access : "public" },

    /**
     * comment (Text)
     */
    'comment' : {type : 'string' , access : "public" },

    /**
     * usersId (BIGINT)
     */
    'usersId' : {type : 'bigint' , access : "public" },

    /**
     * linkType (ENUM("project","workstream","task"))
     */
    'linkType' : {type : 'string' , access : "public" },

    /**
     * linkId (BIGIN)
     */
    'linkId' : {type : 'bigint' , access : "public" },

    /**
     * dateAdded (DATETIME)
     */
    'dateAdded' : {type : 'date' , access : "public" },

    /**
     * dateUpdated (TIMESTAMP)
     */
    'dateUpdated' : {type : 'date' , access : "public" },

    /**
     * isDeleted (tinyint )
     */
    'isDeleted' :  {type : 'date' , access : "public" }

}

var { getData, putData, postData, deleteData } = require("./index");
exports.getData = getData;
exports.putData = putData;
exports.postData = postData;
exports.deleteData = deleteData;