const Sequelize = require("sequelize");
const field = exports.field = global.connectionDb.define('checklist_type', {
  invokerUserId: {
    type: Sequelize.STRING
  },
  checklistId: {
    type: Sequelize.BIGINT(11)  
  },
  dateAdded: {
    type: Sequelize.DATE  
  },
  dateUpdated: {
    type: Sequelize.DATE  
  }
});