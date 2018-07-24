var func = global.initFunc(),
    sequence = require("sequence").Sequence;

var init = exports.init = (socket) => {

    function isUserExist(id, username, email , cb){
        let users = global.initModel("users");

        let filter = { "|||or|||" : [ { name : "username" , value : username, condition : "=" }, 
                                        { name : "email", value : email, condition : "=" }
                                    ]}
        if(id != ""){
             filter = { "|||or|||" : [ { name : "username" , value : username, condition : "=" }, 
                                        { name : "email", value : email, condition : "=" }
                                    ], id : { value: id , condition : " != " }
            }
        }

        users.getData("users",filter,{},(c)=>{
            if(c.data.length > 0) {
                cb(true)
            }else{
                cb(false)
            }
        })
    }

    socket.on("GET_USER_LIST",(d) => {
        let users = global.initModel("users")
        let filter = (typeof d.filter != "undefined")?d.filter:{};
        users.getData("users",filter,{},(c)=>{
            if(c.status) {
                socket.emit("FRONT_USER_LIST",c.data)
            }else{
                if(c.error) { socket.emit("RETURN_ERROR_MESSAGE",{message:c.error.sqlMessage}) }
            }
        })
    })

    socket.on("GET_TRAINER_LIST",(d) => {
        let users = global.initModel("users")
        let filter = (typeof d.filter != "undefined")?d.filter:{};
        filter.userType = "trainer";
        users.getData("users",filter,{},(c)=>{
            if(c.status) {
                socket.emit("FRONT_TRAINER_LIST",c.data)
            }else{
                if(c.error) { socket.emit("RETURN_ERROR_MESSAGE",{message:c.error.sqlMessage}) }
            }
        })
    })
    
    socket.on("GET_USER_DETAIL",(d) => {
        let users = global.initModel("users")
        users.getData("users",{id:d.id},{},(c)=>{
            if(c.data.length > 0) {
                socket.emit("FRONT_USER_SELECTED",c.data[0])
            }
        })
    })
    
    socket.on("SAVE_OR_UPDATE_USER",(d) => {
        let users = global.initModel("users")
        sequence.create().then(function (nextThen) {
            users.getData("users",{active:1,userType:"admin"},{},(b)=>{
                if( b.data.length <= 1 && b.data[0].id == d.data.id && ( typeof d.data.active != "undefined" && d.data.active == "0" ) ){
                    socket.emit("RETURN_ERROR_MESSAGE",{message:"Cant Delete, Last admin user."})
                    socket.emit("FRONT_USER_ACTIVE",{id:d.data.id,status:1})
                }else{
                    nextThen()
                }
            })
        }).then(function (nextThen) {
            if(typeof d.data.username != "undefined" || typeof d.data.email != "undefined"){
                isUserExist(d.data.id,d.data.username,d.data.email,(e)=>{
                    if( e ){
                        socket.emit("RETURN_ERROR_MESSAGE",{message:"Username/Email address already exist"})
                    }else {
                        nextThen()
                    }
                })
            }else{
                nextThen()
            }
        }).then(function (nextThen) {
            if( typeof d.data.id != "undefined" && d.data.id != "" ){
                let id = d.data.id
                delete d.data.id
                users.putData("users",d.data,{id:id},(c)=>{
                    if(c.status) {
                        users.getData("users",{id:id},{},(e)=>{
                            if(e.data.length > 0) {
                                socket.emit("FRONT_USER_EDIT",e.data[0])
                                socket.emit("RETURN_SUCCESS_MESSAGE",{message:"Successfully updated"})
                            }else{
                                socket.emit("RETURN_ERROR_MESSAGE",{message:"Updating failed. Please Try again later."})
                            }
                        })
                    }else{
                        if(c.error) { socket.emit("RETURN_ERROR_MESSAGE",{message:c.error.sqlMessage}); return; }

                        socket.emit("RETURN_ERROR_MESSAGE",{message:"Updating failed. Please Try again later."})
                    }
                })
            }else{
                users.postData("users",d.data,(c)=>{
                    if(typeof c.id != "undefined" && c.id > 0) {
                        users.getData("users",{id:c.id},{},(e)=>{
                            if(e.data.length > 0) {
                                socket.emit("FRONT_USER_ADD",e.data)
                                socket.emit("RETURN_SUCCESS_MESSAGE",{message:"Successfully updated"})
                            }else{
                                socket.emit("RETURN_ERROR_MESSAGE",{message:"Saving failed. Please Try again later."})
                            }
                        })
                    }else{
                        socket.emit("RETURN_ERROR_MESSAGE",{message:"Saving failed. Please Try again later."})
                    }
                })
            }
        })
    })

    socket.on("DELETE_USER",(d) => {
        let users = global.initModel("users")

        users.getData("users",{active:1,userType:"admin"},{},(b)=>{
            if( b.data.length <= 1 && b.data[0].id == d.id ){
                socket.emit("RETURN_ERROR_MESSAGE",{message:"Cant Delete, Last admin user."})
            }else{
                users.deleteData("users",{id:d.id},(c)=>{
                    if(c.status) {
                        socket.emit("FRONT_USER_DELETED",{id:d.id})
                    }else{
                        socket.emit("RETURN_ERROR_MESSAGE","Delete failed. Please try again later.")
                    }
                })
            }
        })
    })

    socket.on("CHANGE_USER_PASSWORD",function(d){
        let users = global.initModel("users");
        let id = d.Id;
        let data = {}
        data.salt = func.randomString(32);
        data.password = func.generatePassword(d.password,data.salt);
        users.putData("users",data,{id:id},(c)=>{
            if(c.status) {
                socket.emit("RETURN_SUCCESS_MESSAGE",{message:"Password successfully changed."})
            } else {
                socket.emit("RETURN_ERROR_MESSAGE",{message:"Password change failed. Please Try again later."})
            }
        })
    })

    socket.on("UPLOAD_AVATAR", (image, cb) => {
        let users = global.initModel("users");
        let AWS = global.initAWS();
        let s3 = new AWS.S3();
        const base64Data = new Buffer((image.source.uri).replace(/^data:image\/\w+;base64,/, ""), 'base64');
        const type = (image.source.uri).split(';')[0].split('/')[1]

        s3.putObject({
            Bucket: global.AWSBucket,
            Key: 'avatars/' + image.source.file_name,
            Body: base64Data,
            ContentType: 'image/' + type,
            ACL: 'public-read-write',
        }, (response) => {
            users.putData("users", { avatar: 'https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/' + image.source.file_name }, {id:image.Id}, (c) => {
                cb({ avatar: 'https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/' + image.source.file_name })
            })
        });
    })

    socket.on("UPDATE_ONE_SIGNAL_ID",function(d){
        let users = global.initModel("users");
        let id = d.id;
        let data = { oneSignalId: d.oneSignalId }
        users.putData("users",data,{id:id},(c)=>{ 
            //console.log(c); 
        })
    })
}