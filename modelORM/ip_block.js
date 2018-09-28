const Sequelize = require("sequelize");
const field = exports.field = global.connectionDb.define('ip_block', {
  ipAddress: {
    type: Sequelize.STRING
  },
  failedTimes: {
    type: Sequelize.INTEGER
  },
  parentId: {
    type: Sequelize.BIGINT(11)
  },
  dateFailed: {
    type: Sequelize.INTEGER  
  },
  dateAdded: {
    type: Sequelize.DATE  
  },
  dateUpdated: {
    type: Sequelize.DATE
  }
});