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

var getDataCount = exports.getDataCount = ( tablename, data, advance , cb ) => {
    let db = global.initDB();
    let params = [];
    
    let query = `SELECT 
                        typeId,
                        Active,
                        type,
                        linkType 
                FROM (SELECT 
                        typeId,
                        SUM(IF(isActive="1",1,0)) as Active 
                      FROM project 
                      GROUP BY typeId) AS tb 
                      LEFT JOIN type ON tb.typeId = type.id`;

    db.query(
        query,
        params, 
        function(err,row,fields){
            if(err) { cb({ status : false, error : err, data : row }); return; }

            cb({  status : true, error : err, data : row });
        }
    );
}