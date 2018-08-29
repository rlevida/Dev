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
    console.log("Run due today reminder");
})