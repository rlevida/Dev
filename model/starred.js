var field = exports.field = {

    /**
     *  Id (Primary Key)
     */
    'id' : {type : 'bigint' , access : "public" },

    /**
     * userId (BIGINT)
     */
    'userId' : {type : 'bigint' , access : "public" },

    /**
     * linkType (ENUM("project","workstream","task","document","conversation"))
     */
    'linkType' : {type : 'string' , access : "public", database: "users" , relation: "one-to-one" },

    /**
     * linkId (BIGINT)
     */
    'linkId' : {type : 'bigint' , access : "public" },

    /**
     * date_added (DATETIME)
     */
    'date_added' : {type : 'date' , access : "public" },

    /**
     * date_updated (TIMESTAMP)
     */
    'date_updated' :  {type : 'date' , access : "public" },

    /**
     * isActive (tinyint )
     */
    'isActive' :  {type : 'date' , access : "public" },

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