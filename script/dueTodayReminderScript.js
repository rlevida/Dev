var schedule = require('node-schedule'),
    sequence = require("sequence").Sequence; 
    
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
    let dateToday = new Date();
    task.getTaskDueToday((ret)=>{
        if ( ret.data.length > 0 ) {
            ret.data.map((e,i)=>{
                reminder.postData("reminder",{
                    taskId:e.id,
                    usersId:e.usersId,
                    reminderDetail: "Task Due Today"
                },()=>{})
            })
        }
    })
})