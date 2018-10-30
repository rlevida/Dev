DROP TABLE IF EXISTS `folder`;
CREATE TABLE `folder` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `name` TEXT,
    `projectId`BIGINT,
    `parentId` BIGINT,
    `isDeleted` TINYINT(1) DEFAULT '0',
    `isFolder` TINYINT(1) DEFAULT 1,
    `type` ENUM("new","library","archived"),
    `createdBy`BIGINT,
    `dateAdded` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
) ENGINE=INNODB;