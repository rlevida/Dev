const models = require('../modelORM');
const { ActivityLog } = models;

exports.post = (req, cb) => {
    defaultPost(dbName, req, (res) => {
        if (res.success) {
            cb({ status: true, data: res.data })
        } else {
            cb({ status: false, error: res.error })
        }
    })
}

exports.get = {
    index: (req, cb) => {
        const queryStack = [];
        const queryString = req.query;
        try {
            ActivityLog.findAll({ raw: true }).then((response) => {
               
            });
        } catch (err) {
            
        }
        // if (typeof queryString.taskId != "undefined" && queryString.taskId != "") {
        //     queryStack.push()
        // }
        // activityLog.getListData({
        //     query: [
        //         {}
        //     ]
        // }, { orderBy: [{ type: 'desc', fieldname: 'dateAdded' }], limit: 1 }, (res) => {
        //     console.log(res)
        //     // if (res.status) {
        //     //     cb({ status: true, data: res.data })
        //     // } else {
        //     //     cb({ status: false, error: res.error })
        //     // }
        // });
    }
    // ,
    // getLatestData: (params, cb) => {
    //     activityLog.getListData(params, { orderBy: [{ type: 'desc', fieldname: 'dateAdded' }], limit: 1 }, (res) => {
    //         if (res.status) {
    //             cb({ status: true, data: res.data })
    //         } else {
    //             cb({ status: false, error: res.error })
    //         }
    //     });
    // }
}