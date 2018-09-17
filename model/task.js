var field = exports.field = {

    /**
     *  Id (Primary Key)
     */
    'id': { type: 'bigint', access: "public" },

    /**
     * projectId (BIGINT)
     */
    'projectId': { type: 'bigint', access: "public", database: "project", relation: "one-to-one" },

    /**
     * workstream (VARCHAR(50))
     */
    'workstreamId': { type: 'bigint', access: "public", database: "workstream", relation: "one-to-one" },

    /**
    * task (TEXT)
    */
    'task': { type: 'text', access: "public" },

    /**
    * dueDate (DATETIME)
    */
    'dueDate': { type: 'date', access: "public" },

    /**
    * startDate (DATETIME)
    */
    'startDate': { type: 'date', access: "public" },

    /**
     * status (ENUM("In Progress","For Approval","Completed"))
     */
    'status': { type: 'string', access: "public" },

    /**
     * typeId (BIGINT)
     */
    'typeId': { type: 'bigint', access: "public" },

    /**
     * linkTaskId (BIGINT)
     */
    'linkTaskId': { type: 'bigint', access: "public", database: "task", relation: "one-to-one" },

    /**
     * typeId (tinyint)
     */
    'periodic': { type: 'tinyint', access: "public" },

    /**
     * periodType (ENUM("Year","Month","Week", "Day"))
     */
    'periodType': { type: 'string', access: "public" },

    /**
     * period (int)
     */
    'period': { type: 'int', access: "public" },

    /**
     * dateAdded (DATETIME)
     */
    'dateAdded': { type: 'date', access: "public" },
    /**
     * dateUpdated (TIMESTAMP)
     */
    'dateUpdated': { type: 'date', access: "public" },

    /**
     * isActive (tinyInt)
     */
    'isActive': { type: 'int', access: "public" },

    /**
     * isDeleted (tinyInt)
     */
    'isDeleted': { type: 'int', access: "public" },

}

var { getData, putData, postData, deleteData, getPublicField } = require("./index");
exports.getData = getData;
exports.putData = putData;
exports.postData = postData;
exports.deleteData = deleteData;

var getDataCount = exports.getDataCount = (tablename, data, advance, cb) => {
    let db = global.initDB();
    let params = [data.projectId];

    let query = `SELECT projectId,
                    workstreamId,
                    SUM(isActive) as Active, 
                    SUM(IF(dueDate>=CURDATE(),1,0)) as OnTrack, 
                    SUM(IF(dueDate<CURDATE() AND duedate > "1970-01-01",1,0)) as Issues FROM task WHERE ( status != "Completed" || status is NULL) AND isActive = 1 AND projectId =${data.projectId}
                `;
    db.query(
        query,
        params,
        function (err, row, fields) {
            if (err) { cb({ status: false, error: err, data: row }); return; }

            cb({ status: true, error: err, data: row });
        }
    );
}

var getUserTaskDataCount = exports.getUserTaskDataCount = (tablename, data, advance, cb) => {
    let db = global.initDB();
    let params = [];
    let filter = "", filter2 = "";
    if (data.userId) {
        params = [data.userId, data.userId]
        filter = " AND finalTbl1.usersId = ? "
        filter2 = " AND finalTbl2.usersId = ? "
    }

    let query = `
                    SELECT *,SUM(isActive) as Active, SUM(IF(DATE_FORMAT(dueDate,"%Y-%m-%d")=CURDATE(),1,0)) as DueToday, SUM(IF(dueDate<CURDATE() AND duedate > "1970-01-01",1,0)) as Issues FROM ( 
                      
                            SELECT finalTbl1.*,task.id as taskId,task.dueDate,task.isActive,task.status, task.projectId , project.isActive as project_isActive FROM ( 
                                    SELECT members.linkType,members.linkId,members.memberType,users.id as usersId FROM members 
                                        LEFT JOIN users ON members.userTypeLinkId = users.id
                                        WHERE usersType = "users"
                                UNION ALL
                                    SELECT members.linkType,members.linkId,members.memberType,users.id as usesrId FROM members 
                                        LEFT JOIN users_team ON members.userTypeLinkId = users_team.teamId
                                        LEFT JOIN users ON users_team.usersId = users.id
                                    WHERE members.usersType = "team" 
                            ) as finalTbl1 

                                LEFT JOIN task on finalTbl1.linkId = task.id LEFT JOIN project ON project.id = task.projectId 
                            WHERE finalTbl1.linkType = "task"  AND (task.status != "Completed" OR task.status IS NULL) AND task.isActive = 1 AND task.isDeleted = 0 AND project.isActive > 0 `+ filter + `

                    UNION ALL

                            SELECT finalTbl2.*,task.id as taskId,task.dueDate,task.isActive,task.status , task.projectId , project.isActive as project_isActive FROM ( 
                                    SELECT members.linkType,members.linkId,members.memberType,users.id as usersId FROM members 
                                        LEFT JOIN users ON members.userTypeLinkId = users.id
                                    WHERE usersType = "users" 
                                UNION ALL
                                    SELECT members.linkType,members.linkId,members.memberType,users.id as usersId FROM members 
                                        LEFT JOIN users_team ON members.userTypeLinkId = users_team.teamId
                                            LEFT JOIN users ON users_team.usersId = users.id
                                    WHERE members.usersType = "team" 
                            ) as finalTbl2 

                                LEFT JOIN task on finalTbl2.linkId = task.workstreamId LEFT JOIN project ON project.id = task.projectId
                            WHERE finalTbl2.linkType = "workstream"  AND (task.status != "Completed" OR task.status IS NULL) AND task.isActive = 1 AND task.isDeleted = 0 AND project.isActive > 0 `+ filter2 + ` 

                    ) as tbl
                `;
    db.query(
        query,
        params,
        function (err, row, fields) {
            if (err) { cb({ status: false, error: err, data: row }); return; }

            cb({ status: true, error: err, data: row });
        }
    );
}

var getTaskAllowedAccess = exports.getTaskAllowedAccess = (tablename, data, advance, cb) => {

    let db = global.initDB();
    let params = [data.usersId, data.usersId, data.usersId, data.usersId];
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
                    WHERE finalTbl1.linkType = "task" AND (task.status != "Completed" || task.status  IS NULL) AND task.id IS NOT NULL 
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
                    WHERE finalTbl2.linkType = "workstream" AND (task.status != "Completed" || task.status  IS NULL) AND task.id IS NOT NULL ) as tbl
                    GROUP BY tbl.taskId
                `;
    if (data.userRole == 1 || data.userRole == 2) {
        query = "SELECT id as taskId FROM task"
        params = []
    }

    db.query(
        query,
        params,
        function (err, row, fields) {
            if (err) { cb({ status: false, error: err, data: row }); return; }

            cb({ status: true, error: err, data: row });
        }
    );
}

var getTaskList = exports.getTaskList = (tablename, data, advance, cb) => {
    let db = global.initDB();
    let field = global.initModel(tablename).field;
    let dataField = Object.keys(data);

    /**
     * Manage primary table
     */
    let query = " SELECT " + (getPublicField(tablename) != "" ? getPublicField(tablename) + "" : "*") + " FROM " + tablename;
    if (typeof advance.allowedPrivate != "undefined" && advance.allowedPrivate) {
        query = " SELECT * FROM " + tablename;
    }
    query = " SELECT * FROM ( " + query + " ) as primaryTable "

    /**
     * Manage one-to-one relation
     */
    let relationField = [];
    let fieldList = Object.keys(field);
    fieldList.map((e, i) => {
        if (typeof field[e].database != "undefined" && typeof field[e].relation != "undefined") {
            field[e].fieldname = e;
            relationField.push(field[e])
        }
    })
    let relationQuery = [];
    relationField.map((e, i) => {
        let model = global.initModel(e.database);
        let modelField = getPublicField(e.database).split(",");
        modelField = modelField.map((f, j) => {
            return f + " as " + e.database + "_" + f
        })
        let joinField = modelField.join(",");
        let TempQuery = "";
        TempQuery += " LEFT JOIN ";
        TempQuery += " ( SELECT " + joinField + " FROM " + e.database + " ) as  tbl" + ("" + i) + " ON " + "tbl" + ("" + i) + "." + e.database + "_id = primaryTable." + e.fieldname;
        relationQuery.push(TempQuery)
    })
    query = query + " " + relationQuery.join(" ");

    /**
     * Manage table filter
     */
    let params = [];
    let paramStr = [];
    dataField.map((e, i) => {
        if (e == "|||or|||") {
            if (typeof data[e] == "object") {
                let paramStrOr = [];
                let dataFieldOr = data[e];
                dataFieldOr.map((f, j) => {
                    if (typeof field[f.name] != "undefined") {
                        let condition = " = ";
                        if (typeof f.condition != "undefined") {
                            condition = f.condition;
                        }
                        if (condition.trim() == "IN") {
                            if (data[e].value.length > 0) {
                                let dataValue = f.value.map((e) => { return "?" }).join(",")
                                params = params.concat(f.value)
                                paramStrOr.push(f.name + " " + condition + " ( " + dataValue + " ) ")
                            } else {
                                paramStr.push(" false ")
                            }
                        } else {
                            paramStrOr.push(f.name + " " + condition + " ?")
                            params.push((typeof f.value != "undefined") ? f.value : "")
                        }
                    }
                })
                if (paramStrOr.length > 0) {
                    paramStr.push(" ( " + paramStrOr.join(" OR ") + ")");
                }
            }
        } else if (e == "|||and|||") {
            if (typeof data[e] == "object") {
                let paramStrAnd = [];
                let dataFieldAnd = data[e];
                dataFieldAnd.map((f, j) => {
                    if (typeof field[f.name] != "undefined") {
                        let condition = " = ";
                        if (typeof f.condition != "undefined") {
                            condition = f.condition;
                        }
                        if (condition.trim() == "IN") {
                            if (data[e].value.length > 0) {
                                let dataValue = f.value.map((e) => { return "?" }).join(",")
                                params = params.concat(f.value)
                                paramStrAnd.push(f.name + " " + condition + " ( " + dataValue + " ) ")
                            } else {
                                paramStr.push(" false ")
                            }
                        } else {
                            paramStrAnd.push(f.name + " " + condition + " ?")
                            params.push((typeof f.value != "undefined") ? f.value : "")
                        }
                    }
                })
                if (paramStrAnd.length > 0) {
                    paramStr.push(" ( " + paramStrAnd.join(" AND ") + ")");
                }
            }
        } else if (typeof field[e] != "undefined") {
            if (typeof data[e] == "object") {
                let condition = " = ";
                if (typeof data[e].condition != "undefined") {
                    condition = data[e].condition;
                }

                if (condition.trim() == "IN") {
                    if (data[e].value.length > 0) {
                        let dataValue = data[e].value.map((e) => { return "?" }).join(",")
                        params = params.concat(data[e].value)
                        paramStr.push(e + " " + condition + " ( " + dataValue + " ) ")
                    } else {
                        paramStr.push(" false ")
                    }
                } else {
                    paramStr.push(e + condition + " ?")
                    params.push((typeof data[e].value != "undefined") ? data[e].value : "")
                }
            } else {
                paramStr.push(e + " = ?")
                params.push(data[e])
            }
        }
    })
    if (paramStr.length > 0) {
        query += " WHERE "
    }
    query += paramStr.join(" AND ");


    if (typeof advance.orderBy != "undefined" && advance.orderBy.length > 0) {
        query += " ORDER BY  "
        advance.orderBy.map((e, i) => {
            if (typeof e.type == "undefined") {
                e.type = " ASC "
            }
            query += e.fieldname + "  " + e.type
        })
    }

    if (typeof advance.limit != "undefined") {
        query += " LIMIT " + advance.limit
    }

    if (typeof advance.offset != "undefined") {
        query += " OFFSET " + advance.offset
    }

    query = `SELECT prj.*, (
                    IF(prj.status="Completed" AND task.status = "Completed","Completed",
                        IF(prj.status="Completed" AND task.id IS NOT NULL AND ( task.status != "Completed" || task.status IS NULL ),"Incomplete",
                            IF(prj.status="Completed","Completed","In Progress")
                        )
                    )
                ) as currentState,
                assignedTo.firstName as assignedBy,
                assignedTo.id as assignedById,
                assignedTo.userType as assignedUserType,
                follower.followersName,
                follower.followersIds
                FROM (` + query + `) as prj 
                LEFT JOIN task ON prj.linkTaskId = task.id
                LEFT JOIN (SELECT users.*,members.linkId FROM members 
                                LEFT JOIN users ON members.userTypeLinkId = users.id 
                                    AND members.memberType = "assignedTo" 
                                    AND members.usersType="users" 
                                    AND members.linkType="task" 
                                    WHERE users.id IS NOT NULL
                                    GROUP BY members.linkId ) as assignedTo ON prj.id = assignedTo.linkId
                LEFT JOIN (SELECT members.linkId,GROUP_CONCAT(users.id) as followersIds,GROUP_CONCAT(users.firstName) as followersName FROM members 
                                LEFT JOIN users ON members.userTypeLinkId = users.id 
                                    AND members.memberType = "Follower" 
                                    AND members.usersType="users" 
                                    AND members.linkType="task" 
                                    WHERE users.id IS NOT NULL
                                    GROUP BY members.linkId ) as follower ON prj.id = follower.linkId
            `
    /**
     * Manage Query Connection
     */
    db.query(
        query,
        params,
        function (err, row, fields) {
            if (err) { cb({ status: false, error: err, data: row }); return; }

            cb({ status: true, error: err, data: row });
        }
    );
}

var getTaskDueToday = exports.getTaskDueToday = (cb) => {
    let db = global.initDB();
    let params = [];

    let query = ` SELECT task.*,members.userTypeLinkId as usersId FROM task 
                    LEFT JOIN members ON task.id = members.linkId AND members.linkType = "task" AND usersType = "users"
                    WHERE DATE_FORMAT(task.dueDate,"%Y%m%d") = DATE_FORMAT(NOW(),"%Y%m%d") 
                    AND ( members.userTypeLinkId IS NOT NULL || members.userTypeLinkId != "" ) AND task.isDelete = 0`;
    db.query(
        query,
        params,
        function (err, row, fields) {
            if (err) { cb({ status: false, error: err, data: row }); return; }

            cb({ status: true, error: err, data: row });
        }
    );
}

var getTaskOverdue = exports.getTaskOverdue = (cb) => {
    let db = global.initDB();
    let params = [];

    let query = ` SELECT task.*,members.userTypeLinkId as usersId FROM task 
                    LEFT JOIN members ON task.id = members.linkId AND members.linkType = "task" AND usersType = "users"
                    WHERE DATE_FORMAT(task.dueDate,"%Y%m%d") < DATE_FORMAT(NOW(),"%Y%m%d") 
                    AND ( members.userTypeLinkId IS NOT NULL || members.userTypeLinkId != "" ) AND task.isDelete = 0`;
    db.query(
        query,
        params,
        function (err, row, fields) {
            if (err) { cb({ status: false, error: err, data: row }); return; }

            cb({ status: true, error: err, data: row });
        }
    );
}