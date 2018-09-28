const Sequelize = require("sequelize");
const field = exports.field = global.connectionDb.define('activity_log', {
  invokerUserId: {
    type: Sequelize.BIGINT(11)
  },
  data: {
    type: Sequelize.STRING  
  },
  dateAdded: {
    type: Sequelize.DATE  
  },
  dateUpdated: {
    type: Sequelize.DATE  
  }
});