DROP TABLE IF EXISTS `task`;
CREATE TABLE `task` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `projectId` BIGINT,
    `task` TEXT,
    `workstreamId` BIGINT,
    `dueDate` DATETIME,
    `status` ENUM("In Progress","For Approval","Completed"),
    `typeId` BIGINT,
    `linkTaskId` BIGINT,
    `dateAdded` DATETIME,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `isActive` TINYINT(1) DEFAULT '1',
    `isDeleted` TINYINT(1) DEFAULT '0',
    PRIMARY KEY(`id`)
) ENGINE=INNODB;