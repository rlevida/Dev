DROP TABLE IF EXISTS `task_time_logs`;

CREATE TABLE `task_time_logs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `time` FLOAT,
    `period` ENUM("days","weeks","hours","minutes"),
    `description` TEXT,
    `taskId` BIGINT,
    `usersId` BIGINT,
    `dateAdded` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    `dateUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY(`id`)
) ENGINE=INNODB;