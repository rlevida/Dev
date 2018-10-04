DROP TABLE IF EXISTS `task_dependency`;
CREATE TABLE `task_dependency` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `taskId` BIGINT,
    `dependencyType` ENUM("Preceded by","Succeeding"),
    `linkTaskId` BIGINT,
    `dateAdded` DATETIME,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `isDeleted` TINYINT(1) DEFAULT '0',
    PRIMARY KEY(`id`)
) ENGINE=INNODB;