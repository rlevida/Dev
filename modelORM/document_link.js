const Sequelize = require("sequelize");
const field = exports.field = global.connectionDb.define('document_link', {
  documentId: {
    type: Sequelize.INTEGER
  },
  usersId: {
    type: Sequelize.BIGINT(11)  
  },
  linkType: {
    type: Sequelize.STRING
  },
  linkId: {
    type: Sequelize.BIGINT(11)
  },
  dateAdded: {
    type: Sequelize.DATE  
  },
  dateUpdated: {
    type: Sequelize.DATE  
  }
});