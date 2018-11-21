DROP TABLE IF EXISTS `task_member_reminder`;
CREATE TABLE `task_member_reminder` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `taskId` BIGINT,
    `usersId` BIGINT,
    `defaultNotification` TINYINT(1) DEFAULT '1',
    `emailNotification` TINYINT(1) DEFAULT '1',
    `dateAdded` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
) ENGINE=INNODB;