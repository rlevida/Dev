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
         * isDeleted (tinyint )
         */
        'isDeleted' :  {type : 'date' , access : "public" },

        /**
         * status (ENUM("newupload","foraction","email"))
         */
        'status' : {type : 'string' , access : "public" },

         /**
         * isCompleted (tinyint)
         */
        'isCompleted' : {type : 'tinyint' , access : "public" },

        /**
         * folderId (tinyint)
         */
        'folderId': {type : 'tinyint' , access : "public"},

         /**
         * documentNameCount (INT)
         */
        'documentNameCount': {type : 'int' , access : "public"},

         /**
         * documentNameCount (INT)
         */
        'attachmentId': {type : 'int' , access : "public"},
        
        /**
         * readOn (DATETIME)
         */
        
        'readOn' : {type : 'date' , access : "public" },
         /**
         * dateAdded (DATETIME)
         */
        'dateAdded' : {type : 'date' , access : "public" },

        /**
         * dateUpdated (TIMESTAMP)
         */
        'dateUpdated' : {type : 'date' , access : "public" },
}

var { getData, putData, postData, deleteData } = require("./index");
exports.getData = getData;
exports.putData = putData;
exports.postData = postData;
exports.deleteData = deleteData;

var getProjectDocument = exports.getProjectDocument = (filter,data,cb) =>{
    let db = global.initDB();
        let query = `SELECT * FROM document WHERE id IN (${data.join(",")})`;
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

var getWorkstreamDocumentList = exports.getWorkstreamDocumentList = (tableName,filter,data,cb)=>{
    let db = global.initDB();
    let query = `SELECT document.* ,tag.* , workstream.id as workstreamId FROM document 
                    LEFT JOIN tag ON document.id = tag.tagTypeId 
                        LEFT JOIN workstream ON tag.linkId = workstream.id WHERE status = 'new'
                        `
    let params = [];
        db.query(
            query,
            {},
            function(err,row,fields){
                if(err) { cb({ status : false, error : err, data : row }); return; }
                cb({  status : true, error : err, data : row });
            }
        );
}
