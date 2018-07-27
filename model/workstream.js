var field = exports.field = {

        /**
         *  Id (Primary Key)
         */
        'id' : {type : 'bigint' , access : "public" },

        /**
         * projectId (BIGINT)
         */
        'projectId' : {type : 'bigint' , access : "public" },
        
        /**
         * workstream (VARCHAR(50))
         */
        'workstream' : {type : 'string' , access : "public" },

        /**
         * projectName (VARCHAR(50))
         */
        'projectName' : {type : 'string' , access : "public" },

        /**
         * projectDescription (text)
         */
        'projectDescription' : {type : 'string' , access : "public" },

        /**
         * numberOfHours (BIGINT)
         */
        'numberOfHours' : {type : 'numberOfHours' , access : "public", database: "status", relation: "one-to-one"  },

        /**
         * statusId (BIGINT)
         */
        'statusId' : {type : 'bigint' , access : "public", database: "status", relation: "one-to-one"  },

        /**
         * typeId (BIGINT)
         */
        'typeId' : {type : 'bigint' , access : "public", database: "type", relation: "one-to-one"  },
        
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