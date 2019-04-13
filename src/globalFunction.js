let showToast = exports.showToast = (type, message, duration, multiple) => {
    let toastDuration = duration || 3000;

    if (typeof multiple == 'undefined') {
        toastr.remove();
    }

    toastr.options.timeOut = toastDuration;
    toastr[type](message);
}

const getParameterByName = exports.getParameterByName = (name, url) => {
    if (!url) {
        url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

let validateEmail = exports.validateEmail = (email) => {
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regEx.test(email);
}

let displayDate = exports.displayDate = function (strDate) {
    const displayDate = moment(strDate, "YYYY MMM DD").format("MMMM DD, YYYY");
    return displayDate;
}

let displayDateMD = exports.displayDateMD = function (strDate) {
    let displayDate = moment(strDate).format("MMMM DD");
    return displayDate;
}

let formatDate = exports.formatDate = function (strDate) {
    if (strDate == "" || strDate == undefined || strDate == "00-00-0000" || strDate == "00-00-0000 00:00:00") {
        strDate = "01-01-1970";
    }

    let res = strDate.split("/");

    let formatDate = res[2] + "/" + res[0] + "/" + res[1];

    return formatDate;
}

let isNumber = exports.isNumber = function (_this, params, e) {
    var value = "",
        state = false;
    if (/^\d+\.\d{0,2}$/.test(e.target.value)) {
        state = true;
        value = e.target.value
    } else if (e.target.value == '') {
        state = true;
        value = e.target.value
    } else {
        if (typeof e.target.value.split(".")[1] == 'undefined' && /^\d+$/.test(e.target.value)) {
            state = true;
            value = e.target.value
        } else if (e.target.value.split(".")[1] == '' && e.target.value == '.') {
            state = true;
            value = e.target.value
        }
    }
    if (state) {
        if (params.objectName) {
            var object = _this.state[params.objectName];
            object[params.name] = value;
            _this.setState({
                [params.objectName]: object
            });
        } else {
            _this.setState({
                [params.name]: value
            });
        }
    }
}

let numberFormat = exports.numberFormat = function (number, decimals, decPoint, thousandsSep) {

    number = (number + '').replace(/[^0-9+\-Ee.]/g, '')
    var n = !isFinite(+number) ? 0 : +number
    var prec = !isFinite(+decimals) ? 0 : Math.abs(decimals)
    var sep = (typeof thousandsSep === 'undefined') ? ',' : thousandsSep
    var dec = (typeof decPoint === 'undefined') ? '.' : decPoint
    var s = ''

    var toFixedFix = function (n, prec) {
        var k = Math.pow(10, prec)
        return '' + (Math.round(n * k) / k)
            .toFixed(prec)
    }

    // @todo: for IE parseFloat(0.55).toFixed(0) = 0;
    s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.')
    if (s[0].length > 3) {
        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep)
    }
    if ((s[1] || '').length < prec) {
        s[1] = s[1] || ''
        s[1] += new Array(prec - s[1].length + 1).join('0')
    }

    return s.join(dec)
}

let getCookie = exports.getCookie = function (cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

let setCookie = exports.setCookie = function (cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

let checkContactNumber = exports.checkContactNumber = function (value) {
    const regEx = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return regEx.test(value);
}

let exportToExcel = exports.exportToExcel = function (fields) {
    var form = document.createElement("form");
    document.body.appendChild(form);
    form.method = "POST";
    form.target = "_blank";
    form.action = "/api/exportReport";
    Object.keys(fields).map(function (field, index) {
        var element = document.createElement("input")
        element.name = field;
        element.value = fields[field];
        element.type = "hidden";
        form.appendChild(element);
    });
    form.submit();
}

let CurrencyList = exports.CurrencyList = function (cb) {
    $.ajax({
        url: "/json/currency.json",
        dataType: 'json',
        type: 'get',
        success: function (currency) {
            var curs = Object.keys(currency).map(function (cur, index) {
                return { id: cur, name: cur };
            });
            cb(curs);
        }
    });
}


let CountryList = exports.CountryList = function (cb) {
    $.ajax({
        url: "/json/country.json",
        dataType: 'json',
        type: 'get',
        success: function (countries) {
            var country = Object.keys(countries).map(function (country, index) {
                return { id: country, name: countries[country] };
            });
            cb(country);
        }
    });
}

let NationalityList = exports.NationalityList = function (cb) {
    $.ajax({
        url: "/json/nationality.json",
        dataType: 'json',
        type: 'get',
        success: function (nationality) {
            cb(nationality);
        }
    });
}


var setDatePicker = exports.setDatePicker = function (handleDate, Id) {
    $("#" + Id).on('change', function (e) {
        handleDate(e);
    });
    try {
        var picker = $('.datepicker').pickadate({
            selectMonths: true,
            selectYears: 200,
            format: 'yyyy-mm-dd',
            onSet: function (data) {
                if (data.select != undefined) {
                    $('.picker__close').click();
                }
            }
        });
    } catch (error) {
        //console.log(error)
    }
}

var setTimePicker = exports.setTimePicker = function (handleDate, Id) {
    $("#" + Id).on('change', function (e) {
        handleDate(e);
    });

    try {
        $("#" + Id).pickatime({ twelvehour: false });
    } catch (error) {
        //console.log(error)
    }
}

var getFilePathExtension = exports.getFilePathExtension = (path) => {
    var filename = path.split('\\').pop().split('/').pop();
    return filename.substr((Math.max(0, filename.lastIndexOf(".")) || Infinity) + 1);
}

import axios from "axios"

var postData = exports.postData = function (url, data, cb) {
    axios.post(url, data)
        .then((res) => {
            cb(res)
        })
        .catch((err) => {
            cb(err);
        });
}

var getData = exports.getData = function (url, data, cb) {
    axios.get(url, data)
        .then((res) => {
            cb(res)
        })
        .catch((err) => {
            console.error(err);
        });
}

var putData = exports.putData = function (url, data, cb) {
    axios.put(url, data)
        .then((res) => {
            cb(res)
        })
        .catch((err) => {
            console.error(err);
        });
}

var deleteData = exports.deleteData = function (url, data, cb) {
    axios.delete(url, data)
        .then((res) => {
            cb(res)
        })
        .catch((err) => {
            console.error(err);
        });
}

var removeTempFile = exports.removeTempFile = function (fileToRemove, cb) {
    axios.post(`/api/document/removeTempFile`, { data: fileToRemove })
        .then((res) => {
            cb(res)
        })
        .catch((err) => {
            console.error(err);
        });
}

var notificationType = exports.notificationType = function (type) {
    switch (type) {
        case "fileNewUpload": {
            return "upload a new file"
        }
        case "taskAssigned": {
            return "assigned a new task for you"
        }
        case "taskApprover": {
            return "needs your approval to complete a task"
        }
        case "messageSend": {
            return "sent you a new message"
        }
        case "taskTagged": {
            return "mentioned you in a task"
        }
        case "commentReplies": {
            return "replies to a comment"
        }
        case "taskFollowingCompleted": {
            return "completed this task"
        }
        case "taskMemberCompleted": {
            return "completed this task"
        }
        case "taskDeadline": {
            return "You seem to have missed a deadline"
        }
        case "taskFollowingDeadline": {
            return "Task following seem to have missed a deadline"
        }
        case "taskTeamDeadline": {
            return "Team member seem to have missed a deadline"
        }
        default:
            return;
    }
}