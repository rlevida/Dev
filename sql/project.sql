DROP TABLE IF EXISTS `project`;
CREATE TABLE `project` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `project` VARCHAR(50),
    `statusId` BIGINT,
    `typeId` BIGINT,
    `projectType` VARCHAR(50),
    `classification` VARCHAR(50),
    `tinNo` VARCHAR(50),
    `companyAddress` VARCHAR(50),
    `classification` VARCHAR(50),
    `createdBy` BIGINT,
    `dateAdded` DATETIME,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `isActive` TINYINT(1) DEFAULT '1',
    `isDeleted` TINYINT(1) DEFAULT '0',
    PRIMARY KEY(`id`)
) ENGINE=INNODB;