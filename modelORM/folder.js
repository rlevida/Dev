const Sequelize = require("sequelize");
const field = exports.field = global.connectionDb.define('folder', {
  name: {
    type: Sequelize.STRING
  },
  projectId: {
    type: Sequelize.BIGINT(11)  
  },
  parentId: {
    type: Sequelize.BIGINT(11)
  },
  dateAdded: {
    type: Sequelize.DATE  
  },
  dateUpdated: {
    type: Sequelize.DATE  
  },
  isDeleted: {
    type: Sequelize.INTEGER
  },
  isFolder: {
    type: Sequelize.INTEGER
  },
  type: {
    type: Sequelize.STRING
  },
  createdBy: {
    type: Sequelize.BIGINT(11)
  }
});