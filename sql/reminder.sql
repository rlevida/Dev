DROP TABLE IF EXISTS `reminder`;
CREATE TABLE `reminder` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `reminderDetail` VARCHAR(50),
    `usersId` BIGINT,
    `seen` TINYINT(1) DEFAULT '0',
    `projectId` BIGINT,
    `linkId` BIGINT,
    `linkType` ENUM("task","document","workstream"),
    `type` ENUM("For Approval","Task Rejected","Task Overdue","Task Due Today","Tag in Comment","Task Completed"),
    `createdBy` BIGINT,
    `dateAdded` DATETIME,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
) ENGINE=INNODB;