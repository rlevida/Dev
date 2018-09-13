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
     * origin (VARCHAR(50))
     */
    'projectId' : {type : 'string' , access : "public" },
    /**
     * uploadedBy (BIGINT)
     */
    'parentId' : {type : 'bigint' , access : "public" },
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
    'isDeleted' :  {type : 'date' , access : "public" },
    
    /**
     * isFolder (tinyint )
     */
    'isFolder' : {type:'tinyint' , access : "public"},

    /** 
     * status (ENUM("new","library","achrive"))
     */
    'type' : {type : 'string' , access : "public" },

     /**
     * createdBy (BIGINT )
     */
    'createdBy' : {type:'bigint' , access : "public"}

}

var { getData, putData, postData, deleteData } = require("./index");
exports.getData = getData;
exports.putData = putData;
exports.postData = postData;
exports.deleteData = deleteData;