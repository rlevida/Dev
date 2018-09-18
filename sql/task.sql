DROP TABLE IF EXISTS `task`;
CREATE TABLE `task` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `projectId` BIGINT,
    `task` TEXT,
    `description` TEXT,
    `workstreamId` BIGINT,
    `dueDate` DATETIME,
    `startDate` DATETIME,
    `status` ENUM("In Progress","For Approval","Completed"),
    `typeId` BIGINT,
    `linkTaskId` BIGINT,
    `periodic` TINYINT(1) DEFAULT '0',
    `periodType` ENUM("years", "months", "weeks", "days"),
    `period` INT,
    `dateAdded` DATETIME,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `isActive` TINYINT(1) DEFAULT '1',
    `isDeleted` TINYINT(1) DEFAULT '0',
    PRIMARY KEY(`id`)
) ENGINE=INNODB;