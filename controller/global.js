var { defaultGet, defaultGetId, defaultPost, defaultPut, defaultDelete } = require("./")

exports.get = {
    selectList : (req,cb) => {
        let d = req.query
        let filter = (typeof d.filter != "undefined")?JSON.parse(d.filter):{};
        let modelName = "";
        let modelList = [];
            modelList["teamList"] = "team"; 
            modelList["usersList"] = "users"; 
            modelList["documentList"] = "document";
            modelList["workstreamList"] = "workstream";
            modelList["starredList"] = "starred";
            modelList["tagList"] = "tag";
            modelList["ProjectMemberList"] = "members";
            modelList["taskList"] = "task";
            modelList["folderList"] = "folder";
            modelList["shareList"] = "share"
            modelList["workstreamDocumentList"] = "document"
            modelList["userFollowedTasks"] = "members"
            modelList["workstreamMemberList"] = "members";
        modelName = modelList[d.selectName];
        if(modelName != ""){
            let model = global.initModel(modelName);
            let type = (typeof d.type != 'undefined') ? d.type : 'client';
            switch(d.selectName){
                case "ProjectMemberList" : {
                    model.getProjectMemberList(modelName, filter, {}, (c) => {
                        if (c.status) {
                            cb({ status:200, data: c.data })
                        } else {
                            cb({ status:200, data: [] })
                        }
                    })
                    break;
                }
                case "shareList":{
                    model.getShareList(modelName,filter,{},(c)=>{
                        if(c.status){
                            cb({ status:200, data: c.data })
                        } else {
                            cb({ status:200, data: [] })
                        }
                    })
                    break;
                }
                case "workstreamDocumentList":{
                    model.getWorkstreamDocumentList(modelName,filter,{},(c)=>{
                        if(c.status){
                            cb({ status:200, data: c.data })
                        } else {
                            cb({ status:200, data: [] })
                        }
                    })
                    break;
                }
                case "workstreamMemberList":{
                    let id = filter.id
                    async.parallel({
                        responsible : (parallelCallback) => {
                            model.getWorkstreamResponsible([id], (c) => {
                                if(c.status){
                                    parallelCallback(null,c.data)
                                }else{
                                    parallelCallback(null,c.data)
                                }
                            })
                        },
                        taskMember : (parallelCallback) => {
                            model.getWorkstreamTaskMembers(filter,(c)=>{
                                if(c.status){
                                    parallelCallback(null,c.data)
                                } else {
                                    parallelCallback(null,c.data)
                                }
                            })
                        }
                    }, (err, results) => {
                        let usersRole = global.initModel("users_role");
                        let usersTeam = global.initModel("users_team")
                        let mergeResults = _.uniqBy(results.taskMember.concat(results.responsible),"id")

                            async.map(mergeResults, (user, mapCallback) => {
                                async.parallel({
                                    role: function (parallelCallback) {
                                        usersRole.getData("users_role", { usersId: user.id }, {}, (role) => {
                                            parallelCallback(null, role.data)
                                        });
                                    },
                                    team: function (parallelCallback) {
                                        usersTeam.getData("users_team", { usersId: user.id }, {}, (team) => {
                                            parallelCallback(null, team.data)
                                        });
                                    }
                                }, function (err, { role, team }) {
                                    mapCallback(null , { ...user, role , team })
                                });
                            }, function (err, usersResult) {
                                cb({ status : true , data : usersResult })
                            })
                    })
                    break;
                }
                default: {
                    model.getData(modelName, filter, {}, (c) => {
                        if(c.status){
                            cb({ status:200, data: c.data })
                        } else {
                            cb({ status:200, data: [] })
                        }
                    })
                break;
                }
            }
        }
    }
}