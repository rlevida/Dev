/**
 * getData - get list of data
 * @data : Must be an object containing field : value
 * @advance : should be special query containing limit, offset, order by, group by
 */

var getData = exports.getData = ( tablename, data, advance , cb ) => {
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
                        paramStrOr.push( f.name + " " +condition + " ?" ) 
                        params.push((typeof f.value != "undefined")?f.value:"")
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
                        paramStrAnd.push( f.name + " " +condition + " ?" ) 
                        params.push((typeof f.value != "undefined")?f.value:"")
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
                paramStr.push( e + condition + " ?" ) 
                params.push((typeof data[e].value != "undefined")?data[e].value:"")
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

/**
 * putData - updates record
 * @data : Must be an object containing field : value
 * @id : id of the record
 */
var putData = exports.putData = ( tablename, data , filter , cb ) => {

    let db = global.initDB();
    let field = global.initModel(tablename).field;
    
    let dataField = Object.keys(data);
    let query = " UPDATE " + tablename 
            + " SET  ";
    let paramStr = [];
    let filterStr = [];
    let params = [];
    
    dataField.map((e,i)=>{
        if(typeof field[e] != "undefined"){
            paramStr.push(e + " = ?") 
            params.push(data[e])
        }
    })
    query += paramStr.join(",");

    query += " WHERE "

    let filterField = Object.keys(filter);
    filterField.map((e,i)=>{
        if(typeof field[e] != "undefined"){
            filterStr.push(e + " = ?")
            params.push(filter[e])
        }
    })
    query += filterStr.join(" AND ");
    
    if(filterStr.length <= 0){
        cb({ status : false, error : "Should have one parameter to continue update.", data : [] })
        return;
    }
    
    db.query(
        query,
        params, 
        function(err,row,fields){
            if(err) { cb({ status : false, error : err, data : row }); return }

            cb({  status : true, error : err, data : row });
        }
    );
}

/**
 * postData - insert record
 * @data : Must be an object containing field : value
 */

var postData = exports.postData = ( tablename, data , cb ) => {

    let db = global.initDB();
    let field = global.initModel(tablename).field;
    let params = [];
    let dataField = Object.keys(data);
    let fieldStr = [];
    let fieldReplacer = [];

    dataField.map((e,i)=>{
        if(typeof field[e] != "undefined"){
            fieldStr.push(e);
            fieldReplacer.push("?");
            params.push(data[e])  
        }
    })
    if(dataField.indexOf("dateAdded") < 0){
            fieldStr.push("dateAdded");
            fieldReplacer.push("NOW()");
    }

    let query = " INSERT INTO " + tablename
            + " ( " + fieldStr.join(",") + " )  "
            + " values( " + fieldReplacer.join(",") + " ) ";

    db.query(
        query,
        params, 
        function(err,row,fields){
            if(err) { cb({ status : false, error : err, id : null }); return }

            cb({  status : true, error : err, id : row.insertId });
        }
    );
}


/**
 * deleteData - delete record
 * @id : id of the record
 */

var deleteData = exports.deleteData = ( tablename, data, cb ) => {

    let db = global.initDB();
    let field = global.initModel(tablename).field;
    let dataField = Object.keys(data);
    let query = " DELETE " 
                    + " FROM " + tablename
                    + " WHERE ";
    let params = [];
    let paramStr = [];

    dataField.map((e,i)=>{
        if(typeof field[e] != "undefined"){
            paramStr.push(e + " = ?")
            params.push(data[e])
        }
    })
    
    if(paramStr.length <= 0){
        cb({ status : false, error : "Should have one parameter to continue delete.", data : [] })
        return;
    }

    query += paramStr.join(" AND ");

    db.query(
        query,
        params, 
        function(err,row,fields){
            if(err) { cb({ status : false, error : err, data : row }); return }

            cb({  status : true, error : err, data : row });
        }
    );
}

/**
 * countData - count record
 * @id : id of the record
 */

var countData = exports.countData = ( tablename, data, alias, cb ) => {

    let db = global.initDB();
    let field = global.initModel(tablename).field;
    let dataField = Object.keys(data);
    let query = " SELECT COUNT(*) AS "+alias
                    + " FROM " + tablename
                    + " WHERE ";
    let params = [];
    let paramStr = [];

    dataField.map((e,i)=>{
        if(typeof field[e] != "undefined"){
            paramStr.push(e + " = ?")
            params.push(data[e])
        }
    })
    
    if(paramStr.length <= 0){
        cb({ status : false, error : "Should have one parameter to continue counting.", data : [] })
        return;
    }

    query += paramStr.join(" AND ");
    db.query(
        query,
        params, 
        function(err,row,fields){
            if(err) { cb({ status : false, error : err, data : row }); return }

            cb({  status : true, error : err, data : row[0] });
        }
    );
}

/**
 * getPublicField - manage field to show on the list
 */

var getPublicField = exports.getPublicField = ( tablename ) => {

    let db = global.initDB();
    let field = global.initModel(tablename).field;
    let dataField = Object.keys(field);

    let selectField = []

    dataField.map((e,i)=>{
        if(typeof field[e].access != "undefined" && field[e].access == "public"){
            selectField.push(e)
        }
    })

    return selectField.join(",")
}