const Sequelize = require("sequelize");
const field = exports.field = global.connectionDb.define('company', {
  companyName: {
    type: Sequelize.STRING
  },
  industry: {
    type: Sequelize.STRING  
  },
  isActive: {
    type: Sequelize.INTEGER
  },
  dateAdded: {
    type: Sequelize.DATE  
  },
  dateUpdated: {
    type: Sequelize.DATE  
  }
});