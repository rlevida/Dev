var field = exports.field = {

    /**
     *  Id (Primary Key)
     */
    'id' : {type : 'bigint' , access : "public" },

    /**
     * firstName (VARCHAR 50)
     */
    'firstName' : {type : 'string' , access : "public" },

    /**
     * lastName (VARCHAR 50)
     */
    'lastName' : {type : 'string' , access : "public" },

    /**
     * phoneNumber (VARCHAR 20)
     */
    'phoneNumber' : {type : 'string' , access : "public" },

    /**
     * position (BIGINT)
     */
    'companyId' : {type : 'bigint' , access : "public", database: "company", relation: "one-to-one" },

    /**
     * username (VARCHAR 100)
     */
    'username' : {type : 'string' , access : "public" },

    /**
     * password (VARCHAR 50)
     */
    'password' : {type : 'string' , access : "private" },

    /**
     * salt (VARCHAR 50)
     */
    'salt' : {type : 'string' , access : "private" },

    /**
     * avatar (TEXT)
     */
    'avatar' : {type : 'string' , access : "public" },

    /**
     * emailAddress (VARCHAR 100)
     */
    'emailAddress' : {type : 'string' , access : "public" },

    /**
     * userType (ENUM("Internal","External"))
     */
    'userType' : {type : 'string' , access : "public" },

    /**
     * dateAdded (DATETIME)
     */
    'dateAdded' : {type : 'date' , access : "public" },

    /**
     * dateUpdated (TIMESTAMP)
     */
    'dateUpdated' :  {type : 'date' , access : "public" },

    /**
     * isActive (tinyint )
     */
    'isActive' :  {type : 'date' , access : "public" },

    /**
     * isDeleted (tinyint )
     */
    'isDeleted' :  {type : 'date' , access : "public" },

    /**
     * company (VARCHAR 50 )
     */
    'company' :  {type : 'string' , access : "public" }

}

var { getData, putData, postData, deleteData } = require("./index");
exports.getData = getData;
exports.putData = putData;
exports.postData = postData;
exports.deleteData = deleteData;