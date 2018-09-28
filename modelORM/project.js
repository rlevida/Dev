const Sequelize = require("sequelize");
const field = exports.field = global.connectionDb.define('project', {
  project: {
    type: Sequelize.STRING
  },
  tinNo: {
    type: Sequelize.STRING
  },
  companyAddress: {
    type: Sequelize.STRING
  },
  statusId: {
    type: Sequelize.BIGINT(11)  
  },
  typeId: {
    type: Sequelize.BIGINT(11)  
  },
  projectNameCount: {
    type: Sequelize.INTEGER  
  },
  createdBy: {
    type: Sequelize.INTEGER  
  },
  projectType: {
    type: Sequelize.STRING  
  },
  classification: {
    type: Sequelize.STRING  
  },
  dateAdded: {
    type: Sequelize.DATE  
  },
  dateUpdated: {
    type: Sequelize.DATE
  },
  isActive: {
    type: Sequelize.INTEGER
  },
  isDeleted: {
    type: Sequelize.INTEGER
  }
});