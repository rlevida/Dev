const Sequelize = require("sequelize");
const field = exports.field = global.connectionDb.define('document', {
  name: {
    type: Sequelize.STRING
  },
  origin: {
    type: Sequelize.STRING  
  },
  uploadedBy: {
    type: Sequelize.BIGINT(11)
  },
  type: {
    type: Sequelize.STRING
  },
  isDeleted: {
    type: Sequelize.INTEGER
  },
  tags: {
    type: Sequelize.STRING
  },
  status: {
    type: Sequelize.STRING
  },
  isCompleted: {
    type: Sequelize.INTEGER
  },
  folderId: {
    type: Sequelize.BIGINT(11)
  },
  documentNameCount: {
    type: Sequelize.BIGINT(11)
  },
  attachmentId: {
    type: Sequelize.BIGINT(11)
  },
  dateAdded: {
    type: Sequelize.DATE  
  },
  dateUpdated: {
    type: Sequelize.DATE  
  }
});