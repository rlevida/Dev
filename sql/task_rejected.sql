DROP TABLE IF EXISTS `task_rejected`;
CREATE TABLE `task_rejected` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `projectId` BIGINT,
    `taskId` BIGINT,
    `workstreamId` BIGINT,
    `approverId` BIGINT,
    `approvalDueDate` DATETIME,
    `dateAdded` DATETIME,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
) ENGINE=INNODB;