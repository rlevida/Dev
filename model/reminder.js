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
     * reminderTypeId (TINYINT)
     */
    'reminderTypeId' : {type : 'int' , access : "public" },
    
    /**
     * reminderType (ENUM("task","document"))
     */
    'reminderType' : {type : 'string' , access : "public" },
    
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
    let query = `SELECT reminder.*, reminder.id as reminderId , task.* , task.workstreamId  FROM reminder 
                    LEFT JOIN task ON reminder.taskId = task.id WHERE reminder.usersId = ${data.usersId} AND reminder.seen = 0`;
    db.query(
        query,
        params, 
        function(err,row,fields){
            if(err) { cb({ status : false, error : err, data : row }); return; }

            cb({  status : true, error : err, data : row });
        }
    );
}