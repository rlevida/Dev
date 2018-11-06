const async = require("async");
const field = exports.field = {

    /**
     *  Id (Primary Key)
     */
    'id': { type: 'bigint', access: "public" },

    /**
     *  usersId (BIGINT)
     */
    'usersId': { type: 'bigint', access: "public" },

    /**
    * linkType ENUM("user","workstream","task","conversation","document","others")
    */
    'linkType': { type: 'string', access: "public" },

    /**
     * linkId (BIGINT)
     */
    'linkId': { type: 'bigint', access: "public" },

    /**
     * action ENUM("created","modified","deleted")
     */
    'actionType': { type: 'string', access: "public" },

    /**
     * from TEXT
     */
    'old': { type: 'string', access: "public" },

    /**
     * from TEXT
     */
    'new': { type: 'string', access: "public" },

    /**
     * dateAdded (DATETIME)
     */
    'dateAdded': { type: 'date', access: "public" },

    /**
     * dateUpdated (TIMESTAMP)
     */
    'dateUpdated': { type: 'date', access: "public" },

}

const { getData, putData, postData, deleteData } = require("./index");
exports.getData = getData;
exports.putData = putData;
exports.postData = postData;
exports.deleteData = deleteData;
exports.getListData = exports.getListData = (data, advance, cb) => {
    const db = global.initDB();
    let params = [];
    let queryString = 'WHERE id <> 0 ';

    if (typeof data.query != "undefined" && data.query.length > 0) {
        const querySyntax = (data.query).map((dataObject, index) => {
            params.push(dataObject.value)
            return `${dataObject.opt} ${dataObject.field} = ? `
        });

        queryString += `${querySyntax.join('')}`;
    }

    async.parallel({
        data: (parallelCallback) => {
            if (typeof advance.orderBy != "undefined" && advance.orderBy.length > 0) {
                const orderBySyntax = (advance.orderBy).map((orderByObj, index) => {
                    return orderByObj.fieldname + " " + orderByObj.type
                });

                queryString += `ORDER BY ${orderBySyntax.join('')}`;
            }

            if (typeof advance.limit != "undefined") {
                queryString += " LIMIT " + advance.limit
            }

            if (typeof advance.offset != "undefined") {
                queryString += " OFFSET " + advance.offset
            }
            const query = `SELECT * FROM activity_log ${queryString}`;

            db.query(query, params, (err, row, fields) => {
                if (err) {
                    parallelCallback(err);
                } else {
                    parallelCallback(null, row);
                }
            });
        },
        count: (parallelCallback) => {
            const query = `SELECT COUNT(*) as queryCount FROM activity_log ${queryString}`;

            db.query(query, params, (err, row, fields) => {
                if (err) {
                    parallelCallback(err);
                } else {
                    parallelCallback(null, row[0]);
                }
            });
        }
    }, (err, results) => {
        if (err != null) {
            cb({ status: false, error: err, data: row });
        } else {
            
        }
        // console.log(results)
    });
}; 