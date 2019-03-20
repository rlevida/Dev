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
    `color` VARCHAR(50),
    `isActive` TINYINT(1) DEFAULT '1',
    `isTemplate` TINYINT(1) DEFAULT '0',
    `isDeleted` TINYINT(1) DEFAULT '0',
    `dateAdded` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `dateUpdated` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
) ENGINE=INNODB;