var schedule = require('node-schedule'),
    sequence = require("sequence").Sequence,
    async = require("async");
    
/**
 * 
 * Comment : Manage reminder for due today
 *   *    *    *    *    *    *
 *   s    i    H    DM    M   DW 
 * 
 **/
var j = schedule.scheduleJob('0 0 * * *', () => {
    let task = global.initModel("task")
    let reminder = global.initModel("reminder")
    let members = global.initModel("members")
    let dateToday = new Date();
    
    sequence.create().then((nextThen) => {
        task.getTaskDueToday((ret)=>{
            if ( ret.data.length > 0 ) {
                async.map( ret.data , (e, mapCallback) => {
                        reminder.postData("reminder",{
                            // taskId:e.id,
                            usersId:e.usersId,
                            linkType:"task",
                            linkId:e.id,
                            type:"Task Due Today",
                            reminderDetail: "Task Due Today"
                        },()=>{ mapCallback(null) })
                }, (err, res) => {
                    nextThen(ret)
                });
            }
        })
    }).then((nextThen,result) => {
        let taskIds = result.data.map((e,index)=>{ return e.workstreamId })
            members.getWorkstreamResponsible(taskIds,(responsible)=>{
                if(responsible.data.length > 0){
                    async.map( responsible.data , (e, mapCallback) => {
                        reminder.postData("reminder",{
                            // taskId:e.taskId,
                            linkType:"task",
                            linkId:e.id,
                            type:"Task Due Today",
                            usersId:e.usersId,
                            reminderDetail: "Task Due Today"
                        },()=>{ mapCallback(null) })
                    
                    }, (err, res) => {
                        nextThen(result)
                    });
                }
            })
    }).then((nextThen,result)=>{
        let taskIds = result.data.map((e,index)=>{ return e.id })
            members.getTaskFollower(taskIds,(responsible)=>{
                if(responsible.data.length > 0){
                    async.map( responsible.data , (e, mapCallback) => {
                        reminder.postData("reminder",{
                            // taskId:e.taskId,
                            linkType: "task",
                            linkId: e.id,
                            type:"Task Due Today",
                            usersId:e.usersId,
                            reminderDetail: "Task Due Today"
                        },()=>{ mapCallback(null) })
                    
                    }, (err, res) => {
                    });
                }
            })
    })
})