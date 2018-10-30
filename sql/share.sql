DROP TABLE IF EXISTS `share`;
CREATE TABLE `share` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `usersType` ENUM("users","team"),
    `userTypeLinkId` BIGINT,
    `linkType` ENUM("project","workstream","task"),
    `linkId` BIGINT,
    `shareType` ENUM("document","folder"),
    `shareId` BIGINT,
    `sharedBy` BIGINT,
    `dateAdded` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
) ENGINE=INNODB;