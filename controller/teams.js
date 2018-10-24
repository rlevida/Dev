const dbName = "team";
var { defaultGet, defaultGetId, defaultPost, defaultPut, defaultDelete } = require("./")

const Sequelize = require("sequelize")
const Op = Sequelize.Op;

const models = require('../modelORM');

const {
    Members,
    Project,
    Teams,
    Users,
    UsersTeam,
} = models;


exports.get = {
    index : (req,cb) => {
        let d = req.query;
        let filter = (typeof d.filter != "undefined") ? JSON.parse(d.filter) : {};
        
        Teams
            .findAll({
                include: [
                    {
                        model:Users,
                        as:'teamLeader'
                    },
                    {
                        model:UsersTeam,
                        as:'users_team',
                        include:[{
                            model:Users,
                            as:'user'
                        }]
                    }
                ]
            })
            .then((res) => {
                cb({status: 200, data:res})
            })
            .catch((err) => {
                console.error(err)
            })
    },
    getById : (req,cb) => {
        defaultGetById(dbName,req,(res)=>{
            if(res.status){
                cb({ status:true, data:res.data })
            } else {
                cb({ status:false, error:res.error })
            }
        })
    }
}

exports.post = {
    index : (req,cb) => {
        defaultPost(dbName,req,(res)=>{
            if(res.success){
                cb({ status:true, data:res.data })
            }else{
                cb({ status:false, error:res.error })
            }
        })
    }
}

exports.put = {
    index : (req,cb) => {
        defaultPut(dbName,req,(res)=>{
            if(res.success){
                cb({ status:true, data:res.data })
            } else {
                cb({ status:false, error:c.error })
            }
        })
    }
}

exports.delete =  {
    index : (req,cb) => {
        defaultDelete(dbName,req,(res)=>{
            if(res.success){
                cb({ status:true, data:res.data })
            } else {
                cb({ status:false, error:res.error })
            }
        })
    }
}