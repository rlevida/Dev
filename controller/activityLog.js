
const dbName = "activity_log";
const { defaultGet } = require("./");
const activityLog = global.initModel("activity_log");

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
    getLatestData: (params, cb) => {
        activityLog.getLatestData(params, { orderBy: [{ type: 'desc', fieldname: 'dateAdded' }], limit: 1 }, (res) => {
            if (res.status) {
                cb({ status: true, data: res.data })
            } else {
                cb({ status: false, error: res.error })
            }
        });
    }
}