DROP TABLE IF EXISTS `workstream`;
CREATE TABLE `workstream` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `projectId` BIGINT,
    `workstream` VARCHAR(50),
    `projectName` VARCHAR(50),
    `projectDescription` TEXT,
    `statusId` BIGINT,
    `typeId` BIGINT,
    `dateAdded` DATETIME,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `isActive` TINYINT(1) DEFAULT '1',
    `isDeleted` TINYINT(1) DEFAULT '0',
    PRIMARY KEY(`id`)
) ENGINE=INNODB;