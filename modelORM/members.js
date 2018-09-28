const Sequelize = require("sequelize");
const field = exports.field = global.connectionDb.define('members', {
  usersType: {
    type: Sequelize.STRING
  },
  userTypeLinkId: {
    type: Sequelize.INTEGER
  },
  linkType: {
    type: Sequelize.STRING
  },
  linkId: {
    type: Sequelize.BIGINT(11)  
  },
  memberType: {
    type: Sequelize.STRING  
  },
  receiveNotification: {
    type: Sequelize.INTEGER  
  },
  dateAdded: {
    type: Sequelize.DATE  
  },
  dateUpdated: {
    type: Sequelize.DATE
  }
});