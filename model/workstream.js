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

var { getData, putData, postData, deleteData, getPublicField } = require("./index");
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
                       tb2.OnTrack
                    FROM (select projectId,sum(IF(isActive="1",1,0)) as Active FROM workstream WHERE projectId = ? AND isActive = 1 ) as tb
                    LEFT JOIN
                (SELECT projectId,
                        SUM(IF(Issues>0,1,0))  as Issues,
                        SUM(IF(OnTrack>0,1,0)) as OnTrack  FROM 
                            ( SELECT projectId,
                                     workstreamId,
                                     IF(SUM(IF(dueDate<CURDATE(),1,0))>0,0,SUM(IF(dueDate>=CURDATE(),1,0))) as OnTrack, 
                                     SUM(IF(dueDate<CURDATE(),1,0)) as Issues FROM task WHERE projectId = ? AND isActive = 1 AND (status != "Completed" OR status IS NULL )
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


var getWorkstreamList = exports.getWorkstreamList = ( tablename, data, advance , cb ) => {
    let db = global.initDB();
    let field = global.initModel(tablename).field;
    let dataField = Object.keys(data);

    /**
     * Manage primary table
     */
    let query = " SELECT " + (getPublicField(tablename) != "" ?getPublicField(tablename)+"":"*") + " FROM " + tablename;
    if(typeof advance.allowedPrivate != "undefined" && advance.allowedPrivate){
        query = " SELECT * FROM " + tablename;
    }
    query = " SELECT * FROM ( " + query + " ) as primaryTable "

    /**
     * Manage one-to-one relation
     */
    let relationField = [];
    let fieldList = Object.keys(field);
    fieldList.map((e,i)=>{
        if(typeof field[e].database != "undefined" && typeof field[e].relation != "undefined"){
            field[e].fieldname = e;
            relationField.push(field[e])
        }
    })
    let relationQuery = [];
    relationField.map((e,i)=>{
        let model = global.initModel(e.database);
        let modelField = getPublicField(e.database).split(",");
        modelField = modelField.map((f,j)=>{
            return f + " as " + e.database + "_" + f
        })
        let joinField = modelField.join(",");
        let TempQuery = "";
        TempQuery += " LEFT JOIN ";
        TempQuery += " ( SELECT " + joinField + " FROM "+ e.database +" ) as  tbl" + (""+i) + " ON " + "tbl" + (""+i)+"."+ e.database +"_id = primaryTable." + e.fieldname;
        relationQuery.push( TempQuery )
    })
    query = query + " " + relationQuery.join(" ");

    /**
     * Manage table filter
     */
    let params = [];
    let paramStr = [];
    dataField.map((e,i)=>{
        if(e == "|||or|||"){
            if( typeof data[e] == "object" ){
                let paramStrOr = [];
                let dataFieldOr = data[e];
                dataFieldOr.map((f,j)=>{
                    if(typeof field[f.name] != "undefined"){
                        let condition = " = ";
                        if( typeof f.condition != "undefined" ){
                            condition = f.condition;
                        }
                        if(condition.trim() == "IN"){
                            if(data[e].value.length > 0){
                                let dataValue = f.value.map((e)=>{ return "?" }).join(",")
                                params = params.concat(f.value)
                                paramStrOr.push( f.name + " " +condition + " ( "+dataValue+" ) " ) 
                            }else{
                                paramStr.push( " false " ) 
                            }
                        }else{
                            paramStrOr.push( f.name + " " +condition + " ?" ) 
                            params.push((typeof f.value != "undefined")?f.value:"")
                        }
                    }
                })
                if(paramStrOr.length > 0){
                    paramStr.push(" ( " + paramStrOr.join(" OR ") + ")");
                }
            }
        }else if(e == "|||and|||"){
            if( typeof data[e] == "object" ){
                let paramStrAnd = [];
                let dataFieldAnd = data[e];
                dataFieldAnd.map((f,j)=>{
                    if(typeof field[f.name] != "undefined"){
                        let condition = " = ";
                        if( typeof f.condition != "undefined" ){
                            condition =f.condition;
                        }
                        if(condition.trim() == "IN"){
                            if(data[e].value.length > 0){
                                let dataValue = f.value.map((e)=>{ return "?" }).join(",")
                                params = params.concat(f.value)
                                paramStrAnd.push( f.name + " " +condition + " ( "+dataValue+" ) " ) 
                            }else{
                                paramStr.push( " false " ) 
                            }
                        }else{
                            paramStrAnd.push( f.name + " " +condition + " ?" ) 
                            params.push((typeof f.value != "undefined")?f.value:"")
                        }
                    }
                })
                if(paramStrAnd.length > 0){
                    paramStr.push(" ( " + paramStrAnd.join(" AND ") + ")");
                }
            }
        }else if(typeof field[e] != "undefined"){
            if( typeof data[e] == "object" ){
                let condition = " = ";
                if( typeof data[e].condition != "undefined" ){
                    condition = data[e].condition;
                }
                
                if(condition.trim() == "IN"){
                    if(data[e].value.length > 0){
                        let dataValue = data[e].value.map((e)=>{ return "?" }).join(",")
                        params = params.concat(data[e].value)
                        paramStr.push( e + " " +condition + " ( "+dataValue+" ) " ) 
                    }else{
                        paramStr.push( " false " ) 
                    }
                }else{
                    paramStr.push( e + condition + " ?" ) 
                    params.push((typeof data[e].value != "undefined")?data[e].value:"")
                }
            }else{
                paramStr.push(e + " = ?") 
                params.push(data[e])
            }
        }
    })

    
    query = query + `
        LEFT JOIN 
            ( SELECT 
                workstreamId,
                SUM(IF(task.status!="",1,0 )) as TasksNumber, 
                SUM(IF(task.status="Completed",1,0 )) as Completed, 
                SUM(IF((task.status!="Completed" OR task.status IS NULL)AND task.dueDate>=CURDATE(),1,0)) as OnTrack,
                SUM(IF((task.status!="Completed" OR task.status IS NULL)AND task.dueDate=CURDATE(),1,0)) as OnDue,
                SUM(IF((task.status!="Completed" OR task.status IS NULL) AND task.dueDate<CURDATE() AND task.dueDate>"1970-01-01",1,0)) as Issues 
                FROM task GROUP BY workstreamId) as tasktable
            ON primaryTable.id = tasktable.workstreamId 
        LEFT JOIN (
            SELECT GROUP_CONCAT(tb2.id) as memberIds,GROUP_CONCAT(tb2.firstName) as memberNames,tb2.workstreamId FROM (
                SELECT * FROM (
                SELECT users.id,users.firstName, IF(members.linkType="workstream",members.linkId,task.workstreamId) as workstreamId FROM members 
                LEFT JOIN task ON members.linkId = task.id AND members.linkType = 'task'
                LEFT JOIN users ON members.usersType = "users" AND members.userTypeLinkId = users.Id
                WHERE members.usersType = 'users'
                    AND ( linkType = 'task' || linkType = 'workstream' )
                    AND users.id IS NOT NULL
            ) as tb1 GROUP BY tb1.workstreamId,tb1.id
            )  as tb2 GROUP BY tb2.workstreamId
        ) as finalMembers ON primaryTable.id = finalMembers.workstreamId
        `;


    if(paramStr.length > 0){
        query += " WHERE "
    }
    query += paramStr.join(" AND ");


    if(typeof advance.orderBy != "undefined" && advance.orderBy.length > 0){
        query += " ORDER BY  "
        advance.orderBy.map((e,i)=>{
            if(typeof e.type == "undefined"){
                e.type = " ASC "
            }
            query += e.fieldname + "  " + e.type
        })
    }

    if(typeof advance.limit != "undefined"){
         query += " LIMIT " + advance.limit
    }

    if(typeof advance.offset != "undefined"){
         query += " OFFSET " + advance.offset
    }

    /**
     * Manage Query Connection
     */
    db.query(
        query,
        params, 
        function(err,row,fields){
            if(err) { cb({ status : false, error : err, data : row }); return; }

            cb({  status : true, error : err, data : row });
        }
    );
}