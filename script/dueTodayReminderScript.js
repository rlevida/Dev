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
        task.getTaskDueToday((result)=>{
            if ( result.data.length > 0 ) {
                async.parallel({
                    remindTaskAsssigned : (parallelCallback) => {    
                        async.map( result.data , (e, mapCallback) => {
                            reminder.postData("reminder",{
                                usersId:e.usersId,
                                linkType:"task",
                                linkId:e.id,
                                type:"Task Due Today",
                                reminderDetail: "Task Due Today"
                            },()=>{ mapCallback(null) })
                        }, (err, ret) => {
                            parallelCallback(null, ret);
                        });
                    },sendToEmail : (parallelCallback) => {
                        async.map(result.data, (e, mapCallback) => {
                            if(e.receiveNotification > 0){
                                let mailOptions = {
                                    from: '"no-reply" <no-reply@c_cfo.com>', // sender address
                                    to: `${e.user_emailAddress}`, // list of receivers
                                    subject: '[CLOUD-CFO]', // Subject line
                                    text: 'Task Due Today', // plain text body
                                    html: 'Task Due Today' // html body
                                }
                                global.emailtransport(mailOptions)
                                mapCallback(null)
                            }else{
                                mapCallback(null)
                            }
                        }, (err, ret) => { parallelCallback(null, ret); });
                    }
                },(error, asyncParallelResult) =>{
                    nextThen(result)
                })
            }
        })
    }).then((nextThen, result) => {
        let workstreamIds = result.data.map((e, index) => { return e.workstreamId })
        members.getWorkstreamResponsible(workstreamIds, (responsible) => {
            if (responsible.data.length > 0) {
                async.parallel({
                    remindWorkstreamResponsible : (parallelCallback) => {
                        async.map(responsible.data, (e, mapCallback) => {
                            reminder.postData("reminder", {
                                linkType: "workstream",
                                linkId: e.workstreamId,
                                type: "Task Due Today",
                                usersId: e.usersId,
                                reminderDetail: "Task Due Today as responsible"
                            }, () => { mapCallback(null) })
                        }, (err, res) => { parallelCallback(null, res); });
                    },
                    sendToEmail : (parallelCallback) => {
                        async.map(responsible.data, (e, mapCallback) => {
                            if(e.receiveNotification > 0){
                                let mailOptions = {
                                    from: '"no-reply" <no-reply@c_cfo.com>', // sender address
                                    to: `${e.user_emailAddress}`, // list of receivers
                                    subject: '[CLOUD-CFO]', // Subject line
                                    text: 'Task Due Today', // plain text body
                                    html: 'Task Due Today as responsible' // html body
                                }
                                global.emailtransport(mailOptions)
                                mapCallback(null)
                            }else{
                                mapCallback(null)
                            }
                        }, (err, ret) => { parallelCallback(null, ret) });
                    }
                    
                },(error, asyncParallelResult) =>{
                    nextThen(result)
                })
            }else{
                nextThen(result)
            }
        })
    }).then((nextThen, result) => {
        let taskIds = result.data.map((e, index) => { return e.id })
        members.getTaskFollower(taskIds, (follower) => {
            if (follower.data.length > 0) {
                async.parallel({
                   remindTaskFollower:(parallelCallback)=>{ 
                       async.map(follower.data, (e, mapCallback) => {
                            reminder.postData("reminder", {
                                linkType: "task",
                                linkId: e.taskId,
                                type: "Task Due Today",
                                usersId: e.usersId,
                                reminderDetail: "Task Due Today as follower"
                            }, () => { mapCallback(null) })
        
                        }, (err, ret) => { parallelCallback(null, ret) });
                    },
                    sendToEmail : (parallelCallback) => {
                        async.map(follower.data, (e, mapCallback) => {
                            if(e.receiveNotification > 0){
                                let mailOptions = {
                                    from: '"no-reply" <no-reply@c_cfo.com>', // sender address
                                    to: `${e.user_emailAddress}`, // list of receivers
                                    subject: '[CLOUD-CFO]', // Subject line
                                    text: 'Task Due Today', // plain text body
                                    html: 'Task Due Today as follower' // html body
                                }
                                global.emailtransport(mailOptions)
                                mapCallback(null)
                            }else{
                                mapCallback(null)
                            }
                        }, (err, ret) => {  parallelCallback(null, ret)});
                    }

                },(error, asyncParallelResult) =>{
                    nextThen(result)
                })
            }
        })
    })
})