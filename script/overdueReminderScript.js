var schedule = require('node-schedule'),
    sequence = require("sequence").Sequence; 

/**
 * 
 * Comment : Manage reminder for overdue task
 *   *    *    *    *    *    *
 *   s    i    H    DM    M   DW 
 * 
 **/
var j = schedule.scheduleJob('0 0 * * *', () => {
    console.log("Run overdue reminser");
})