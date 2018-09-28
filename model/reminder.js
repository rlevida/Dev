var field = exports.field = {

    /**
     *  Id (Primary Key)
     */
    'id' : {type : 'bigint' , access : "public" },

    /**
     * reminderDetail (VARCHAR(50))
     */
    'reminderDetail' : {type : 'string' , access : "public" },

     /**
     * usersId (BIGINT)
     */
    'usersId' : {type : 'int' , access : "public" },

    /**
     * taskId (BIGINT)
     */
    'taskId' : {type : 'int' , access : "public" },

    /**
     * seen (TINYINT)
     */
    'seen' : {type : 'int' , access : "public" },

     /**
     * projectId (BIGINT)
     */
    'projectId' : {type : 'int' , access : "public" },

     /**
     * linkId (TINYINT)
     */
    'linkId' : {type : 'int' , access : "public" },
    
    /**
     * linkType (ENUM("task","document","workstream"))
     */
    'linkType' : {type : 'string' , access : "public" },

    /**
     * type (ENUM("For Approval","Task Rejected","Task Overdue","Task Due Today","Tag in Comment"))
     */
    'type' : {type : 'string' , access : "public" },

    /**
     * createdBy (BIGINT)
     * 
     */
    'createdBy' : {type : 'int' , access : "public" },
    
    /**
     * dateAdded (DATETIME)
     */
    'dateAdded' : {type : 'date' , access : "public" },

    /**
     * dateUpdated (TIMESTAMP)
     */
    'dateUpdated' :  {type : 'date' , access : "public" }
}

var { getData, putData, postData, deleteData } = require("./index");
exports.getData = getData;
exports.putData = putData;
exports.postData = postData;
exports.deleteData = deleteData;

var getReminderList = exports.getReminderList = (data , cb ) => {
  
    let db = global.initDB();
    let params = []; 
    let query = `SELECT reminder.*, task.task as taskName , reminder.id as reminderId , task.workstreamId , CONCAT(users.firstName," " , users.lastName) as createdByName FROM reminder 
                    LEFT JOIN task ON reminder.linkId = task.id 
                    LEFT JOIN users ON reminder.createdBy = users.id
                    WHERE reminder.seen = 0 `
                ;
    db.query(
        query,
        params, 
        function(err,row,fields){
            if(err) { cb({ status : false, error : err, data : row }); return; }

            cb({  status : true, error : err, data : row });
        }
    );
}