DROP TABLE IF EXISTS `project`;
CREATE TABLE `project` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `picture` TEXT,
    `project` VARCHAR(50),
    `statusId` BIGINT,
    `typeId` BIGINT,
    `projectType` VARCHAR(50),
    `tinNo` VARCHAR(50),
    `companyAddress` VARCHAR(50),
    `classification` VARCHAR(50),
    `projectNameCount` INT(11) NOT NULL DEFAULT '0',
    `createdBy` BIGINT,
    `isActive` TINYINT(1) DEFAULT '1',
    `isDeleted` TINYINT(1) DEFAULT '0',
    `remindOnDuedate` TINYINT(1) DEFAULT '0',
    `remindBeforeDuedate` TINYINT(1) DEFAULT '0',
    `color` VARCHAR(50),
    `dateAdded` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `dateUpdated` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
) ENGINE=INNODB;