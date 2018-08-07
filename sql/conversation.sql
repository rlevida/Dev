DROP TABLE IF EXISTS `conversation`;
CREATE TABLE `conversation` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `comment` TEXT,
    `usersId` BIGINT,
    `linkType` ENUM("project","workstream","task"),
    `linkId` BIGINT,
    `status` BIGINT,
    `dateAdded` DATETIME,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `isDeleted` TINYINT(1) DEFAULT '0',
    PRIMARY KEY(`id`)
) ENGINE=INNODB;