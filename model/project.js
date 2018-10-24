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
         * projectNameCount (INT)
         */
        'projectNameCount' : {type : 'int' , access : "public" },

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

var { getData, putData, postData, deleteData, getPublicField } = require("./index");
exports.getData = getData;
exports.putData = putData;
exports.postData = postData;
exports.deleteData = deleteData;

var getDataCount = exports.getDataCount = ( tablename, data, advance , cb ) => {
    let db = global.initDB();
    let params = [];
    
    let projectTb = "( SELECT * FROM project WHERE isActive = 1 and isDeleted = 0) as project"
    if(typeof data.projectIds != "undefined" ){
        if(data.projectIds.length > 0){
            let dataValue = data.projectIds.map((e)=>{ return "?" }).join(",")
            params = data.projectIds.concat(data.projectIds)
            projectTb = "( SELECT * FROM project WHERE id IN ("+dataValue+") AND project.isActive = 1  ) as project"
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
                                            IF(Issues>0,0,IF(OnTrack>0,1,0)) as OnTrack 
                                        FROM `+projectTb+`
                            LEFT JOIN (SELECT projectId, SUM(IF(dueDate>=CURDATE(),1,0)) as OnTrack, SUM(IF(dueDate<CURDATE() AND duedate > "1970-01-01",1,0)) as Issues FROM task WHERE (status <> "Completed" OR status IS NULL) AND isActive = 1 GROUP BY projectId) as tbTask 
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

var getProjectList = exports.getProjectList = ( tablename, data, advance , cb ) => {
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

    query = `SELECT * FROM (` + query + `) as prj 
                LEFT JOIN ( SELECT count(*) as newDocCount, docs.projectId FROM ( SELECT linkId as projectId FROM document
                        LEFT JOIN document_link
                            ON document.id = document_link.documentId AND document_link.linkType = 'project' 
                            WHERE document.status = 'new' AND !document.isDeleted 
                            GROUP BY document_link.documentId ) as docs
                        GROUP BY docs.projectId ) as docsCount ON prj.id = docsCount.projectId 
                LEFT JOIN ( SELECT ws.projectId, Active, tk.Issues, IF(tk.Issues=0,tk.OnTrack,0) as OnTrack, IF(tk.Issues=0,tk.OnDue,0) as OnDue  FROM (
	                            SELECT projectId,sum(IF(isActive="1",1,0)) as Active FROM workstream GROUP BY workstream.projectId 
                            ) as ws
                            LEFT JOIN ( SELECT tb1.projectId,workstreamId, SUM(IF(Issues>0,1,0)) as Issues, SUM(IF(OnTrack>0,1,0)) as OnTrack, SUM(IF(OnDue>0,1,0)) as OnDue  FROM 
                            (SELECT projectId, workstreamId, SUM(IF(dueDate>=CURDATE(),1,0)) as OnTrack, SUM(IF((status <> "Completed" OR status IS NULL) AND dueDate=CURDATE(),1,0)) as OnDue, SUM(IF((status <> "Completed" OR status IS NULL) AND dueDate<CURDATE() AND duedate > "1970-01-01",1,0 )) as Issues FROM task 			
                                    GROUP BY task.workstreamId) as tb1 GROUP BY tb1.projectId) as tk 
                            ON ws.projectId = tk.projectId
                ) as wsStatus ON prj.id = wsStatus.projectId 

                LEFT JOIN ( SELECT users.id as projectManagerId , users.firstName , members.linkId as projectLinkId , users.lastName FROM users 
                    LEFT JOIN members ON members.userTypeLinkId = users.id WHERE memberType = 'project manager'
                    ) as member ON prj.id = member.projectLinkId  
            ` 
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

var getProjectDetails = exports.getProjectDetails = ( tablename , data , {}, cb ) => {
    let db = global.initDB();
    let params = [];
    let query = ` SELECT prj.* , members.userTypeLinkId as projectManagerId , type.type as project_type from project as prj 
                    LEFT JOIN members ON members.linkId = ${data.projectId} AND linkType = 'project' AND memberType = 'project manager' AND prj.id = ${data.projectId}
                    LEFT JOIN type ON type.id = prj.typeId
                    WHERE prj.id = ${data.projectId}`

    db.query(
        query,
        params, 
        function(err,row,fields){
            if(err) { cb({ status : false, error : err, data : row }); return; }

            cb({  status : true, error : err, data : row });
        }
    );
}