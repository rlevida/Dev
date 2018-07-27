var field = exports.field = {

        /**
         *  Id (Primary Key)
         */
        'id' : {type : 'bigint' , access : "public" },

        /**
         * documentId (BIGINT)
         */
        'documentId' : {type : 'bigint' , access : "public" },

        /**
         * linkType (ENUM("project","workstream","task"))
         */
        'linkType' : {type : 'string' , access : "public" },

        /**
         * linkId (BIGINT)
         */
        'linkId' : {type : 'bigint' , access : "public" },

        /**
         * dateAdded (DATETIME)
         */
        'dateAdded' : {type : 'date' , access : "public" },

        /**
         * dateUpdated (TIMESTAMP)
         */
        'dateUpdated' : {type : 'date' , access : "public" }

}

var { getData, putData, postData, deleteData } = require("./index");
exports.getData = getData;field
exports.putData = putData;
exports.postData = postData;
exports.deleteData = deleteData;
