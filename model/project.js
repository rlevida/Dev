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
         * tinNo (VARCHAR(50))
         */
        'tinNo' : {type : 'string' , access : "public" },

        /**
         * companyAddress (VARCHAR(50))
         */
        'companyAddress' : {type : 'string' , access : "public" },

        /**
         * statusId (BIGINT)
         */
        'statusId' : {type : 'bigint' , access : "public", database: "status", relation: "one-to-one" },

        /**
         * typeId (BIGINT)
         */
        'typeId' : {type : 'bigint' , access : "public", database: "type", relation: "one-to-one" },

        /**
         * createdBy (BIGINT)
         */
        'createdBy' : {type : 'bigint' , access : "public"},

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
    
    let projectTb = "project"
    if(typeof data.projectIds != "undefined" ){
        if(data.projectIds.length > 0){
            let dataValue = data.projectIds.map((e)=>{ return "?" }).join(",")
            params = data.projectIds.concat(data.projectIds)
            projectTb = "( SELECT * FROM project WHERE id IN ("+dataValue+") ) as project"
        }else{
            projectTb = "( SELECT * FROM project WHERE false ) as project"
        }
    }

    let query = `SELECT tb.typeId,
                        Active,
                        type,
                        linkType,
                        taskStatus.Issues,
                        taskStatus.OnTrack  
                    FROM (select typeId,sum(IF(isActive="1",1,0)) as Active from `+projectTb+` 
                    GROUP BY typeId) as tb 
                            LEFT JOIN type ON tb.typeId = type.id
                            LEFT JOIN (SELECT typeId,sum(Issues) as Issues,sum(OnTrack) as OnTrack 
                                FROM (SELECT typeId,projectId,
                                            IF(Issues>0,1,0) as Issues,
                                            IF(OnTrack>0,1,0) as OnTrack 
                                        FROM `+projectTb+`
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

var getProjectAllowedAccess = exports.getProjectAllowedAccess = ( tablename, data, advance , cb ) => {
    let db = global.initDB();
    let params = [data.usersId,data.usersId,data.usersId];
    let query = `
                    SELECT * FROM (SELECT id as projectId FROM project WHERE createdBy = ?
                        UNION ALL
                                SELECT linkId as projectId FROM members 
                                        WHERE usersType = 'users' 
                                        AND userTypeLinkId = ?
                                        AND linkType = 'project'
                        UNION ALL
                                SELECT linkId as projectId FROM users_team 
                                        JOIN members ON users_team.teamId = members.userTypeLinkId 
                                                AND members.usersType = 'team' 
                                                AND members.linkType = 'project' 
                                                WHERE users_team.usersId = ?) as tb
                        GROUP BY projectId
                `;
    if( data.userRole == 1 || data.userRole == 2 ){
        query = "SELECT id as projectId FROM project"
        params = []
    }
    
    db.query(
        query,
        params, 
        function(err,row,fields){
            if(err) { cb({ status : false, error : err, data : row }); return; }

            cb({  status : true, error : err, data : row });
        }
    );
}