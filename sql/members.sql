DROP TABLE IF EXISTS `members`;
CREATE TABLE `members` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `usersType` ENUM("users","team"),
    `userTypeLinkId` BIGINT,
    `linkType` ENUM("project","workstream","task"),
    `linkId` BIGINT,
    `memberType` ENUM("assignedTo","Follower","responsible", "project manager"),
    `receiveNotification` TINYINT(1) DEFAULT '1',
    `dateAdded` DATETIME,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
) ENGINE=INNODB;