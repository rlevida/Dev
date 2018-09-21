DROP TABLE IF EXISTS `task_checklist`;
CREATE TABLE `task_checklist` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `completed` TINYINT(1) DEFAULT '0',
    `description` TEXT,
    `taskId` BIGINT,
    `documents` VARCHAR(50),
    `dateAdded` DATETIME,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
) ENGINE=INNODB;