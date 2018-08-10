var field = exports.field = {

    /**
     *  Id (Primary Key)
     */
    'id' : {type : 'bigint' , access : "public" },

    /**
     * projectId (BIGINT)
     */
    'projectId' : {type : 'bigint' , access : "public",  database: "project", relation: "one-to-one" },

    /**
     * workstream (VARCHAR(50))
     */
    'workstreamId' : {type : 'bigint' , access : "public",  database: "workstream", relation: "one-to-one" },

     /**
     * task (TEXT)
     */
    'task' : {type : 'text' , access : "public" },

     /**
     * dueDate (DATETIME)
     */
    'dueDate' : {type : 'date' , access : "public" },

    /**
     * status (ENUM("In Progress","For Approval","Completed"))
     */
    'status' : {type : 'string' , access : "public" },

    /**
     * typeId (BIGINT)
     */
    'typeId' : {type : 'bigint' , access : "public" },

    /**
     * linkTaskId (BIGINT)
     */
    'linkTaskId' : {type : 'bigint' , access : "public",  database: "task", relation: "one-to-one"  },

    /**
     * dateAdded (DATETIME)
     */
    'dateAdded' : {type : 'date' , access : "public" },

    /**
     * dateUpdated (TIMESTAMP)
     */
    'dateUpdated' :  {type : 'date' , access : "public" },

    /**
     * isActive (tinyInt)
     */
    'isActive' : {type : 'int' , access : "public" },

    /**
     * isDeleted (tinyInt)
     */
    'isDeleted' : {type : 'int' , access : "public" },

}

var { getData, putData, postData, deleteData } = require("./index");
exports.getData = getData;
exports.putData = putData;
exports.postData = postData;
exports.deleteData = deleteData;

var getDataCount = exports.getDataCount = ( tablename, data, advance , cb ) => {
    let db = global.initDB();
    let params = [data.projectId];
    
    let query = `SELECT projectId,
                    workstreamId,
                    SUM(isActive) as Active, 
                    SUM(IF(dueDate>=CURDATE(),1,0)) as OnTrack, 
                    SUM(IF(dueDate<CURDATE() AND duedate > "1970-01-01",1,0)) as Issues FROM task WHERE projectId = ? AND status != "Completed"  AND isActive = 1
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

var getUserTaskDataCount = exports.getUserTaskDataCount = ( tablename, data, advance , cb ) => {
    let db = global.initDB();
    let params = [];
    let filter = "" , filter2 = "";
    if(data.userId){
        params = [data.userId,data.userId]
        filter = " AND finalTbl1.usersId = ? "
        filter2 = " AND finalTbl2.usersId = ? "
    }

    let query = `
                    SELECT memberType,SUM(isActive) as Active, SUM(IF(DATE_FORMAT(dueDate,"%Y-%m-%d")=CURDATE(),1,0)) as DueToday, SUM(IF(dueDate<CURDATE() AND duedate > "1970-01-01",1,0)) as Issues FROM (SELECT finalTbl1.*,task.id as taskId,task.dueDate,task.isActive,task.status FROM ( SELECT members.linkType,members.linkId,members.memberType,users.id as usersId FROM members 
                        LEFT JOIN users ON members.userTypeLinkId = users.id
                            WHERE usersType = "users"
                    UNION ALL
                    SELECT members.linkType,members.linkId,members.memberType,users.id as usesrId FROM members 
                        LEFT JOIN users_team ON members.userTypeLinkId = users_team.teamId
                            LEFT JOIN users ON users_team.usersId = users.id
                            WHERE members.usersType = "team" ) as finalTbl1 
                        LEFT JOIN task on finalTbl1.linkId = task.id
                    WHERE finalTbl1.linkType = "task"  AND task.status != "Completed" AND task.isActive = 1 `+filter+`
                    UNION ALL
                    SELECT finalTbl2.*,task.id as taskId,task.dueDate,task.isActive,task.status FROM ( SELECT members.linkType,members.linkId,members.memberType,users.id as usersId FROM members 
                        LEFT JOIN users ON members.userTypeLinkId = users.id
                            WHERE usersType = "users"
                    UNION ALL
                    SELECT members.linkType,members.linkId,members.memberType,users.id as usersId FROM members 
                        LEFT JOIN users_team ON members.userTypeLinkId = users_team.teamId
                            LEFT JOIN users ON users_team.usersId = users.id
                            WHERE members.usersType = "team" ) as finalTbl2 
                        LEFT JOIN task on finalTbl2.linkId = task.workstreamId
                    WHERE finalTbl2.linkType = "workstream"  AND task.status != "Completed" AND task.isActive = 1 `+filter2+` ) as tbl
                    GROUP BY linkType;
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

var getTaskAllowedAccess = exports.getTaskAllowedAccess = ( tablename, data, advance , cb ) => {

    let db = global.initDB();
    let params = [data.usersId,data.usersId,data.usersId,data.usersId];
    let query = `
                    SELECT * FROM (SELECT task.id as taskId FROM ( SELECT members.linkType,members.linkId,members.memberType,users.id as usersId FROM members 
                        LEFT JOIN users ON members.userTypeLinkId = users.id
                            WHERE usersType = "users"  AND users.id = ?
                    UNION ALL
                    SELECT members.linkType,members.linkId,members.memberType,users.id as usesrId FROM members 
                        LEFT JOIN users_team ON members.userTypeLinkId = users_team.teamId
                            LEFT JOIN users ON users_team.usersId = users.id
                            WHERE members.usersType = "team"  AND users.id = ? ) as finalTbl1 
                        LEFT JOIN task on task.id = finalTbl1.linkId
                    WHERE finalTbl1.linkType = "task" AND task.status != "Completed" AND task.id IS NOT NULL 
                    UNION ALL
                    SELECT task.id as taskId FROM ( SELECT members.linkType,members.linkId,members.memberType,users.id as usersId FROM members 
                        LEFT JOIN users ON members.userTypeLinkId = users.id
                            WHERE usersType = "users"  AND users.id = ?
                    UNION ALL
                    SELECT members.linkType,members.linkId,members.memberType,users.id as usersId FROM members 
                        LEFT JOIN users_team ON members.userTypeLinkId = users_team.teamId
                            LEFT JOIN users ON users_team.usersId = users.id
                            WHERE members.usersType = "team" AND users.id = ? ) as finalTbl2 
                        LEFT JOIN task on task.workstreamId = finalTbl2.linkId
                    WHERE finalTbl2.linkType = "workstream" AND task.status != "Completed" AND task.id IS NOT NULL ) as tbl
                    GROUP BY tbl.taskId
                `;
    if( data.userRole == 1 || data.userRole == 2 ){
        query = "SELECT id as taskId FROM task"
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