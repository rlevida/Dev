var func = global.initFunc(),
    sequence = require("sequence").Sequence;

var init = exports.init = (socket) => {

    socket.on('USER_LOGGED_IN', function (data) {
        let users = global.initModel("users");
            users.getData("users",{username:data.username},{allowedPrivate:true},(user)=>{
            if( user.status && user.data.length > 0 ){
                
                if (!user.data[0].salt || typeof user.data[0].salt == "undefined") {
                    socket.emit("RETURN_ERROR_MESSAGE",{message:"Incorrect username/password."})
                    return;
                }
                // check if user is Active
                if( user.data[0].isActive == 0 ){
                    socket.emit("RETURN_ERROR_MESSAGE",{message:"Account is inactive. Please contact your administrator."})
                    return;
                }

                // manage password hash here
                var inputPassword = func.generatePassword(data.password, user.data[0].salt);
                if (user.data[0].password == inputPassword) {
                    if(typeof socket.request.cookies["app.sid"] == "undefined"){
                        // manage token if app.sid is not yet set by the server/mobile access directly to socket during login
                        const TokenGenerator = require('uuid-token-generator');
                        socket.request.cookies["app.sid"] = new TokenGenerator(256).generate();
                    }

                    let session = global.initModel("session");
                    session.getData("session",{usersId:user.data[0].id},{},(sess)=>{
                        if(sess.data.length == 0){
                            delete user.data[0].password;
                            delete user.data[0].salt;
                            session.postData("session",{usersId:user.data[0].id,session:socket.request.cookies["app.sid"],data:JSON.stringify(user.data[0]),dateAdded:new Date()},()=>{
                                socket.emit("AUTHENTICATION_RETURN",{token:socket.request.cookies["app.sid"]})
                                socket.emit("RETURN_SUCCESS_MESSAGE",{message:"Successfully Login"})
                                return;
                            })
                        }else{
                            delete user.data[0].password;
                            delete user.data[0].salt;
                            session.putData(
                                "session",
                                {session:socket.request.cookies["app.sid"],data:JSON.stringify(user.data[0]),dateAdded:new Date()},
                                {id:sess.data[0].id},
                                ()=>{
                                    socket.emit("AUTHENTICATION_RETURN",{token:socket.request.cookies["app.sid"]})
                                    socket.emit("RETURN_SUCCESS_MESSAGE",{message:"Successfully Login"})
                                    return;
                            })
                        }
                    })
                }else{
                    socket.emit("RETURN_ERROR_MESSAGE",{message:"Incorrect username/password."})
                    return;
                }

            }else{
                if(user.error) { socket.emit("RETURN_ERROR_MESSAGE",{message:(user.error.sqlMessage)?user.error.sqlMessage:user.error.code}); return}

                socket.emit("RETURN_ERROR_MESSAGE",{message:"Incorrect username/password."})
                return;
            }
        })
    });

    socket.on('LOGGED_USER', function (data) {
        sequence.create().then((nextThen)=>{
            let users = global.initModel("users");
            users.getData("users",{id:socket.handshake.query.UserId},{},(user)=>{
                if(user.data.length > 0 && user.status){
                    let retData = Object.assign({},user.data[0])
                    delete retData.password
                    delete retData.salt
                    retData.LastLoggedIn = socket.handshake.query.LastLoggedIn
                    nextThen(retData)
                }
            })
        }).then((nextThen,retData)=>{
            let usersRole = global.initModel("users_role")
            usersRole.getData("users_role",{usersId:retData.id},{},(e)=>{
                retData.userRole = (e.data.length > 0)?e.data[0].roleId:0;
                nextThen(retData)
            })
        }).then((nextThen,retData)=>{
            let usersTeam = global.initModel("users_team")
            usersTeam.getData("users_team",{usersId:retData.id},{},(e)=>{
                retData.team = JSON.stringify(e.data.map((e,i)=>{ return {value:e.teamId,label:e.team_team}; }));
                nextThen(retData)
            })
        }).then((nextThen,retData)=>{
            let project = global.initModel("project")
            console.log(retData.id);
            project.getProjectAllowedAccess("project",{usersId:retData.id, userRole: retData.userRole},{},(e)=>{
                retData.projectIds = e.data.map((f) => { return f.projectId })
                socket.emit("RETURN_LOGGED_USER",{data:retData})
            })
        })
    });

    socket.on('LOGOUT', function (data) {
        let session = global.initModel("session");
        session.deleteData("session",{session:socket.handshake.query.Token},(sess)=>{
            socket.emit("RETURN_LOGOUT",{message:"Successfully logout."})
        })
    });

    socket.on('IS_USER_LOGGED_IN', function (data) {
        let session = global.initModel("session");
        session.getData("session",{session:data.Token},{},(ret)=>{
            if(ret.status && ret.data.length > 0){
                socket.emit("FRONT_IS_USER_LOGGED_IN",{status:true});
            }else{
                socket.emit("FRONT_IS_USER_LOGGED_IN",{status:false});
            }
        })
    });

}