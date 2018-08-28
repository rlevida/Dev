DROP TABLE IF EXISTS `folder`;
CREATE TABLE `folder` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `name` TEXT,
    `projectId`BIGINT,
    `parentId` BIGINT,
    `dateAdded` DATETIME,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `isDeleted` TINYINT(1) DEFAULT '0',
    PRIMARY KEY(`id`)
) ENGINE=INNODB;