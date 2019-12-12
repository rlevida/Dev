var sequence = require("sequence").Sequence;
var moment = require('moment');
var parse = require("html-react-parser");
var { flattenDeep } = require("lodash")
var randomString = exports.randomString = (length) => {
    var result = '';
    var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

var generateHash = exports.generateHash = (name) => {
    var crypto = global.initRequire("crypto");
    var moment = global.initRequire("moment");
    return crypto.createHmac("sha1", ("" + moment().format()) + (name + "")).update("" + Math.random()).digest('hex');
}

var generatePassword = exports.generatePassword = (password, salt) => {
    var crypto = global.initRequire("crypto");
    return crypto.createHmac("sha1", salt).update(password).digest('hex');;
}

var getFilePathExtension = exports.getFilePathExtension = (path) => {
    var filename = path.split('\\').pop().split('/').pop();
    return filename.substr((Math.max(0, filename.lastIndexOf(".")) || Infinity) + 1);
}

var uploadFile = exports.uploadFile = (params, cb) => {
    var fs = global.initRequire('fs'),
        AWS = global.initAWS();
    var fileStream = fs.readFileSync(params.file.path);
    var s3 = new AWS.S3();
    var environment = global.environment || "development";
    s3.putObject({
        Bucket: global.AWSBucket,
        Key: environment + "/" + params.form + "/" + params.filename,
        Body: fileStream,
        ContentType: params.file.type,
        ACL: 'public-read-write'
    }, function (err, res) {
        if (err) {
            cb({ Message: 'Failed to upload' })
        } else {
            cb({ Message: 'Success' })
        }
    });
}

var getUserRoles = exports.getUserRoles = (users, cb) => {
    let usersRole = global.initModel("users_role");
    let data = {}
    usersRole.getData("users_role", { usersId: users.id }, {}, (e) => {
        data.userRole = (e.data.length > 0) ? e.data[0].roleId : 0;

        let usersTeam = global.initModel("users_team")
        usersTeam.getData("users_team", { usersId: users.id }, {}, (e) => {
            data.team = JSON.stringify(e.data.map((e, i) => { return { value: e.teamId, label: e.team_team }; }));
            cb(data)
        })
    })
}

var getUserAllowedAccess = exports.getUserAllowedAccess = (data, cb) => {
    let func = global.initFunc();
    func.getUserRoles({ id: data.userId }, resp => {
        let project = global.initModel("project")
        project.getProjectAllowedAccess("project", { usersId: data.userId, userRole: resp.userRole }, {}, (e) => {
            let projectIds = e.data.map((f) => { return f.projectId })
            let allowed = projectIds.filter(f => { return f == data.params }).length
            if (allowed) {
                cb({ status: true })
            } else {
                cb({ status: false })
            }
        })
    })
}

var getFilePathExtension = exports.getFilePathExtension = (path) => {
    var filename = path.split('\\').pop().split('/').pop();
    return filename.substr((Math.max(0, filename.lastIndexOf(".")) || Infinity) + 1);
}

var getTaskProjectId = exports.getTaskProjectId = (data, cb) => {
    let task = global.initModel("task");
    task.getData("task", { id: data.id }, { id: data.id }, (c) => {
        if (c.data.length) {
            cb({ status: true, data: { project: c.data[0].projectId, workstream: c.data[0].workstreamId } })
        }
    })
}

var changedObjAttributes = exports.changedObjAttributes = (object, base) => {
    return _.transform(object, function (result, value, key) {
        if (!_.isEqual(value, base[key])) {
            result[key] = (_.isObject(value) && _.isObject(base[key])) ? changedObjAttributes(value, base[key]) : value;
        }
    });
}

var isArrayEqual = exports.isArrayEqual = (x, y) => {
    return _(x).xorWith(y, _.isEqual).isEmpty();
};

var MentionConvert = exports.MentionConvert = (string) => {
    const split = string.split(/{([^}]+)}/g).filter(Boolean);

    return (
        `<p style="margin:0">
            ${flattenDeep(split.map((o, index) => {
            const regEx = /\[([^\]]+)]/;
            if (regEx.test(o)) {
                let mentionString = o.replace(/[\[\]']+/g, "");
                return (
                    `
                    <strong key=${index}>
                        <span style="color:#789ce4;">${mentionString.replace(/[(^0-9)]/g, "")}</span>
                    </strong>
                    `
                );
            } else if (o.match(/^http\:\//) || o.match(/^https\:\//)) {
                return (
                    `<a>
                            ${o.replace(/\r?\n/g, "<br />")}
                        </a>`
                );
            } else {
                return o.replace(/\r?\n/g, "<br />");
            }
        })).join("")}
        </p>`
    );
};

var toCapitalizeFirstLetter = exports.toCapitalizeFirstLetter = (value) => {
    return value.charAt(0).toUpperCase() + value.substring(1)
}

var daysRemaining = exports.daysRemaining = (date) => {
    var eventdate = moment(moment(date).format("YYYY-MM-DD"));
    var todaysdate = moment(moment().format("YYYY-MM-DD"));
    return eventdate.diff(todaysdate, 'days');
}