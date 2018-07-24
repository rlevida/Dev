var func = global.initFunc();

var init = exports.init = (socket) => {

    socket.on("SEND_FORGOT_PASSWORD", (d) => {
        let users = global.initModel("users");
        let type = (typeof d.type != 'undefined') ? d.type : 'client';

        users.getData("users", { email: d.email }, {}, (c) => {
            if (c.data.length > 0) {
                func.sendForgotPasswordmail(c.data[0].id, d.email, type, (d, res) => {
                    if (type == 'mobile') {
                        var result = {
                            message: d,
                            result: {
                                id: c.data[0].id,
                                security_code: res.security_code,
                                hash: res.hash
                            }
                        };
                        socket.emit("DONE_SENDING_FORGOT_PASSWORD_EMAIL_MOBILE", result);
                    } else {
                        socket.emit("DONE_SENDING_FORGOT_PASSWORD_EMAIL", d);
                    }
                });
            } else {
                if(c.error) { socket.emit("DONE_SENDING_FORGOT_PASSWORD_EMAIL_FAILED",{message:c.error.sqlMessage}); return; }

                socket.emit("DONE_SENDING_FORGOT_PASSWORD_EMAIL_FAILED", {message:"Email does not exist."});
            }
        })
    })

    socket.on("COMPLETE_FORGOT_PASSWORD", (c) => {
        let ufp = global.initModel("users_forgot_password");
        ufp.getData("users_forgot_password", { hash: c.hash }, {}, (ufpRet) => {
            if (ufpRet.data.length > 0) {
                data = {};
                data.salt = func.randomString(32);
                data.password = func.generatePassword(c.newPassword,data.salt);
                ufp.putData("users",data,{id:ufpRet.data[0].userId},(users)=>{
                    if(users.status){
                        socket.emit("COMPLETE_FORGOT_PASSWORD_SUCCESS",{});
                    }else{
                        socket.emit("COMPLETE_FORGOT_PASSWORD_FAILED",{});
                    }
                })
            } else {
                socket.emit("COMPLETE_FORGOT_PASSWORD_FAILED", {});
            }
        })
    })

    socket.on("GET_SETTINGS", (c) => {

        let data = [];
        data.push({ name: "imageUrl", value: global.AWSLink + global.environment });

        socket.emit("GET_SETTINGS_RETURN", data);
    })
}