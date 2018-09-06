var field = exports.field = {

    /**
     *  Id (Primary Key)
     */
    'id' : {type : 'bigint' , access : "public" },

    /**
     *  usersId (BIGINT)
     */
    'usersId' : {type : 'usersId' , access : "public" },

    /**
     *  teamLeaderId (BIGINT)
     */
    'teamLeaderId' : {type : 'teamLeaderId' , access : "public", database: "users", relation: "one-to-one"  },

    /**
     * team (VARCHAR(50))
     */
    'team' : {type : 'string' , access : "public" },
    
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
    'isDeleted' :  {type : 'date' , access : "public" }

}

var { getData, putData, postData, deleteData } = require("./index");
exports.getData = getData;
exports.putData = putData;
exports.postData = postData;
exports.deleteData = deleteData;