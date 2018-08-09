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
                    SUM(IF(dueDate>NOW(),1,0)) as OnTrack, 
                    SUM(IF(dueDate<NOW(),1,0)) as Issues FROM task WHERE projectId = ? && status != "Completed"
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