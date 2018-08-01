var field = exports.field = {

        /**
         *  Id (Primary Key)
         */
        'id' : {type : 'bigint' , access : "public" },
        /**
         * name (VARCHAR(50))
         */
        'name' : {type : 'string' , access : "public" },
        /**
         * origin (VARCHAR(50))
         */
        'origin' : {type : 'string' , access : "public" },
        /**
         * uploadedBy (BIGINT)
         */
        'uploadedBy' : {type : 'bigint' , access : "public" },

        /**
         * type (VARCHAR(20))
         */
        'type' : {type : 'string' , access : "public" },

        /**
         * dateAdded (DATETIME)
         */
        'dateAdded' : {type : 'date' , access : "public" },

        /**
         * dateUpdated (TIMESTAMP)
         */
        'dateUpdated' : {type : 'date' , access : "public" },

        /**
         * isDeleted (tinyint )
         */
        'isDeleted' :  {type : 'date' , access : "public" },
           /**
         * tags (VARCHAR(50))
         */
        'tags' : {type : 'string' , access : "public" },

}

var { getData, putData, postData, deleteData } = require("./index");
exports.getData = getData;
exports.putData = putData;
exports.postData = postData;
exports.deleteData = deleteData;

var getProjectDocument = exports.getProjectDocument = (filter,data,cb) =>{
        let db = global.initDB();
        let query = `select * from document WHERE id IN (${data.join(",")})`;
        let params = [];
        let tempFilter = Object.keys(filter);
        if(tempFilter.length>0){
            tempFilter.map((e,i)=>{
                if(typeof field[e] != "undefined"){
                    query += " AND  " + e + " = ?" 
                    params.push(filter[e])
                }
            })
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
