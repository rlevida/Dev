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
            let filter = (typeof d.filter != "undefined")?d.filter:{};
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
                    model.getWorkstreamTaskMembers(filter,(c)=>{
                        if(c.status){
                            cb({ status:200, data: c.data })
                        } else {
                            cb({ status:200, data: [] })
                        }
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