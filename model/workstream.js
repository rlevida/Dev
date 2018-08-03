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

var getDataCount = exports.getDataCount = ( tablename, data, advance , cb ) => {
    let db = global.initDB();
    let params = [data.projectId,data.projectId];
    
    let query = `SELECT tb.projectId,
                        Active, 
                        tb2.Issues, 
                        IF(tb2.Issues=0,tb2.OnTrack,0) as OnTrack 
                    FROM (select projectId,sum(IF(isActive="1",1,0)) as Active FROM workstream WHERE projectId = ? ) as tb
                    LEFT JOIN
                (SELECT projectId,
                        SUM(IF(Issues>0,1,0))  as Issues,
                        SUM(IF(OnTrack>0,1,0)) as OnTrack  FROM 
                            ( SELECT projectId,
                                     workstreamId,
                                     SUM(IF(dueDate>NOW(),1,0)) as OnTrack, 
                                     SUM(IF(dueDate<NOW(),1,0)) as Issues FROM task WHERE projectId = ?
                                GROUP BY workstreamId ) as tbpt) as tb2
                ON tb.projectId = tb2.projectId
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