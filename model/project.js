var field = exports.field = {

        /**
         *  Id (Primary Key)
         */
        'id' : {type : 'bigint' , access : "public" },

        /**
         * project (VARCHAR(50))
         */
        'project' : {type : 'string' , access : "public" },

        /**
         * statusId (BIGINT)
         */
        'statusId' : {type : 'bigint' , access : "public", database: "status", relation: "one-to-one" },

        /**
         * typeId (BIGINT)
         */
        'typeId' : {type : 'bigint' , access : "public", database: "type", relation: "one-to-one" },

        /**
         * projectType (VARCHAR(50))
         */
        'projectType' : {type : 'string' , access : "public" },

        /**
         * classification (VARCHAR(50))
         */
        'classification' : {type : 'string' , access : "public" },
        
        /**
         * dateAdded (DATETIME)
         */
        'dateAdded' : {type : 'date' , access : "public" },

        /**
         * dateUpdated (TIMESTAMP)
         */
        'dateUpdated' : {type : 'date' , access : "public" },

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