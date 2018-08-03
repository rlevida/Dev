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
    
    let query = `SELECT tb.typeId,
                        Active,
                        type,
                        linkType,
                        taskStatus.Issues,
                        taskStatus.OnTrack  
                    FROM (select typeId,sum(IF(isActive="1",1,0)) as Active from project 
                    GROUP BY typeId) as tb 
                            LEFT JOIN type ON tb.typeId = type.id
                            LEFT JOIN (SELECT typeId,sum(Issues) as Issues,sum(OnTrack) as OnTrack 
                                FROM (SELECT typeId,projectId,
                                            IF(Issues>0,1,0) as Issues,
                                            IF(OnTrack>0,1,0) as OnTrack 
                                        FROM project
                            LEFT JOIN (SELECT projectId,
                                                SUM(IF(dueDate>NOW(),1,0)) as OnTrack, 
                                                SUM(IF(dueDate<NOW(),1,0)) as Issues FROM task) as tbTask 
                                    ON project.id = tbTask.projectId) as tbpt 
                                    GROUP BY typeId) as taskStatus ON tb.typeId = taskStatus.typeId;
`;

    db.query(
        query,
        params, 
        function(err,row,fields){
            if(err) { cb({ status : false, error : err, data : row }); return; }

            cb({  status : true, error : err, data : row });
        }
    );
}