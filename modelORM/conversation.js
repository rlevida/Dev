const Sequelize = require("sequelize");
const field = exports.field = global.connectionDb.define('conversation', {
  comment: {
    type: Sequelize.STRING
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
  },
  isDeleted: {
    type: Sequelize.INTEGER
  }
});