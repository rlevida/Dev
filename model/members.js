var field = exports.field = {

        /**
         *  Id (Primary Key)
         */
        'id' : {type : 'bigint' , access : "public" },

        /**
         * usersType (ENUM("users","team"))
         */
        'usersType' : {type : 'string' , access : "public" },

        /**
         * userTypeLinkId (BIGINT)
         */
        'userTypeLinkId' : {type : 'bigint' , access : "public" },

        /**
         * linkType (ENUM("project","workstream","task"))
         */
        'linkType' : {type : 'string' , access : "public" },

        /**
         * linkId (BIGINT)
         */
        'linkId' : {type : 'bigint' , access : "public" },

        /**
         * memberType (ENUM("assignedTo","Follower","responsible"))
         */
        'memberType' : {type : 'string' , access : "public" },

        /**
         * dateAdded (DATETIME)
         */
        'dateAdded' : {type : 'date' , access : "public" },

        /**
         * dateUpdated (TIMESTAMP)
         */
        'dateUpdated' : {type : 'date' , access : "public" },

}

var { getData, putData, postData, deleteData, countData, getPublicField } = require("./index");
exports.getData = getData;
exports.putData = putData;
exports.postData = postData;
exports.deleteData = deleteData;
exports.countData = countData;
 
var getProjectMemberList = exports.getProjectMemberList = ( tablename, data, advance , cb ) => {
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

    query = `
             SELECT * FROM (
                SELECT users.* , role.role FROM (
                        SELECT * FROM (` + query + `) as prjMembersUsers WHERE usersType = "users") as tb1
                LEFT JOIN users ON tb1.userTypeLinkId = users.id
                LEFT JOIN users_role ON users.id = users_role.usersId
                LEFT JOIN role ON users_role.roleId = role.id
                UNION ALL
                SELECT users.* , role.role FROM  ( SELECT * FROM (` + query + `) as prjMembersTeam WHERE usersType = "team") as tb2
                LEFT JOIN users_team ON tb2.userTypeLinkId = users_team.teamId
                LEFT JOIN users ON users_team.usersId = users.id 
                LEFT JOIN users_role ON users.id = users_role.usersId
                LEFT JOIN role ON users_role.roleId = role.id
             ) as mainTable GROUP BY id

    `;
    params = params.concat(params);
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

var getWorkstreamTaskMembers = exports.getWorkstreamTaskMembers = (data , cb ) => {
  
    let db = global.initDB();
    let params = [data.id]; 
    let filter = `AND task.workstreamId = ?`

    if(data.type == "project"){
        filter = `projectId`
    }

    let query = `SELECT memberTask.* FROM task LEFT JOIN (SELECT * FROM (
                    SELECT users.* , members.linkId , members.linkType , role.role FROM members LEFT JOIN users ON members.userTypeLinkId = users.id AND members.usersType = "users"
                        LEFT JOIN users_role ON users.id = users_role.usersId 
                            LEFT JOIN role ON users_role.roleId = role.id
                        UNION ALL
                            SELECT users.* , members.linkId , members.linkType , role.role FROM members LEFT JOIN users_team ON members.userTypeLinkId = users_team.teamId AND members.usersType = "team" 
                                LEFT JOIN users ON users_team.usersId = users.id 
                                    LEFT JOIN users_role ON users.id = users_role.usersId 
                                        LEFT JOIN role ON users_role.roleId = role.id
                    ) as finalTable 
                WHERE finalTable.linkType = "task" ) as memberTask ON task.id = memberTask.linkId WHERE memberTask.id IS NOT NULL ${filter}
                GROUP BY memberTask.id` 
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