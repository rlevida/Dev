DROP TABLE IF EXISTS `workstream`;
CREATE TABLE `workstream` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `projectId` BIGINT,
    `workstream` VARCHAR(50),
    `projectName` VARCHAR(50),
    `description` TEXT,
    `numberOfHours` BIGINT,
    `statusId` BIGINT,
    `typeId` BIGINT,
    `isActive` TINYINT(1) DEFAULT '1',
    `isDeleted` TINYINT(1) DEFAULT '0',
    `dateAdded` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
) ENGINE=INNODB;